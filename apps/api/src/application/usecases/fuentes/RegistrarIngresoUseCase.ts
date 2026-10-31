import { IUnitOfWork } from '../../../domain/repositories/IUnitOfWork'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { NotFoundError } from '../../../domain/errors/DomainError'
import { TipoMovimiento, RegistrarIngresoInput, FuenteDTO, MovimientoDTO } from 'shared-types'
import { FuenteMapper } from '../../../infrastructure/mappers/FuenteMapper'
import { MovimientoMapper } from '../../../infrastructure/mappers/MovimientoMapper'

export class RegistrarIngresoUseCase {
  constructor(private uow: IUnitOfWork) {}

  async execute(
    fuenteId: string,
    input: RegistrarIngresoInput
  ): Promise<{ fuente: FuenteDTO; movimiento: MovimientoDTO }> {
    return this.uow.run(async repos => {
      const fuente = await repos.fuentes.findById(fuenteId)
      if (!fuente) throw new NotFoundError('Fuente', fuenteId)

      fuente.depositar(input.monto)
      await repos.fuentes.update(fuente)

      const movimiento = await repos.movimientos.save(
        new Movimiento(
          null,
          TipoMovimiento.INGRESO,
          fuente.id,
          null,
          input.descripcion ?? null,
          input.monto,
          new Date()
        )
      )

      return { fuente: FuenteMapper.toDTO(fuente), movimiento: MovimientoMapper.toDTO(movimiento) }
    })
  }
}
