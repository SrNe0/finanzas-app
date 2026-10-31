import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository'
import { MovimientoDTO } from 'shared-types'
import { MovimientoDtoMapper } from '../../mappers/MovimientoDtoMapper'

export class ObtenerHistorialFuenteUseCase {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(fuenteId: string): Promise<MovimientoDTO[]> {
    const movimientos = await this.movimientoRepo.findByFuenteId(fuenteId)
    return movimientos.map(MovimientoDtoMapper.toDTO)
  }
}
