import { PrismaClient } from '@prisma/client'
import { Fuente } from '../../domain/entities/Fuente'
import { IFuenteRepository } from '../../domain/repositories/IFuenteRepository'
import { FuenteMapper } from '../mappers/FuenteMapper'

export class PrismaFuenteRepository implements IFuenteRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Fuente | null> {
    const record = await this.prisma.fuente.findUnique({ where: { id } })
    return record ? FuenteMapper.toDomain(record as any) : null
  }

  async findAll(): Promise<Fuente[]> {
    const records = await this.prisma.fuente.findMany({ orderBy: { nombre: 'asc' } })
    return records.map(r => FuenteMapper.toDomain(r as any))
  }

  async save(fuente: Fuente): Promise<Fuente> {
    const record = await this.prisma.fuente.create({
      data: { nombre: fuente.nombre, tipo: fuente.tipo, saldo: fuente.saldo },
    })
    return FuenteMapper.toDomain(record as any)
  }

  async update(fuente: Fuente): Promise<Fuente> {
    const record = await this.prisma.fuente.update({
      where: { id: fuente.id },
      data: { nombre: fuente.nombre, saldo: fuente.saldo },
    })
    return FuenteMapper.toDomain(record as any)
  }
}
