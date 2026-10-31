import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { TipoMovimiento } from 'shared-types'
import { PrismaMovimientoRepository } from '../src/infrastructure/repositories/PrismaMovimientoRepository'
import { crearBaseTemporal, BaseTemporal } from './helpers/baseTemporal'

let base: BaseTemporal
let prisma: PrismaClient
let repo: PrismaMovimientoRepository

beforeEach(async () => {
  base = await crearBaseTemporal()
  prisma = base.prisma
  repo = new PrismaMovimientoRepository(prisma)
})

afterEach(async () => {
  await base.cerrar()
})

/** Crea un movimiento en el instante UTC indicado y devuelve su descripción. */
async function crearMovimiento(descripcion: string, fechaUtc: string) {
  await prisma.movimiento.create({
    data: { tipo: TipoMovimiento.INGRESO, descripcion, monto: 1000, fecha: new Date(fechaUtc) },
  })
  return descripcion
}

async function descripcionesDe(mes: string) {
  const movimientos = await repo.findByMes(mes)
  return movimientos.map(m => m.descripcion).sort()
}

describe('PrismaMovimientoRepository.findByMes', () => {
  it('noviembre termina el 30 de noviembre (hora de Bogotá), no el 2 de diciembre', async () => {
    const ultimo = await crearMovimiento('30 nov 11:59 pm', '2026-12-01T04:59:00.000Z')
    await crearMovimiento('1 dic 7:00 am', '2026-12-01T12:00:00.000Z')
    await crearMovimiento('2 dic 7:00 am', '2026-12-02T12:00:00.000Z')

    expect(await descripcionesDe('2026-11')).toEqual([ultimo])
  })

  it('febrero termina el 28 de febrero, no el 4 de marzo', async () => {
    const ultimo = await crearMovimiento('28 feb 11:59 pm', '2026-03-01T04:59:00.000Z')
    await crearMovimiento('1 mar 7:00 am', '2026-03-01T12:00:00.000Z')
    await crearMovimiento('3 mar 7:00 am', '2026-03-03T12:00:00.000Z')

    expect(await descripcionesDe('2026-02')).toEqual([ultimo])
  })

  it('febrero de un año bisiesto incluye el 29', async () => {
    const dia29 = await crearMovimiento('29 feb 8:00 pm', '2028-03-01T01:00:00.000Z')
    await crearMovimiento('1 mar 7:00 am', '2028-03-01T12:00:00.000Z')

    expect(await descripcionesDe('2028-02')).toEqual([dia29])
  })

  it('un movimiento después de las 7 p. m. en Bogotá cuenta en su mes, no en el siguiente', async () => {
    const octubre = await crearMovimiento('31 oct 11:30 pm', '2026-11-01T04:30:00.000Z')
    const noviembre = await crearMovimiento('1 nov 12:00 am', '2026-11-01T05:00:00.000Z')

    expect(await descripcionesDe('2026-10')).toContain(octubre)
    expect(await descripcionesDe('2026-10')).not.toContain(noviembre)
    expect(await descripcionesDe('2026-11')).toEqual([noviembre])
  })

  it('diciembre cruza correctamente a enero', async () => {
    const dic = await crearMovimiento('31 dic 11:59 pm', '2027-01-01T04:59:00.000Z')
    const ene = await crearMovimiento('1 ene 12:00 am', '2027-01-01T05:00:00.000Z')

    expect(await descripcionesDe('2026-12')).toEqual([dic])
    expect(await descripcionesDe('2027-01')).toEqual([ene])
  })

  it('un movimiento pertenece a un solo mes', async () => {
    await crearMovimiento('a', '2026-10-31T23:00:00.000Z')
    await crearMovimiento('b', '2026-11-15T15:00:00.000Z')
    await crearMovimiento('c', '2026-12-01T05:00:00.000Z')

    const porMes = [
      ...(await descripcionesDe('2026-10')),
      ...(await descripcionesDe('2026-11')),
      ...(await descripcionesDe('2026-12')),
    ].sort()
    expect(porMes).toEqual(['a', 'b', 'c'])
  })
})
