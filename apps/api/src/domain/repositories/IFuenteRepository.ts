import { Fuente } from '../entities/Fuente'

export interface IFuenteRepository {
  findById(id: string): Promise<Fuente | null>
  findAll(): Promise<Fuente[]>
  save(fuente: Fuente): Promise<Fuente>
  update(fuente: Fuente): Promise<Fuente>
}
