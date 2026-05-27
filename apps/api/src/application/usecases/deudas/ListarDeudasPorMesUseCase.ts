import { IDeudaRepository } from '../../../domain/repositories/IDeudaRepository'
import { DeudaDTO } from 'shared-types'
import { DeudaMapper } from '../../../infrastructure/mappers/DeudaMapper'

export class ListarDeudasPorMesUseCase {
  constructor(private deudaRepo: IDeudaRepository) {}

  async execute(mes: string): Promise<{ delMes: DeudaDTO[]; arrastradas: DeudaDTO[] }> {
    const [delMes, arrastradas] = await Promise.all([
      this.deudaRepo.findByMes(mes),
      this.deudaRepo.findPendientesAnterioresA(mes),
    ])
    return {
      delMes: delMes.map(DeudaMapper.toDTO),
      arrastradas: arrastradas.map(DeudaMapper.toDTO),
    }
  }
}
