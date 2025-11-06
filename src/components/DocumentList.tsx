import React, { useState, useEffect } from 'react';
import api from '../lib/api';

interface IDocument {
  id: number;
  file_name: string;
  file_type: string;
  created_at: string;
}

interface DocumentListProps {
  refreshKey: number; // Chave para forçar o recarregamento
  onDeleteSuccess: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ refreshKey, onDeleteSuccess }) => {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        // GET /api/documents
        const response = await api.get('/documents');
        setDocuments(response.data);
      } catch (err) {
        console.error('Erro ao buscar documentos:', err);
        setError('Não foi possível carregar os documentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [refreshKey]); // Recarrega sempre que a 'refreshKey' mudar

  const handleDelete = async (docId: number, docName: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${docName}"? Isso removerá todos os seus dados de contexto.`)) {
      return;
    }

    try {
      // DELETE /api/documents/[id]
      await api.delete(`/documents/${docId}`);
      onDeleteSuccess(); // Avisa o pai para atualizar a chave e recarregar a lista
    } catch (err) {
      console.error('Erro ao deletar documento:', err);
      alert('Não foi possível deletar o documento.');
    }
  };

  if (loading) return <div>Carregando documentos...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h4>Documentos Vetorizados</h4>
      {documents.length === 0 ? (
        <p>Nenhum documento encontrado.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Tipo</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Data</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{doc.file_name}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{doc.file_type}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {new Date(doc.created_at).toLocaleString('pt-BR')}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <button 
                    onClick={() => handleDelete(doc.id, doc.file_name)}
                    style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};