import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { EstadoDeuda } from 'shared-types'
import { buildApp } from '../src/app'
import { buildContainer } from '../src/shared/container'
import { crearBaseTemporal, BaseTemporal } from './helpers/baseTemporal'

let base: BaseTemporal
let prisma: PrismaClient
let app: FastifyInstance

beforeEach(async () => {
  base = await crearBaseTemporal()
  prisma = base.prisma
  app = await buildApp(buildContainer(prisma), { logger: false })
  await app.ready()
})

afterEach(async () => {
  await app.close()
  await base.cerrar()
})

async function crearDeuda(mes: string, valor: number, saldo: number, estado: EstadoDeuda) {
  return prisma.deuda.create({ data: { nombre: `Deuda ${mes}`, valor, saldo, estado, mes } })
}

async function resumen(mes: string) {
  const respuesta = await app.inject({ method: 'GET', url: `/api/resumen?mes=${mes}` })
  expect(respuesta.statusCode).toBe(200)
  return respuesta.json()
}

describe('GET /api/resumen — totales de deudas', () => {
  it('totalDeudasPagadas suma lo abonado: deudas pagadas y abonos parciales', async () => {
    await crearDeuda('2026-10', 100_000, 0, EstadoDeuda.PAGADO)
    await crearDeuda('2026-10', 200_000, 50_000, EstadoDeuda.EN_PROCESO)
    await crearDeuda('2026-10', 300_000, 300_000, EstadoDeuda.PENDIENTE)

    const datos = await resumen('2026-10')

    expect(datos.totalDeudas).toBe(600_000)
    expect(datos.totalDeudasPagadas).toBe(250_000)
  })

  it('con solo abonos parciales ya no es 0', async () => {
    await crearDeuda('2026-10', 60_000, 40_000, EstadoDeuda.EN_PROCESO)

    const datos = await resumen('2026-10')

    expect(datos.totalDeudasPagadas).toBe(20_000)
  })

  it('sin deudas los totales son 0', async () => {
    const datos = await resumen('2026-10')

    expect(datos.totalDeudas).toBe(0)
    expect(datos.totalDeudasPagadas).toBe(0)
  })

  it('solo cuenta las deudas del mes consultado (las arrastradas no entran)', async () => {
    await crearDeuda('2026-09', 500_000, 100_000, EstadoDeuda.EN_PROCESO)
    await crearDeuda('2026-10', 100_000, 100_000, EstadoDeuda.PENDIENTE)

    const datos = await resumen('2026-10')

    expect(datos.totalDeudas).toBe(100_000)
    expect(datos.totalDeudasPagadas).toBe(0)
  })
})
