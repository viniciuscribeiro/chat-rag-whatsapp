import React, { useState } from 'react';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';

export const RAGManager: React.FC = () => {
  // Usamos uma "chave" (um número) para forçar o recarregamento da lista
  // quando o upload ou a deleção for bem-sucedida.
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1); // Apenas incrementa a chave
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h3>Gerenciador de Documentos (RAG)</h3>
      
      {/* Componente de Upload */}
      <DocumentUpload onUploadSuccess={handleRefresh} />
      
      <hr style={{ margin: '20px 0' }} />
      
      {/* Componente da Lista */}
      <DocumentList refreshKey={refreshKey} onDeleteSuccess={handleRefresh} />
    </div>
  );
};