import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Carrega as variáveis de ambiente do Vercel
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  
  // CORS (Obrigatório para o Vercel)
  res.setHeader('Access-Control-Allow-Origin', '*'); // Em produção, restrinja isso
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ID Fixo "1" para a única linha de configuração
  const SETTINGS_ID = 1;

  if (req.method === 'GET') {
    // --- LÓGICA GET ---
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single();

      if (error || !data) {
        throw error || new Error('Configuração não encontrada');
      }
      
      return res.status(200).json(data);

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar configurações', error: error.message });
    }
  }

  if (req.method === 'POST') {
    // --- LÓGICA POST ---
    const { open_router_api_key, model_name, system_prompt } = req.body;

    if (!open_router_api_key || !model_name || !system_prompt) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios: API Key, Modelo e System Prompt.' });
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .update({
          open_router_api_key,
          model_name,
          system_prompt,
        })
        .eq('id', SETTINGS_ID)
        .select();

      if (error) throw error;
      
      return res.status(200).json({ message: 'Configurações salvas com sucesso!', data: data[0] });

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao salvar configurações', error: error.message });
    }
  }

  // Se não for GET ou POST
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `Método ${req.method} não permitido` });
}