-- Dados fictícios para desenvolvimento e demonstração.
-- Execute com um usuário autenticado ou via SQL Editor do Supabase.

insert into public.clientes (nome, telefone, email, tipo, endereco, observacoes) values
  ('Boutique Estilo Sul', '(51) 99822-3344', 'compras@example.com', 'empresa', 'Várzea, Camaquã - RS', 'Pedidos recorrentes de camisetas e moletons'),
  ('Escola Caminhos', '(51) 99644-5566', 'secretaria@example.com', 'empresa', 'Floresta, Camaquã - RS', 'Uniformes escolares'),
  ('Mariana Souza', '(51) 99911-2233', 'mariana@example.com', 'pessoa', 'Centro, Camaquã - RS', 'Prefere contato por WhatsApp'),
  ('João Oliveira', '(51) 99733-4455', null, 'pessoa', 'Cohab, Camaquã - RS', null);

insert into public.servicos (nome, descricao, preco_varejo, preco_atacado, tempo_medio_dias) values
  ('Camiseta personalizada', 'Corte e costura de camisetas para equipes e empresas', 55.00, 42.00, 7),
  ('Moletom personalizado', 'Confecção de moletons sob medida', 135.00, 110.00, 12),
  ('Jaqueta personalizada', 'Confecção de jaquetas para equipes e empresas', 180.00, 150.00, 15),
  ('Calça personalizada', 'Confecção e ajustes de calças', 95.00, 78.00, 8);

insert into public.materiais (nome, unidade, quantidade_atual, estoque_minimo, custo_unitario) values
  ('Linha preta', 'rolo', 8, 3, 12.50),
  ('Zíper para jaqueta', 'un', 14, 5, 3.80),
  ('Malha para camisetas', 'm', 18, 8, 24.90);

insert into public.metas (mes, ano, meta_faturamento, meta_pedidos, meta_lucro)
values (extract(month from current_date)::integer, extract(year from current_date)::integer, 3500.00, 30, 1800.00);

with dados as (
  select
    (select id from public.clientes where nome = 'Boutique Estilo Sul') as cliente_id,
    current_date - 12 as entrada,
    current_date - 5 as prazo,
    'entregue'::public.status_pedido as status,
    'varejo'::public.tipo_cliente as tipo
  union all
  select
    (select id from public.clientes where nome = 'Escola Caminhos'),
    current_date - 3, current_date + 6, 'em_producao', 'atacado'
  union all
  select
    (select id from public.clientes where nome = 'Mariana Souza'),
    current_date, current_date + 4, 'aprovado', 'varejo'
  union all
  select
    (select id from public.clientes where nome = 'João Oliveira'),
    current_date - 1, current_date + 12, 'orcamento', 'atacado'
)
insert into public.pedidos (cliente_id, data_entrada, prazo_entrega, status, tipo_venda)
select cliente_id, entrada, prazo, status, tipo from dados;

insert into public.pedido_itens (pedido_id, servico_id, descricao_peca, quantidade, valor_unitario, medidas_observacoes)
select p.id, s.id, 'Lote de camisetas', 20, 42.00, 'Logo da empresa no peito'
from public.pedidos p join public.servicos s on s.nome = 'Camiseta personalizada'
where p.codigo = 'PED-0001';

insert into public.pedido_itens (pedido_id, servico_id, descricao_peca, quantidade, valor_unitario)
select p.id, s.id, 'Lote de moletons', 8, 110.00
from public.pedidos p join public.servicos s on s.nome = 'Moletom personalizado'
where p.codigo = 'PED-0002';

insert into public.pedido_itens (pedido_id, servico_id, descricao_peca, quantidade, valor_unitario)
select p.id, s.id, 'Jaqueta corporativa', 1, 150.00
from public.pedidos p join public.servicos s on s.nome = 'Jaqueta personalizada'
where p.codigo = 'PED-0003';

insert into public.pedido_itens (pedido_id, servico_id, descricao_peca, quantidade, valor_unitario)
select p.id, s.id, 'Calça de uniforme', 12, 78.00
from public.pedidos p join public.servicos s on s.nome = 'Calça personalizada'
where p.codigo = 'PED-0004';

insert into public.pagamentos (pedido_id, valor, forma, data_pagamento, tipo)
select id, valor_total, 'pix', current_date - 6, 'quitacao'
from public.pedidos where codigo = 'PED-0001';

insert into public.pagamentos (pedido_id, valor, forma, data_pagamento, tipo)
select id, 300.00, 'transferencia', current_date - 2, 'sinal'
from public.pedidos where codigo = 'PED-0002';

insert into public.pagamentos (pedido_id, valor, forma, data_pagamento, tipo)
select id, 20.00, 'dinheiro', current_date, 'sinal'
from public.pedidos where codigo = 'PED-0003';

insert into public.despesas (descricao, categoria, valor, data_despesa, fornecedor) values
  ('Compra de linhas e zíperes', 'material', 185.40, current_date - 8, 'Armarinho Central'),
  ('Conta de energia', 'contas', 142.70, current_date - 4, null),
  ('Passagem para entrega', 'transporte', 28.00, current_date - 1, null);
