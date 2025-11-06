import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenRouterEmbeddings } from "langchain/embeddings/openrouter";
import { OpenRouter } from "langchain/chat_models/openrouter";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

// Carrega as variáveis de ambiente do Vercel (chaves secretas)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Função Helper: Formatar Contexto (RAG) ---
function formatContext(docs: Array<{ pageContent: string }>): string {
  if (docs.length === 0) {
    return "Nenhum contexto encontrado nos documentos.";
  }
  return docs.map((doc, i) => `--- Contexto ${i + 1} ---\n${doc.pageContent}`).join('\n\n');
}

/**
 * Esta é a função central de processamento de chat.
 * Recebe uma mensagem e um ID de sessão, processa com RAG + LLM,
 * salva no histórico e retorna a resposta da IA.
 */
export async function processMessage(message: string, session_id: string): Promise<string> {
  try {
    // 1. Buscar Configurações (Chave, Modelo, Prompt)
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

    // 3. RAG: Buscar Contexto
    const embeddings = new OpenRouterEmbeddings({
      openRouterApiKey: open_router_api_key,
      model: "openai/text-embedding-ada-002"
    });
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'vector_store',
      queryName: 'match_documents',
    });
    const contextDocs = await vectorStore.similaritySearch(message, 4);
    const formattedContext = formatContext(contextDocs);

    // 4. Configurar o Modelo (LLM)
    const model = new OpenRouter({
      openRouterApiKey: open_router_api_key,
      model: model_name,
      temperature: 0.7,
    });

    // 5. Criar o Prompt (Template)
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
        context: () => formattedContext,
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);

    // 7. Executar a Chain
    const aiResponse = await chain.invoke({ question: message });

    // 8. Salvar a Resposta da IA no Histórico
    await supabase.from('conversations').insert({
      session_id,
      sender: 'ai',
      message: aiResponse,
    });

    // 9. Retornar a resposta
    return aiResponse;

  } catch (error: any) {
    console.error(`Erro no processMessage (session: ${session_id}):`, error);
    const errorMessage = `Desculpe, ocorreu um erro ao processar sua solicitação: ${error.message}`;
    // Salva o erro no histórico
    await supabase.from('conversations').insert({
      session_id,
      sender: 'ai',
      message: errorMessage,
    });
    return errorMessage;
  }
}