# Help Caracas — Registro de Ingresos Hospitalarios

Herramienta open source para centralizar el registro de personas hospitalizadas
tras el terremoto del 24 de junio de 2026 en Venezuela. Permite a voluntarios y
personal de salud registrar, buscar y actualizar el estado de pacientes para que
sus familias puedan localizarlos.

**Stack:** Next.js 16 · React 19 · Supabase (Postgres + RLS) · Zod · Tailwind 4

---

## Funcionalidades

- Registro de ingresos con detección automática de duplicados (ventana de 7 días)
- Búsqueda por nombre, cédula, procedencia, hospital y estado
- Edición de registros existentes desde el listado
- Importación masiva desde CSV (con normalizacion de datos OCR)
- Exportación del listado filtrado a CSV
- Detección de coincidencias similares al registrar (fuzzy matching por nombre)
- API pública de solo lectura (`/api/v1/personas`) para que otros sitios de
  búsqueda de personas consulten el registro — ver
  [documentación interactiva](/docs) y [openapi.yaml](public/openapi.yaml)

---

## Quickstart

### Requisitos

- Node.js 18+
- Una cuenta gratuita en [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone https://github.com/biglee-tech/help-caracas.git
cd help-caracas
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto nuevo en [app.supabase.com](https://app.supabase.com)
2. Ve a **SQL Editor** y ejecuta `supabase/schema.sql`
3. Copia las credenciales del proyecto (Settings → API)

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
```

### 4. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Estructura del proyecto

```
src/
  app/dashboard/       # Página principal + server actions
  components/          # Componentes React
  lib/                 # Utilidades: matching, validación, CSV, Supabase
supabase/
  schema.sql           # Esquema completo + RLS policies (ejecutar en proyecto nuevo)
  migrations/          # Migraciones incrementales
```

---

## Contribuir

¿Quieres ayudar? Lee [CONTRIBUTING.md](CONTRIBUTING.md) para el flujo de trabajo.

Issues marcados [`good first issue`](https://github.com/biglee-tech/help-caracas/labels/good%20first%20issue)
son un buen punto de entrada.

---

## Seguridad y privacidad

Esta app maneja datos personales de víctimas (nombre, cédula, edad, procedencia).
Lee [SECURITY.md](SECURITY.md) para reportar vulnerabilidades o solicitar la
eliminación de un dato personal. **No publiques PII en issues públicos.**

Notas de seguridad:
- El frontend solo usa la `anon key` de Supabase (nunca la `service_role`)
- Row Level Security está habilitado en todas las tablas
- Cualquier persona con la URL puede registrar y consultar ingresos; considera
  agregar rate limiting o Vercel Firewall antes de exponer públicamente

---

## Licencia

[MIT](LICENSE) © 2026 Biglee
