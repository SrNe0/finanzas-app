import { Gasto } from '../../../domain/entities/Gasto'
import { IUnitOfWork } from '../../../domain/repositories/IUnitOfWork'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { NotFoundError } from '../../../domain/errors/DomainError'
import { TipoMovimiento, RegistrarGastoInput, GastoDTO } from 'shared-types'
import { GastoMapper } from '../../../infrastructure/mappers/GastoMapper'

export class RegistrarGastoUseCase {
  constructor(private uow: IUnitOfWork) {}

  async execute(input: RegistrarGastoInput): Promise<GastoDTO> {
    return this.uow.run(async repos => {
      const fuente = input.fuenteId ? await repos.fuentes.findById(input.fuenteId) : null
      if (input.fuenteId && !fuente) throw new NotFoundError('Fuente', input.fuenteId)

      if (fuente) {
        fuente.debitar(input.monto)
        await repos.fuentes.update(fuente)
      }

      const gasto = new Gasto(
        null,
        input.descripcion,
        input.categoria,
        input.monto,
        input.mes,
        input.fuenteId ?? null,
        new Date()
      )
      const saved = await repos.gastos.save(gasto)

      if (fuente) {
        await repos.movimientos.save(
          new Movimiento(
            null,
            TipoMovimiento.GASTO,
            fuente.id,
            null,
            input.descripcion,
            input.monto,
            new Date(),
            saved.id
          )
        )
      }

      return GastoMapper.toDTO(saved)
    })
  }
}
