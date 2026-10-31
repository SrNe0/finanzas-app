import { IUnitOfWork } from '../../../domain/repositories/IUnitOfWork'
import { NotFoundError } from '../../../domain/errors/DomainError'

export class EliminarGastoUseCase {
  constructor(private uow: IUnitOfWork) {}

  async execute(id: string): Promise<void> {
    await this.uow.run(async (repos) => {
      const gasto = await repos.gastos.findById(id)
      if (!gasto) throw new NotFoundError('Gasto', id)

      if (gasto.fuenteId) {
        const fuente = await repos.fuentes.findById(gasto.fuenteId)
        if (!fuente) throw new NotFoundError('Fuente', gasto.fuenteId)
        fuente.depositar(gasto.monto)
        await repos.fuentes.update(fuente)

        // Los gastos anteriores a la migración no tienen movimiento vinculado.
        const movimiento = await repos.movimientos.findByGastoId(gasto.id as string)
        if (movimiento?.id) await repos.movimientos.delete(movimiento.id)
      }

      await repos.gastos.delete(id)
    })
  }
}
