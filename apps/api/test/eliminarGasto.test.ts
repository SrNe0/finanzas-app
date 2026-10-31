import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { TipoFuente, TipoMovimiento } from 'shared-types'
import { NotFoundError } from '../src/domain/errors/DomainError'
import { PrismaUnitOfWork } from '../src/infrastructure/PrismaUnitOfWork'
import { PrismaGastoRepository } from '../src/infrastructure/repositories/PrismaGastoRepository'
import { RegistrarGastoUseCase } from '../src/application/usecases/gastos/RegistrarGastoUseCase'
import { EliminarGastoUseCase } from '../src/application/usecases/gastos/EliminarGastoUseCase'
import { crearBaseTemporal, BaseTemporal } from './helpers/baseTemporal'

let base: BaseTemporal
let prisma: PrismaClient
let registrar: RegistrarGastoUseCase
let eliminar: EliminarGastoUseCase

beforeEach(async () => {
  base = await crearBaseTemporal()
  prisma = base.prisma
  const uow = new PrismaUnitOfWork(prisma)
  registrar = new RegistrarGastoUseCase(uow)
  eliminar = new EliminarGastoUseCase(uow)
})

afterEach(async () => {
  vi.restoreAllMocks()
  await base.cerrar()
})

async function crearFuente(saldo: number) {
  return prisma.fuente.create({ data: { nombre: 'Cuenta', tipo: TipoFuente.CUENTA, saldo } })
}

async function saldoDe(fuenteId: string) {
  return (await prisma.fuente.findUniqueOrThrow({ where: { id: fuenteId } })).saldo
}

const gasto = { descripcion: 'Mercado', categoria: 'Alimentación', monto: 20_000, mes: '2026-10' }

describe('RegistrarGasto', () => {
  it('vincula el movimiento con el gasto', async () => {
    const fuente = await crearFuente(50_000)

    const creado = await registrar.execute({ ...gasto, fuenteId: fuente.id })

    const movimiento = await prisma.movimiento.findFirstOrThrow()
    expect(movimiento.gastoId).toBe(creado.id)
    expect(movimiento.tipo).toBe(TipoMovimiento.GASTO)
  })
})

describe('EliminarGasto', () => {
  it('devuelve el monto a la fuente y elimina el gasto y su movimiento', async () => {
    const fuente = await crearFuente(50_000)
    const creado = await registrar.execute({ ...gasto, fuenteId: fuente.id })
    expect(await saldoDe(fuente.id)).toBe(30_000)

    await eliminar.execute(creado.id)

    expect(await saldoDe(fuente.id)).toBe(50_000)
    expect(await prisma.gasto.count()).toBe(0)
    expect(await prisma.movimiento.count()).toBe(0)
  })

  it('elimina solo el movimiento de ese gasto cuando hay otros iguales', async () => {
    const fuente = await crearFuente(100_000)
    const primero = await registrar.execute({ ...gasto, fuenteId: fuente.id })
    const segundo = await registrar.execute({ ...gasto, fuenteId: fuente.id })

    await eliminar.execute(primero.id)

    expect(await saldoDe(fuente.id)).toBe(80_000)
    const movimientos = await prisma.movimiento.findMany()
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0].gastoId).toBe(segundo.id)
  })

  it('elimina un gasto sin fuente sin tocar ninguna fuente', async () => {
    const fuente = await crearFuente(50_000)
    const creado = await registrar.execute({ ...gasto })

    await eliminar.execute(creado.id)

    expect(await prisma.gasto.count()).toBe(0)
    expect(await saldoDe(fuente.id)).toBe(50_000)
  })

  it('devuelve el monto de un gasto anterior a la vinculación (sin movimiento asociado)', async () => {
    const fuente = await crearFuente(30_000)
    const antiguo = await prisma.gasto.create({
      data: { ...gasto, fuenteId: fuente.id },
    })

    await eliminar.execute(antiguo.id)

    expect(await saldoDe(fuente.id)).toBe(50_000)
    expect(await prisma.gasto.count()).toBe(0)
  })

  it('lanza NotFoundError si el gasto no existe', async () => {
    await expect(eliminar.execute('no-existe')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('es atómico: si falla al borrar el gasto, la fuente y el movimiento quedan como estaban', async () => {
    const fuente = await crearFuente(50_000)
    const creado = await registrar.execute({ ...gasto, fuenteId: fuente.id })
    vi.spyOn(PrismaGastoRepository.prototype, 'delete').mockRejectedValueOnce(new Error('falla'))

    await expect(eliminar.execute(creado.id)).rejects.toThrow('falla')

    expect(await saldoDe(fuente.id)).toBe(30_000)
    expect(await prisma.gasto.count()).toBe(1)
    expect(await prisma.movimiento.count()).toBe(1)
  })
})
