import { Deuda } from '../entities/Deuda'

export interface IDeudaRepository {
  findById(id: string): Promise<Deuda | null>
  findByMes(mes: string): Promise<Deuda[]>
  findPendientesAnterioresA(mes: string): Promise<Deuda[]>
  save(deuda: Deuda): Promise<Deuda>
  update(deuda: Deuda): Promise<Deuda>
  delete(id: string): Promise<void>
}
