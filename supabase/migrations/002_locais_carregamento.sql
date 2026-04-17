-- ============================================================
-- Locais de Carregamento
-- ============================================================

create table public.locais_carregamento (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  responsavel    text,
  telefone       text,
  cidade         text,
  estado         char(2),
  endereco       text,
  produto        text check (produto in ('feno', 'pre_secado', 'ambos')),
  capacidade_ton numeric(10, 2),
  observacoes    text,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  owner_id       uuid not null references auth.users(id)
);

create index on public.locais_carregamento (owner_id, ativo);

alter table public.locais_carregamento enable row level security;

create policy "representante_crud_locais" on public.locais_carregamento
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
