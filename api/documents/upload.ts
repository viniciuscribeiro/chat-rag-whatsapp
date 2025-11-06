import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { formidable } from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenRouterEmbeddings } from "langchain/embeddings/openrouter";
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';

// Carrega as variáveis de ambiente do Vercel
// (Estas SÃO as chaves SECRETAS, configuradas no painel da Vercel)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Desabilitar o bodyParser padrão do Vercel para o formidable funcionar
export const config = {
  api: { bodyParser: false },
};

// Função helper para extrair texto baseado no tipo de arquivo
async function extractText(filepath: string, filetype: string): Promise<string> {
  const buffer = fs.readFileSync(filepath);
  
  if (filetype === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  } else if (filetype === 'text/plain' || filetype === 'text/markdown') {
    return buffer.toString('utf-8');
  } else {
    throw new Error('Tipo de arquivo não suportado');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (Necessário para o Vercel)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }

  try {
    // 1. Buscar a API Key da Open Router (salva no Painel de Config.)
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('open_router_api_key')
      .eq('id', 1)
      .single();

    if (settingsError || !settings?.open_router_api_key) {
      throw new Error('API Key da Open Router não configurada no painel.');
    }
    const openRouterApiKey = settings.open_router_api_key;

    // 2. Processar o upload do arquivo com Formidable
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    
    // Tipos de arquivo permitidos
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.filepath); // Limpa o arquivo temporário
        return res.status(400).json({ message: 'Tipo de arquivo inválido. Use PDF, TXT ou MD.' });
    }

    // 3. Salvar o registro do documento na tabela 'documents'
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        file_name: file.originalFilename || 'arquivo',
        file_type: file.mimetype,
      })
      .select()
      .single();

    if (docError || !docRecord) {
      throw docError || new Error('Erro ao salvar registro do documento.');
    }
    const documentId = docRecord.id;

    // 4. Extrair o texto do arquivo (PDF, TXT, MD)
    const text = await extractText(file.filepath, file.mimetype);

    // 5. Quebrar o texto em "Chunks" (Pedaços)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([text]);

    // 6. Adicionar metadados a cada chunk (para sabermos de qual doc eles vieram)
    const chunksWithMetadata = chunks.map((chunk) => {
      chunk.metadata = {
        document_id: documentId,
        file_name: file.originalFilename || 'arquivo',
      };
      return chunk;
    });

    // 7. Criar Embeddings e Salvar no Supabase (Vector Store)
    const embeddings = new OpenRouterEmbeddings({
      openRouterApiKey: openRouterApiKey,
      model: "openai/text-embedding-ada-002" // Modelo de embedding padrão
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'vector_store',
      queryName: 'match_documents', // Nome da função SQL que criamos
    });

    await vectorStore.addDocuments(chunksWithMetadata);

    // 8. Limpar o arquivo temporário
    fs.unlinkSync(file.filepath);

    return res.status(200).json({ message: 'Documento processado e vetorizado com sucesso!', document: docRecord });

  } catch (error: any) {
    console.error('Erro no upload RAG:', error);
    return res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
}