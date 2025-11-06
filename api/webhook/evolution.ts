import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processMessage } from '../lib/chatProcessor'; // Importa o cérebro
import axios from 'axios';

// --- Credenciais da Evolution API (Fornecidas no prompt) ---
const EVOLUTION_API_URL = "https://evodevs.cordex.ai";
const EVOLUTION_API_KEY = "V0e3EBKbaJFnKREYfFCqOnoi904vAPV7";
const EVOLUTION_INSTANCE = "default"; // Assumindo uma instância; ajuste se necessário

/**
 * Envia uma mensagem de texto de volta para o usuário via Evolution API
 */
async function sendWhatsAppMessage(to: string, text: string) {
  const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
  
  try {
    console.log(`Enviando resposta para ${to}: "${text.substring(0, 20)}..."`);
    await axios.post(url, {
      number: to,
      options: {
        delay: 100,
        presence: "composing" // Simula "digitando"
      },
      textMessage: {
        text: text
      }
    }, {
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error(`Erro ao enviar msg via Evolution API para ${to}:`, error.response?.data || error.message);
  }
}

/**
 * Handler do Webhook da Evolution API
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // A Evolution API envia POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const body = req.body;

    // A Evolution API usa o evento 'message.upsert' para novas mensagens
    // (Baseado na documentação oficial: doc.evolution-api.com)
    if (body.event === 'message.upsert' && body.data?.message?.text) {
      
      const messageData = body.data;
      const message = messageData.message.text.body; // O texto da mensagem
      const senderJid = messageData.key.remoteJid;  // ID do usuário (ex: 55119..._@s.whatsapp.net)
      const senderNumber = senderJid.split('@')[0]; // Apenas o número (ex: 55119...)

      // Ignorar mensagens de grupos (terminam com @g.us)
      // Ignorar nossas próprias mensagens (fromMe)
      if (messageData.key.fromMe || senderJid.includes('@g.us')) {
        return res.status(200).json({ message: 'Mensagem ignorada (grupo ou própria).' });
      }

      console.log(`Mensagem recebida de ${senderNumber}: "${message}"`);

      // --- Processa com RAG + LLM ---
      // Usamos o número do WhatsApp como 'session_id' para o histórico
      const aiResponse = await processMessage(message, senderNumber);

      // --- Envia a Resposta de volta ---
      if (aiResponse) {
        await sendWhatsAppMessage(senderNumber, aiResponse);
      }
    }

    // Responde ao webhook rapidamente com 200 OK para evitar timeouts
    return res.status(200).json({ message: 'Webhook recebido com sucesso.' });

  } catch (error: any) {
    console.error('Erro crítico no Webhook da Evolution:', error);
    return res.status(500).json({ message: 'Erro interno no webhook.' });
  }
}