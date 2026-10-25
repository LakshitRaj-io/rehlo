-- Marks a listing as a vacancy (a room or bed free in an already-occupied flat)
-- rather than a whole PG / flat / hostel listing. Staff can post either kind;
-- the public can only submit vacancies. Safe to re-run.
alter table public.listings add column if not exists is_vacancy boolean not null default false;

-- Vacancies submitted through the public form are vacancies by definition.
update public.listings set is_vacancy = true where source = 'public-vacancy' and not is_vacancy;

create index if not exists listings_vacancy_idx on public.listings (is_vacancy) where published;
