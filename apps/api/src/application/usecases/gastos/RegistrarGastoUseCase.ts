import { Gasto } from '../../../domain/entities/Gasto'
import { IGastoRepository } from '../../../domain/repositories/IGastoRepository'
import { IFuenteRepository } from '../../../domain/repositories/IFuenteRepository'
import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { NotFoundError } from '../../../domain/errors/DomainError'
import { TipoMovimiento, RegistrarGastoInput, GastoDTO } from 'shared-types'
import { GastoMapper } from '../../../infrastructure/mappers/GastoMapper'

export class RegistrarGastoUseCase {
  constructor(
    private gastoRepo: IGastoRepository,
    private fuenteRepo: IFuenteRepository,
    private movimientoRepo: IMovimientoRepository
  ) {}

  async execute(input: RegistrarGastoInput): Promise<GastoDTO> {
    if (input.fuenteId) {
      const fuente = await this.fuenteRepo.findById(input.fuenteId)
      if (!fuente) throw new NotFoundError('Fuente', input.fuenteId)
      fuente.debitar(input.monto)
      await this.fuenteRepo.update(fuente)
      await this.movimientoRepo.save(
        new Movimiento(null, TipoMovimiento.GASTO, fuente.id, null, input.descripcion, input.monto, new Date())
      )
    }

    const gasto = new Gasto(null, input.descripcion, input.categoria, input.monto, input.mes, input.fuenteId ?? null, new Date())
    const saved = await this.gastoRepo.save(gasto)
    return GastoMapper.toDTO(saved)
  }
}
