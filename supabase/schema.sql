-- Biglee Help Caracas - Registro de ingresos de emergencia
-- Esquema e infraestructura sincronizados con producción

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
  cedula text unique, -- Mantengo el UNIQUE detectado en la sección anterior
  edad integer,
  sexo text not null default 'No especificado'::text,
  procedencia text,
  hospital_id bigint references hospitales(id) on delete restrict not null,
  fecha_ingreso timestamp with time zone default now() not null,
  servicio_requerido text not null,
  estado text default 'Pendiente'::text,
  created_at timestamp with time zone default now() not null
);

-- Constraints y validaciones de datos
alter table ingresos_emergencia drop constraint if exists ingresos_emergencia_edad_check;
alter table ingresos_emergencia add constraint ingresos_emergencia_edad_check
check (edad is null or (edad >= 0 and edad <= 130));

-- Habilitar Seguridad RLS
alter table hospitales enable row level security;
alter table ingresos_emergencia enable row level security;

---
--- POLÍTICAS PARA LA TABLA: hospitales
---

drop policy if exists "Publico puede consultar hospitales" on hospitales;
create policy "Publico puede consultar hospitales"
on hospitales for select to anon
using (true);

drop policy if exists "Publico puede registrar hospitales" on hospitales;
create policy "Publico puede registrar hospitales"
on hospitales for insert to anon
with check (char_length(trim(nombre)) >= 3);


---
--- POLÍTICAS PARA LA TABLA: ingresos_emergencia
---

drop policy if exists "Publico puede consultar ingresos" on ingresos_emergencia;
create policy "Publico puede consultar ingresos"
on ingresos_emergencia for select to anon
using (true);

drop policy if exists "Publico puede registrar ingresos" on ingresos_emergencia;
create policy "Publico puede registrar ingresos"
on ingresos_emergencia for insert to anon
with check (true);

-- Política de actualización rescatada de producción (image_cd62fb.png)
drop policy if exists "Publico puede actualizar ingresos" on ingresos_emergencia;
create policy "Publico puede actualizar ingresos"
on ingresos_emergencia for update to anon
using (true)
with check (
  nombres is not null and 
  apellidos is not null and 
  hospital_id is not null and 
  sexo is not null
);


---
--- AUTOMATIZACIONES (Triggers y Funciones)
---

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