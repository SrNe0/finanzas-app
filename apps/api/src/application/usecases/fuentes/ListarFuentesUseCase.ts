import { IFuenteRepository } from '../../../domain/repositories/IFuenteRepository'
import { FuenteDTO } from 'shared-types'
import { FuenteMapper } from '../../../infrastructure/mappers/FuenteMapper'

export class ListarFuentesUseCase {
  constructor(private fuenteRepo: IFuenteRepository) {}

  async execute(): Promise<FuenteDTO[]> {
    const fuentes = await this.fuenteRepo.findAll()
    return fuentes.map(FuenteMapper.toDTO)
  }
}
