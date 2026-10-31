import type { Gasto as GastoRecord } from '@prisma/client'
import { Gasto } from '../../domain/entities/Gasto'

export class GastoMapper {
  static toDomain(record: GastoRecord): Gasto {
    return new Gasto(
      record.id,
      record.descripcion,
      record.categoria,
      record.monto,
      record.mes,
      record.fuenteId,
      record.fecha
    )
  }
}
