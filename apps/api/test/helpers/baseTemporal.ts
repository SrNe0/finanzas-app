import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const MIGRACIONES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../prisma/migrations')

export interface BaseTemporal {
  prisma: PrismaClient
  cerrar: () => Promise<void>
}

/**
 * Crea una SQLite en una carpeta temporal con todas las migraciones aplicadas
 * y devuelve un cliente de Prisma apuntando a ella. No toca la base de la app.
 */
export async function crearBaseTemporal(): Promise<BaseTemporal> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'finanzas-test-'))
  const dbPath = path.join(dir, 'test.db')
  const prisma = new PrismaClient({ datasourceUrl: `file:${dbPath.replace(/\\/g, '/')}` })

  const carpetas = fs
    .readdirSync(MIGRACIONES, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

  for (const carpeta of carpetas) {
    const sql = fs.readFileSync(path.join(MIGRACIONES, carpeta, 'migration.sql'), 'utf-8')
    for (const sentencia of sql.split(';')) {
      const sinComentarios = sentencia
        .split('\n')
        .filter((linea) => !linea.trim().startsWith('--'))
        .join('\n')
        .trim()
      if (sinComentarios) await prisma.$executeRawUnsafe(sinComentarios)
    }
  }

  return {
    prisma,
    cerrar: async () => {
      await prisma.$disconnect()
      fs.rmSync(dir, { recursive: true, force: true })
    },
  }
}
