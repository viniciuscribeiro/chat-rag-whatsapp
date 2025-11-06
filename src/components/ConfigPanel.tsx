import React, { useState, useEffect } from 'react';
import api from '../lib/api'; // Nosso helper axios

// Lista de modelos suportados (simplificada)
const MODEL_OPTIONS = [
  "openai/gpt-4o",
  "openai/gpt-4-turbo",
  "anthropic/claude-3-haiku-20240307",
  "anthropic/claude-3-sonnet-20240229",
  "meta-llama/llama-3-70b-instruct",
  "meta-llama/llama-3-8b-instruct",
  "google/gemini-pro-1.5",
];

interface ISettings {
  open_router_api_key: string;
  model_name: string;
  system_prompt: string;
}

export const ConfigPanel: React.FC = () => {
  const [settings, setSettings] = useState<ISettings>({
    open_router_api_key: '',
    model_name: MODEL_OPTIONS[0],
    system_prompt: 'Você é um assistente prestativo.',
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Efeito para carregar as configurações ao montar o componente
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // GET /api/settings
        const response = await api.get('/settings');
        if (response.data) {
          setSettings({
            open_router_api_key: response.data.open_router_api_key || '',
            model_name: response.data.model_name || MODEL_OPTIONS[0],
            system_prompt: response.data.system_prompt || '',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        setMessage({ text: 'Não foi possível carregar as configurações.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    
    try {
      // POST /api/settings
      await api.post('/settings', settings);
      setMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao salvar.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !message) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Painel de Configurações</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="open_router_api_key" style={{ display: 'block', marginBottom: '5px' }}>
            API Key da Open Router
          </label>
          <input
            type="password"
            id="open_router_api_key"
            name="open_router_api_key"
            value={settings.open_router_api_key}
            onChange={handleChange}
            placeholder="sk-or-..."
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="model_name" style={{ display: 'block', marginBottom: '5px' }}>
            Seletor de Modelo
          </label>
          <select
            id="model_name"
            name="model_name"
            value={settings.model_name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          >
            {MODEL_OPTIONS.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="system_prompt" style={{ display: 'block', marginBottom: '5px' }}>
            System Prompt
          </label>
          <textarea
            id="system_prompt"
            name="system_prompt"
            value={settings.system_prompt}
            onChange={handleChange}
            rows={5}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px 15px', cursor: 'pointer' }}>
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
      
      {message && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          color: message.type === 'success' ? 'green' : 'red',
          border: `1px solid ${message.type === 'success' ? 'green' : 'red'}`
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
};