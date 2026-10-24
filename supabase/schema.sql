-- REHLO database setup. Run once in Supabase → SQL Editor (safe to re-run).
--
-- Security model: RLS is enabled on every table with NO policies, so the anon key
-- cannot read or write anything directly. All access goes through the Next.js
-- server, which validates input, checks the signed staff session cookie
-- (lib/auth.ts) and uses the service-role key.
--
-- Who can do what:
--   Site admin  - signs in with username "admin" and the admin password
--                 (ADMIN_PASSWORD_HASH). Full access, including agent accounts.
--   Agents      - accounts the admin creates (staff_agents). Can create, edit and
--                 publish their OWN listings, and work every enquiry (mark
--                 contacted, add feedback). Cannot delete enquiries, tick
--                 verification checks, or touch other agents' listings.
--   Public      - can submit enquiries, callbacks, service requests, and
--                 vacancies (a room free in an existing flat). Vacancies stay
--                 unpublished until staff review them.

-- ------------------------------------------------------------------ agents
create table if not exists public.staff_agents (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  display_name  text not null,
  -- scrypt hash from lib/password.ts. The plain password is never stored.
  password_hash text not null,
  active        boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Failed sign-in attempts: 5 in a minute from one IP locks that IP for 60 seconds.
create table if not exists public.staff_login_attempts (
  id           bigint generated always as identity primary key,
  ip           text not null,
  username     text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists staff_login_attempts_idx on public.staff_login_attempts (ip, attempted_at);

-- ---------------------------------------------------------------- listings
create table if not exists public.listings (
  id                        text primary key,
  slug                      text not null unique,
  title                     text not null,
  description               text not null,
  locality                  text not null,
  landmark                  text,
  approx_distance_km        double precision,
  accommodation_type        text not null check (accommodation_type in ('PG','Shared Room','Private Room','Flat','Hostel')),
  furnishing                text not null check (furnishing in ('Furnished','Semi-furnished','Unfurnished')),
  sharing_type              text not null,
  monthly_rent              integer not null,
  deposit                   integer,
  maintenance               integer,
  other_charges             text,
  pricing_notes             text,
  capacity                  integer,
  occupied                  integer,
  available_from            date,
  bedrooms                  integer,
  bathrooms                 integer,
  amenities                 text[] not null default '{}',
  house_rules               text[] not null default '{}',
  gender_restriction        text check (gender_restriction in ('Women only','Men only','Any')),
  images                    text[] not null default '{}',
  videos                    text[] not null default '{}',
  owner_name                text,
  owner_contact             text,          -- internal only
  owner_identity_checked    boolean not null default false,
  listing_details_reviewed  boolean not null default false,
  verification_notes        text not null default '',  -- internal only
  published                 boolean not null default false,
  source                    text not null check (source in ('admin','agent','public-vacancy')),
  -- The agent who owns the listing. Null for admin-posted and public vacancies.
  agent_id                  uuid references public.staff_agents (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index if not exists listings_published_idx on public.listings (published);
create index if not exists listings_agent_idx on public.listings (agent_id);

-- --------------------------------------------------------------- enquiries
create table if not exists public.enquiries (
  id                        text primary key,  -- human reference, e.g. RH-1024-K7QM
  type                      text not null check (type in ('property-enquiry','callback')),
  status                    text not null default 'new' check (status in ('new','contacted','follow-up','closed')),
  listing_id                text references public.listings (id) on delete set null,
  listing_title_snapshot    text,
  full_name                 text not null,
  mobile                    text not null,
  email                     text,
  whatsapp_preferred        boolean not null default false,
  year_of_study             text not null,
  accommodation_requirement text not null,
  group_size                integer not null,
  occupants_for             text,
  vacancies_needed          integer,
  preferred_bedrooms        integer,
  whole_flat_together       boolean,
  shared_common_areas_ok    boolean,
  joining_with              text,
  pg_sharing                text,
  meals_required            boolean,
  budget                    text not null,
  preferred_locality        text not null,
  move_in_date              date,
  move_in_flexible          boolean not null default false,
  preferred_callback_time   text,
  additional_requirements   text,
  internal_note             text not null default '',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

-- Feedback log: one row each time staff contact the student and record the response.
create table if not exists public.enquiry_feedback (
  id          bigint generated always as identity primary key,
  enquiry_id  text not null references public.enquiries (id) on delete cascade,
  author_id   uuid references public.staff_agents (id) on delete set null,  -- null = site admin
  author_name text not null,   -- snapshot, so history survives an agent being removed
  status      text not null check (status in ('new','contacted','follow-up','closed')),
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists enquiry_feedback_enquiry_idx on public.enquiry_feedback (enquiry_id, created_at);

-- -------------------------------------------------------- service requests
create table if not exists public.service_requests (
  id                  text primary key,  -- e.g. SR-1024-K7QM
  category            text not null,
  locality            text not null,
  issue               text not null,
  preferred_date      date not null,
  contact_preference  text not null check (contact_preference in ('Phone call','WhatsApp','Email')),
  contact             text not null,
  status              text not null default 'new' check (status in ('new','contacted','follow-up','closed')),
  internal_note       text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists service_requests_created_idx on public.service_requests (created_at desc);

alter table public.staff_agents         enable row level security;
alter table public.staff_login_attempts enable row level security;
alter table public.listings             enable row level security;
alter table public.enquiries            enable row level security;
alter table public.enquiry_feedback     enable row level security;
alter table public.service_requests     enable row level security;

-- ----------------------------------------------------------------- storage
-- Public bucket for listing photos and video tours. 50 MB per file is the
-- Supabase Free plan maximum; raise it here (and in lib/media.ts) on Pro.
-- Uploads only happen through short-lived signed URLs issued by the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media', 'listing-media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
