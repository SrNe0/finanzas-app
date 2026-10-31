import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { EstadoDeuda, TipoFuente, TipoMovimiento } from 'shared-types'
import { DomainError } from '../src/domain/errors/DomainError'
import { PrismaUnitOfWork } from '../src/infrastructure/PrismaUnitOfWork'
import { ActualizarSaldoDeudaUseCase } from '../src/application/usecases/deudas/ActualizarSaldoDeudaUseCase'
import { PagarDeudaUseCase } from '../src/application/usecases/deudas/PagarDeudaUseCase'
import { crearBaseTemporal, BaseTemporal } from './helpers/baseTemporal'

let base: BaseTemporal
let prisma: PrismaClient
let actualizar: ActualizarSaldoDeudaUseCase
let pagar: PagarDeudaUseCase

beforeEach(async () => {
  base = await crearBaseTemporal()
  prisma = base.prisma
  const uow = new PrismaUnitOfWork(prisma)
  actualizar = new ActualizarSaldoDeudaUseCase(uow)
  pagar = new PagarDeudaUseCase(uow)
})

afterEach(async () => {
  await base.cerrar()
})

async function crearFuente(saldo: number) {
  return prisma.fuente.create({ data: { nombre: 'Cuenta', tipo: TipoFuente.CUENTA, saldo } })
}

async function crearDeuda(valor: number, saldo = valor, estado: EstadoDeuda = EstadoDeuda.PENDIENTE) {
  return prisma.deuda.create({ data: { nombre: 'Tarjeta', valor, saldo, estado, mes: '2026-10' } })
}

async function saldoDe(fuenteId: string) {
  return (await prisma.fuente.findUniqueOrThrow({ where: { id: fuenteId } })).saldo
}

async function deudaDe(id: string) {
  return prisma.deuda.findUniqueOrThrow({ where: { id } })
}

describe('ActualizarSaldoDeuda — marcar como Pagado', () => {
  it('debita de la fuente el saldo pendiente y registra el pago', async () => {
    const fuente = await crearFuente(150_000)
    const deuda = await crearDeuda(100_000)

    await actualizar.execute({ deudaId: deuda.id, nuevoEstado: EstadoDeuda.PAGADO, fuenteId: fuente.id })

    expect(await saldoDe(fuente.id)).toBe(50_000)
    const deudaDb = await deudaDe(deuda.id)
    expect(deudaDb.saldo).toBe(0)
    expect(deudaDb.estado).toBe(EstadoDeuda.PAGADO)
    const movimientos = await prisma.movimiento.findMany()
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0]).toMatchObject({
      tipo: TipoMovimiento.PAGO_DEUDA,
      monto: 100_000,
      fuenteId: fuente.id,
      deudaId: deuda.id,
    })
  })

  it('después de un abono parcial debita solo lo que faltaba', async () => {
    const fuente = await crearFuente(150_000)
    const deuda = await crearDeuda(100_000)
    await pagar.execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 40_000 })

    await actualizar.execute({ deudaId: deuda.id, nuevoEstado: EstadoDeuda.PAGADO, fuenteId: fuente.id })

    expect(await saldoDe(fuente.id)).toBe(50_000)
    expect((await deudaDe(deuda.id)).estado).toBe(EstadoDeuda.PAGADO)
    expect(await prisma.movimiento.count()).toBe(2)
  })

  it('no debita dos veces si además se envía saldo 0', async () => {
    const fuente = await crearFuente(150_000)
    const deuda = await crearDeuda(100_000)

    await actualizar.execute({ deudaId: deuda.id, nuevoSaldo: 0, nuevoEstado: EstadoDeuda.PAGADO, fuenteId: fuente.id })

    expect(await saldoDe(fuente.id)).toBe(50_000)
    expect(await prisma.movimiento.count()).toBe(1)
  })

  it('sin fuente deja la deuda pagada sin mover dinero', async () => {
    const fuente = await crearFuente(150_000)
    const deuda = await crearDeuda(100_000)

    await actualizar.execute({ deudaId: deuda.id, nuevoEstado: EstadoDeuda.PAGADO })

    const deudaDb = await deudaDe(deuda.id)
    expect(deudaDb.saldo).toBe(0)
    expect(deudaDb.estado).toBe(EstadoDeuda.PAGADO)
    expect(await saldoDe(fuente.id)).toBe(150_000)
    expect(await prisma.movimiento.count()).toBe(0)
  })

  it('rechaza Pagado con un saldo distinto de 0', async () => {
    const deuda = await crearDeuda(100_000)

    await expect(
      actualizar.execute({ deudaId: deuda.id, nuevoSaldo: 30_000, nuevoEstado: EstadoDeuda.PAGADO })
    ).rejects.toBeInstanceOf(DomainError)
    expect((await deudaDe(deuda.id)).saldo).toBe(100_000)
  })
})

