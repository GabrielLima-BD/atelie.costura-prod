-- Views de leitura usadas pelos relatórios do painel.

create or replace view public.vw_faturamento_mensal as
select
  date_trunc('month', p.data_entrada)::date as mes,
  count(*) filter (where p.status <> 'cancelado')::integer as quantidade_pedidos,
  coalesce(sum(p.valor_total) filter (where p.status in ('aprovado', 'em_producao', 'pronto', 'entregue')), 0)::numeric(12,2) as faturamento
from public.pedidos p
group by 1
order by 1;

create or replace view public.vw_saldo_a_receber as
select
  p.id as pedido_id,
  p.codigo,
  p.cliente_id,
  c.nome as cliente,
  p.prazo_entrega,
  p.status,
  p.valor_total,
  coalesce(sum(pg.valor), 0)::numeric(12,2) as total_pago,
  greatest(0, p.valor_total - coalesce(sum(pg.valor), 0))::numeric(12,2) as saldo
from public.pedidos p
join public.clientes c on c.id = p.cliente_id
left join public.pagamentos pg on pg.pedido_id = p.id
where p.status <> 'cancelado'
group by p.id, c.nome;

create or replace view public.vw_lucro_mensal as
with receitas as (
  select date_trunc('month', data_pagamento)::date as mes, sum(valor) as valor
  from public.pagamentos
  group by 1
), custos as (
  select date_trunc('month', data_despesa)::date as mes, sum(valor) as valor
  from public.despesas
  group by 1
)
select
  coalesce(r.mes, c.mes) as mes,
  coalesce(r.valor, 0)::numeric(12,2) as receitas,
  coalesce(c.valor, 0)::numeric(12,2) as despesas,
  (coalesce(r.valor, 0) - coalesce(c.valor, 0))::numeric(12,2) as lucro
from receitas r
full join custos c on c.mes = r.mes
order by 1;

create or replace view public.vw_pedidos_atrasados as
select p.*, c.nome as cliente, c.telefone
from public.pedidos p
join public.clientes c on c.id = p.cliente_id
where p.prazo_entrega < current_date
  and p.status not in ('entregue', 'cancelado');

create or replace view public.vw_valor_medio_por_peca as
select
  date_trunc('month', p.data_entrada)::date as mes,
  coalesce(sum(i.valor_total) / nullif(sum(i.quantidade), 0), 0)::numeric(12,2) as valor_medio
from public.pedidos p
join public.pedido_itens i on i.pedido_id = p.id
where p.status <> 'cancelado'
group by 1
order by 1;

create or replace view public.vw_top_servicos as
select
  s.id as servico_id,
  s.nome,
  sum(i.quantidade)::numeric(12,2) as quantidade,
  sum(i.valor_total)::numeric(12,2) as faturamento
from public.pedido_itens i
join public.servicos s on s.id = i.servico_id
join public.pedidos p on p.id = i.pedido_id
where p.status <> 'cancelado'
group by s.id, s.nome
order by faturamento desc;

create or replace view public.vw_comparativo_tipo_venda as
select
  p.tipo_venda,
  count(distinct p.id)::integer as quantidade_pedidos,
  coalesce(sum(p.valor_total), 0)::numeric(12,2) as faturamento,
  coalesce(avg(p.valor_total), 0)::numeric(12,2) as ticket_medio
from public.pedidos p
where p.status <> 'cancelado'
group by p.tipo_venda;

create or replace view public.vw_materiais_abaixo_minimo as
select *
from public.materiais
where ativo and quantidade_atual <= estoque_minimo;
