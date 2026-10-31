import { IDeudaRepository } from './IDeudaRepository'
import { IFuenteRepository } from './IFuenteRepository'
import { IGastoRepository } from './IGastoRepository'
import { IMovimientoRepository } from './IMovimientoRepository'

export interface Repos {
  deudas: IDeudaRepository
  fuentes: IFuenteRepository
  gastos: IGastoRepository
  movimientos: IMovimientoRepository
}

export interface IUnitOfWork {
  /**
   * Ejecuta `work` en una única transacción: si lanza un error se revierten
   * todas las escrituras hechas a través de `repos`.
   */
  run<T>(work: (repos: Repos) => Promise<T>): Promise<T>
}
