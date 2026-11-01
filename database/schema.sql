-- Atelier: schema principal para PostgreSQL/Supabase
-- Execute este arquivo antes de views.sql, policies.sql e seed.sql.

create extension if not exists pgcrypto;

create type public.tipo_pessoa_cliente as enum ('pessoa', 'empresa');
create type public.tipo_cliente as enum ('varejo', 'atacado');
create type public.status_pedido as enum (
  'orcamento', 'aprovado', 'em_producao', 'pronto', 'entregue', 'cancelado'
);
create type public.forma_pagamento as enum ('pix', 'dinheiro', 'cartao', 'transferencia');
create type public.tipo_pagamento as enum ('sinal', 'parcial', 'quitacao');
create type public.categoria_despesa as enum ('material', 'equipamento', 'contas', 'transporte', 'outros');
create type public.unidade_material as enum ('un', 'm', 'kg', 'l', 'rolo', 'caixa');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 2 and 120),
  telefone text not null check (length(trim(telefone)) between 8 and 30),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  tipo public.tipo_pessoa_cliente not null default 'empresa',
  endereco text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (length(trim(nome)) between 2 and 120),
  descricao text,
  preco_varejo numeric(12,2) not null check (preco_varejo >= 0),
  preco_atacado numeric(12,2) not null check (preco_atacado >= 0),
  tempo_medio_dias integer not null check (tempo_medio_dias between 0 and 365),
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique check (length(trim(nome)) between 2 and 120),
  unidade public.unidade_material not null,
  quantidade_atual numeric(12,3) not null default 0 check (quantidade_atual >= 0),
  estoque_minimo numeric(12,3) not null default 0 check (estoque_minimo >= 0),
  custo_unitario numeric(12,2) not null default 0 check (custo_unitario >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  cliente_id uuid not null references public.clientes(id),
  data_entrada date not null default current_date,
  prazo_entrega date not null,
  status public.status_pedido not null default 'orcamento',
  tipo_venda public.tipo_cliente not null default 'varejo',
  desconto numeric(12,2) not null default 0 check (desconto >= 0),
  valor_total numeric(12,2) not null default 0 check (valor_total >= 0),
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (prazo_entrega >= data_entrada),
  check (codigo ~ '^PED-[0-9]{4,}$')
);

create sequence public.pedidos_codigo_seq;

