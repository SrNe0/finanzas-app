import { describe, expect, it } from 'vitest'
import { archivoBaseDemo, msHastaReinicio } from '../scripts/demo-run.mjs'

const HORA = 60 * 60 * 1000

describe('msHastaReinicio (04:00 de Bogotá = 09:00 UTC)', () => {
  it('antes de la hora, espera hasta el mismo día', () => {
    expect(msHastaReinicio(new Date('2026-11-04T05:00:00Z'))).toBe(4 * HORA)
  })

  it('después de la hora, espera hasta el día siguiente', () => {
    expect(msHastaReinicio(new Date('2026-11-04T10:00:00Z'))).toBe(23 * HORA)
  })

  it('justo a la hora (o a menos de un minuto) salta al día siguiente', () => {
    expect(msHastaReinicio(new Date('2026-11-04T09:00:00Z'))).toBe(24 * HORA)
    expect(msHastaReinicio(new Date('2026-11-04T08:59:30Z'))).toBe(24 * HORA + 30_000)
  })

  it('cruza correctamente el fin de mes', () => {
    expect(msHastaReinicio(new Date('2026-11-30T20:00:00Z'))).toBe(13 * HORA)
  })
})

describe('archivoBaseDemo (seguro contra bases reales)', () => {
  it('acepta solo bases dentro de /tmp', () => {
    expect(archivoBaseDemo('file:/tmp/demo.db')).toBe('/tmp/demo.db')
  })

  it('rechaza rutas fuera de /tmp, relativas o vacías', () => {
    expect(archivoBaseDemo('file:../../data/finanzas.db')).toBeNull()
    expect(archivoBaseDemo('file:/home/srne0/Projects/finanzas-app/apps/data/finanzas.db')).toBeNull()
    expect(archivoBaseDemo('')).toBeNull()
    expect(archivoBaseDemo(undefined)).toBeNull()
  })
})
