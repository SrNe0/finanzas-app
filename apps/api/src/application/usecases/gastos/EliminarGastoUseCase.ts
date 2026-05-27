import { IGastoRepository } from '../../../domain/repositories/IGastoRepository'
import { NotFoundError } from '../../../domain/errors/DomainError'

export class EliminarGastoUseCase {
  constructor(private gastoRepo: IGastoRepository) {}

  async execute(id: string): Promise<void> {
    const gasto = await this.gastoRepo.findById(id)
    if (!gasto) throw new NotFoundError('Gasto', id)
    await this.gastoRepo.delete(id)
  }
}
