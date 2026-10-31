import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { asegurarEnv } from '../scripts/asegurar-env.mjs'

let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'finanzas-env-'))
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('asegurarEnv', () => {
  it('crea el .env copiando el .env.example cuando no existe', () => {
    const origen = path.join(dir, '.env.example')
    const destino = path.join(dir, '.env')
    fs.writeFileSync(origen, 'DATABASE_URL="file:../../data/finanzas.db"\n')

    expect(asegurarEnv(origen, destino)).toBe(true)

    expect(fs.readFileSync(destino, 'utf-8')).toBe('DATABASE_URL="file:../../data/finanzas.db"\n')
  })

  it('no pisa un .env que ya existe', () => {
    const origen = path.join(dir, '.env.example')
    const destino = path.join(dir, '.env')
    fs.writeFileSync(origen, 'DATABASE_URL="file:../../data/finanzas.db"\n')
    fs.writeFileSync(destino, 'DATABASE_URL="file:./otra.db"\n')

    expect(asegurarEnv(origen, destino)).toBe(false)

    expect(fs.readFileSync(destino, 'utf-8')).toBe('DATABASE_URL="file:./otra.db"\n')
  })
})

describe('configuración de la base de datos', () => {
  const raizApi = path.resolve(__dirname, '..')

  it('el esquema de Prisma lee la URL de la variable DATABASE_URL', () => {
    const esquema = fs.readFileSync(path.join(raizApi, 'prisma', 'schema.prisma'), 'utf-8')

    expect(esquema).toMatch(/url\s*=\s*env\("DATABASE_URL"\)/)
  })

  it('el .env.example define DATABASE_URL con la ruta por defecto de la base local', () => {
    const ejemplo = fs.readFileSync(path.join(raizApi, '.env.example'), 'utf-8')

    expect(ejemplo).toMatch(/^DATABASE_URL="file:\.\.\/\.\.\/data\/finanzas\.db"$/m)
  })
})
