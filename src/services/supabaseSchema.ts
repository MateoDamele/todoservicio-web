export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- TODOSERVICIO URUGUAY — SUPABASE POSTGRESQL + RLS + REALTIME SCHEMA
-- Cobertura: Montevideo & Canelones | Admin Principal: MateoD
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. PERFILES & RBAC (Vinculado a auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  document_id text unique, -- Cédula de Identidad UY
  role text not null check (role in ('admin', 'supervisor', 'tecnico', 'limpieza', 'cliente')),
  category text check (category in ('tecnico', 'limpieza', 'supervisor')),
  phone text,
  email text,
  avatar_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_relation text,
  assigned_zone text default 'Montevideo' check (assigned_zone in ('Montevideo', 'Canelones')),
  must_change_password boolean not null default true,
  active boolean not null default true,
  hire_date date default current_date,
  created_at timestamptz not null default now()
);

-- 2. EMPRESAS MATRICES
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rut text not null,
  industry text,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now()
);

-- 3. SEDES Y LOCALES CON GEOCERCAS
create table if not exists public.sites (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  department text not null check (department in ('Montevideo', 'Canelones')),
  neighborhood text,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  geofence_radius_meters integer not null default 100,
  google_maps_url text,
  site_contact_name text,
  site_contact_phone text,
  created_at timestamptz not null default now()
);

-- 4. CATÁLOGO DE SERVICIOS (RUBROS)
create table if not exists public.service_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  default_sla_hours integer not null default 24,
  color_hex text not null default '#1E4B82',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. CALENDARIO OPERATIVO
create table if not exists public.calendar_assignments (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  start_time time not null,
  end_time time not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid not null references public.service_categories(id) on delete restrict,
  status text not null default 'programada' check (status in ('programada', 'en_curso', 'completada', 'cancelada')),
  notes text,
  created_at timestamptz not null default now()
);

-- 6. CONTROL DE LIMPIEZA & GPS (GEOCERCAS)
create table if not exists public.gps_logs (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  type text not null check (type in ('entrada', 'salida')),
  timestamp timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  distance_meters integer not null default 0,
  out_of_range boolean not null default false,
  is_manual boolean not null default false,
  manual_reason text,
  approval_status text not null default 'aprobada' check (approval_status in ('aprobada', 'pendiente', 'rechazada')),
  recorded_by text not null
);

-- 7. ÓRDENES DE TRABAJO CORRELATIVAS (OT-0001...)
create sequence if not exists public.work_order_seq start 1;

create table if not exists public.work_orders (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null default ('OT-' || lpad(nextval('public.work_order_seq')::text, 4, '0')),
  company_id uuid not null references public.companies(id) on delete restrict,
  site_id uuid not null references public.sites(id) on delete restrict,
  staff_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid not null references public.service_categories(id) on delete restrict,
  title text not null,
  description text,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_curso', 'completada')),
  scheduled_date date not null default current_date,
  started_at timestamptz,
  completed_at timestamptz,
  photo_before_url text,
  photo_after_url text,
  signature_data_url text,
  signed_by_name text,
  rating integer check (rating between 1 and 5),
  client_comment text,
  created_at timestamptz not null default now()
);

-- 8. SOLICITUDES Y APROBACIONES
create table if not exists public.approval_requests (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('solicitud_cliente_ia', 'marca_manual_gps', 'cambio_turno')),
  title text not null,
  description text,
  requested_by text not null,
  company_id uuid references public.companies(id) on delete set null,
  site_id uuid references public.sites(id) on delete set null,
  staff_id uuid references public.profiles(id) on delete set null,
  gps_log_id uuid references public.gps_logs(id) on delete set null,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz not null default now()
);

-- 9. CARTELERA DIGITAL & NOTIFICACIONES PUSH
create table if not exists public.notices (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  priority text not null check (priority in ('alta', 'media', 'baja')),
  audience text not null check (audience in ('todos', 'tecnicos', 'limpieza', 'clientes')),
  image_url text,
  push_sent boolean not null default false,
  push_sent_at timestamptz,
  author text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & RBAC HELPERS
-- ============================================================================
create or replace function public.current_user_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.sites enable row level security;
alter table public.service_categories enable row level security;
alter table public.calendar_assignments enable row level security;
alter table public.gps_logs enable row level security;
alter table public.work_orders enable row level security;
alter table public.approval_requests enable row level security;
alter table public.notices enable row level security;

-- Admin / Supervisor: Acceso total operativo
create policy "admin_supervisor_all_companies" on public.companies
  for all using (public.current_user_role() in ('admin', 'supervisor'));

create policy "admin_supervisor_all_sites" on public.sites
  for all using (public.current_user_role() in ('admin', 'supervisor'));

create policy "staff_read_assigned_work_orders" on public.work_orders
  for select using (
    public.current_user_role() in ('admin', 'supervisor')
    or staff_id = auth.uid()
  );

create policy "staff_insert_own_gps" on public.gps_logs
  for insert with check (staff_id = auth.uid() or public.current_user_role() in ('admin', 'supervisor'));

-- ============================================================================
-- REALTIME PUBLICATION (Sincronización instantánea Web <-> App Móvil)
-- ============================================================================
alter publication supabase_realtime add table
  public.calendar_assignments,
  public.gps_logs,
  public.work_orders,
  public.approval_requests,
  public.notices;
`;
