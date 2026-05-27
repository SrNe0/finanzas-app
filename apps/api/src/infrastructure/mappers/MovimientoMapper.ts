import { Movimiento } from '../../domain/entities/Movimiento'
import { TipoMovimiento, MovimientoDTO } from 'shared-types'

type PrismaMovimiento = {
  id: string
  tipo: string
  fuenteId: string | null
  deudaId: string | null
  descripcion: string | null
  monto: number
  fecha: Date
}

export class MovimientoMapper {
  static toDomain(record: PrismaMovimiento): Movimiento {
    return new Movimiento(
      record.id,
      record.tipo as TipoMovimiento,
      record.fuenteId,
      record.deudaId,
      record.descripcion,
      record.monto,
      record.fecha
    )
  }

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
