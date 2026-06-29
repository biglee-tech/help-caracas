# Política de Seguridad

## Reportar una vulnerabilidad

Si encuentras una vulnerabilidad de seguridad o un problema de privacidad en
este proyecto, **no lo publiques como issue público**. Escríbenos directamente:

**Email:** bigleetechnology@gmail.com

Incluye en tu reporte:
- Descripción del problema
- Pasos para reproducirlo
- Impacto potencial estimado
- Si tienes una propuesta de solución, bienvenida

Respondemos en un máximo de 72 horas. Una vez confirmada y corregida la
vulnerabilidad, te acreditamos en el changelog si así lo deseas.

## Datos personales (PII)

Esta aplicación almacena datos de personas hospitalizadas tras el terremoto del
24 de junio de 2026 en Venezuela: nombres, apellidos, cédula, edad y
procedencia. Son datos sensibles de personas en situación vulnerable.

Compromisos del equipo:
- Acceso de escritura limitado por Row Level Security en Supabase
- La clave `anon` que usa el frontend es de solo lectura para operaciones de
  búsqueda; las escrituras van validadas por políticas en la base de datos
- No compartimos ni vendemos los datos con terceros
- Los datos se usan exclusivamente para ayudar a familias a localizar a sus
  seres queridos

Si encuentras un registro con datos incorrectos o quieres solicitar la
eliminación de un dato personal, escríbenos al mismo email.

## Scope

| Área | En scope |
|---|---|
| Inyección SQL / XSS | ✅ |
| Bypass de Row Level Security | ✅ |
| Exposición masiva de PII | ✅ |
| Abuso de escritura (spam, defacement) | ✅ |
| Fugas de credenciales en el repo | ✅ |
| Bugs de UI sin impacto en datos | ❌ (usa issues normales) |

## Versiones con soporte

Solo la versión en `main` recibe parches de seguridad.
