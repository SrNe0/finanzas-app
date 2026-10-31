import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app'
import { buildContainer } from '../src/shared/container'
import { crearBaseTemporal, BaseTemporal } from './helpers/baseTemporal'
import { mesDeBogota } from './helpers/memoria'

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

async function pedir(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) {
  const respuesta = await app.inject({ method, url, payload })
  const cuerpo = respuesta.body ? respuesta.json() : undefined
  return { status: respuesta.statusCode, cuerpo }
}

async function crearFuente(nombre = 'Cuenta', saldoInicial = 0) {
  const { cuerpo } = await pedir('POST', '/api/fuentes', { nombre, tipo: 'cuenta' })
  if (saldoInicial > 0) await pedir('POST', `/api/fuentes/${cuerpo.id}/ingresar`, { monto: saldoInicial })
  return cuerpo.id as string
}

async function crearDeuda(valor = 100_000, mes = '2026-10') {
  const { cuerpo } = await pedir('POST', '/api/deudas', { nombre: 'Tarjeta', valor, mes })
  return cuerpo.id as string
}

async function saldoDe(fuenteId: string) {
  return (await prisma.fuente.findUniqueOrThrow({ where: { id: fuenteId } })).saldo
}

describe('rutas de fuentes', () => {
  it('POST /api/fuentes crea la fuente con saldo 0 (201) y GET /api/fuentes la lista', async () => {
    const creada = await pedir('POST', '/api/fuentes', { nombre: 'Efectivo', tipo: 'efectivo' })

    expect(creada.status).toBe(201)
    expect(creada.cuerpo).toMatchObject({ nombre: 'Efectivo', tipo: 'efectivo', saldo: 0 })

    const lista = await pedir('GET', '/api/fuentes')
    expect(lista.status).toBe(200)
    expect(lista.cuerpo).toHaveLength(1)
  })

  it.each([
    ['sin nombre', { tipo: 'cuenta' }],
    ['con nombre vacío', { nombre: '', tipo: 'cuenta' }],
    ['con un tipo desconocido', { nombre: 'X', tipo: 'inventado' }],
  ])('POST /api/fuentes %s responde 400', async (_caso, payload) => {
    const { status, cuerpo } = await pedir('POST', '/api/fuentes', payload)

    expect(status).toBe(400)
    expect(cuerpo.error.code).toBe('VALIDATION_ERROR')
  })

  it('POST /api/fuentes/:id/ingresar suma el ingreso y lo deja en el historial', async () => {
    const id = await crearFuente()

    const ingreso = await pedir('POST', `/api/fuentes/${id}/ingresar`, { monto: 250_000, descripcion: 'Quincena' })
    const historial = await pedir('GET', `/api/fuentes/${id}/movimientos`)

    expect(ingreso.status).toBe(200)
    expect(ingreso.cuerpo.fuente.saldo).toBe(250_000)
    expect(historial.cuerpo).toHaveLength(1)
    expect(historial.cuerpo[0]).toMatchObject({ tipo: 'ingreso', monto: 250_000, descripcion: 'Quincena' })
  })

  it.each([0, -100, 1.5])('POST /api/fuentes/:id/ingresar con monto %s responde 400', async (monto) => {
    const id = await crearFuente()

    expect((await pedir('POST', `/api/fuentes/${id}/ingresar`, { monto })).status).toBe(400)
  })

  it('POST /api/fuentes/:id/ingresar en una fuente inexistente responde 404', async () => {
    const { status, cuerpo } = await pedir('POST', '/api/fuentes/no-existe/ingresar', { monto: 1000 })

    expect(status).toBe(404)
    expect(cuerpo.error.code).toBe('NOT_FOUND')
  })

  it('POST /api/fuentes/transferir mueve el dinero entre fuentes', async () => {
    const origen = await crearFuente('Cuenta', 100_000)
    const destino = await crearFuente('Efectivo', 0)

    const { status, cuerpo } = await pedir('POST', '/api/fuentes/transferir', { origenId: origen, destinoId: destino, monto: 40_000 })

    expect(status).toBe(200)
    expect(cuerpo.origen.saldo).toBe(60_000)
    expect(cuerpo.destino.saldo).toBe(40_000)
  })

  it('transferir a la misma fuente o sin saldo suficiente responde 422', async () => {
    const origen = await crearFuente('Cuenta', 1_000)
    const destino = await crearFuente('Efectivo', 0)

    const misma = await pedir('POST', '/api/fuentes/transferir', { origenId: origen, destinoId: origen, monto: 100 })
    const sinSaldo = await pedir('POST', '/api/fuentes/transferir', { origenId: origen, destinoId: destino, monto: 5_000 })

    expect(misma.status).toBe(422)
    expect(sinSaldo.status).toBe(422)
    expect(sinSaldo.cuerpo.error.code).toBe('DOMAIN_ERROR')
    expect(await saldoDe(origen)).toBe(1_000)
  })
})

