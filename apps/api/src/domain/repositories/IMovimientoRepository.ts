import { Movimiento } from '../entities/Movimiento'

export interface IMovimientoRepository {
  save(movimiento: Movimiento): Promise<Movimiento>
  findByFuenteId(fuenteId: string): Promise<Movimiento[]>
  findByGastoId(gastoId: string): Promise<Movimiento | null>
  findByMes(mes: string): Promise<Movimiento[]>
  delete(id: string): Promise<void>
}
