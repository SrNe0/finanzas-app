import { IUnitOfWork } from '../../../domain/repositories/IUnitOfWork'
import { Movimiento } from '../../../domain/entities/Movimiento'
import { DomainError, NotFoundError } from '../../../domain/errors/DomainError'
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

      // Marcar la deuda como Pagado equivale a dejar su saldo en 0 (pagando lo que falta).
      let nuevoSaldo = input.nuevoSaldo
      if (input.nuevoEstado === EstadoDeuda.PAGADO) {
        if (nuevoSaldo !== undefined && nuevoSaldo !== 0) {
          throw new DomainError('Una deuda pagada debe tener saldo 0')
        }
        nuevoSaldo = 0
      }

      let fuente = undefined
      if (nuevoSaldo !== undefined) {
        const diferencia = deuda.saldo - nuevoSaldo
        deuda.actualizarSaldo(nuevoSaldo)

        if (diferencia > 0 && input.fuenteId) {
          const f = await repos.fuentes.findById(input.fuenteId)
          if (!f) throw new NotFoundError('Fuente', input.fuenteId)
          f.debitar(diferencia)
          await repos.fuentes.update(f)
          const concepto = nuevoSaldo === 0 ? 'Pago' : 'Pago parcial'
          await repos.movimientos.save(
            new Movimiento(null, TipoMovimiento.PAGO_DEUDA, f.id, deuda.id, `${concepto} ${deuda.nombre}`, diferencia, new Date())
          )
          fuente = FuenteMapper.toDTO(f)
        }
      }

      // El estado lo determina el saldo: un estado que no coincide es incoherente.
      if (input.nuevoEstado !== undefined && input.nuevoEstado !== deuda.estado) {
        throw new DomainError(
          `El estado "${input.nuevoEstado}" no es coherente con el saldo ${deuda.saldo} de una deuda de valor ${deuda.valor}`
        )
      }

      const updated = await repos.deudas.update(deuda)
      return { deuda: DeudaMapper.toDTO(updated), fuente }
    })
  }
}
