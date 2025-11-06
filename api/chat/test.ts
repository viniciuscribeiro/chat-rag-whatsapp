import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processMessage } from '../../src/lib/chatProcessor';

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
    // Chama o "cérebro" central
    const aiResponse = await processMessage(message, session_id);
    
    // Retorna a resposta para o chat de teste
    return res.status(200).json({
      message: 'Resposta da IA',
      data: aiResponse,
    });

  } catch (error: any) {
    console.error('Erro na API /chat/test:', error);
    return res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
}