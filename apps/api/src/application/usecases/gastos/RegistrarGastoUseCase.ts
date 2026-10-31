import { Gasto } from '../../../domain/entities/Gasto'
import { IUnitOfWork } from '../../../domain/repositories/IUnitOfWork'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { NotFoundError } from '../../../domain/errors/DomainError'
import { TipoMovimiento, RegistrarGastoInput, GastoDTO } from 'shared-types'
import { GastoMapper } from '../../../infrastructure/mappers/GastoMapper'

export class RegistrarGastoUseCase {
  constructor(private uow: IUnitOfWork) {}

  async execute(input: RegistrarGastoInput): Promise<GastoDTO> {
    return this.uow.run(async (repos) => {
      if (input.fuenteId) {
        const fuente = await repos.fuentes.findById(input.fuenteId)
        if (!fuente) throw new NotFoundError('Fuente', input.fuenteId)
        fuente.debitar(input.monto)
        await repos.fuentes.update(fuente)
        await repos.movimientos.save(
          new Movimiento(null, TipoMovimiento.GASTO, fuente.id, null, input.descripcion, input.monto, new Date())
        )
      }

      const gasto = new Gasto(null, input.descripcion, input.categoria, input.monto, input.mes, input.fuenteId ?? null, new Date())
      const saved = await repos.gastos.save(gasto)
      return GastoMapper.toDTO(saved)
    })
  }
}
