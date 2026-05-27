# Finanzas Personales

App web de finanzas personales de uso local. Sin autenticación, corre completamente en tu equipo.

## Requisitos

- Node.js 20+
- pnpm

## Instalación

```bash
pnpm install
```

## Setup base de datos

```bash
pnpm db:migrate   # Crea la base de datos SQLite y ejecuta el seed
```

## Desarrollo

```bash
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:5173

## Features

- **Resumen**: Métricas mensuales (ingresos, gastos, pagos, disponible), progreso de pago de deudas, 4 gráficas de donut (balance general, deudas por estado, gastos por categoría, disponible por fuente) y últimos movimientos
- **Deudas**: Gestión de deudas del mes con arrastre de meses anteriores, pago desde cualquier fuente, estados (Pendiente / En proceso / Pagado)
- **Gastos**: Registro con categorías, filtros por categoría y gráfico de distribución
- **Disponible**: Gestión de fuentes de dinero (cuenta, efectivo, bono, otro), nuevo ingreso, transferencias entre fuentes, historial de movimientos por fuente, agregar nuevas fuentes
- **Tema**: Modo oscuro y claro persistente

## Arquitectura

### Monorepo (pnpm workspaces)

```
finanzas-app/
  apps/
    api/          Backend Fastify + TypeScript
    web/          Frontend React + Vite
  packages/
    shared-types/ DTOs y enums compartidos
  data/
    finanzas.db   Base de datos SQLite
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

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Arranca API (3001) + Web (5173) en paralelo |
| `pnpm build` | Compila ambas apps |
| `pnpm db:migrate` | Migra la base de datos (incluye seed) |
| `pnpm db:seed` | Carga los datos de ejemplo |
| `pnpm db:studio` | Abre Prisma Studio |
