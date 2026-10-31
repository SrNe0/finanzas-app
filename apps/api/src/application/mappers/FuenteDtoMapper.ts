import { FuenteDTO } from 'shared-types'
import { Fuente } from '../../domain/entities/Fuente'

export class FuenteDtoMapper {
  static toDTO(fuente: Fuente): FuenteDTO {
    return {
      id: fuente.id,
      nombre: fuente.nombre,
      tipo: fuente.tipo,
      saldo: fuente.saldo,
    }
  }
}
