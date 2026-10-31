import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { EstadoDeuda, TipoMovimiento } from 'shared-types'
import { sembrarDemo } from '../prisma/seed-demo'
import { crearBaseTemporal, BaseTemporal } from './helpers/baseTemporal'
import { mesDeBogota } from './helpers/memoria'

const HOY = new Date('2026-10-20T15:00:00-05:00')

let base: BaseTemporal
let prisma: PrismaClient

beforeEach(async () => {
  base = await crearBaseTemporal()
  prisma = base.prisma
})

afterEach(async () => {
  await base.cerrar()
})

const ENTRADAS = [TipoMovimiento.INGRESO, TipoMovimiento.TRANSFERENCIA_ENTRADA]

describe('sembrarDemo', () => {
  it('carga fuentes, deudas, gastos y movimientos', async () => {
    const resumen = await sembrarDemo(prisma, HOY)

    expect(await prisma.fuente.count()).toBe(3)
    expect(await prisma.deuda.count()).toBeGreaterThanOrEqual(6)
    expect(await prisma.gasto.count()).toBeGreaterThanOrEqual(10)
    expect(await prisma.movimiento.count()).toBeGreaterThan(20)
    expect(resumen).toMatchObject({ fuentes: 3 })
  })

  it('los saldos de las fuentes coinciden con sus movimientos y ninguno es negativo', async () => {
    await sembrarDemo(prisma, HOY)

    for (const fuente of await prisma.fuente.findMany()) {
      const movimientos = await prisma.movimiento.findMany({ where: { fuenteId: fuente.id } })
      const esperado = movimientos.reduce(
        (saldo, m) => saldo + (ENTRADAS.includes(m.tipo as TipoMovimiento) ? m.monto : -m.monto),
        0
      )
      expect(fuente.saldo, fuente.nombre).toBe(esperado)
      expect(fuente.saldo, fuente.nombre).toBeGreaterThanOrEqual(0)
    }
  })

  it('los estados de las deudas son coherentes con su saldo', async () => {
    await sembrarDemo(prisma, HOY)

    for (const deuda of await prisma.deuda.findMany()) {
      if (deuda.estado === EstadoDeuda.PAGADO) expect(deuda.saldo, deuda.nombre).toBe(0)
      else if (deuda.estado === EstadoDeuda.PENDIENTE) expect(deuda.saldo, deuda.nombre).toBe(deuda.valor)
      else {
        expect(deuda.saldo, deuda.nombre).toBeGreaterThan(0)
        expect(deuda.saldo, deuda.nombre).toBeLessThan(deuda.valor)
      }
    }
  })

  it('hay deudas pagadas, con abonos, pendientes y una arrastrada del mes anterior', async () => {
    await sembrarDemo(prisma, HOY)

    const deudas = await prisma.deuda.findMany()
    const estados = new Set(deudas.map(d => d.estado))
    expect(estados).toEqual(new Set([EstadoDeuda.PAGADO, EstadoDeuda.EN_PROCESO, EstadoDeuda.PENDIENTE]))
    expect(deudas.some(d => d.mes === '2026-09' && d.estado !== EstadoDeuda.PAGADO)).toBe(true)
  })

  it('todo ocurre en el mes actual o en el anterior y nada queda en el futuro (hora de Bogotá)', async () => {
    await sembrarDemo(prisma, HOY)

    const permitidos = new Set(['2026-09', '2026-10'])
    for (const m of await prisma.movimiento.findMany()) {
      expect(permitidos.has(mesDeBogota(m.fecha))).toBe(true)
      expect(m.fecha.getTime()).toBeLessThanOrEqual(HOY.getTime())
    }
    for (const g of await prisma.gasto.findMany()) {
      expect(permitidos.has(g.mes)).toBe(true)
      expect(mesDeBogota(g.fecha)).toBe(g.mes)
    }
    expect(await prisma.deuda.count({ where: { mes: { notIn: [...permitidos] } } })).toBe(0)
  })

  it('reutiliza las fuentes vacías que crea el seed normal', async () => {
    await prisma.fuente.create({ data: { nombre: 'Efectivo', tipo: 'efectivo', saldo: 0 } })

    await sembrarDemo(prisma, HOY)

    expect(await prisma.fuente.count({ where: { nombre: 'Efectivo' } })).toBe(1)
    expect(await prisma.fuente.count()).toBe(3)
  })

  it('se niega a cargar datos de demostración si la base ya tiene datos', async () => {
    await prisma.deuda.create({
      data: { nombre: 'Mía', valor: 1000, saldo: 1000, estado: EstadoDeuda.PENDIENTE, mes: '2026-10' },
    })

    await expect(sembrarDemo(prisma, HOY)).rejects.toThrow('base ya tiene datos')

    expect(await prisma.deuda.count()).toBe(1)
    expect(await prisma.fuente.count()).toBe(0)
  })

  it('no se puede ejecutar dos veces seguidas', async () => {
    await sembrarDemo(prisma, HOY)

    await expect(sembrarDemo(prisma, HOY)).rejects.toThrow('base ya tiene datos')
  })
})
