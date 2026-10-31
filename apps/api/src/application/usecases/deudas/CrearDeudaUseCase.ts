import { Deuda } from '../../../domain/entities/Deuda'
import { IDeudaRepository } from '../../../domain/repositories/IDeudaRepository'
import { EstadoDeuda, CrearDeudaInput, DeudaDTO } from 'shared-types'
import { DeudaDtoMapper } from '../../mappers/DeudaDtoMapper'

export class CrearDeudaUseCase {
  constructor(private deudaRepo: IDeudaRepository) {}

  async execute(input: CrearDeudaInput): Promise<DeudaDTO> {
    const deuda = new Deuda('', input.nombre, input.valor, input.valor, EstadoDeuda.PENDIENTE, input.mes, new Date())
    const saved = await this.deudaRepo.save(deuda)
    return DeudaDtoMapper.toDTO(saved)
  }
}
