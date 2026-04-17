alter table locais_carregamento
  add column if not exists cor_fonte text default null;
