# Biglee Help Caracas

Registro centralizado de ingresos hospitalarios para emergencias. Creado tras el
terremoto en Venezuela, junio 2026.

Una iniciativa de [biglee.io](https://biglee.io).

## Stack

- [Next.js](https://nextjs.org/) — framework web
- [Supabase](https://supabase.com/) — base de datos y autenticacion
- [Tailwind CSS](https://tailwindcss.com/) — estilos
- [Zod](https://zod.dev/) — validacion de datos
- [TypeScript](https://www.typescriptlang.org/) — tipado

## Requisitos

- Node.js 20+
- Proyecto Supabase activo

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

## Uso

### Registrar un ingreso

El formulario de registro permite ingresar datos del paciente y el servicio
requerido. Al guardar, la app busca personas parecidas en las ultimas 72 horas
para evitar duplicados.

### Importacion masiva via CSV

El formulario incluye un boton "Cargar CSV" que abre un modal para importar
multiples registros desde un archivo CSV con las columnas:

```
nombres, apellidos, edad, sexo, cedula, procedencia, servicio_requerido,
hospital_id, fecha_ingreso, estado
```

### Consultar ingresos

El panel de busqueda permite filtrar por nombre, cedula, procedencia, centro de
salud o estado. Los resultados se muestran paginados.

## Registros similares y completar vacios

Al registrar un ingreso, la app busca personas parecidas en las ultimas 72 horas.
Si hay coincidencias, el operador puede:

- **Completar registro existente:** agrega datos al registro seleccionado cuando
  falte cedula, edad, procedencia, sexo u otros campos vacios (no crea duplicado).
  Requiere que el ingreso existente tenga al menos cedula, edad o procedencia
  vacios (segun la policy de Supabase en produccion).
- **Editar registro:** permite modificar estado, servicio, cedula, edad,
  procedencia y sexo de un registro existente.
- **Ya esta registrada:** cancela sin guardar nada nuevo.
- **Registrar de todos modos:** crea un ingreso nuevo si es otra persona.

No se modifican nombres, apellidos ni datos que ya estaban completos.

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000`.

### Comandos

| Comando | Descripcion |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para produccion |
| `npm run start` | Inicia servidor de produccion |
| `npm run lint` | Ejecuta ESLint |


## Licencia

MIT
