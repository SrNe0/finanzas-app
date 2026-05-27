import { IGastoRepository } from '../../../domain/repositories/IGastoRepository'
import { GastoDTO } from 'shared-types'
import { GastoMapper } from '../../../infrastructure/mappers/GastoMapper'

export class ListarGastosPorMesUseCase {
  constructor(private gastoRepo: IGastoRepository) {}

  async execute(mes: string): Promise<GastoDTO[]> {
    const gastos = await this.gastoRepo.findByMes(mes)
    return gastos.map(GastoMapper.toDTO)
  }
}
