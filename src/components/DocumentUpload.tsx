import React, { useState } from 'react';
import api from '../lib/api';

interface DocumentUploadProps {
  onUploadSuccess: () => void; // Função para avisar o pai e atualizar a lista
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'text/plain', 'text/markdown'];
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setMessage(null);
      } else {
        setFile(null);
        setMessage({ text: 'Tipo de arquivo inválido. Use PDF, TXT ou MD.', type: 'error' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ text: 'Por favor, selecione um arquivo.', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file); // O nome 'file' deve ser o mesmo esperado pelo formidable no backend

    try {
      // POST /api/documents/upload
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({ text: 'Arquivo enviado e vetorizado com sucesso!', type: 'success' });
      setFile(null); // Limpa o input
      if (document.getElementById('file-input')) {
         (document.getElementById('file-input') as HTMLInputElement).value = ""; // Reseta o input
      }
      onUploadSuccess(); // Avisa o componente pai para recarregar a lista
    } catch (error: any) {
      console.error('Erro no upload:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao enviar arquivo.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4>Upload de Documentos (RAG)</h4>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          id="file-input"
          accept=".pdf,.txt,.md" 
          onChange={handleFileChange} 
          style={{ marginBottom: '10px' }}
        />
        <button type="submit" disabled={uploading || !file}>
          {uploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {message && (
        <div style={{ 
          marginTop: '10px', 
          color: message.type === 'success' ? 'green' : 'red',
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
};