import type { Movimiento as MovimientoRecord } from '@prisma/client'
import { TipoMovimiento } from 'shared-types'
import { Movimiento } from '../../domain/entities/Movimiento'

export class MovimientoMapper {
  static toDomain(record: MovimientoRecord): Movimiento {
    return new Movimiento(
      record.id,
      record.tipo as TipoMovimiento,
      record.fuenteId,
      record.deudaId,
      record.descripcion,
      record.monto,
      record.fecha,
      record.gastoId
    )
  }
}
