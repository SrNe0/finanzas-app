# Finanzas Personales

[![CI](https://github.com/SrNe0/finanzas-app/actions/workflows/ci.yml/badge.svg)](https://github.com/SrNe0/finanzas-app/actions/workflows/ci.yml)

App web de finanzas personales para llevar las deudas, los gastos y el dinero disponible del mes. Los montos se manejan en pesos colombianos (COP, enteros sin decimales) y las fechas en zona horaria America/Bogota.

> **Uso local:** la app no tiene autenticación y guarda todo en una base SQLite en tu equipo. No la expongas a internet ni a una red que no sea de confianza.

## Requisitos

- Node.js 22+
- pnpm 11 (el repo declara la versión en `packageManager`; con Corepack basta `corepack enable`)

## Instalación

```bash
pnpm install
```

## Setup base de datos

```bash
pnpm db:migrate   # Crea la base de datos SQLite y ejecuta el seed
```

La base se crea en `apps/data/finanzas.db` y no se versiona.

## Desarrollo

```bash
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:5173

## Tests

```bash
pnpm --filter api test   # Vitest, contra una SQLite temporal
pnpm --filter web test   # Vitest + Testing Library (jsdom)
```

## Features

- **Resumen**: Métricas mensuales (ingresos, gastos, pagos, disponible), progreso de pago de deudas, 4 gráficas de donut (balance general, deudas por estado, gastos por categoría, disponible por fuente) y últimos movimientos
- **Deudas**: Gestión de deudas del mes con arrastre de meses anteriores, pago desde cualquier fuente, estados (Pendiente / En proceso / Pagado)
- **Gastos**: Registro con categorías, filtros por categoría y gráfico de distribución
- **Disponible**: Gestión de fuentes de dinero (cuenta, efectivo, bono, otro), nuevo ingreso, transferencias entre fuentes, historial de movimientos por fuente, agregar nuevas fuentes
- **Tema**: Modo oscuro y claro persistente

## Roadmap

El trabajo se organiza en fases. El detalle y el estado de cada tarea están en los [milestones](https://github.com/SrNe0/finanzas-app/milestones) y los [issues](https://github.com/SrNe0/finanzas-app/issues) del repositorio.

| Fase | Objetivo | Incluye |
|---|---|---|
| [1 — Arreglos](https://github.com/SrNe0/finanzas-app/milestone/1) | Corregir errores de datos y de seguridad | Rangos de fechas por mes, operaciones atómicas, reversa al eliminar gastos y deudas, validaciones, API solo en `127.0.0.1` |
| [2 — Tests](https://github.com/SrNe0/finanzas-app/milestone/2) | Cubrir la lógica con pruebas | Entidades, casos de uso e integración de rutas; Vitest en la web |
| [3 — Calidad y CI](https://github.com/SrNe0/finanzas-app/milestone/3) | Automatizar y ordenar el código | ESLint y Prettier, GitHub Actions, limpieza de dependencias, configuración por entorno |
| [4 — Features](https://github.com/SrNe0/finanzas-app/milestone/4) | Nuevas funcionalidades | Por definir |

## Arquitectura

### Monorepo (pnpm workspaces)

```
finanzas-app/
  apps/
    api/          Backend Fastify + TypeScript
    web/          Frontend React + Vite
    data/         Base de datos SQLite local (no versionada)
  packages/
    shared-types/ DTOs y enums compartidos
```

### Backend — Clean Architecture

```
src/
  domain/         Entidades, interfaces de repositorio
  application/    Use cases (uno por operación)
  infrastructure/ Implementaciones Prisma de repositorios
  interface/      Rutas Fastify, validación Zod
  shared/         Container de dependencias
```

### Frontend — Feature-based

```
src/
  features/
    resumen/      Dashboard con métricas y gráficas
    deudas/       Tabla de deudas, modal de pago
    gastos/       Tabla de gastos, filtros
    disponible/   Cards de fuentes, transferencias, historial
  shared/
    components/   shadcn/ui con sistema de temas CSS variables
    lib/          API client, utilidades de formato, config de gráficas
  store/          Zustand (mes activo, tema oscuro/claro)
  pages/          Rutas de React Router
```

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Fastify + TypeScript |
| ORM | Prisma + SQLite |
| Frontend | React 18 + Vite |
| Estilos | TailwindCSS v3 |
| Estado global | Zustand |
| Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Gráficas | Recharts |
| UI components | shadcn/ui |
| Tests | Vitest |

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Arranca API (3001) + Web (5173) en paralelo |
| `pnpm build` | Compila ambas apps |
| `pnpm --filter api test` | Ejecuta los tests de la API (Vitest) |
| `pnpm --filter web test` | Ejecuta los tests de la web (Vitest + Testing Library) |
| `pnpm lint` | Revisa el código con ESLint |
| `pnpm typecheck` | Revisa los tipos de la API (incluidos sus tests) y de la web |
| `pnpm format` / `pnpm format:check` | Formatea el código con Prettier / comprueba el formato |
| `pnpm db:migrate` | Migra la base de datos (incluye seed) |
| `pnpm db:seed` | Carga los datos de ejemplo |
| `pnpm db:studio` | Abre Prisma Studio |

## Licencia

[MIT](LICENSE)