describe('rutas de deudas', () => {
  it('POST /api/deudas crea la deuda (201) y GET /api/deudas?mes la devuelve', async () => {
    const creada = await pedir('POST', '/api/deudas', { nombre: 'Tarjeta', valor: 100_000, mes: '2026-10' })

    expect(creada.status).toBe(201)
    expect(creada.cuerpo).toMatchObject({ nombre: 'Tarjeta', valor: 100_000, saldo: 100_000, estado: 'Pendiente' })

    const lista = await pedir('GET', '/api/deudas?mes=2026-10')
    expect(lista.status).toBe(200)
    expect(lista.cuerpo.delMes).toHaveLength(1)
    expect(lista.cuerpo.arrastradas).toEqual([])
  })

  it('las deudas pendientes de meses anteriores aparecen como arrastradas', async () => {
    await crearDeuda(50_000, '2026-08')

    const { cuerpo } = await pedir('GET', '/api/deudas?mes=2026-10')

    expect(cuerpo.delMes).toEqual([])
    expect(cuerpo.arrastradas).toHaveLength(1)
  })

  it.each([
    ['sin nombre', { valor: 1000, mes: '2026-10' }],
    ['con valor negativo', { nombre: 'X', valor: -5, mes: '2026-10' }],
    ['con valor decimal', { nombre: 'X', valor: 10.5, mes: '2026-10' }],
    ['con valor cero', { nombre: 'X', valor: 0, mes: '2026-10' }],
  ])('POST /api/deudas %s responde 400', async (_caso, payload) => {
    expect((await pedir('POST', '/api/deudas', payload)).status).toBe(400)
  })

  it('POST /api/deudas/:id/pagar paga parte de la deuda con una fuente', async () => {
    const fuente = await crearFuente('Cuenta', 150_000)
    const deuda = await crearDeuda(100_000)

    const { status, cuerpo } = await pedir('POST', `/api/deudas/${deuda}/pagar`, { fuenteId: fuente, monto: 40_000 })

    expect(status).toBe(200)
    expect(cuerpo.deuda).toMatchObject({ saldo: 60_000, estado: 'En proceso' })
    expect(cuerpo.fuente.saldo).toBe(110_000)
  })

  it('pagar con una fuente sin saldo responde 422 y no cambia nada', async () => {
    const fuente = await crearFuente('Cuenta', 1_000)
    const deuda = await crearDeuda(100_000)

    const { status, cuerpo } = await pedir('POST', `/api/deudas/${deuda}/pagar`, { fuenteId: fuente })

    expect(status).toBe(422)
    expect(cuerpo.error.message).toContain('Cuenta')
    expect(await saldoDe(fuente)).toBe(1_000)
    expect(await prisma.deuda.findUniqueOrThrow({ where: { id: deuda } })).toMatchObject({ saldo: 100_000, estado: 'Pendiente' })
  })

  it('pagar una deuda o con una fuente inexistentes responde 404', async () => {
    const fuente = await crearFuente('Cuenta', 1_000)
    const deuda = await crearDeuda(100)

    expect((await pedir('POST', '/api/deudas/no-existe/pagar', { fuenteId: fuente })).status).toBe(404)
    expect((await pedir('POST', `/api/deudas/${deuda}/pagar`, { fuenteId: 'no-existe' })).status).toBe(404)
  })

  it('PATCH /api/deudas/:id actualiza el nombre y registra un pago parcial al bajar el saldo', async () => {
    const fuente = await crearFuente('Cuenta', 80_000)
    const deuda = await crearDeuda(100_000)

    const { status, cuerpo } = await pedir('PATCH', `/api/deudas/${deuda}`, { nombre: 'Visa', saldo: 70_000, fuenteId: fuente })

    expect(status).toBe(200)
    expect(cuerpo).toMatchObject({ nombre: 'Visa', saldo: 70_000, estado: 'En proceso' })
    expect(await saldoDe(fuente)).toBe(50_000)
  })

  it('PATCH con un estado incoherente o un saldo mayor al valor responde 422', async () => {
    const deuda = await crearDeuda(100_000)

    const estado = await pedir('PATCH', `/api/deudas/${deuda}`, { estado: 'En proceso' })
    const saldo = await pedir('PATCH', `/api/deudas/${deuda}`, { saldo: 200_000 })

    expect(estado.status).toBe(422)
    expect(saldo.status).toBe(422)
  })

  it('PATCH con un estado desconocido responde 400 y sobre una deuda inexistente 404', async () => {
    const deuda = await crearDeuda(100_000)

    expect((await pedir('PATCH', `/api/deudas/${deuda}`, { estado: 'Inventado' })).status).toBe(400)
    expect((await pedir('PATCH', '/api/deudas/no-existe', { nombre: 'x' })).status).toBe(404)
  })

  it('DELETE /api/deudas/:id responde 204 y devuelve los abonos a la fuente', async () => {
    const fuente = await crearFuente('Cuenta', 100_000)
    const deuda = await crearDeuda(100_000)
    await pedir('POST', `/api/deudas/${deuda}/pagar`, { fuenteId: fuente, monto: 30_000 })

    const { status } = await pedir('DELETE', `/api/deudas/${deuda}`)

    expect(status).toBe(204)
    expect(await saldoDe(fuente)).toBe(100_000)
    expect(await prisma.deuda.count()).toBe(0)
    expect(await prisma.movimiento.count()).toBe(1) // solo el ingreso inicial
  })

  it('DELETE de una deuda inexistente responde 404', async () => {
    expect((await pedir('DELETE', '/api/deudas/no-existe')).status).toBe(404)
  })
})

