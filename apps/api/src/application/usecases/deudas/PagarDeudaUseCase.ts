import { IDeudaRepository } from '../../../domain/repositories/IDeudaRepository'
import { IFuenteRepository } from '../../../domain/repositories/IFuenteRepository'
import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { NotFoundError } from '../../../domain/errors/DomainError'
import { TipoMovimiento, DeudaDTO, FuenteDTO } from 'shared-types'
import { DeudaMapper } from '../../../infrastructure/mappers/DeudaMapper'
import { FuenteMapper } from '../../../infrastructure/mappers/FuenteMapper'

interface PagarDeudaInput {
  deudaId: string
  fuenteId: string
  monto?: number
}

export class PagarDeudaUseCase {
  constructor(
    private deudaRepo: IDeudaRepository,
    private fuenteRepo: IFuenteRepository,
    private movimientoRepo: IMovimientoRepository
  ) {}

  async execute(input: PagarDeudaInput): Promise<{ deuda: DeudaDTO; fuente: FuenteDTO }> {
    const deuda = await this.deudaRepo.findById(input.deudaId)
    if (!deuda) throw new NotFoundError('Deuda', input.deudaId)

    const fuente = await this.fuenteRepo.findById(input.fuenteId)
    if (!fuente) throw new NotFoundError('Fuente', input.fuenteId)

    const monto = input.monto ?? deuda.saldo
    fuente.debitar(monto)
    deuda.pagar(monto)

    await this.fuenteRepo.update(fuente)
    await this.deudaRepo.update(deuda)
    await this.movimientoRepo.save(
      new Movimiento(null, TipoMovimiento.PAGO_DEUDA, fuente.id, deuda.id, `Pago ${deuda.nombre}`, monto, new Date())
    )

    return { deuda: DeudaMapper.toDTO(deuda), fuente: FuenteMapper.toDTO(fuente) }
  }
}
