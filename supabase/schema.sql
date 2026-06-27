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
  edad integer,
  sexo text not null default 'No especificado'::text,
  procedencia text,
  hospital_id bigint references hospitales(id) on delete restrict not null,
  fecha_ingreso timestamp with time zone default now() not null,
  servicio_requerido text not null,
  estado text default 'Pendiente'::text,
  created_at timestamp with time zone default now() not null
);

alter table ingresos_emergencia
add column if not exists sexo text not null default 'No especificado'::text;

alter table ingresos_emergencia
add column if not exists edad integer;

alter table ingresos_emergencia
drop constraint if exists ingresos_emergencia_edad_check;

alter table ingresos_emergencia
add constraint ingresos_emergencia_edad_check
check (edad is null or (edad >= 0 and edad <= 130));

alter table hospitales enable row level security;
alter table ingresos_emergencia enable row level security;

drop policy if exists "Personal autenticado puede consultar hospitales" on hospitales;
drop policy if exists "Publico puede consultar hospitales" on hospitales;
create policy "Publico puede consultar hospitales"
on hospitales
for select
to anon
using (true);

drop policy if exists "Publico puede registrar hospitales" on hospitales;
create policy "Publico puede registrar hospitales"
on hospitales
for insert
to anon
with check (char_length(trim(nombre)) >= 3);

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
drop policy if exists "Publico puede actualizar ingresos vacios" on ingresos_emergencia;

-- Policy de UPDATE en produccion: la aplica el admin de Supabase
-- ("Publico puede actualizar ingresos vacios").

-- Opcional: cargar hospitales iniciales desde el panel de Supabase o con inserts como:
-- insert into hospitales (nombre, ciudad) values ('Hospital Universitario de Caracas', 'Caracas');

-- Asegurar que fecha_ingreso siempre coincida con created_at al insertar.
create or replace function ingresos_emergencia_sync_fecha_ingreso()
returns trigger as $$
begin
  new.fecha_ingreso := new.created_at;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ingresos_emergencia_sync_fecha on ingresos_emergencia;
create trigger trg_ingresos_emergencia_sync_fecha
before insert on ingresos_emergencia
for each row
execute function ingresos_emergencia_sync_fecha_ingreso();

-- Corregir fecha_ingreso desfasada (ejecutar una sola vez en el SQL Editor).
-- update ingresos_emergencia
-- set fecha_ingreso = created_at
-- where fecha_ingreso is distinct from created_at;
