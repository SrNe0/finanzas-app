import { IFuenteRepository } from '../../../domain/repositories/IFuenteRepository'
import { FuenteDTO } from 'shared-types'
import { FuenteDtoMapper } from '../../mappers/FuenteDtoMapper'

export class ListarFuentesUseCase {
  constructor(private fuenteRepo: IFuenteRepository) {}

  async execute(): Promise<FuenteDTO[]> {
    const fuentes = await this.fuenteRepo.findAll()
    return fuentes.map(FuenteDtoMapper.toDTO)
  }
}
