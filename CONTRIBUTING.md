# Guía para contribuir

Gracias por querer ayudar. Este proyecto existe para que las familias venezolanas
puedan encontrar a sus seres queridos hospitalizados tras el terremoto del 24 de
junio de 2026. La integridad de los datos de las víctimas es la prioridad por encima
de cualquier decisión técnica.

---

## Setup en 4 pasos

```bash
git clone https://github.com/biglee-tech/help-caracas.git
cd help-caracas
npm install
cp .env.example .env.local   # completar con tus credenciales de Supabase
npm run dev
```

Ver [README.md](README.md) para el setup completo de Supabase.

---

## Antes de abrir un PR

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
npm run build      # build completo (detecta errores de tipos y rutas)
```

Los tres deben pasar sin errores. El CI los corre automáticamente en cada PR.

---

## Flujo de trabajo

1. **Abre un issue primero** para discutir cambios no triviales (nuevas features,
   refactors grandes). Para bugs y `good first issue` puedes ir directo al PR.
2. **Crea una rama** desde `main`: `git checkout -b mi-cambio`
3. **Commits en Conventional Commits:**
   - `feat: descripción` — nueva funcionalidad
   - `fix: descripción` — corrección de bug
   - `chore: descripción` — tareas de mantenimiento, dependencias
   - `docs: descripción` — solo documentación
   - `refactor: descripción` — refactor sin cambio de comportamiento
   - `test: descripción` — tests
4. **Abre el PR** contra `main`. Usa la plantilla proporcionada.

---

## Estándares de código

- TypeScript estricto — sin `any` ni supresión de errores salvo casos justificados
- Componentes de servidor por defecto; `"use client"` solo cuando hay estado o
  eventos de navegador
- Server Actions para mutaciones — no endpoints REST propios
- Sin hardcodear valores de negocio — usar constantes o validación Zod
- Sin comentarios que expliquen *qué* hace el código; solo el *por qué* cuando no
  es obvio

---

## Tests

Usamos [Vitest](https://vitest.dev). La lógica pura (matching, normalización, CSV)
debe tener tests. UI y componentes: no son obligatorios aún, pero bienvenidos.

```bash
npm test
```

---

## Privacidad — regla más importante

- **Nunca incluyas datos reales de pacientes** en tests, seeds, fixtures o issues
- Si encuentras un bug relacionado con PII, repórtalo por email según [SECURITY.md](SECURITY.md)
- En los seeds y ejemplos, usa datos completamente ficticios

---

## ¿Dónde pedir ayuda?

Abre un issue con la etiqueta `question`. El equipo de Biglee revisa diariamente.

## Mantenedores

| Persona | Rol |
|---|---|
| Francisco Márquez | Lead developer, decisiones de arquitectura y DB |
| William Serrano | Product, coordinación |

Los PRs los revisa Francisco o William. Tiempo de respuesta habitual: 24-48h.
