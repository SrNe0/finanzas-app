import { GastoDTO } from 'shared-types'
import { Gasto } from '../../domain/entities/Gasto'

export class GastoDtoMapper {
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
