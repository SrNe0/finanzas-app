import { MovimientoDTO } from 'shared-types'
import { Movimiento } from '../../domain/entities/Movimiento'

export class MovimientoDtoMapper {
  static toDTO(m: Movimiento): MovimientoDTO {
    return {
      id: m.id ?? '',
      tipo: m.tipo,
      fuenteId: m.fuenteId,
      deudaId: m.deudaId,
      descripcion: m.descripcion,
      monto: m.monto,
      fecha: m.fecha.toISOString(),
    }
  }
}
