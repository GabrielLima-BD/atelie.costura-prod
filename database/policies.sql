-- RLS para o usuário autenticado do ateliê.
-- O backend usa a sessão do Supabase; service_role continua sendo controlada
-- exclusivamente no servidor e ignora RLS por definição do Supabase.

alter table public.clientes enable row level security;
alter table public.servicos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
alter table public.pagamentos enable row level security;
alter table public.despesas enable row level security;
alter table public.materiais enable row level security;
alter table public.pedido_materiais enable row level security;
alter table public.metas enable row level security;

create policy "usuário autenticado pode ler clientes"
  on public.clientes for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar clientes"
  on public.clientes for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "usuário autenticado pode ler serviços"
  on public.servicos for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar serviços"
  on public.servicos for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "usuário autenticado pode ler pedidos"
  on public.pedidos for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar pedidos"
  on public.pedidos for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "usuário autenticado pode ler itens"
  on public.pedido_itens for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar itens"
  on public.pedido_itens for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "usuário autenticado pode ler pagamentos"
  on public.pagamentos for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar pagamentos"
  on public.pagamentos for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "usuário autenticado pode ler despesas"
  on public.despesas for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar despesas"
  on public.despesas for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "usuário autenticado pode ler materiais"
  on public.materiais for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar materiais"
  on public.materiais for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "usuário autenticado pode ler consumos"
  on public.pedido_materiais for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar consumos"
  on public.pedido_materiais for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "usuário autenticado pode ler metas"
  on public.metas for select to authenticated using (auth.uid() is not null);
create policy "usuário autenticado pode gerenciar metas"
  on public.metas for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
