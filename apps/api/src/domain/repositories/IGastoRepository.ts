import { Gasto } from '../entities/Gasto'

export interface IGastoRepository {
  findById(id: string): Promise<Gasto | null>
  findByMes(mes: string): Promise<Gasto[]>
  save(gasto: Gasto): Promise<Gasto>
  delete(id: string): Promise<void>
}
