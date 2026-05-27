import { IDeudaRepository } from '../../../domain/repositories/IDeudaRepository'
import { NotFoundError } from '../../../domain/errors/DomainError'

export class EliminarDeudaUseCase {
  constructor(private deudaRepo: IDeudaRepository) {}

  async execute(id: string): Promise<void> {
    const deuda = await this.deudaRepo.findById(id)
    if (!deuda) throw new NotFoundError('Deuda', id)
    await this.deudaRepo.delete(id)
  }
}
