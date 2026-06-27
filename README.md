# Biglee Help Caracas

Aplicacion Next.js para registrar y consultar ingresos hospitalarios durante la
emergencia por terremoto en Venezuela.

## Requisitos

- Node.js compatible con Next.js.
- Proyecto Supabase activo.

## Configuracion

1. Copia `.env.example` a `.env.local`.
2. Completa las variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Ejecuta el SQL de `supabase/schema.sql` en el SQL Editor de Supabase (solo en
   instalaciones nuevas).
4. Carga hospitales iniciales en la tabla `hospitales` o deja que cualquier
   usuario los registre desde la opcion "Otro hospital" del formulario.

La policy de Supabase para completar vacios (`Publico puede actualizar ingresos
vacios`) la administra el equipo en produccion; no hace falta correr SQL extra
desde este repo.

## Registros similares y completar vacios

Al registrar un ingreso, la app busca personas parecidas en las ultimas 72 horas.
Si hay coincidencias, el operador puede:

- **Completar registro existente:** agrega datos al registro seleccionado cuando
  falte cedula, edad, procedencia, sexo u otros campos vacios (no crea duplicado).
  Requiere que el ingreso existente tenga al menos cedula, edad o procedencia
  vacios (segun la policy de Supabase en produccion).
- **Ya esta registrada:** cancela sin guardar nada nuevo.
- **Registrar de todos modos:** crea un ingreso nuevo si es otra persona.

No se modifican nombres, apellidos ni datos que ya estaban completos.

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Seguridad

- La app permite registrar y consultar ingresos sin login.
- Row Level Security queda habilitado para `hospitales` e
  `ingresos_emergencia`, con policies publicas de lectura e insercion para el
  rol `anon`, y actualizacion limitada a registros con campos incompletos.
- El frontend solo usa la anon key de Supabase. No agregues `service_role` al
  proyecto Next.js.
- Cualquier persona con la URL podra usar el sistema. Considera proteccion en
  Vercel, captcha o rate limiting si lo expones publicamente.
