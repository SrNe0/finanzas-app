import { PrismaClient } from '@prisma/client'
import { Movimiento } from '../../domain/entities/Movimiento'
import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository'
import { MovimientoMapper } from '../mappers/MovimientoMapper'

export class PrismaMovimientoRepository implements IMovimientoRepository {
  constructor(private prisma: PrismaClient) {}

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
    const start = new Date(`${mes}-01T00:00:00.000Z`)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)
    const records = await this.prisma.movimiento.findMany({
      where: { fecha: { gte: start, lt: end } },
      orderBy: { fecha: 'desc' },
    })
    return records.map(r => MovimientoMapper.toDomain(r as any))
  }
}
