import { IUnitOfWork } from '../../../domain/repositories/IUnitOfWork'
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
  constructor(private uow: IUnitOfWork) {}

  async execute(input: PagarDeudaInput): Promise<{ deuda: DeudaDTO; fuente: FuenteDTO }> {
    return this.uow.run(async (repos) => {
      const deuda = await repos.deudas.findById(input.deudaId)
      if (!deuda) throw new NotFoundError('Deuda', input.deudaId)

      const fuente = await repos.fuentes.findById(input.fuenteId)
      if (!fuente) throw new NotFoundError('Fuente', input.fuenteId)

      const monto = input.monto ?? deuda.saldo
      deuda.pagar(monto)
      fuente.debitar(monto)

      await repos.fuentes.update(fuente)
      await repos.deudas.update(deuda)
      await repos.movimientos.save(
        new Movimiento(null, TipoMovimiento.PAGO_DEUDA, fuente.id, deuda.id, `Pago ${deuda.nombre}`, monto, new Date())
      )

      return { deuda: DeudaMapper.toDTO(deuda), fuente: FuenteMapper.toDTO(fuente) }
    })
  }
}
