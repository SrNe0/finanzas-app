import { IGastoRepository } from '../../../domain/repositories/IGastoRepository'
import { GastoDTO } from 'shared-types'
import { GastoDtoMapper } from '../../mappers/GastoDtoMapper'

export class ListarGastosPorMesUseCase {
  constructor(private gastoRepo: IGastoRepository) {}

  async execute(mes: string): Promise<GastoDTO[]> {
    const gastos = await this.gastoRepo.findByMes(mes)
    return gastos.map(GastoDtoMapper.toDTO)
  }
}