describe('ActualizarSaldoDeuda — saldo', () => {
  it('un pago parcial debita la diferencia y deja la deuda En proceso', async () => {
    const fuente = await crearFuente(80_000)
    const deuda = await crearDeuda(100_000)

    await actualizar.execute({ deudaId: deuda.id, nuevoSaldo: 70_000, fuenteId: fuente.id })

    expect(await saldoDe(fuente.id)).toBe(50_000)
    const deudaDb = await deudaDe(deuda.id)
    expect(deudaDb.saldo).toBe(70_000)
    expect(deudaDb.estado).toBe(EstadoDeuda.EN_PROCESO)
    expect(await prisma.movimiento.count()).toBe(1)
  })

  it('rechaza un saldo mayor que el valor de la deuda', async () => {
    const deuda = await crearDeuda(100_000)

    await expect(actualizar.execute({ deudaId: deuda.id, nuevoSaldo: 150_000 })).rejects.toBeInstanceOf(DomainError)
    expect((await deudaDe(deuda.id)).saldo).toBe(100_000)
  })

  it('permite corregir el saldo hacia arriba sin superar el valor', async () => {
    const deuda = await crearDeuda(100_000, 60_000, EstadoDeuda.EN_PROCESO)

    await actualizar.execute({ deudaId: deuda.id, nuevoSaldo: 80_000 })

    const deudaDb = await deudaDe(deuda.id)
    expect(deudaDb.saldo).toBe(80_000)
    expect(deudaDb.estado).toBe(EstadoDeuda.EN_PROCESO)
  })
})

describe('ActualizarSaldoDeuda — estados coherentes', () => {
  it('rechaza Pendiente en una deuda con abonos', async () => {
    const deuda = await crearDeuda(100_000, 60_000, EstadoDeuda.EN_PROCESO)

    await expect(actualizar.execute({ deudaId: deuda.id, nuevoEstado: EstadoDeuda.PENDIENTE })).rejects.toBeInstanceOf(
      DomainError
    )
    expect((await deudaDe(deuda.id)).estado).toBe(EstadoDeuda.EN_PROCESO)
  })

  it('rechaza Pendiente en una deuda pagada (saldo 0)', async () => {
    const deuda = await crearDeuda(100_000, 0, EstadoDeuda.PAGADO)

    await expect(actualizar.execute({ deudaId: deuda.id, nuevoEstado: EstadoDeuda.PENDIENTE })).rejects.toBeInstanceOf(
      DomainError
    )
    expect((await deudaDe(deuda.id)).estado).toBe(EstadoDeuda.PAGADO)
  })

  it('rechaza En proceso en una deuda sin abonos', async () => {
    const deuda = await crearDeuda(100_000)

    await expect(actualizar.execute({ deudaId: deuda.id, nuevoEstado: EstadoDeuda.EN_PROCESO })).rejects.toBeInstanceOf(
      DomainError
    )
    expect((await deudaDe(deuda.id)).estado).toBe(EstadoDeuda.PENDIENTE)
  })

  it('acepta un estado que coincide con el saldo', async () => {
    const deuda = await crearDeuda(100_000, 60_000, EstadoDeuda.EN_PROCESO)

    await actualizar.execute({ deudaId: deuda.id, nuevoEstado: EstadoDeuda.EN_PROCESO, nombre: 'Tarjeta Visa' })

    const deudaDb = await deudaDe(deuda.id)
    expect(deudaDb.nombre).toBe('Tarjeta Visa')
    expect(deudaDb.estado).toBe(EstadoDeuda.EN_PROCESO)
  })

  it('si el estado es incoherente no deja el pago a medias (se revierte la fuente)', async () => {
    const fuente = await crearFuente(80_000)
    const deuda = await crearDeuda(100_000)

    await expect(
      actualizar.execute({
        deudaId: deuda.id,
        nuevoSaldo: 70_000,
        nuevoEstado: EstadoDeuda.PENDIENTE,
        fuenteId: fuente.id,
      })
    ).rejects.toBeInstanceOf(DomainError)

    expect(await saldoDe(fuente.id)).toBe(80_000)
    expect((await deudaDe(deuda.id)).saldo).toBe(100_000)
    expect(await prisma.movimiento.count()).toBe(0)
  })
})

describe('PagarDeuda sobre una deuda ya pagada', () => {
  it('falla y no registra un movimiento de $0', async () => {
    const fuente = await crearFuente(50_000)
    const deuda = await crearDeuda(100_000, 0, EstadoDeuda.PAGADO)

    await expect(pagar.execute({ deudaId: deuda.id, fuenteId: fuente.id })).rejects.toBeInstanceOf(DomainError)

    expect(await saldoDe(fuente.id)).toBe(50_000)
    expect(await prisma.movimiento.count()).toBe(0)
  })
})
