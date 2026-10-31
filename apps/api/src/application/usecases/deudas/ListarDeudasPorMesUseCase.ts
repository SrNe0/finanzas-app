import { IDeudaRepository } from '../../../domain/repositories/IDeudaRepository'
import { DeudaDTO } from 'shared-types'
import { DeudaDtoMapper } from '../../mappers/DeudaDtoMapper'

export class ListarDeudasPorMesUseCase {
  constructor(private deudaRepo: IDeudaRepository) {}

  async execute(mes: string): Promise<{ delMes: DeudaDTO[]; arrastradas: DeudaDTO[] }> {
    const [delMes, arrastradas] = await Promise.all([
      this.deudaRepo.findByMes(mes),
      this.deudaRepo.findPendientesAnterioresA(mes),
    ])
    return {
      delMes: delMes.map(DeudaDtoMapper.toDTO),
      arrastradas: arrastradas.map(DeudaDtoMapper.toDTO),
    }
  }
}
