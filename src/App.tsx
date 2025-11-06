import { ConfigPanel } from './components/ConfigPanel';
import { RAGManager } from './components/RAGManager';

function App() {
  return (
    <div>
      <ConfigPanel />
      
      <hr style={{ 
        maxWidth: '800px', 
        margin: '30px auto', 
        border: 'none', 
        borderTop: '2px solid #eee' 
      }} />
      
      <RAGManager />

      {/* Mais tarde, adicionaremos o Chat de Teste aqui */}
    </div>
  );
}

export default App;