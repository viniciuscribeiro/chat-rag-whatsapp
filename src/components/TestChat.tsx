import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { supabase } from '../lib/supabaseClient'; // Cliente frontend do Supabase

interface IMessage {
  id?: number;
  sender: 'user' | 'ai';
  message: string;
  created_at?: string;
}

const SESSION_ID = 'local_test_chat'; // ID fixo para o chat de teste

export const TestChat: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null); // Para rolar para o fim

  // Função para carregar histórico
  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', SESSION_ID)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar histórico:', error);
      alert('Erro ao carregar histórico.');
    } else {
      setMessages(data as IMessage[]);
    }
    setLoadingHistory(false);
  };

  // Carrega o histórico ao montar
  useEffect(() => {
    fetchHistory();
  }, []);

  // Rola para a última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: IMessage = {
      sender: 'user',
      message: input,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]); // Exibe a msg do usuário
    setInput('');
    setLoading(true);

    try {
      // Envia a mensagem para a API "Cérebro"
      const response = await api.post('/chat/test', {
        message: input,
        session_id: SESSION_ID,
      });

      const aiResponse: IMessage = {
        sender: 'ai',
        message: response.data.data, // A resposta da IA
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiResponse]); // Exibe a msg da IA

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMsg = error.response?.data?.message || 'Erro desconhecido';
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: `ERRO: ${errorMsg}`,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '600px' }}>
      <h3 style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
        Interface de Teste (RAG)
      </h3>
      
      {/* Área de Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {loadingHistory ? (
            <div style={{textAlign: 'center', color: '#888'}}>Carregando histórico...</div>
        ) : messages.length === 0 ? (
            <div style={{textAlign: 'center', color: '#888'}}>Nenhuma mensagem. Faça upload de um documento e envie uma pergunta.</div>
        ) : (
            messages.map((msg, index) => (
            <div key={index} style={{ 
                marginBottom: '10px', 
                textAlign: msg.sender === 'user' ? 'right' : 'left'
            }}>
                <span style={{
                background: msg.sender === 'user' ? '#007bff' : '#f1f1f1',
                color: msg.sender === 'user' ? 'white' : 'black',
                padding: '8px 12px',
                borderRadius: '15px',
                display: 'inline-block',
                maxWidth: '80%',
                whiteSpace: 'pre-wrap' // Mantém a formatação (quebra de linha)
                }}>
                {msg.message}
                </span>
            </div>
            ))
        )}

        {loading && (
          <div style={{ textAlign: 'left' }}>
            <span style={{ background: '#f1f1f1', padding: '8px 12px', borderRadius: '15px', display: 'inline-block' }}>
              Digitando...
            </span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input de Envio */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #eee' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={loading || loadingHistory}
          style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', marginRight: '10px' }}
        />
        <button type="submit" disabled={loading || loadingHistory} style={{ padding: '10px 15px', borderRadius: '20px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}>
          Enviar
        </button>
      </form>
    </div>
  );
};