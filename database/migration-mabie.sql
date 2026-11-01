-- Migração da base existente para o posicionamento da Mabie.
-- Execute uma única vez depois do schema original já aplicado.

do $$
begin
  create type public.tipo_pessoa_cliente as enum ('pessoa', 'empresa');
exception
  when duplicate_object then null;
end
$$;

alter table public.clientes
  alter column tipo drop default;

alter table public.clientes
  alter column tipo type public.tipo_pessoa_cliente
  using case tipo::text
    when 'atacado' then 'empresa'::public.tipo_pessoa_cliente
    else 'pessoa'::public.tipo_pessoa_cliente
  end;

alter table public.clientes
  alter column tipo set default 'empresa'::public.tipo_pessoa_cliente;

update public.clientes
set tipo = 'empresa'::public.tipo_pessoa_cliente
where nome in ('Boutique Estilo Sul', 'Escola Caminhos');

update public.servicos
set nome = 'Camiseta personalizada',
    descricao = 'Corte e costura de camisetas para equipes e empresas',
    preco_varejo = 55.00,
    preco_atacado = 42.00,
    tempo_medio_dias = 7
where nome = 'Barra de calça';

update public.servicos
set nome = 'Moletom personalizado',
    descricao = 'Confecção de moletons sob medida',
    preco_varejo = 135.00,
    preco_atacado = 110.00,
    tempo_medio_dias = 12
where nome = 'Ajuste de cintura';

update public.servicos
set nome = 'Jaqueta personalizada',
    descricao = 'Confecção de jaquetas para equipes e empresas',
    preco_varejo = 180.00,
    preco_atacado = 150.00,
    tempo_medio_dias = 15
where nome = 'Conserto de zíper';

update public.servicos
set nome = 'Calça personalizada',
    descricao = 'Confecção e ajustes de calças',
    preco_varejo = 95.00,
    preco_atacado = 78.00,
    tempo_medio_dias = 8
where nome = 'Confecção de uniforme';
