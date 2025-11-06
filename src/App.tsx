import { ConfigPanel } from './components/ConfigPanel';
import { RAGManager } from './components/RAGManager';
import { TestChat } from './components/TestChat'; // Importar

function App() {
  const divider = <hr style={{ 
    maxWidth: '800px', 
    margin: '30px auto', 
    border: 'none', 
    borderTop: '2px solid #eee' 
  }} />;

  return (
    <div style={{ paddingBottom: '50px' }}>
      <ConfigPanel />
      {divider}
      <RAGManager />
      {divider}
      <TestChat /> {/* Adicionado */}
    </div>
  );
}

export default App;