import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const MIGRACIONES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../prisma/migrations')

// SQLite integrado en Node (sin dependencias). Se carga con require porque @types/node 20 no trae sus tipos.
interface BaseSqlite {
  exec(sql: string): void
  close(): void
}
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as {
  DatabaseSync: new (ruta: string) => BaseSqlite
}

export interface BaseTemporal {
  prisma: PrismaClient
  cerrar: () => Promise<void>
}

/** Aplica todas las migraciones, en orden, en una sola conexión (como hace `prisma migrate`). */
function aplicarMigraciones(rutaBase: string) {
  const carpetas = fs
    .readdirSync(MIGRACIONES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort()

  const db = new DatabaseSync(rutaBase)
  try {
    for (const carpeta of carpetas) {
      db.exec(fs.readFileSync(path.join(MIGRACIONES, carpeta, 'migration.sql'), 'utf-8'))
    }
  } finally {
    db.close()
  }
}

/**
 * Crea una SQLite en una carpeta temporal con todas las migraciones aplicadas
 * y devuelve un cliente de Prisma apuntando a ella. No toca la base de la app.
 *
 * Las migraciones no se ejecutan a través de Prisma: su pool reparte las sentencias entre conexiones, y los
 * PRAGMA y las tablas redefinidas de las migraciones de SQLite necesitan una única conexión.
 */
export async function crearBaseTemporal(): Promise<BaseTemporal> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'finanzas-test-'))
  const dbPath = path.join(dir, 'test.db')
  aplicarMigraciones(dbPath)

  const prisma = new PrismaClient({ datasourceUrl: `file:${dbPath.replace(/\\/g, '/')}` })

  return {
    prisma,
    cerrar: async () => {
      await prisma.$disconnect()
      fs.rmSync(dir, { recursive: true, force: true })
    },
  }
}
