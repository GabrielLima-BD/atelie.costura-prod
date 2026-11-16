# Ateliê — Sistema de gestão de pedidos

Sistema interno para uma costureira autônoma de Camaquã/RS, desenvolvido para a Atividade Extensionista II (CST em Banco de Dados) e alinhado ao ODS 8. O painel controla clientes, pedidos, prazos, pagamentos, despesas, materiais e metas; não é e-commerce nem PDV.

## Stack e estrutura

- **Banco:** PostgreSQL no Supabase, com SQL, views, triggers e RLS.
- **API:** Node.js, Express e TypeScript estrito.
- **Painel:** React, Vite e TypeScript.
- **Testes de API:** coleção Postman exportável.

```text
backend/       API REST protegida por JWT do Supabase
frontend/      painel React responsivo
database/      schema, views, policies e seed
postman/       coleção e environment
docs/          modelo ER e documentação acadêmica
```

## Configuração

### Banco Supabase

No SQL Editor do projeto Supabase, execute nesta ordem:

1. `database/schema.sql`
2. `database/views.sql`
3. `database/policies.sql`
4. `database/seed.sql` (somente desenvolvimento/demonstração)

Crie o usuário único em **Authentication > Users**. As políticas permitem operações somente para sessões autenticadas.

### Backend

```powershell
Set-Location .\backend
Copy-Item .env.example .env
npm install
npm run dev
```

### Frontend

```powershell
Set-Location .\frontend
Copy-Item .env.example .env
npm install
npm run dev
```