create or replace function public.set_pedido_codigo()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is null or trim(new.codigo) = '' then
    new.codigo := 'PED-' || lpad(nextval('public.pedidos_codigo_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

alter table public.pedidos alter column codigo set default '';

create table public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  servico_id uuid not null references public.servicos(id),
  descricao_peca text not null check (length(trim(descricao_peca)) between 2 and 200),
  quantidade numeric(10,2) not null check (quantidade > 0),
  valor_unitario numeric(12,2) not null check (valor_unitario >= 0),
  valor_total numeric(12,2) generated always as (round(quantidade * valor_unitario, 2)) stored,
  medidas_observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  valor numeric(12,2) not null check (valor > 0),
  forma public.forma_pagamento not null,
  data_pagamento date not null default current_date,
  tipo public.tipo_pagamento not null,
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.despesas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null check (length(trim(descricao)) between 2 and 200),
  categoria public.categoria_despesa not null,
  valor numeric(12,2) not null check (valor > 0),
  data_despesa date not null default current_date,
  fornecedor text,
  pedido_id uuid references public.pedidos(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  mes integer not null check (mes between 1 and 12),
  ano integer not null check (ano between 2020 and 2200),
  meta_faturamento numeric(12,2) not null default 0 check (meta_faturamento >= 0),
  meta_pedidos integer not null default 0 check (meta_pedidos >= 0),
  meta_lucro numeric(12,2) not null default 0 check (meta_lucro >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (mes, ano)
);

-- Materiais consumidos por pedido. A relação permite baixa e estorno automáticos.
create table public.pedido_materiais (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  material_id uuid not null references public.materiais(id),
  quantidade numeric(12,3) not null check (quantidade > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (pedido_id, material_id)
);

create index clientes_nome_idx on public.clientes using gin (to_tsvector('simple', nome));
create index clientes_telefone_idx on public.clientes (telefone);
create index pedidos_cliente_idx on public.pedidos (cliente_id);
create index pedidos_status_prazo_idx on public.pedidos (status, prazo_entrega);
create index pedidos_data_entrada_idx on public.pedidos (data_entrada);
create index pedido_itens_pedido_idx on public.pedido_itens (pedido_id);
create index pagamentos_pedido_data_idx on public.pagamentos (pedido_id, data_pagamento);
create index despesas_data_categoria_idx on public.despesas (data_despesa, categoria);
create index materiais_alerta_idx on public.materiais (quantidade_atual, estoque_minimo);

create trigger clientes_updated_at before update on public.clientes
for each row execute function public.set_updated_at();
create trigger servicos_updated_at before update on public.servicos
for each row execute function public.set_updated_at();
create trigger materiais_updated_at before update on public.materiais
for each row execute function public.set_updated_at();
create trigger pedidos_updated_at before update on public.pedidos
for each row execute function public.set_updated_at();
create trigger pedido_itens_updated_at before update on public.pedido_itens
for each row execute function public.set_updated_at();
create trigger pagamentos_updated_at before update on public.pagamentos
for each row execute function public.set_updated_at();
create trigger despesas_updated_at before update on public.despesas
for each row execute function public.set_updated_at();
create trigger metas_updated_at before update on public.metas
for each row execute function public.set_updated_at();
create trigger pedido_materiais_updated_at before update on public.pedido_materiais
for each row execute function public.set_updated_at();

create trigger pedidos_codigo before insert on public.pedidos
for each row execute function public.set_pedido_codigo();

create or replace function public.recalcular_total_pedido()
returns trigger
language plpgsql
as $$
declare
  alvo uuid;
begin
  alvo := coalesce(new.pedido_id, old.pedido_id);
  update public.pedidos
     set valor_total = greatest(0, coalesce((
       select sum(valor_total) from public.pedido_itens where pedido_id = alvo
     ), 0) - desconto)
   where id = alvo;
  return coalesce(new, old);
end;
$$;

create trigger pedido_itens_recalcular_total
after insert or update or delete on public.pedido_itens
for each row execute function public.recalcular_total_pedido();

create or replace function public.validar_pagamento_pedido()
returns trigger
language plpgsql
as $$
declare
  total numeric(12,2);
  pago numeric(12,2);
begin
  select valor_total into total from public.pedidos where id = new.pedido_id for update;
  select coalesce(sum(valor), 0) into pago
    from public.pagamentos
   where pedido_id = new.pedido_id and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
  if pago + new.valor > total then
    raise exception using
      errcode = '23514',
      message = 'O pagamento não pode exceder o saldo do pedido';
  end if;
  return new;
end;
$$;

create trigger pagamentos_validar_saldo
before insert or update on public.pagamentos
for each row execute function public.validar_pagamento_pedido();

create or replace function public.validar_entrega_pedido()
returns trigger
language plpgsql
as $$
declare
  pago numeric(12,2);
begin
  if new.status = 'entregue' and new.status is distinct from old.status then
    select coalesce(sum(valor), 0) into pago from public.pagamentos where pedido_id = new.id;
    if pago < new.valor_total then
      raise exception using
        errcode = '23514',
        message = 'O pedido só pode ser entregue com saldo zerado';
    end if;
  end if;
  return new;
end;
$$;

create trigger pedidos_validar_entrega
before update of status on public.pedidos
for each row execute function public.validar_entrega_pedido();

create or replace function public.atualizar_estoque_consumo()
returns trigger
language plpgsql
as $$
declare
  variacao numeric(12,3);
begin
  if tg_op = 'INSERT' then
    update public.materiais
       set quantidade_atual = quantidade_atual - new.quantidade
     where id = new.material_id and quantidade_atual >= new.quantidade;
    if not found then
      raise exception using errcode = '23514', message = 'Estoque insuficiente para o material';
    end if;
  elsif tg_op = 'UPDATE' then
    if old.material_id = new.material_id then
      variacao := new.quantidade - old.quantidade;
      if variacao > 0 then
        update public.materiais
           set quantidade_atual = quantidade_atual - variacao
         where id = new.material_id and quantidade_atual >= variacao;
        if not found then
          raise exception using errcode = '23514', message = 'Estoque insuficiente para o material';
        end if;
      else
        update public.materiais set quantidade_atual = quantidade_atual - variacao
         where id = new.material_id;
      end if;
    else
      update public.materiais set quantidade_atual = quantidade_atual + old.quantidade
       where id = old.material_id;
      update public.materiais
         set quantidade_atual = quantidade_atual - new.quantidade
       where id = new.material_id and quantidade_atual >= new.quantidade;
      if not found then
        raise exception using errcode = '23514', message = 'Estoque insuficiente para o material';
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    update public.materiais set quantidade_atual = quantidade_atual + old.quantidade
     where id = old.material_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger pedido_materiais_atualizar_estoque
after insert or update or delete on public.pedido_materiais
for each row execute function public.atualizar_estoque_consumo();
