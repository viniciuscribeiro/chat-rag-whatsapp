# Chat de IA com RAG + WhatsApp (Teste Fullstack)

Este é um projeto fullstack que implementa um sistema de chat com Inteligência Artificial, RAG (Retrieval-Augmented Generation) e integração com o WhatsApp via Evolution API.

O sistema permite que um usuário configure um modelo de IA (via Open Router), faça upload de documentos (PDF, TXT, MD) para servirem de contexto, e converse com a IA através de uma interface de teste ou diretamente pelo WhatsApp.

## ✨ Features

* **Painel de Configurações:** Permite salvar a API Key da Open Router, selecionar o modelo de LLM (GPT-4, Claude, Llama) e editar o "System Prompt" da IA.
* **Sistema RAG:** Permite o upload de arquivos (PDF, TXT, MD), que são processados, vetorizados e armazenados no Supabase (pg_vector) para serem usados como contexto.
* **Interface de Teste:** Um chat local que utiliza o RAG para responder perguntas com base nos documentos.
* **Integração WhatsApp:** Um webhook que recebe mensagens da Evolution API, processa-as com a mesma lógica RAG + LLM e envia a resposta de volta ao usuário no WhatsApp.

## 🚀 Stack Técnica

* **Frontend:** React + TypeScript + Vite
* **Backend:** Vercel Serverless Functions (API Routes)
* **Banco de Dados:** Supabase (PostgreSQL + pg_vector)
* **IA (LLM):** Open Router (para acesso a múltiplos modelos)
* **IA (RAG):** LangChain.js (para processamento, chunking e vetorização)
* **WhatsApp:** Evolution API

---

## 🔧 Instalação e Execução

### 1. Pré-requisitos

* Node.js (LTS)
* Uma conta no [Supabase](https://supabase.com) (para o banco de dados)
* Uma conta no [Vercel](https://vercel.com) (para o deploy)
* Uma API Key da [Open Router](https://openrouter.ai/)
* Uma instância da [Evolution API](https://doc.evolution-api.com/v2/overview/installation) rodando.

### 2. Configuração do Supabase

1.  Crie um novo projeto no Supabase.
2.  Vá em **Database** -> **Extensions** e habilite a extensão `vector`.
3.  Vá em **SQL Editor** e execute os dois scripts SQL gerados durante o desenvolvimento (o primeiro para `settings`, `documents`, `conversations` e o segundo para `vector_store` e `match_documents`).

### 3. Configuração Local (Desenvolvimento)

1.  Clone este repositório:
    ```bash
    git clone <url-do-seu-repositorio>
    cd chat-rag-whatsapp
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie o arquivo `.env` na raiz e adicione suas chaves **públicas** do Supabase:
    ```env
    VITE_SUPABASE_URL="httpsEntry_do_Projeto_URL_do_Supabase"
    VITE_SUPABASE_ANON_KEY="Entry_da_Chave_ANON_PÚBLICA_do_Supabase"
    ```
4.  Para rodar o backend (API) e o frontend (Vite) juntos, use o Vercel CLI:
    ```bash
    npm install -g vercel
    vercel dev
    ```
    (O comando `vercel dev` usa o `vite.config.ts` para fazer o proxy das chamadas `/api` para o backend serverless.)

### 4. Deploy na Vercel (Obrigatório)

1.  Faça o push do seu código para o GitHub.
2.  No painel da Vercel, crie um "New Project" e importe seu repositório do GitHub.
3.  A Vercel deve detectar automaticamente que é um projeto Vite.
4.  Vá para **Settings** -> **Environment Variables** e adicione as seguintes variáveis (essas são as chaves **secretas**):
    * `SUPABASE_URL`: (A mesma URL do seu projeto Supabase)
    * `SUPABASE_SERVICE_KEY`: (A sua chave `service_role` secreta do Supabase)

### 5. Configuração do Webhook (Pós-Deploy)

Após o deploy, a Vercel fornecerá uma URL (ex: `https://meu-chat.vercel.app`).

1.  Pegue a sua URL de deploy e adicione o caminho do webhook:
    `https://<sua-url-vercel>.vercel.app/api/webhook/evolution`
2.  Configure este URL na sua instância da Evolution API como o endpoint de webhook para o evento `message.upsert`.

---

## 🔑 Credenciais do Banco (Para Acesso)

Conforme solicitado, aqui estão as credenciais do banco de dados Supabase usado para este projeto.

* **Supabase URL:** `https://deltnfayogngszcmgxff.supabase.co`
* **Supabase Anon Key (Frontend):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbHRuZmF5b2duZ3N6Y21neGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzODc2ODMsImV4cCI6MjA3Nzk2MzY4M30.wPQQGDRJF3LqPP8T3qSz87JoHYwTHYM-G3jZbi1widk`
* **Supabase Service Role Key (Backend):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbHRuZmF5b2duZ3N6Y21neGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM4NzY4MywiZXhwIjoyMDc3OTYzNjgzfQ.p83En_yRCt43pEfSf1WKBiqo5kQoTsoOsN3zcFEN2zs`