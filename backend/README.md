# Atelier API

## Executar

1. Copie `.env.example` para `.env` e preencha as credenciais do Supabase.
2. Execute `npm install`.
3. Execute `npm run dev` durante o desenvolvimento ou `npm run build && npm start` em produção.

Todas as rotas, exceto `GET /health`, exigem `Authorization: Bearer <JWT do Supabase Auth>`.
A chave `SUPABASE_SERVICE_ROLE_KEY` deve permanecer somente no backend.
