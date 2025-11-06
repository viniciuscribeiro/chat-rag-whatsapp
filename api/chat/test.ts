import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenRouterEmbeddings } from '@langchain/openrouter';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenRouter } from '@langchain/openrouter';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

// Carrega as variáveis de ambiente do Vercel (chaves secretas)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Função Helper: Formatar Contexto (RAG) ---
// Transforma os documentos do RAG em um texto único
function formatContext(docs: Array<{ pageContent: string }>): string {
  if (docs.length === 0) {
    return "Nenhum contexto encontrado nos documentos.";
  }
  return docs.map((doc, i) => `--- Contexto ${i + 1} ---\n${doc.pageContent}`).join('\n\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { message, session_id } = req.body;

  if (!message || !session_id) {
    return res.status(400).json({ message: 'Mensagem e session_id são obrigatórios.' });
  }

  try {
    // 1. Buscar Configurações (Chave, Modelo, Prompt) do Painel
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('open_router_api_key, model_name, system_prompt')
      .eq('id', 1)
      .single();

    if (settingsError || !settings) {
      throw new Error('Configurações não encontradas. Verifique o Painel.');
    }
    const { open_router_api_key, model_name, system_prompt } = settings;

    // 2. Salvar a Mensagem do Usuário no Histórico
    await supabase.from('conversations').insert({
      session_id,
      sender: 'user',
      message: message,
    });

    // 3. RAG: Buscar Contexto no Vector Store
    const embeddings = new OpenRouterEmbeddings({
      openRouterApiKey: open_router_api_key,
      model: "openai/text-embedding-ada-002"
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'vector_store',
      queryName: 'match_documents',
    });

    // Faz a busca por similaridade da pergunta do usuário nos documentos
    const contextDocs = await vectorStore.similaritySearch(message, 4); // Busca 4 chunks
    const formattedContext = formatContext(contextDocs);

    // 4. Configurar o Modelo (LLM) da Open Router
    const model = new OpenRouter({
      openRouterApiKey: open_router_api_key,
      model: model_name, // Usa o modelo selecionado no Painel
      temperature: 0.7,
    });

    // 5. Criar o Prompt (Template)
    // Juntamos o System Prompt (do Painel) + Contexto (do RAG) + Pergunta (do Usuário)
    const promptTemplate = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `${system_prompt}\n\nUse o contexto abaixo para responder à pergunta. Se a resposta não estiver no contexto, diga que você não sabe com base nos documentos fornecidos.\n\nCONTEXTO:\n{context}`
      ),
      HumanMessagePromptTemplate.fromTemplate("{question}"),
    ]);

    // 6. Criar a "Chain" (Sequência)
    const chain = RunnableSequence.from([
      {
        question: (input: { question: string }) => input.question,
        context: () => formattedContext, // Injeta o contexto RAG
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);

    // 7. Executar a Chain e obter a Resposta da IA
    const aiResponse = await chain.invoke({ question: message });

    // 8. Salvar a Resposta da IA no Histórico
    await supabase.from('conversations').insert({
      session_id,
      sender: 'ai',
      message: aiResponse,
    });

    // 9. Retornar a resposta para o frontend
    return res.status(200).json({
      message: 'Resposta da IA',
      data: aiResponse,
    });

  } catch (error: any) {
    console.error('Erro na API /chat/test:', error);
    // Tenta salvar uma mensagem de erro no chat
    await supabase.from('conversations').insert({
      session_id,
      sender: 'ai',
      message: `Desculpe, ocorreu um erro ao processar sua solicitação: ${error.message}`,
    });
    return res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
}