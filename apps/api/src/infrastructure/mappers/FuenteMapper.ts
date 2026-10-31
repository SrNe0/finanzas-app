import type { Fuente as FuenteRecord } from '@prisma/client'
import { TipoFuente } from 'shared-types'
import { Fuente } from '../../domain/entities/Fuente'

export class FuenteMapper {
  static toDomain(record: FuenteRecord): Fuente {
    return new Fuente(record.id, record.nombre, record.tipo as TipoFuente, record.saldo)
  }
}
