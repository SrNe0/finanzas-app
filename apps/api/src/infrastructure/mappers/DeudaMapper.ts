import type { Deuda as DeudaRecord } from '@prisma/client'
import { EstadoDeuda } from 'shared-types'
import { Deuda } from '../../domain/entities/Deuda'

export class DeudaMapper {
  static toDomain(record: DeudaRecord): Deuda {
    return new Deuda(
      record.id,
      record.nombre,
      record.valor,
      record.saldo,
      record.estado as EstadoDeuda,
      record.mes,
      record.creadoEn
    )
  }
}
