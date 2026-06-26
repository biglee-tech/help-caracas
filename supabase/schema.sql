-- Biglee Help Caracas - Registro de ingresos de emergencia
-- Ejecutar en el SQL Editor de Supabase antes de usar la app con datos reales.

create table if not exists hospitales (
  id bigint generated always as identity primary key,
  nombre text unique not null,
  ciudad text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ingresos_emergencia (
  id bigint generated always as identity primary key,
  nombres text not null,
  apellidos text not null,
  cedula text,
  procedencia text,
  hospital_id bigint references hospitales(id) on delete restrict not null,
  fecha_ingreso timestamp with time zone default timezone('utc'::text, now()) not null,
  servicio_requerido text not null,
  estado text default 'Pendiente'::text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table hospitales enable row level security;
alter table ingresos_emergencia enable row level security;

drop policy if exists "Personal autenticado puede consultar hospitales" on hospitales;
drop policy if exists "Publico puede consultar hospitales" on hospitales;
create policy "Publico puede consultar hospitales"
on hospitales
for select
to anon
using (true);

drop policy if exists "Personal autenticado puede consultar ingresos" on ingresos_emergencia;
drop policy if exists "Publico puede consultar ingresos" on ingresos_emergencia;
create policy "Publico puede consultar ingresos"
on ingresos_emergencia
for select
to anon
using (true);

drop policy if exists "Personal autenticado puede registrar ingresos" on ingresos_emergencia;
drop policy if exists "Publico puede registrar ingresos" on ingresos_emergencia;
create policy "Publico puede registrar ingresos"
on ingresos_emergencia
for insert
to anon
with check (true);

drop policy if exists "Personal autenticado puede actualizar estado" on ingresos_emergencia;
drop policy if exists "Publico puede actualizar ingresos" on ingresos_emergencia;
create policy "Publico puede actualizar ingresos"
on ingresos_emergencia
for update
to anon
using (true)
with check (true);

-- Opcional: cargar hospitales iniciales desde el panel de Supabase o con inserts como:
-- insert into hospitales (nombre, ciudad) values ('Hospital Universitario de Caracas', 'Caracas');
