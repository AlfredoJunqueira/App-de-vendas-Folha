-- 009_perfil_logo.sql
-- Adiciona campos de identidade visual ao perfil

ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS logo_url       text;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS nome_app       text;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS subtitulo_app  text;
