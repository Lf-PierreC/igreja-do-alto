-- =============================================================================
-- IGREJA DO ALTO — PORTAL DO MEMBRO & NÚCLEO FAMILIAR (MIGRATION SUPABASE)
-- =============================================================================
-- Como executar:
-- 1. Acesse o painel do Supabase (https://supabase.com/dashboard)
-- 2. No menu lateral esquerdo, clique em "SQL Editor" -> "New query"
-- 3. Cole este script e clique em "Run" (Ctrl+Enter)
-- =============================================================================

-- 1. Adiciona os campos de identidade única e família na tabela members
ALTER TABLE public.members 
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS password text,
  ADD COLUMN IF NOT EXISTS is_official_member boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS family_id text,
  ADD COLUMN IF NOT EXISTS family_role text,
  ADD COLUMN IF NOT EXISTS spouse_member_id text,
  ADD COLUMN IF NOT EXISTS dependents jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_pastor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_role text DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS current_ministries jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interested_ministries jsonb DEFAULT '[]'::jsonb;

-- 2. Cria índices únicos para garantir que não haja duplicidade de CPF ou E-mail
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_cpf_unique 
  ON public.members (cpf) 
  WHERE cpf IS NOT NULL AND cpf <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_email_unique 
  ON public.members (lower(email)) 
  WHERE email IS NOT NULL AND email <> '';

CREATE INDEX IF NOT EXISTS idx_members_family_id 
  ON public.members (family_id) 
  WHERE family_id IS NOT NULL;

-- 3. Tabela opcional de Núcleos Familiares (Household)
CREATE TABLE IF NOT EXISTS public.families (
  id text PRIMARY KEY,
  family_name text NOT NULL,
  titular_member_id text NOT NULL,
  spouse_member_id text,
  address jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabela opcional de Filhos e Dependentes Menores de 16 Anos
CREATE TABLE IF NOT EXISTS public.family_dependents (
  id text PRIMARY KEY,
  family_id text NOT NULL,
  registered_by_member_id text NOT NULL,
  full_name text NOT NULL,
  birth_date text NOT NULL,
  gender text,
  relationship text NOT NULL DEFAULT 'Filho(a)',
  notes text,
  cpf text,
  registered_at text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Atualiza o status dos membros oficiais já cadastrados
UPDATE public.members 
SET is_official_member = true 
WHERE cpf IS NOT NULL AND cpf <> '';
