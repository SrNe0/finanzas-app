import { Fuente } from '../../domain/entities/Fuente'
import { TipoFuente, FuenteDTO } from 'shared-types'

type PrismaFuente = {
  id: string
  nombre: string
  tipo: string
  saldo: number
}

export class FuenteMapper {
  static toDomain(record: PrismaFuente): Fuente {
    return new Fuente(record.id, record.nombre, record.tipo as TipoFuente, record.saldo)
  }

  static toDTO(fuente: Fuente): FuenteDTO {
    return {
      id: fuente.id,
      nombre: fuente.nombre,
      tipo: fuente.tipo,
      saldo: fuente.saldo,
    }
  }
}