describe('rutas de gastos', () => {
  const gasto = { descripcion: 'Mercado', categoria: 'Alimentación', monto: 20_000, mes: '2026-10' }

  it('POST /api/gastos con fuente la debita (201) y GET /api/gastos lo lista', async () => {
    const fuente = await crearFuente('Cuenta', 50_000)

    const creado = await pedir('POST', '/api/gastos', { ...gasto, fuenteId: fuente })

    expect(creado.status).toBe(201)
    expect(creado.cuerpo).toMatchObject({ ...gasto, fuenteId: fuente })
    expect(await saldoDe(fuente)).toBe(30_000)
    const lista = await pedir('GET', '/api/gastos?mes=2026-10')
    expect(lista.cuerpo).toHaveLength(1)
  })

  it('POST /api/gastos sin fuente solo guarda el gasto', async () => {
    const creado = await pedir('POST', '/api/gastos', gasto)

    expect(creado.status).toBe(201)
    expect(creado.cuerpo.fuenteId).toBeNull()
  })

  it.each([
    ['sin descripción', { ...gasto, descripcion: '' }],
    ['sin categoría', { ...gasto, categoria: '' }],
    ['con monto negativo', { ...gasto, monto: -1 }],
    ['con monto decimal', { ...gasto, monto: 1.5 }],
  ])('POST /api/gastos %s responde 400', async (_caso, payload) => {
    expect((await pedir('POST', '/api/gastos', payload)).status).toBe(400)
  })

  it('un gasto con una fuente inexistente responde 404 y sin saldo suficiente 422', async () => {
    const fuente = await crearFuente('Cuenta', 1_000)

    expect((await pedir('POST', '/api/gastos', { ...gasto, fuenteId: 'no-existe' })).status).toBe(404)
    expect((await pedir('POST', '/api/gastos', { ...gasto, fuenteId: fuente })).status).toBe(422)
    expect(await prisma.gasto.count()).toBe(0)
    expect(await saldoDe(fuente)).toBe(1_000)
  })

  it('DELETE /api/gastos/:id responde 204 y devuelve el monto a la fuente', async () => {
    const fuente = await crearFuente('Cuenta', 50_000)
    const creado = await pedir('POST', '/api/gastos', { ...gasto, fuenteId: fuente })

    const { status } = await pedir('DELETE', `/api/gastos/${creado.cuerpo.id}`)

    expect(status).toBe(204)
    expect(await saldoDe(fuente)).toBe(50_000)
    expect(await prisma.gasto.count()).toBe(0)
  })

  it('DELETE de un gasto inexistente responde 404', async () => {
    expect((await pedir('DELETE', '/api/gastos/no-existe')).status).toBe(404)
  })
})

describe('flujo completo', () => {
  it('ingreso, deuda, pago parcial y resumen coinciden de punta a punta', async () => {
    const fuente = await crearFuente('Cuenta')
    await pedir('POST', `/api/fuentes/${fuente}/ingresar`, { monto: 500_000 })
    const deuda = await crearDeuda(200_000)
    await pedir('POST', `/api/deudas/${deuda}/pagar`, { fuenteId: fuente, monto: 80_000 })
    await pedir('POST', '/api/gastos', { descripcion: 'Mercado', categoria: 'Alimentación', monto: 20_000, mes: '2026-10', fuenteId: fuente })

    // Los movimientos se fechan "ahora": se consulta el mes en que ocurrieron (hora de Bogotá)
    const mesBogota = mesDeBogota(new Date())
    const resumen = (await pedir('GET', `/api/resumen?mes=${mesBogota}`)).cuerpo
    const deudas = (await pedir('GET', '/api/deudas?mes=2026-10')).cuerpo

    expect(deudas.delMes[0]).toMatchObject({ saldo: 120_000, estado: 'En proceso' })
    expect(resumen.totalIngresos).toBe(500_000)
    expect(resumen.totalPagosDeuda).toBe(80_000)
    expect(resumen.totalDisponible).toBe(400_000)
    expect(await saldoDe(fuente)).toBe(400_000)
  })
})
