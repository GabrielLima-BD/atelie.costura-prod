# Fase 1 — Modelo de dados da Mabie

## Plano da fase

1. Definir o monorepo `backend`, `frontend`, `database`, `postman` e `docs`.
2. Modelar o núcleo operacional em 3FN: clientes, serviços, pedidos, itens, pagamentos, despesas, materiais e metas.
3. Implementar integridade no PostgreSQL: enums, `CHECK`, chaves estrangeiras, índices, totais e estoque.
4. Criar views para os indicadores do dashboard e relatórios.
5. Habilitar RLS para usuários autenticados do Supabase e preparar dados fictícios.

## Decisões técnicas

- `uuid` identifica todas as entidades; `created_at` e `updated_at` padronizam auditoria.
- Valores financeiros usam `numeric(12,2)`, sem aritmética de ponto flutuante.
- Pedidos em orçamento não são duplicados: a aprovação altera o status do próprio pedido.
- Clientes não são excluídos pela API quando possuem pedidos; serão inativados com `ativo = false`.
- `pedido_materiais` registra o consumo e permite baixa/estorno transacional do estoque por trigger.
- O backend poderá consultar as views com a chave de servidor, mantendo o acesso direto ao banco fora do frontend.

## Diagrama ER

```mermaid
erDiagram
  CLIENTES ||--o{ PEDIDOS : realiza
  SERVICOS ||--o{ PEDIDO_ITENS : compoe
  PEDIDOS ||--|{ PEDIDO_ITENS : possui
  PEDIDOS ||--o{ PAGAMENTOS : recebe
  PEDIDOS ||--o{ DESPESAS : relaciona
  PEDIDOS ||--o{ PEDIDO_MATERIAIS : consome
  MATERIAIS ||--o{ PEDIDO_MATERIAIS : utilizado

  CLIENTES {
    uuid id PK
    text nome
    text telefone
    text email
    tipo_pessoa_cliente tipo
    boolean ativo
  }
  SERVICOS {
    uuid id PK
    text nome UK
    numeric preco_varejo
    numeric preco_atacado
    integer tempo_medio_dias
  }
  PEDIDOS {
    uuid id PK
    text codigo UK
    uuid cliente_id FK
    date data_entrada
    date prazo_entrega
    status_pedido status
    numeric desconto
    numeric valor_total
  }
  PEDIDO_ITENS {
    uuid id PK
    uuid pedido_id FK
    uuid servico_id FK
    numeric quantidade
    numeric valor_unitario
    numeric valor_total
  }
  PAGAMENTOS {
    uuid id PK
    uuid pedido_id FK
    numeric valor
    forma_pagamento forma
    date data_pagamento
  }
  DESPESAS {
    uuid id PK
    uuid pedido_id FK
    text descricao
    categoria_despesa categoria
    numeric valor
    date data_despesa
  }
  MATERIAIS {
    uuid id PK
    text nome UK
    unidade_material unidade
    numeric quantidade_atual
    numeric estoque_minimo
  }
  PEDIDO_MATERIAIS {
    uuid id PK
    uuid pedido_id FK
    uuid material_id FK
    numeric quantidade
  }
  METAS {
    uuid id PK
    integer mes
    integer ano
    numeric meta_faturamento
    integer meta_pedidos
    numeric meta_lucro
  }
```

## Execução no Supabase

No SQL Editor, execute na ordem `schema.sql`, `views.sql`, `policies.sql` e `seed.sql`.
O seed é fictício e deve ser usado apenas em desenvolvimento/demonstração.
