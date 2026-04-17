-- Adiciona cliente principal ao carregamento (opcional, complementar às paradas)
alter table carregamentos
  add column if not exists cliente_id uuid references clientes(id) on delete set null;
