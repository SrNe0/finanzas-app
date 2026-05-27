import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository'
import { MovimientoDTO } from 'shared-types'
import { MovimientoMapper } from '../../../infrastructure/mappers/MovimientoMapper'

export class ObtenerHistorialFuenteUseCase {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  async execute(fuenteId: string): Promise<MovimientoDTO[]> {
    const movimientos = await this.movimientoRepo.findByFuenteId(fuenteId)
    return movimientos.map(MovimientoMapper.toDTO)
  }
}
