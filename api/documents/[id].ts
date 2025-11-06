import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query; // Pega o [id] da URL (ex: /api/documents/123)

  if (req.method === 'DELETE') {
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ID do documento inválido.' });
    }
    
    // O ID da tabela 'documents' é um número
    const documentId = parseInt(id, 10); 
    if (isNaN(documentId)) {
       return res.status(400).json({ message: 'ID do documento inválido.' });
    }

    try {
      // 1. Deletar os vetores (chunks) associados da 'vector_store'
      // Nós filtramos usando os metadados que salvamos
      const { error: vectorError } = await supabase
        .from('vector_store')
        .delete()
        .eq('metadata->>document_id', documentId); // Filtra pelo campo 'document_id' no JSONB

      if (vectorError) {
        console.warn('Aviso: Erro ao deletar vetores:', vectorError.message);
        // Não paramos aqui, tentamos deletar o registro principal mesmo assim
      }

      // 2. Deletar o registro principal da tabela 'documents'
      const { data, error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .select()
        .single();
      
      if (docError) throw docError;

      if (!data) {
         return res.status(404).json({ message: 'Documento não encontrado.' });
      }

      return res.status(200).json({ message: `Documento ${data.file_name} e seus vetores foram deletados.` });

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao deletar documento', error: error.message });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({ message: `Método ${req.method} não permitido` });
}