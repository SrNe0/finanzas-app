import { DeudaDTO } from 'shared-types'
import { Deuda } from '../../domain/entities/Deuda'

export class DeudaDtoMapper {
  static toDTO(deuda: Deuda): DeudaDTO {
    return {
      id: deuda.id,
      nombre: deuda.nombre,
      valor: deuda.valor,
      saldo: deuda.saldo,
      estado: deuda.estado,
      mes: deuda.mes,
      creadoEn: deuda.creadoEn.toISOString(),
    }
  }
}
