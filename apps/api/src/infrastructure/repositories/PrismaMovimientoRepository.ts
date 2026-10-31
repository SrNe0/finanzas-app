import { PrismaClient, Prisma } from '@prisma/client'
import { Movimiento } from '../../domain/entities/Movimiento'
import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository'
import { MovimientoMapper } from '../mappers/MovimientoMapper'

// Colombia (America/Bogota) no tiene horario de verano: el offset fijo -05:00 es válido.
const OFFSET_BOGOTA = '-05:00'

function rangoDelMes(mes: string): { start: Date; end: Date } {
  const [anio, numeroMes] = mes.split('-').map(Number)
  const siguiente = numeroMes === 12 ? `${anio + 1}-01` : `${anio}-${String(numeroMes + 1).padStart(2, '0')}`
  return {
    start: new Date(`${mes}-01T00:00:00.000${OFFSET_BOGOTA}`),
    end: new Date(`${siguiente}-01T00:00:00.000${OFFSET_BOGOTA}`),
  }
}

export class PrismaMovimientoRepository implements IMovimientoRepository {
  constructor(private prisma: PrismaClient | Prisma.TransactionClient) {}

  async save(movimiento: Movimiento): Promise<Movimiento> {
    const record = await this.prisma.movimiento.create({
      data: {
        tipo: movimiento.tipo,
        fuenteId: movimiento.fuenteId,
        deudaId: movimiento.deudaId,
        descripcion: movimiento.descripcion,
        monto: movimiento.monto,
        fecha: movimiento.fecha,
      },
    })
    return MovimientoMapper.toDomain(record as any)
  }

  async findByFuenteId(fuenteId: string): Promise<Movimiento[]> {
    const records = await this.prisma.movimiento.findMany({
      where: { fuenteId },
      orderBy: { fecha: 'desc' },
    })
    return records.map(r => MovimientoMapper.toDomain(r as any))
  }

  async findByMes(mes: string): Promise<Movimiento[]> {
    const { start, end } = rangoDelMes(mes)
    const records = await this.prisma.movimiento.findMany({
      where: { fecha: { gte: start, lt: end } },
      orderBy: { fecha: 'desc' },
    })
    return records.map(r => MovimientoMapper.toDomain(r as any))
  }
}
