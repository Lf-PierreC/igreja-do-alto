-- =============================================================================
-- IGREJA DO ALTO — MINISTÉRIO BEM-VINDOS (MIGRATION SUPABASE)
-- =============================================================================
-- Como executar:
-- 1. Acesse o painel do Supabase (https://supabase.com/dashboard)
-- 2. No menu lateral esquerdo, clique em "SQL Editor" -> "New query"
-- 3. Cole este script e clique em "Run" (Ctrl+Enter)
-- =============================================================================

-- 1. Tabela de Visitantes de Primeira Vez
CREATE TABLE IF NOT EXISTS public.first_time_visitors (
  id text PRIMARY KEY,
  full_name text NOT NULL,
  phone text NOT NULL,
  how_heard text NOT NULL,
  how_heard_detail text,
  church_background text,
  other_church_name text,
  visit_date text NOT NULL,
  service_period text,
  neighborhood text,
  city text,
  prayer_request text,
  status text NOT NULL DEFAULT 'novo',
  notes jsonb DEFAULT '[]'::jsonb,
  registered_by jsonb DEFAULT '{"type":"self"}'::jsonb,
  assigned_to jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para busca rápida e ordenação
CREATE INDEX IF NOT EXISTS idx_visitors_visit_date ON public.first_time_visitors (visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.first_time_visitors (status);
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON public.first_time_visitors (phone);

-- 2. Tabela de Solicitações de Acesso ao Portal Bem-Vindos
CREATE TABLE IF NOT EXISTS public.bem_vindos_access_requests (
  id text PRIMARY KEY,
  member_id text NOT NULL,
  member_name text NOT NULL,
  member_email text NOT NULL,
  member_phone text NOT NULL,
  member_ministries jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente' | 'aprovado' | 'recusado'
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz,
  role text DEFAULT 'voluntario'
);

CREATE INDEX IF NOT EXISTS idx_bv_requests_status ON public.bem_vindos_access_requests (status);
CREATE INDEX IF NOT EXISTS idx_bv_requests_member ON public.bem_vindos_access_requests (member_id);

-- 3. Tabela de Equipe Ativa e Aprovada no Portal Bem-Vindos
CREATE TABLE IF NOT EXISTS public.bem_vindos_team (
  member_id text PRIMARY KEY,
  member_name text NOT NULL,
  member_email text,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'voluntario', -- 'voluntario' | 'lider' | 'pastor'
  approved_at timestamptz NOT NULL DEFAULT now(),
  approved_by text NOT NULL
);

-- Desativa RLS para simplificar integração com a service key ou habilita leitura pública controlada
ALTER TABLE public.first_time_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bem_vindos_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bem_vindos_team ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso permissivas para uso via backend API
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'first_time_visitors' AND policyname = 'Allow public insert for visitors'
  ) THEN
    CREATE POLICY "Allow public insert for visitors" ON public.first_time_visitors FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'first_time_visitors' AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON public.first_time_visitors FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bem_vindos_access_requests' AND policyname = 'Allow all bv requests'
  ) THEN
    CREATE POLICY "Allow all bv requests" ON public.bem_vindos_access_requests FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bem_vindos_team' AND policyname = 'Allow all bv team'
  ) THEN
    CREATE POLICY "Allow all bv team" ON public.bem_vindos_team FOR ALL USING (true);
  END IF;
END $$;
