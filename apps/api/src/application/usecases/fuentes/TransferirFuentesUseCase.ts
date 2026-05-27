import { IFuenteRepository } from '../../../domain/repositories/IFuenteRepository'
import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { NotFoundError, DomainError } from '../../../domain/errors/DomainError'
import { TipoMovimiento, TransferirFuentesInput, FuenteDTO } from 'shared-types'
import { FuenteMapper } from '../../../infrastructure/mappers/FuenteMapper'

export class TransferirFuentesUseCase {
  constructor(
    private fuenteRepo: IFuenteRepository,
    private movimientoRepo: IMovimientoRepository
  ) {}

  async execute(input: TransferirFuentesInput): Promise<{ origen: FuenteDTO; destino: FuenteDTO }> {
    if (input.origenId === input.destinoId) throw new DomainError('El origen y destino no pueden ser iguales')

    const origen = await this.fuenteRepo.findById(input.origenId)
    if (!origen) throw new NotFoundError('Fuente', input.origenId)

    const destino = await this.fuenteRepo.findById(input.destinoId)
    if (!destino) throw new NotFoundError('Fuente', input.destinoId)

    origen.debitar(input.monto)
    destino.depositar(input.monto)

    await this.fuenteRepo.update(origen)
    await this.fuenteRepo.update(destino)

    const desc = input.descripcion ?? `Transferencia ${origen.nombre} → ${destino.nombre}`

    await Promise.all([
      this.movimientoRepo.save(
        new Movimiento(null, TipoMovimiento.TRANSFERENCIA_SALIDA, origen.id, null, `${desc} (salida)`, input.monto, new Date())
      ),
      this.movimientoRepo.save(
        new Movimiento(null, TipoMovimiento.TRANSFERENCIA_ENTRADA, destino.id, null, `${desc} (entrada)`, input.monto, new Date())
      ),
    ])

    return { origen: FuenteMapper.toDTO(origen), destino: FuenteMapper.toDTO(destino) }
  }
}
