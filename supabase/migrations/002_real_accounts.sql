-- NexoCare: independent project only. No demo records, no seed patients.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  "fullName" text not null check(length(trim("fullName")) between 1 and 100),
  specialty text not null,
  license text not null default '',
  phone text not null default '',
  timezone text not null default 'America/Caracas',
  currency text not null default 'USD' check(currency in ('USD','VES','EUR','COP','MXN')),
  palette text not null default 'nexocare' check(palette in ('nexocare','clinical','sage','burgundy')),
  "logoDataUrl" text not null default '' check(length("logoDataUrl") < 1500000),
  created_at timestamptz not null default now()
);
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 150),
  phone text not null check(phone ~ '^[0-9]{8,15}$'),
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique(id,doctor_id)
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  patient_id uuid not null,
  starts_at timestamptz not null,
  modality text not null check(modality in ('Presencial','Videoconsulta')),
  status text not null default 'Pendiente' check(status in ('Pendiente','Confirmada','Completada','Cancelada')),
  fee numeric(12,2) not null default 0 check(fee>=0),
  created_at timestamptz not null default now(),
  foreign key(patient_id,doctor_id) references public.patients(id,doctor_id),
  unique(id,doctor_id)
);
create unique index appointments_no_duplicate_slot on public.appointments(doctor_id,starts_at) where status <> 'Cancelada';
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check(kind in ('income','expense')),
  amount numeric(12,2) not null check(amount>0),
  description text not null check(length(trim(description)) between 1 and 200),
  date date not null,
  created_at timestamptz not null default now()
);
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  patient_id uuid not null,
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  created_at timestamptz not null default now(),
  foreign key(patient_id,doctor_id) references public.patients(id,doctor_id)
);
create index patients_doctor on public.patients(doctor_id);
create index movements_doctor_date on public.movements(doctor_id,date);
create index prescriptions_doctor_date on public.prescriptions(doctor_id,created_at);
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.movements enable row level security;
alter table public.prescriptions enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy patients_owner on public.patients for all to authenticated using(doctor_id=(select auth.uid())) with check(doctor_id=(select auth.uid()));
create policy appointments_owner on public.appointments for all to authenticated using(doctor_id=(select auth.uid())) with check(doctor_id=(select auth.uid()));
create policy movements_owner on public.movements for all to authenticated using(doctor_id=(select auth.uid())) with check(doctor_id=(select auth.uid()));
create policy prescriptions_read on public.prescriptions for select to authenticated using(doctor_id=(select auth.uid()));
create policy prescriptions_create on public.prescriptions for insert to authenticated with check(doctor_id=(select auth.uid()));
revoke all on public.profiles,public.patients,public.appointments,public.movements,public.prescriptions from anon;
grant select,update on public.profiles to authenticated;
grant select,insert,update on public.patients,public.appointments,public.movements to authenticated;
grant select,insert on public.prescriptions to authenticated;
-- A fresh account gets only its own professional profile. Clinical/financial tables stay empty.
create function public.create_doctor_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,"fullName",specialty,license,phone,timezone)
  values(
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'fullName'),''),'Profesional'),
    coalesce(new.raw_user_meta_data->>'specialty','Medicina general'),
    coalesce(new.raw_user_meta_data->>'license',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    case when exists(select 1 from pg_catalog.pg_timezone_names where name=new.raw_user_meta_data->>'timezone')
      then new.raw_user_meta_data->>'timezone' else 'America/Caracas' end
  );
  return new;
end;
$$;
revoke all on function public.create_doctor_profile() from public,anon,authenticated;
create trigger on_doctor_registered after insert on auth.users for each row execute function public.create_doctor_profile();
commit;
