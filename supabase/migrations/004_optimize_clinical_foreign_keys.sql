begin;
drop index if exists public.patients_doctor;
create index if not exists appointments_patient_doctor_idx on public.appointments(patient_id,doctor_id);
create index if not exists prescriptions_patient_doctor_idx on public.prescriptions(patient_id,doctor_id);
commit;
