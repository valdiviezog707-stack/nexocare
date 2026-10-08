-- Applied to the pre-existing empty NexoCare schema on 2026-10-08.
begin;
alter table public.doctor_profiles rename to profiles;
alter table public.profiles rename column full_name to "fullName";
alter table public.profiles rename column license_number to license;
alter table public.profiles rename column whatsapp_phone to phone;
alter table public.profiles rename column theme to palette;
update public.profiles set palette='nexocare' where palette='general';
alter table public.profiles alter column palette set default 'nexocare';
alter table public.profiles
  add column if not exists timezone text not null default 'America/Caracas',
  add column if not exists currency text not null default 'USD',
  add column if not exists "logoDataUrl" text not null default '';
alter table public.profiles
  add constraint profiles_name_check check(length(trim("fullName")) between 1 and 100),
  add constraint profiles_currency_check check(currency in ('USD','VES','EUR','COP','MXN')),
  add constraint profiles_palette_check check(palette in ('nexocare','clinical','sage','burgundy')),
  add constraint profiles_logo_size_check check(length("logoDataUrl") < 1500000);
alter table public.patients rename column full_name to name;
alter table public.patients rename column notes to reason;
alter table public.patients alter column reason set default '';
update public.patients set reason='' where reason is null;
alter table public.patients alter column reason set not null;
alter table public.patients
  add constraint patients_name_check check(length(trim(name)) between 1 and 150),
  add constraint patients_phone_check check(phone ~ '^[0-9]{8,15}$'),
  add constraint patients_id_doctor_unique unique(id,doctor_id);
alter table public.appointments drop constraint appointments_check;
alter table public.appointments drop constraint appointments_modality_check;
alter table public.appointments drop constraint appointments_status_check;
update public.appointments set modality=case modality when 'presencial' then 'Presencial' when 'virtual' then 'Videoconsulta' else modality end;
update public.appointments set status=case status when 'pending' then 'Pendiente' when 'confirmed' then 'Confirmada' when 'cancelled' then 'Cancelada' when 'completed' then 'Completada' else status end;
alter table public.appointments alter column modality set default 'Presencial';
alter table public.appointments alter column status set default 'Pendiente';
alter table public.appointments alter column ends_at drop not null;
alter table public.appointments add column if not exists fee numeric(12,2) not null default 0;
alter table public.appointments
  add constraint appointments_modality_check check(modality in ('Presencial','Videoconsulta')),
  add constraint appointments_status_check check(status in ('Pendiente','Confirmada','Completada','Cancelada')),
  add constraint appointments_fee_check check(fee>=0);
alter table public.appointments drop constraint appointments_patient_id_fkey;
alter table public.appointments add constraint appointments_patient_owner_fkey
  foreign key(patient_id,doctor_id) references public.patients(id,doctor_id) on delete restrict;
create unique index appointments_no_duplicate_slot on public.appointments(doctor_id,starts_at) where status <> 'Cancelada';
alter table public.prescriptions rename column directions to snapshot;
alter table public.prescriptions alter column snapshot type jsonb using jsonb_build_object('legacyDirections',snapshot);
alter table public.prescriptions rename column issued_at to created_at;
alter table public.prescriptions add constraint prescriptions_snapshot_object_check check(jsonb_typeof(snapshot)='object');
alter table public.prescriptions drop constraint prescriptions_patient_id_fkey;
alter table public.prescriptions add constraint prescriptions_patient_owner_fkey
  foreign key(patient_id,doctor_id) references public.patients(id,doctor_id) on delete restrict;
alter table public.transactions rename to movements;
alter table public.movements rename column occurred_on to date;
alter table public.movements add constraint movements_description_check check(length(trim(description)) between 1 and 200);
create index if not exists patients_doctor on public.patients(doctor_id);
create index if not exists movements_doctor_date on public.movements(doctor_id,date);
create index if not exists prescriptions_doctor_date on public.prescriptions(doctor_id,created_at);
revoke all on public.profiles,public.patients,public.appointments,public.movements,public.prescriptions from anon,authenticated;
grant select,update on public.profiles to authenticated;
grant select,insert,update on public.patients,public.appointments,public.movements to authenticated;
grant select,insert on public.prescriptions to authenticated;
create or replace function public.create_doctor_profile() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,"fullName",specialty,license,phone,timezone)
  values(new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'fullName'),''),'Profesional'),
    coalesce(new.raw_user_meta_data->>'specialty','Medicina general'),
    coalesce(new.raw_user_meta_data->>'license',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    case when exists(select 1 from pg_catalog.pg_timezone_names where name=new.raw_user_meta_data->>'timezone')
      then new.raw_user_meta_data->>'timezone' else 'America/Caracas' end);
  return new;
end;
$$;
revoke all on function public.create_doctor_profile() from public,anon,authenticated;
create trigger on_doctor_registered after insert on auth.users
for each row execute function public.create_doctor_profile();
commit;
