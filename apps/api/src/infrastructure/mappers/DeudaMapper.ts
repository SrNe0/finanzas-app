import { Deuda } from '../../domain/entities/Deuda'
import { EstadoDeuda, DeudaDTO } from 'shared-types'

type PrismaDeuda = {
  id: string
  nombre: string
  valor: number
  saldo: number
  estado: string
  mes: string
  creadoEn: Date
}

export class DeudaMapper {
  static toDomain(record: PrismaDeuda): Deuda {
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

  static toDTO(deuda: Deuda): DeudaDTO {
    return {
      id: deuda.id,
      nombre: deuda.nombre,
      valor: deuda.valor,
      saldo: deuda.saldo,
      estado: deuda.estado,
      mes: deuda.mes,
      creadoEn: deuda.creadoEn.toISOString(),
    }
  }
}
