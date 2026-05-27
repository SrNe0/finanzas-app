import { IFuenteRepository } from '../../../domain/repositories/IFuenteRepository'
import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { NotFoundError } from '../../../domain/errors/DomainError'
import { TipoMovimiento, RegistrarIngresoInput, FuenteDTO, MovimientoDTO } from 'shared-types'
import { FuenteMapper } from '../../../infrastructure/mappers/FuenteMapper'
import { MovimientoMapper } from '../../../infrastructure/mappers/MovimientoMapper'

export class RegistrarIngresoUseCase {
  constructor(
    private fuenteRepo: IFuenteRepository,
    private movimientoRepo: IMovimientoRepository
  ) {}

  async execute(fuenteId: string, input: RegistrarIngresoInput): Promise<{ fuente: FuenteDTO; movimiento: MovimientoDTO }> {
    const fuente = await this.fuenteRepo.findById(fuenteId)
    if (!fuente) throw new NotFoundError('Fuente', fuenteId)

    fuente.depositar(input.monto)
    await this.fuenteRepo.update(fuente)

    const movimiento = await this.movimientoRepo.save(
      new Movimiento(null, TipoMovimiento.INGRESO, fuente.id, null, input.descripcion ?? null, input.monto, new Date())
    )

    return { fuente: FuenteMapper.toDTO(fuente), movimiento: MovimientoMapper.toDTO(movimiento) }
  }
}
