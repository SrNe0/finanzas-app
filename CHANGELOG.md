# Changelog

Todos los cambios relevantes del proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-10-31

Primera versión publicada. La app es de **uso local**: no tiene autenticación y la API solo escucha en `127.0.0.1`.

### Agregado

- Resumen mensual con métricas, progreso de pago de deudas, cuatro gráficas y los últimos movimientos.
- Deudas con abonos parciales, arrastre de las pendientes de meses anteriores y estados siempre coherentes con el saldo.
- Gastos por categoría, con o sin fuente de dinero.
- Fuentes de dinero (cuenta, efectivo, bono, otro), ingresos, transferencias e historial por fuente.
- Tema oscuro y claro, avisos con opción de reintentar cuando algo falla y un `ErrorBoundary` que evita la pantalla en blanco ([#61](https://github.com/SrNe0/finanzas-app/pull/61)).
- Datos de demostración ficticios con `pnpm db:seed:demo` ([#67](https://github.com/SrNe0/finanzas-app/pull/67)) y puertos configurables con `PORT`, `WEB_PORT` y `API_URL`.
- Configuración de la base por `DATABASE_URL` con `apps/api/.env.example` ([#62](https://github.com/SrNe0/finanzas-app/pull/62)).
- Licencia MIT ([#2](https://github.com/SrNe0/finanzas-app/pull/2)), `SECURITY.md`, plantilla de pull request y README con capturas, arquitectura y decisiones técnicas ([#68](https://github.com/SrNe0/finanzas-app/pull/68), [#69](https://github.com/SrNe0/finanzas-app/pull/69)).

### Cambiado

- Las operaciones que tocan varias tablas (pagos, gastos, ingresos, transferencias, eliminaciones) se ejecutan en una sola transacción mediante `IUnitOfWork` ([#35](https://github.com/SrNe0/finanzas-app/pull/35)).
- Los mappers a DTO pasan a la capa `application` y desaparecen los `as any`; ESLint impide que `domain` y `application` dependan de `infrastructure` o de Prisma ([#60](https://github.com/SrNe0/finanzas-app/pull/60)).
- Las páginas se cargan de forma diferida: el paquete inicial baja de 886 kB a 269 kB ([#75](https://github.com/SrNe0/finanzas-app/pull/75)).
- La API usa `127.0.0.1` y CORS solo admite el origen de Vite ([#42](https://github.com/SrNe0/finanzas-app/pull/42)).
- Migración a pnpm 11 y Node 22 ([#32](https://github.com/SrNe0/finanzas-app/pull/32)); se quitan dependencias no usadas ([#59](https://github.com/SrNe0/finanzas-app/pull/59)).

### Corregido

- Eliminar (`DELETE`) fallaba siempre por enviar `Content-Type` sin cuerpo ([#33](https://github.com/SrNe0/finanzas-app/pull/33)).
- El rango del mes terminaba en el mes siguiente y los movimientos nocturnos caían en el mes equivocado; ahora usa el desfase fijo de Bogotá ([#38](https://github.com/SrNe0/finanzas-app/pull/38)).
- Eliminar un gasto o una deuda con abonos ahora devuelve el dinero a las fuentes ([#39](https://github.com/SrNe0/finanzas-app/pull/39), [#40](https://github.com/SrNe0/finanzas-app/pull/40)).
- Marcar una deuda como pagada debitaba $0 y permitía estados incoherentes ([#41](https://github.com/SrNe0/finanzas-app/pull/41)); los montos inválidos se rechazan en el dominio ([#44](https://github.com/SrNe0/finanzas-app/pull/44)).
- Un mes como `2026-13` y los errores `P2025` de Prisma devolvían 500 ([#43](https://github.com/SrNe0/finanzas-app/pull/43)).
- Resumen: los abonos parciales ya cuentan en el total pagado y en la gráfica de deudas ([#49](https://github.com/SrNe0/finanzas-app/pull/49), [#47](https://github.com/SrNe0/finanzas-app/pull/47)).
- Interfaz: el historial de la fuente se refresca tras mover dinero ([#45](https://github.com/SrNe0/finanzas-app/pull/45)); el modal de pago no deja confirmar sin saldo ([#46](https://github.com/SrNe0/finanzas-app/pull/46)); el saldo de una deuda se registra con Enter ([#48](https://github.com/SrNe0/finanzas-app/pull/48)); el mes activo arranca en el mes actual ([#50](https://github.com/SrNe0/finanzas-app/pull/50)); el `Toaster` sigue el tema ([#66](https://github.com/SrNe0/finanzas-app/pull/66)); las tablas se desplazan en pantallas pequeñas ([#74](https://github.com/SrNe0/finanzas-app/pull/74)).

### Seguridad

- La API dejó de escuchar en todas las interfaces con CORS abierto ([#42](https://github.com/SrNe0/finanzas-app/pull/42)).
- Reporte privado de vulnerabilidades activado y política en `SECURITY.md` ([#69](https://github.com/SrNe0/finanzas-app/pull/69)).

### Calidad

- Más de 230 pruebas: unitarias de dominio, casos de uso con repositorios en memoria, integración de rutas contra una SQLite temporal y pruebas de la web ([#34](https://github.com/SrNe0/finanzas-app/pull/34), [#51](https://github.com/SrNe0/finanzas-app/pull/51), [#52](https://github.com/SrNe0/finanzas-app/pull/52), [#55](https://github.com/SrNe0/finanzas-app/pull/55), [#56](https://github.com/SrNe0/finanzas-app/pull/56)).
- ESLint y Prettier ([#57](https://github.com/SrNe0/finanzas-app/pull/57)) y GitHub Actions con lint, formato, tipos, pruebas y build en cada pull request ([#58](https://github.com/SrNe0/finanzas-app/pull/58)); la rama `main` está protegida y exige que el CI pase.

[1.0.0]: https://github.com/SrNe0/finanzas-app/releases/tag/v1.0.0
