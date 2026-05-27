import { PrismaClient } from '@prisma/client'
import { Deuda } from '../../domain/entities/Deuda'
import { IDeudaRepository } from '../../domain/repositories/IDeudaRepository'
import { DeudaMapper } from '../mappers/DeudaMapper'

export class PrismaDeudaRepository implements IDeudaRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Deuda | null> {
    const record = await this.prisma.deuda.findUnique({ where: { id } })
    return record ? DeudaMapper.toDomain(record as any) : null
  }

  async findByMes(mes: string): Promise<Deuda[]> {
    const records = await this.prisma.deuda.findMany({ where: { mes }, orderBy: { creadoEn: 'desc' } })
    return records.map(r => DeudaMapper.toDomain(r as any))
  }

  async findPendientesAnterioresA(mes: string): Promise<Deuda[]> {
    const records = await this.prisma.deuda.findMany({
      where: { mes: { lt: mes }, estado: { not: 'Pagado' } },
      orderBy: { mes: 'asc' },
    })
    return records.map(r => DeudaMapper.toDomain(r as any))
  }

  async save(deuda: Deuda): Promise<Deuda> {
    const record = await this.prisma.deuda.create({
      data: {
        nombre: deuda.nombre,
        valor: deuda.valor,
        saldo: deuda.saldo,
        estado: deuda.estado,
        mes: deuda.mes,
      },
    })
    return DeudaMapper.toDomain(record as any)
  }

  async update(deuda: Deuda): Promise<Deuda> {
    const record = await this.prisma.deuda.update({
      where: { id: deuda.id },
      data: { nombre: deuda.nombre, saldo: deuda.saldo, estado: deuda.estado },
    })
    return DeudaMapper.toDomain(record as any)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.deuda.delete({ where: { id } })
  }
}
