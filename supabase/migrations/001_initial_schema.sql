-- ============================================================
-- App Representante de Feno — Schema Inicial
-- ============================================================

-- Tabela de perfis de fornecedores (vincula fornecedor → representante)
create table public.supplier_profiles (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  rep_id   uuid not null references auth.users(id) on delete cascade
);

-- ============================================================
-- CLIENTES
-- ============================================================
create table public.clientes (
  id                uuid primary key default gen_random_uuid(),
  nome_propriedade  text not null,
  contato           text,
  telefone          text,
  cidade            text,
  estado            char(2),
  tipo_animal       text check (tipo_animal in ('bovino', 'equino', 'ambos')),
  num_cabecas       integer,
  produto_preferido text check (produto_preferido in ('feno', 'pre_secado', 'ambos')),
  volume_medio_ton  numeric(10, 2),
  status            text not null default 'prospecto'
                      check (status in ('ativo', 'inativo', 'prospecto')),
  observacoes       text,
  criado_em         timestamptz not null default now(),
  owner_id          uuid not null references auth.users(id)
);

-- ============================================================
-- INTERAÇÕES
-- ============================================================
create table public.interacoes (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid not null references public.clientes(id) on delete cascade,
  data              date not null,
  tipo              text not null check (tipo in ('visita', 'ligacao', 'whatsapp', 'email')),
  assunto           text,
  proxima_acao      text,
  data_proxima_acao date,
  criado_em         timestamptz not null default now(),
  owner_id          uuid not null references auth.users(id)
);

-- ============================================================
-- PEDIDOS
-- ============================================================
create table public.pedidos (
  id                    uuid primary key default gen_random_uuid(),
  cliente_id            uuid not null references public.clientes(id),
  produto               text not null check (produto in ('feno', 'pre_secado')),
  quantidade_ton        numeric(10, 3) not null,
  preco_ton             numeric(10, 2) not null,
  valor_total           numeric(12, 2) generated always as (quantidade_ton * preco_ton) stored,
  data_fechamento       date,
  data_entrega_prevista date,
  status                text not null default 'em_aberto'
                          check (status in ('em_aberto', 'confirmado', 'entregue', 'cancelado')),
  observacoes           text,
  criado_em             timestamptz not null default now(),
  owner_id              uuid not null references auth.users(id)
);

-- ============================================================
-- CARREGAMENTOS
-- ============================================================
create table public.carregamentos (
  id                     uuid primary key default gen_random_uuid(),
  data                   date not null,
  transportador_nome     text,
  transportador_telefone text,
  transportador_placa    text,
  status                 text not null default 'rascunho'
                           check (status in ('rascunho', 'confirmado', 'em_rota', 'entregue')),
  link_publico_token     uuid not null unique default gen_random_uuid(),
  criado_em              timestamptz not null default now(),
  owner_id               uuid not null references auth.users(id)
);

-- ============================================================
-- PARADAS
-- ============================================================
create table public.paradas (
  id              uuid primary key default gen_random_uuid(),
  carregamento_id uuid not null references public.carregamentos(id) on delete cascade,
  cliente_id      uuid not null references public.clientes(id),
  produto         text not null check (produto in ('feno', 'pre_secado')),
  quantidade_kg   numeric(10, 2) not null,
  ordem           smallint not null,
  observacoes     text,
  criado_em       timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index on public.interacoes (cliente_id, data desc);
create index on public.pedidos (cliente_id, status);
create index on public.pedidos (data_fechamento);
create index on public.carregamentos (data, status);
create index on public.carregamentos (link_publico_token);
create index on public.paradas (carregamento_id, ordem);

-- ============================================================
-- RLS — ROW LEVEL SECURITY
-- ============================================================
alter table public.clientes          enable row level security;
alter table public.interacoes        enable row level security;
alter table public.pedidos           enable row level security;
alter table public.carregamentos     enable row level security;
alter table public.paradas           enable row level security;
alter table public.supplier_profiles enable row level security;

-- CLIENTES
create policy "representante_crud_clientes" on public.clientes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "fornecedor_leitura_clientes" on public.clientes
  for select using (
    exists (
      select 1 from public.supplier_profiles sp
      where sp.user_id = auth.uid() and sp.rep_id = owner_id
    )
  );

-- INTERAÇÕES
create policy "representante_crud_interacoes" on public.interacoes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- PEDIDOS
create policy "representante_crud_pedidos" on public.pedidos
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "fornecedor_leitura_pedidos" on public.pedidos
  for select using (
    exists (
      select 1 from public.supplier_profiles sp
      where sp.user_id = auth.uid() and sp.rep_id = owner_id
    )
  );

-- CARREGAMENTOS
create policy "representante_crud_carregamentos" on public.carregamentos
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "fornecedor_leitura_carregamentos" on public.carregamentos
  for select using (
    exists (
      select 1 from public.supplier_profiles sp
      where sp.user_id = auth.uid() and sp.rep_id = owner_id
    )
  );

create policy "fornecedor_confirma_carregamentos" on public.carregamentos
  for update using (
    status = 'rascunho'
    and exists (
      select 1 from public.supplier_profiles sp
      where sp.user_id = auth.uid() and sp.rep_id = owner_id
    )
  ) with check (status = 'confirmado');

-- PARADAS
create policy "representante_crud_paradas" on public.paradas
  for all using (
    exists (
      select 1 from public.carregamentos c
      where c.id = carregamento_id and c.owner_id = auth.uid()
    )
  );

create policy "fornecedor_leitura_paradas" on public.paradas
  for select using (
    exists (
      select 1 from public.carregamentos c
      join public.supplier_profiles sp on sp.rep_id = c.owner_id
      where c.id = carregamento_id and sp.user_id = auth.uid()
    )
  );

-- SUPPLIER PROFILES
create policy "representante_gerencia_fornecedores" on public.supplier_profiles
  for all using (rep_id = auth.uid());
