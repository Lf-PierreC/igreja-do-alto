-- =============================================================================
-- IGREJA DO ALTO — GESTÃO DE VISITAS PASTORAIS (SUPABASE / POSTGRESQL SCHEMA)
-- =============================================================================
-- Como usar:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com/dashboard)
-- 2. No menu lateral esquerdo, clique em "SQL Editor" -> "New query"
-- 3. Cole todo este conteúdo e clique em "Run" (ou Ctrl+Enter)
-- =============================================================================

-- 1. TABELA DE PASTORES E VISITADORES AUTORIZADOS
create table if not exists public.pastors (
  id text primary key,
  name text not null unique,
  role text not null default 'Pastor(a) / Visitador(a)',
  phone text not null default '',
  region_focus text not null default 'Geral',
  created_at timestamptz not null default now()
);

-- 2. TABELA DE MEMBROS / FAMÍLIAS (PRONTUÁRIO PASTORAL)
create table if not exists public.members (
  id text primary key,
  name text not null,
  phone text not null,
  birth_date text,
  marital_status text,
  spouse_name text,
  household_size integer,
  family_in_church text,
  relationship text not null default 'Membro',
  attendance_time text,
  participates_in_activity boolean,
  activity_name text,
  address jsonb not null default '{"street":"","number":"","neighborhood":"","city":"São Paulo"}'::jsonb,
  registered_at text not null,
  last_visit_date text,
  last_visited_by text,
  situation text not null default 'bem', -- 'bem' | 'acompanhamento' | 'atencao' | 'prioritario'
  situation_note text,
  needs text[] not null default '{}',
  next_visit_due text,
  next_step text,
  follow_up_responsible text,
  leadership_alert text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. TABELA DO FORMULÁRIO 1 — SOLICITAÇÕES DE VISITA PASTORAL
create table if not exists public.visit_requests (
  id text primary key,
  member_id text not null references public.members(id) on delete cascade,
  member_name text not null,
  phone text not null,
  relationship text not null,
  requester_type text not null,
  reasons text[] not null default '{}',
  address jsonb not null,
  preferred_days text[] not null default '{}',
  preferred_shifts text[] not null default '{}',
  observations text,
  status text not null default 'pendente', -- 'pendente' | 'agendada' | 'realizada' | 'cancelada'
  assigned_pastor text,
  scheduled_date text,
  created_at text not null,
  inserted_at timestamptz not null default now()
);

-- 4. TABELA DO FORMULÁRIO 2 — RELATÓRIOS DE VISITA PASTORAL
create table if not exists public.visit_reports (
  id text primary key,
  request_id text references public.visit_requests(id) on delete set null,
  member_id text not null references public.members(id) on delete cascade,
  member_name text not null,
  neighborhood text not null,
  visit_date text not null,
  approx_time text,
  visitors text[] not null default '{}',
  others_present text,
  visit_happened text not null,
  main_reason text,
  situation text,
  service_attendance text,
  integration text,
  in_casa_do_alto text,
  in_ministry text,
  summary text,
  has_prayer_request boolean,
  prayer_request text,
  needs_follow_up boolean,
  follow_up_needs text[] not null default '{}',
  leadership_communication text,
  leadership_note text,
  next_step text,
  needs_new_visit text,
  new_visit_timeframe text,
  next_visit_due text,
  follow_up_responsible text,
  internal_notes text,
  created_at text not null,
  inserted_at timestamptz not null default now()
);

-- =============================================================================
-- ÍNDICES PARA BUSCA RÁPIDA E FILTROS DO DASHBOARD
-- =============================================================================
create index if not exists idx_members_name on public.members (name);
create index if not exists idx_members_situation on public.members (situation);
create index if not exists idx_visit_requests_status on public.visit_requests (status);
create index if not exists idx_visit_requests_member_id on public.visit_requests (member_id);
create index if not exists idx_visit_reports_member_id on public.visit_reports (member_id);
create index if not exists idx_visit_reports_visit_date on public.visit_reports (visit_date desc);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- =============================================================================
alter table public.pastors enable row level security;
alter table public.members enable row level security;
alter table public.visit_requests enable row level security;
alter table public.visit_reports enable row level security;

-- Permite acesso via API da aplicação (usando anon/service_role key na rota /api/dados)
drop policy if exists "Acesso total na tabela pastors" on public.pastors;
create policy "Acesso total na tabela pastors"
  on public.pastors for all
  using (true)
  with check (true);

drop policy if exists "Acesso total na tabela members" on public.members;
create policy "Acesso total na tabela members"
  on public.members for all
  using (true)
  with check (true);

drop policy if exists "Acesso total na tabela visit_requests" on public.visit_requests;
create policy "Acesso total na tabela visit_requests"
  on public.visit_requests for all
  using (true)
  with check (true);

drop policy if exists "Acesso total na tabela visit_reports" on public.visit_reports;
create policy "Acesso total na tabela visit_reports"
  on public.visit_reports for all
  using (true)
  with check (true);

-- =============================================================================
-- CARGA INICIAL DE PASTORES E VISITADORES
-- =============================================================================
insert into public.pastors (id, name, role, phone, region_focus)
values
  ('pas-1', 'Prs. Marcos e Mara', 'Pastores', '', 'Igreja do Alto'),
  ('pas-2', 'Prs. Rafael e Jelly', 'Pastores', '', 'Igreja do Alto'),
  ('pas-3', 'Prs. Beto e Sheila', 'Pastores', '', 'Igreja do Alto'),
  ('pas-4', 'Prs. Wenderson e Paula', 'Pastores', '', 'Igreja do Alto'),
  ('pas-5', 'Prs. Ademir e Fátima', 'Pastores', '', 'Igreja do Alto'),
  ('pas-6', 'Prs. Cláudio e Cidinha', 'Pastores', '', 'Igreja do Alto'),
  ('pas-7', 'Prs. Júlio e Marlen', 'Pastores', '', 'Igreja do Alto')
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  phone = excluded.phone,
  region_focus = excluded.region_focus;
