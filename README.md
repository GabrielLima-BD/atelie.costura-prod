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

Para uma base que já recebeu a versão anterior do sistema, execute
`database/migration-mabie.sql` uma única vez. Ela transforma o tipo antigo
`varejo/atacado` dos clientes em `pessoa/empresa` e atualiza o catálogo para
camisetas, moletons, jaquetas e calças.

Crie o usuário único em **Authentication > Users**. As políticas permitem operações somente para sessões autenticadas.

### Backend

```powershell
Set-Location .\backend
Copy-Item .env.example .env
npm install
npm run dev
```

Preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no `.env`. A chave `service_role` nunca deve ir para o frontend, para o Git ou para a coleção Postman.

Endpoints públicos: `GET http://localhost:3333/health`. As demais rotas usam `Authorization: Bearer <JWT>`.

### Frontend

```powershell
Set-Location .\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Preencha as variáveis do Supabase e, se necessário, ajuste `VITE_API_URL`. O frontend usa Supabase somente para login/sessão; dados de negócio sempre passam pela API REST.

### Deploy no Vercel

O repositório está configurado como um projeto Vercel único: o frontend Vite é
gerado em `frontend/dist` e a API Express roda como uma Function em
`api/[...path].ts`. Ao importar o repositório, mantenha **Root Directory**
vazio (raiz do repositório) e use o commit mais recente. Configure no Vercel:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
VITE_API_URL=/api/v1
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-publicavel
SUPABASE_SERVICE_ROLE_KEY=chave-apenas-no-servidor
FRONTEND_ORIGIN=https://seu-projeto.vercel.app
```

`SUPABASE_SERVICE_ROLE_KEY` deve ser cadastrada somente nas variáveis do
Vercel e nunca no frontend ou no repositório.

## Postman

Importe `postman/atelier.postman_collection.json` e `postman/atelier.postman_environment.json`. Selecione o environment **Ateliê - Local**, preencha `accessToken` com o JWT da sessão do usuário e execute as pastas na ordem desejada.

## Validação executada

```powershell
Set-Location .\backend; npm run build
Set-Location ..\frontend; npm run build
```

Os dois builds passam com TypeScript estrito. A validação contra um Supabase real depende das credenciais e de um projeto configurado; o SQL deve ser executado no SQL Editor do Supabase.

## Documentação acadêmica

- [Modelo ER e decisões técnicas](docs/modelo-er.md)
- [Visão do produto, requisitos e processo](docs/visao-geral.md)
