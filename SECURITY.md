# Política de seguridad

Finanzas Personales es una app **de uso local**: no tiene autenticación, guarda los datos en una base SQLite en tu equipo y su API solo escucha en `127.0.0.1`. No está pensada para exponerse a internet.

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad, por favor **no lo publiques en un issue**. Usa el aviso privado de GitHub: en la pestaña [Security](https://github.com/SrNe0/finanzas-app/security) elige **Report a vulnerability**.

Intentaré responder en pocos días. Los problemas que no sean sensibles (errores, mejoras) van como [issues](https://github.com/SrNe0/finanzas-app/issues) normales.

## Qué no se guarda en el repositorio

- Las bases de datos (`apps/data/`) y los archivos `.env` están en `.gitignore`.
- Los datos de demostración (`pnpm db:seed:demo`) son ficticios.
