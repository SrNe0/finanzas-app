import { Fuente } from '../../../domain/entities/Fuente'
import { IFuenteRepository } from '../../../domain/repositories/IFuenteRepository'
import { CrearFuenteInput, FuenteDTO } from 'shared-types'
import { FuenteMapper } from '../../../infrastructure/mappers/FuenteMapper'

export class CrearFuenteUseCase {
  constructor(private fuenteRepo: IFuenteRepository) {}

  async execute(input: CrearFuenteInput): Promise<FuenteDTO> {
    const fuente = new Fuente('', input.nombre, input.tipo, 0)
    const saved = await this.fuenteRepo.save(fuente)
    return FuenteMapper.toDTO(saved)
  }
}
