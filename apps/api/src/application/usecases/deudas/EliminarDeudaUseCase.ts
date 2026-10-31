import { IUnitOfWork } from '../../../domain/repositories/IUnitOfWork'
import { NotFoundError } from '../../../domain/errors/DomainError'

export class EliminarDeudaUseCase {
  constructor(private uow: IUnitOfWork) {}

  async execute(id: string): Promise<void> {
    await this.uow.run(async repos => {
      const deuda = await repos.deudas.findById(id)
      if (!deuda) throw new NotFoundError('Deuda', id)

      const pagos = await repos.movimientos.findPagosByDeudaId(id)

      const devolver = new Map<string, number>()
      for (const pago of pagos) {
        if (pago.fuenteId) devolver.set(pago.fuenteId, (devolver.get(pago.fuenteId) ?? 0) + pago.monto)
      }

      for (const [fuenteId, monto] of devolver) {
        const fuente = await repos.fuentes.findById(fuenteId)
        if (!fuente) throw new NotFoundError('Fuente', fuenteId)
        fuente.depositar(monto)
        await repos.fuentes.update(fuente)
      }

      for (const pago of pagos) {
        if (pago.id) await repos.movimientos.delete(pago.id)
      }

      await repos.deudas.delete(id)
    })
  }
}
