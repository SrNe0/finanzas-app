import { IUnitOfWork } from '../../../domain/repositories/IUnitOfWork'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { NotFoundError } from '../../../domain/errors/DomainError'
import { TipoMovimiento, EstadoDeuda, DeudaDTO, FuenteDTO } from 'shared-types'
import { DeudaMapper } from '../../../infrastructure/mappers/DeudaMapper'
import { FuenteMapper } from '../../../infrastructure/mappers/FuenteMapper'

interface ActualizarDeudaInput {
  deudaId: string
  nombre?: string
  nuevoSaldo?: number
  nuevoEstado?: EstadoDeuda
  fuenteId?: string
}

export class ActualizarSaldoDeudaUseCase {
  constructor(private uow: IUnitOfWork) {}

  async execute(input: ActualizarDeudaInput): Promise<{ deuda: DeudaDTO; fuente?: FuenteDTO }> {
    return this.uow.run(async (repos) => {
      const deuda = await repos.deudas.findById(input.deudaId)
      if (!deuda) throw new NotFoundError('Deuda', input.deudaId)

      if (input.nombre !== undefined) deuda.nombre = input.nombre

      let fuente = undefined
      if (input.nuevoSaldo !== undefined) {
        const diferencia = deuda.saldo - input.nuevoSaldo
        if (diferencia > 0 && input.fuenteId) {
          const f = await repos.fuentes.findById(input.fuenteId)
          if (!f) throw new NotFoundError('Fuente', input.fuenteId)
          f.debitar(diferencia)
          await repos.fuentes.update(f)
          await repos.movimientos.save(
            new Movimiento(null, TipoMovimiento.PAGO_DEUDA, f.id, deuda.id, `Pago parcial ${deuda.nombre}`, diferencia, new Date())
          )
          fuente = FuenteMapper.toDTO(f)
        }
        deuda.actualizarSaldo(input.nuevoSaldo)
      }

      if (input.nuevoEstado !== undefined) {
        deuda.estado = input.nuevoEstado
        if (input.nuevoEstado === EstadoDeuda.PAGADO) {
          deuda.saldo = 0
          if (input.fuenteId && !input.nuevoSaldo) {
            const f = await repos.fuentes.findById(input.fuenteId)
            if (f) {
              f.debitar(deuda.saldo)
              await repos.fuentes.update(f)
              fuente = FuenteMapper.toDTO(f)
            }
          }
        }
      }

      const updated = await repos.deudas.update(deuda)
      return { deuda: DeudaMapper.toDTO(updated), fuente }
    })
  }
}
