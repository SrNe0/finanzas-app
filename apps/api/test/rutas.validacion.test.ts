import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma, PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { EstadoDeuda } from 'shared-types'
import { buildApp } from '../src/app'
import { buildContainer } from '../src/shared/container'
import { PrismaDeudaRepository } from '../src/infrastructure/repositories/PrismaDeudaRepository'
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
  vi.restoreAllMocks()
  await app.close()
  await base.cerrar()
})

describe('validación del mes en las rutas', () => {
  it.each(['2026-13', '2026-00', '2026-1', '26-10', 'octubre'])('rechaza el mes %s en las consultas', async mes => {
    for (const url of ['/api/resumen', '/api/deudas', '/api/gastos']) {
      const respuesta = await app.inject({ method: 'GET', url: `${url}?mes=${mes}` })

      expect(respuesta.statusCode, `${url}?mes=${mes}`).toBe(400)
      expect(respuesta.json().error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('rechaza un mes inválido al crear una deuda', async () => {
    const respuesta = await app.inject({
      method: 'POST',
      url: '/api/deudas',
      payload: { nombre: 'Tarjeta', valor: 1000, mes: '2026-13' },
    })

    expect(respuesta.statusCode).toBe(400)
    expect(await prisma.deuda.count()).toBe(0)
  })

  it('rechaza un mes inválido al registrar un gasto', async () => {
    const respuesta = await app.inject({
      method: 'POST',
      url: '/api/gastos',
      payload: { descripcion: 'Mercado', categoria: 'Alimentación', monto: 1000, mes: '2026-13' },
    })

    expect(respuesta.statusCode).toBe(400)
    expect(await prisma.gasto.count()).toBe(0)
  })

  it.each(['2026-01', '2026-10', '2026-12'])('acepta el mes válido %s', async mes => {
    const respuesta = await app.inject({ method: 'GET', url: `/api/gastos?mes=${mes}` })

    expect(respuesta.statusCode).toBe(200)
    expect(respuesta.json()).toEqual([])
  })
})

describe('registro inexistente de Prisma (P2025)', () => {
  it('responde 404 en vez de 500', async () => {
    const deuda = await prisma.deuda.create({
      data: { nombre: 'Tarjeta', valor: 1000, saldo: 1000, estado: EstadoDeuda.PENDIENTE, mes: '2026-10' },
    })
    vi.spyOn(PrismaDeudaRepository.prototype, 'delete').mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('No record was found', { code: 'P2025', clientVersion: '5.22.0' })
    )

    const respuesta = await app.inject({ method: 'DELETE', url: `/api/deudas/${deuda.id}` })

    expect(respuesta.statusCode).toBe(404)
    expect(respuesta.json().error.code).toBe('NOT_FOUND')
  })

  it('otros errores de Prisma siguen siendo 500', async () => {
    const deuda = await prisma.deuda.create({
      data: { nombre: 'Tarjeta', valor: 1000, saldo: 1000, estado: EstadoDeuda.PENDIENTE, mes: '2026-10' },
    })
    vi.spyOn(PrismaDeudaRepository.prototype, 'delete').mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.22.0' })
    )

    const respuesta = await app.inject({ method: 'DELETE', url: `/api/deudas/${deuda.id}` })

    expect(respuesta.statusCode).toBe(500)
  })
})
