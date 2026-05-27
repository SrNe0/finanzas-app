import { Gasto } from '../../domain/entities/Gasto'
import { GastoDTO } from 'shared-types'

type PrismaGasto = {
  id: string
  descripcion: string
  categoria: string
  monto: number
  mes: string
  fuenteId: string | null
  fecha: Date
}

export class GastoMapper {
  static toDomain(record: PrismaGasto): Gasto {
    return new Gasto(record.id, record.descripcion, record.categoria, record.monto, record.mes, record.fuenteId, record.fecha)
  }

  static toDTO(g: Gasto): GastoDTO {
    return {
      id: g.id ?? '',
      descripcion: g.descripcion,
      categoria: g.categoria,
      monto: g.monto,
      mes: g.mes,
      fuenteId: g.fuenteId,
      fecha: g.fecha.toISOString(),
    }
  }
}
