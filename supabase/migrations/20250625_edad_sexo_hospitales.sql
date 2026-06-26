-- Migracion para bases de datos ya creadas antes de edad, sexo y hospital "Otro".
-- Ejecutar en el SQL Editor de Supabase.

alter table ingresos_emergencia
add column if not exists sexo text not null default 'No especificado'::text;

alter table ingresos_emergencia
add column if not exists edad integer;

alter table ingresos_emergencia
drop constraint if exists ingresos_emergencia_edad_check;

alter table ingresos_emergencia
add constraint ingresos_emergencia_edad_check
check (edad is null or (edad >= 0 and edad <= 130));

alter table ingresos_emergencia
drop constraint if exists ingresos_emergencia_sexo_check;

alter table ingresos_emergencia
add constraint ingresos_emergencia_sexo_check
check (sexo in ('Masculino', 'Femenino', 'No especificado'));

drop policy if exists "Publico puede registrar hospitales" on hospitales;
create policy "Publico puede registrar hospitales"
on hospitales
for insert
to anon
with check (true);
