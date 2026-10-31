import { PrismaClient } from '@prisma/client'
import { IUnitOfWork, Repos } from '../domain/repositories/IUnitOfWork'
import { PrismaDeudaRepository } from './repositories/PrismaDeudaRepository'
import { PrismaFuenteRepository } from './repositories/PrismaFuenteRepository'
import { PrismaGastoRepository } from './repositories/PrismaGastoRepository'
import { PrismaMovimientoRepository } from './repositories/PrismaMovimientoRepository'

export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private prisma: PrismaClient) {}

  run<T>(work: (repos: Repos) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async tx =>
      work({
        deudas: new PrismaDeudaRepository(tx),
        fuentes: new PrismaFuenteRepository(tx),
        gastos: new PrismaGastoRepository(tx),
        movimientos: new PrismaMovimientoRepository(tx),
      })
    )
  }
}
