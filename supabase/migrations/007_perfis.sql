-- Tabela de perfil do representante (uma linha por usuário)
CREATE TABLE IF NOT EXISTS public.perfis (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        text,
  telefone    text,
  email       text,
  empresa     text,
  cnpj        text,
  inscricao_estadual text,
  endereco    text,
  cidade      text,
  estado      text,
  cep         text,
  criado_em   timestamptz DEFAULT now()
);

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil_proprio" ON public.perfis
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
