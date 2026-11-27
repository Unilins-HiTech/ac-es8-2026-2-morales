# Aula 6 — Integrando uma API Externa: ViaCEP

Projeto completo de cadastro de pacientes com **Node.js + Express + PostgreSQL (Supabase)** no backend e **HTML + Bootstrap + JavaScript puro (`fetch`)** no frontend, com preenchimento automático de endereço via **ViaCEP**.

## Como executar

1. Entre na pasta do backend e instale as dependências:
   ```bash
   cd backend
   npm install
   ```

2. Crie o arquivo `.env` a partir do `.env.example` e preencha com a `DATABASE_URL` do seu projeto no Supabase:
   ```bash
   cp .env.example .env
   ```

3. Crie/atualize a tabela no banco de dados:
   ```bash
   npm run db:setup
   ```

4. Inicie o servidor:
   ```bash
   npm run dev
   ```

5. Abra `frontend/index.html` utilizando o **Live Server** (VS Code) ou qualquer servidor HTTP local.
