import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { EstadoDeuda, TipoFuente } from 'shared-types'
import { PrismaUnitOfWork } from '../src/infrastructure/PrismaUnitOfWork'
import { PrismaGastoRepository } from '../src/infrastructure/repositories/PrismaGastoRepository'
import { PrismaMovimientoRepository } from '../src/infrastructure/repositories/PrismaMovimientoRepository'
import { PagarDeudaUseCase } from '../src/application/usecases/deudas/PagarDeudaUseCase'
import { ActualizarSaldoDeudaUseCase } from '../src/application/usecases/deudas/ActualizarSaldoDeudaUseCase'
import { RegistrarGastoUseCase } from '../src/application/usecases/gastos/RegistrarGastoUseCase'
import { RegistrarIngresoUseCase } from '../src/application/usecases/fuentes/RegistrarIngresoUseCase'
import { TransferirFuentesUseCase } from '../src/application/usecases/fuentes/TransferirFuentesUseCase'
import { crearBaseTemporal, BaseTemporal } from './helpers/baseTemporal'

let base: BaseTemporal
let prisma: PrismaClient
let uow: PrismaUnitOfWork

beforeEach(async () => {
  base = await crearBaseTemporal()
  prisma = base.prisma
  uow = new PrismaUnitOfWork(prisma)
})

afterEach(async () => {
  vi.restoreAllMocks()
  await base.cerrar()
})

async function crearFuente(nombre: string, saldo: number) {
  return prisma.fuente.create({ data: { nombre, tipo: TipoFuente.CUENTA, saldo } })
}

async function crearDeuda(valor: number, saldo = valor) {
  return prisma.deuda.create({
    data: { nombre: 'Tarjeta', valor, saldo, estado: EstadoDeuda.PENDIENTE, mes: '2026-10' },
  })
}

function fallarAlGuardarMovimiento() {
  vi.spyOn(PrismaMovimientoRepository.prototype, 'save').mockRejectedValueOnce(new Error('falla'))
}

describe('PagarDeuda', () => {
  it('actualiza la fuente, la deuda y registra el movimiento', async () => {
    const fuente = await crearFuente('Cuenta', 150_000)
    const deuda = await crearDeuda(100_000)

    await new PagarDeudaUseCase(uow).execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 40_000 })

    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: fuente.id } })).saldo).toBe(110_000)
    const deudaDb = await prisma.deuda.findUniqueOrThrow({ where: { id: deuda.id } })
    expect(deudaDb.saldo).toBe(60_000)
    expect(deudaDb.estado).toBe(EstadoDeuda.EN_PROCESO)
    expect(await prisma.movimiento.count()).toBe(1)
  })

  it('revierte el saldo de la fuente y de la deuda si falla al guardar el movimiento', async () => {
    const fuente = await crearFuente('Cuenta', 150_000)
    const deuda = await crearDeuda(100_000)
    fallarAlGuardarMovimiento()

    await expect(
      new PagarDeudaUseCase(uow).execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 40_000 })
    ).rejects.toThrow('falla')

    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: fuente.id } })).saldo).toBe(150_000)
    const deudaDb = await prisma.deuda.findUniqueOrThrow({ where: { id: deuda.id } })
    expect(deudaDb.saldo).toBe(100_000)
    expect(deudaDb.estado).toBe(EstadoDeuda.PENDIENTE)
    expect(await prisma.movimiento.count()).toBe(0)
  })
})

