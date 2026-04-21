-- Migration 019: pesagens_sessao
--
-- Tabela transiente que guarda o estado da conversa entre Alfredo e o
-- bot do WhatsApp durante o fluxo de registro de pesagem.
--
-- Uma linha por telefone autorizado. Ciclo de vida esperado: poucos
-- minutos. Linhas vencidas (expira_em < now()) podem ser ignoradas pelo
-- n8n e limpas por cron/trigger.
--
-- Acesso: exclusivamente via service-role key (n8n). Nenhum código do
-- app web consulta essa tabela — por isso RLS fica habilitado com
-- política restritiva (nega tudo para anon/authenticated). A service-role
-- key bypassa RLS automaticamente.

create table if not exists public.pesagens_sessao (
  telefone              text primary key,
  estagio               text not null
                         check (estagio in ('waiting_choice', 'waiting_confirmation')),
  ticket_data           jsonb not null,
  pedidos_listados      jsonb,
  pedido_escolhido_id   uuid references public.pedidos(id) on delete set null,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now(),
  expira_em             timestamptz not null default (now() + interval '10 minutes')
);

comment on table public.pesagens_sessao is
  'Estado de sessão do fluxo de pesagem via WhatsApp. Uma linha por telefone autorizado.';
comment on column public.pesagens_sessao.telefone is
  'Número completo com DDI+DDD, sem formatação (ex.: 5531999999999).';
comment on column public.pesagens_sessao.estagio is
  'waiting_choice: lista enviada, aguardando número do pedido. waiting_confirmation: pedido escolhido, aguardando S/N.';
comment on column public.pesagens_sessao.ticket_data is
  'JSON com dados extraídos do ticket pelo OCR: { peso_kg, placa, emitente, numero_ticket, data_ticket, media_url }.';
comment on column public.pesagens_sessao.pedidos_listados is
  'JSON array com snapshot dos pedidos apresentados ao usuário: [{ pedido_id, cliente_nome, contato_nome, contato_telefone }].';
comment on column public.pesagens_sessao.expira_em is
  'Quando a sessão deixa de ser válida. Padrão: now() + 10 min. Atualizar em cada interação.';

create index if not exists pesagens_sessao_expira_idx
  on public.pesagens_sessao (expira_em);

-- Trigger para atualizar atualizado_em automaticamente em cada UPDATE.
create or replace function public.pesagens_sessao_set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists pesagens_sessao_atualizado_em on public.pesagens_sessao;
create trigger pesagens_sessao_atualizado_em
  before update on public.pesagens_sessao
  for each row
  execute function public.pesagens_sessao_set_atualizado_em();

-- RLS habilitado com negação total para clients não-service-role.
-- O n8n usa service-role e bypassa RLS.
alter table public.pesagens_sessao enable row level security;

-- Política explícita negando acesso ao role anon (defesa em profundidade).
drop policy if exists pesagens_sessao_no_anon on public.pesagens_sessao;
create policy pesagens_sessao_no_anon
  on public.pesagens_sessao
  for all
  to anon
  using (false)
  with check (false);

-- Nem authenticated (usuários logados no Folha) podem tocar nessa tabela.
drop policy if exists pesagens_sessao_no_authenticated on public.pesagens_sessao;
create policy pesagens_sessao_no_authenticated
  on public.pesagens_sessao
  for all
  to authenticated
  using (false)
  with check (false);
