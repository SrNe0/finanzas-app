import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { EstadoDeuda, TipoFuente, TipoMovimiento } from 'shared-types'
import { NotFoundError } from '../src/domain/errors/DomainError'
import { PrismaUnitOfWork } from '../src/infrastructure/PrismaUnitOfWork'
import { PrismaDeudaRepository } from '../src/infrastructure/repositories/PrismaDeudaRepository'
import { PagarDeudaUseCase } from '../src/application/usecases/deudas/PagarDeudaUseCase'
import { EliminarDeudaUseCase } from '../src/application/usecases/deudas/EliminarDeudaUseCase'
import { crearBaseTemporal, BaseTemporal } from './helpers/baseTemporal'

let base: BaseTemporal
let prisma: PrismaClient
let pagar: PagarDeudaUseCase
let eliminar: EliminarDeudaUseCase

beforeEach(async () => {
  base = await crearBaseTemporal()
  prisma = base.prisma
  const uow = new PrismaUnitOfWork(prisma)
  pagar = new PagarDeudaUseCase(uow)
  eliminar = new EliminarDeudaUseCase(uow)
})

afterEach(async () => {
  vi.restoreAllMocks()
  await base.cerrar()
})

async function crearFuente(nombre: string, saldo: number) {
  return prisma.fuente.create({ data: { nombre, tipo: TipoFuente.CUENTA, saldo } })
}

async function crearDeuda(valor: number, nombre = 'Tarjeta') {
  return prisma.deuda.create({
    data: { nombre, valor, saldo: valor, estado: EstadoDeuda.PENDIENTE, mes: '2026-10' },
  })
}

async function saldoDe(fuenteId: string) {
  return (await prisma.fuente.findUniqueOrThrow({ where: { id: fuenteId } })).saldo
}

describe('EliminarDeuda', () => {
  it('elimina una deuda sin abonos sin tocar las fuentes', async () => {
    const fuente = await crearFuente('Cuenta', 50_000)
    const deuda = await crearDeuda(100_000)

    await eliminar.execute(deuda.id)

    expect(await prisma.deuda.count()).toBe(0)
    expect(await saldoDe(fuente.id)).toBe(50_000)
  })

  it('devuelve a la fuente lo abonado y elimina los movimientos de pago', async () => {
    const fuente = await crearFuente('Cuenta', 150_000)
    const deuda = await crearDeuda(100_000)
    await pagar.execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 40_000 })
    expect(await saldoDe(fuente.id)).toBe(110_000)

    await eliminar.execute(deuda.id)

    expect(await saldoDe(fuente.id)).toBe(150_000)
    expect(await prisma.deuda.count()).toBe(0)
    expect(await prisma.movimiento.count()).toBe(0)
  })

  it('suma varios abonos de la misma fuente', async () => {
    const fuente = await crearFuente('Cuenta', 100_000)
    const deuda = await crearDeuda(100_000)
    await pagar.execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 10_000 })
    await pagar.execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 25_000 })
    expect(await saldoDe(fuente.id)).toBe(65_000)

    await eliminar.execute(deuda.id)

    expect(await saldoDe(fuente.id)).toBe(100_000)
    expect(await prisma.movimiento.count()).toBe(0)
  })

  it('devuelve cada abono a la fuente de la que salió', async () => {
    const cuenta = await crearFuente('Cuenta', 100_000)
    const efectivo = await crearFuente('Efectivo', 30_000)
    const deuda = await crearDeuda(100_000)
    await pagar.execute({ deudaId: deuda.id, fuenteId: cuenta.id, monto: 40_000 })
    await pagar.execute({ deudaId: deuda.id, fuenteId: efectivo.id, monto: 20_000 })

    await eliminar.execute(deuda.id)

    expect(await saldoDe(cuenta.id)).toBe(100_000)
    expect(await saldoDe(efectivo.id)).toBe(30_000)
    expect(await prisma.movimiento.count()).toBe(0)
  })

  it('conserva los movimientos de otras deudas y los que no son pagos de deuda', async () => {
    const fuente = await crearFuente('Cuenta', 200_000)
    const eliminada = await crearDeuda(100_000, 'Eliminada')
    const otra = await crearDeuda(100_000, 'Otra')
    await prisma.movimiento.create({
      data: { tipo: TipoMovimiento.INGRESO, fuenteId: fuente.id, monto: 5_000 },
    })
    await pagar.execute({ deudaId: eliminada.id, fuenteId: fuente.id, monto: 30_000 })
    await pagar.execute({ deudaId: otra.id, fuenteId: fuente.id, monto: 20_000 })

    await eliminar.execute(eliminada.id)

    expect(await saldoDe(fuente.id)).toBe(180_000)
    const restantes = await prisma.movimiento.findMany({ orderBy: { monto: 'asc' } })
    expect(restantes.map(m => [m.tipo, m.monto])).toEqual([
      [TipoMovimiento.INGRESO, 5_000],
      [TipoMovimiento.PAGO_DEUDA, 20_000],
    ])
    expect(restantes[1].deudaId).toBe(otra.id)
  })

  it('lanza NotFoundError si la deuda no existe', async () => {
    await expect(eliminar.execute('no-existe')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('es atómico: si falla al borrar la deuda, las fuentes y los movimientos quedan como estaban', async () => {
    const fuente = await crearFuente('Cuenta', 150_000)
    const deuda = await crearDeuda(100_000)
    await pagar.execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 40_000 })
    vi.spyOn(PrismaDeudaRepository.prototype, 'delete').mockRejectedValueOnce(new Error('falla'))

    await expect(eliminar.execute(deuda.id)).rejects.toThrow('falla')

    expect(await saldoDe(fuente.id)).toBe(110_000)
    expect(await prisma.deuda.count()).toBe(1)
    expect(await prisma.movimiento.count()).toBe(1)
  })
})
