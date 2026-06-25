# Biglee Help Caracas

Aplicacion Next.js para registrar y consultar ingresos hospitalarios durante la
emergencia por terremoto en Venezuela.

## Requisitos

- Node.js compatible con Next.js.
- Proyecto Supabase activo.
- Usuarios creados en Supabase Auth para el personal autorizado.

## Configuracion

1. Copia `.env.example` a `.env.local`.
2. Completa las variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Ejecuta el SQL de `supabase/schema.sql` en el SQL Editor de Supabase.
4. Crea o invita usuarios autorizados en Supabase Auth.
5. Carga los hospitales iniciales en la tabla `hospitales`.

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Seguridad

- La app usa Supabase Auth para restringir acceso al dashboard.
- Row Level Security queda habilitado para `hospitales` e
  `ingresos_emergencia`.
- El frontend solo usa la anon key de Supabase. No agregues `service_role` al
  proyecto Next.js.
