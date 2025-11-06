# Processo de Desenvolvimento

Este documento detalha o processo de desenvolvimento e o padrão de commits seguidos na construção do projeto, conforme as diretrizes do teste.

## Padrão de Commits

O projeto seguiu um padrão de commits semântico para diferenciar o código gerado por IA de ajustes manuais e refatorações.

* `[AI]`: Código principal gerado por IA, com o prompt detalhado na descrição do commit.
* `[MANUAL]`: Ajustes manuais, correções de bugs, ou configuração de ambiente.
* `[REFACTOR]`: Refatoração de código para melhorar a estrutura ou reutilização.

## Histórico do Processo (Commits)

O projeto foi construído na seguinte ordem:

1.  **[AI] Initialize project structure and settings API**
    * *Prompt: Crie a estrutura inicial do projeto Vite + TS, o schema do Supabase para settings/documents/conversations, e a API route (Vercel) /api/settings para GET e POST dos dados de configuração.*

2.  **[AI] Add configuration panel frontend**
    * *Prompt: Crie o componente React (ConfigPanel.tsx) para o Painel de Configurações, incluindo formulário para API Key, seletor de modelo e system prompt. Use axios para GET (carregar) e POST (salvar) na /api/settings.*

3.  **[MANUAL] Setup Vite proxy and API/Supabase clients**
    * *Configurado o vite.config.ts para proxy do /api e criados os clientes axios (api.ts) e supabase (supabaseClient.ts) no frontend.*

4.  **[AI] Add pg_vector schema and search function**
    * *Prompt: Crie o SQL necessário para o Supabase pg_vector: a tabela 'vector_store' (com 'content', 'metadata', 'embedding') e a função 'match_documents'.*

5.  **[AI] Implement RAG document upload API**
    * *Prompt: Crie a API route /api/documents/upload.ts. Ela deve usar formidable para upload, pdf-parse para extração, LangChain (RecursiveCharacterTextSplitter) para chunking, OpenRouterEmbeddings para vetorização, e SupabaseVectorStore para salvar na tabela 'vector_store'. Também deve salvar um registro na tabela 'documents'.*

6.  **[AI] Implement RAG document list and delete APIs**
    * *Prompt: Crie as API routes /api/documents/index.ts (GET para listar) e /api/documents/[id].ts (DELETE). O DELETE deve remover o registro da tabela 'documents' e também os chunks correspondentes da 'vector_store'.*

7.  **[AI] Add DocumentUpload frontend component**
    * *Prompt: Crie o componente React DocumentUpload.tsx. Ele deve conter um formulário com input de arquivo (PDF, TXT, MD) e usar o 'api' helper (axios) para enviar o FormData para /api/documents/upload. Deve mostrar mensagens de sucesso/erro e chamar uma função onUploadSuccess.*

8.  **[AI] Add DocumentList frontend component**
    * *Prompt: Crie o componente React DocumentList.tsx. Ele deve buscar dados de /api/documents (GET) e exibir em uma tabela. Deve incluir um botão 'Deletar' que chama a API (DELETE /api/documents/[id]) e chama onDeleteSuccess. Deve usar uma 'refreshKey' para recarregar.*

9.  **[REFACTOR] Create RAGManager and update App.tsx**
    * *Cria o componente RAGManager.tsx para unificar o DocumentUpload e DocumentList. Adiciona o RAGManager ao App.tsx, abaixo do ConfigPanel. A lógica de 'refreshKey' é usada para atualizar a lista após upload ou delete.*

10. **[AI] Create the core RAG/LLM chat API**
    * *Prompt: Crie a API /api/chat/test.ts. Ela deve: 1. Pegar as settings (API key, model, prompt) do Supabase. 2. Salvar a msg do usuário. 3. Usar SupabaseVectorStore (RAG) para buscar contexto. 4. Usar LangChain (RunnableSequence) para formatar o prompt (system_prompt + RAG_context + user_question). 5. Chamar a OpenRouter (LLM) com o prompt. 6. Salvar a resposta da IA. 7. Retornar a resposta.*

11. **[AI] Create frontend TestChat component**
    * *Prompt: Crie o componente React TestChat.tsx. Ele deve ter uma UI de chat, carregar o histórico do Supabase (tabela 'conversations' com 'session_id' fixa), e enviar novas mensagens para /api/chat/test (POST). As mensagens do usuário e da IA devem ser exibidas na tela.*

12. **[REFACTOR] Add TestChat component to App.tsx**
    * *Atualiza o App.tsx para incluir o novo componente TestChat, posicionando-o abaixo do RAGManager e adicionando divisórias.*

13. **[REFACTOR] Extract chat logic to chatProcessor.ts**
    * *Extrai a lógica principal do RAG + LLM (incluindo busca, prompt e chamada de IA) para um arquivo reutilizável 'api/lib/chatProcessor.ts'. Isso evita duplicação de código entre as APIs.*

14. **[REFACTOR] Update /api/chat/test.ts to use chatProcessor**
    * *Simplifica a API do chat de teste para atuar apenas como um wrapper, recebendo a requisição e passando-a para o 'chatProcessor' central.*

15. **[AI] Implement WhatsApp webhook for Evolution API**
    * *Prompt: Crie o endpoint /api/webhook/evolution.ts. Ele deve: 1. Receber o payload 'message.upsert' da Evolution API. 2. Ignorar mensagens de grupo/próprias. 3. Passar a mensagem e o 'senderNumber' para o 'chatProcessor'. 4. Enviar a resposta da IA de volta ao usuário usando as credenciais da Evolution API (axios POST para /message/sendText).*