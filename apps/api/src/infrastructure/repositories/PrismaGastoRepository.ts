import { PrismaClient } from '@prisma/client'
import { Gasto } from '../../domain/entities/Gasto'
import { IGastoRepository } from '../../domain/repositories/IGastoRepository'
import { GastoMapper } from '../mappers/GastoMapper'

export class PrismaGastoRepository implements IGastoRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Gasto | null> {
    const record = await this.prisma.gasto.findUnique({ where: { id } })
    return record ? GastoMapper.toDomain(record as any) : null
  }

  async findByMes(mes: string): Promise<Gasto[]> {
    const records = await this.prisma.gasto.findMany({ where: { mes }, orderBy: { fecha: 'desc' } })
    return records.map(r => GastoMapper.toDomain(r as any))
  }

  async save(gasto: Gasto): Promise<Gasto> {
    const record = await this.prisma.gasto.create({
      data: {
        descripcion: gasto.descripcion,
        categoria: gasto.categoria,
        monto: gasto.monto,
        mes: gasto.mes,
        fuenteId: gasto.fuenteId,
        fecha: gasto.fecha,
      },
    })
    return GastoMapper.toDomain(record as any)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.gasto.delete({ where: { id } })
  }
}