describe('TransferirFuentes', () => {
  it('mueve el dinero y registra los dos movimientos', async () => {
    const origen = await crearFuente('Cuenta', 100_000)
    const destino = await crearFuente('Efectivo', 5_000)

    await new TransferirFuentesUseCase(uow).execute({ origenId: origen.id, destinoId: destino.id, monto: 30_000 })

    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: origen.id } })).saldo).toBe(70_000)
    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: destino.id } })).saldo).toBe(35_000)
    expect(await prisma.movimiento.count()).toBe(2)
  })

  it('revierte ambas fuentes y el primer movimiento si falla el segundo', async () => {
    const origen = await crearFuente('Cuenta', 100_000)
    const destino = await crearFuente('Efectivo', 5_000)
    const guardarOriginal = PrismaMovimientoRepository.prototype.save
    let llamadas = 0
    vi.spyOn(PrismaMovimientoRepository.prototype, 'save').mockImplementation(async function (this: PrismaMovimientoRepository, movimiento) {
      llamadas++
      if (llamadas === 2) throw new Error('falla')
      return guardarOriginal.call(this, movimiento)
    })

    await expect(
      new TransferirFuentesUseCase(uow).execute({ origenId: origen.id, destinoId: destino.id, monto: 30_000 })
    ).rejects.toThrow('falla')

    expect(llamadas).toBe(2)
    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: origen.id } })).saldo).toBe(100_000)
    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: destino.id } })).saldo).toBe(5_000)
    expect(await prisma.movimiento.count()).toBe(0)
  })
})

describe('RegistrarGasto', () => {
  const gasto = { descripcion: 'Mercado', categoria: 'Alimentación', monto: 20_000, mes: '2026-10' }

  it('debita la fuente, registra el movimiento y guarda el gasto', async () => {
    const fuente = await crearFuente('Cuenta', 50_000)

    await new RegistrarGastoUseCase(uow).execute({ ...gasto, fuenteId: fuente.id })

    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: fuente.id } })).saldo).toBe(30_000)
    expect(await prisma.movimiento.count()).toBe(1)
    expect(await prisma.gasto.count()).toBe(1)
  })

  it('revierte la fuente si falla al guardar el movimiento', async () => {
    const fuente = await crearFuente('Cuenta', 50_000)
    fallarAlGuardarMovimiento()

    await expect(new RegistrarGastoUseCase(uow).execute({ ...gasto, fuenteId: fuente.id })).rejects.toThrow('falla')

    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: fuente.id } })).saldo).toBe(50_000)
    expect(await prisma.movimiento.count()).toBe(0)
    expect(await prisma.gasto.count()).toBe(0)
  })

  it('revierte la fuente y el movimiento si falla al guardar el gasto', async () => {
    const fuente = await crearFuente('Cuenta', 50_000)
    vi.spyOn(PrismaGastoRepository.prototype, 'save').mockRejectedValueOnce(new Error('falla'))

    await expect(new RegistrarGastoUseCase(uow).execute({ ...gasto, fuenteId: fuente.id })).rejects.toThrow('falla')

    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: fuente.id } })).saldo).toBe(50_000)
    expect(await prisma.movimiento.count()).toBe(0)
    expect(await prisma.gasto.count()).toBe(0)
  })
})

describe('RegistrarIngreso', () => {
  it('revierte el saldo de la fuente si falla al guardar el movimiento', async () => {
    const fuente = await crearFuente('Cuenta', 10_000)
    fallarAlGuardarMovimiento()

    await expect(new RegistrarIngresoUseCase(uow).execute(fuente.id, { monto: 5_000 })).rejects.toThrow('falla')

    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: fuente.id } })).saldo).toBe(10_000)
    expect(await prisma.movimiento.count()).toBe(0)
  })
})

describe('ActualizarSaldoDeuda', () => {
  it('revierte la fuente y la deuda si falla al guardar el pago parcial', async () => {
    const fuente = await crearFuente('Cuenta', 80_000)
    const deuda = await crearDeuda(100_000)
    fallarAlGuardarMovimiento()

    await expect(
      new ActualizarSaldoDeudaUseCase(uow).execute({ deudaId: deuda.id, nuevoSaldo: 70_000, fuenteId: fuente.id })
    ).rejects.toThrow('falla')

    expect((await prisma.fuente.findUniqueOrThrow({ where: { id: fuente.id } })).saldo).toBe(80_000)
    const deudaDb = await prisma.deuda.findUniqueOrThrow({ where: { id: deuda.id } })
    expect(deudaDb.saldo).toBe(100_000)
    expect(deudaDb.estado).toBe(EstadoDeuda.PENDIENTE)
    expect(await prisma.movimiento.count()).toBe(0)
  })
})
