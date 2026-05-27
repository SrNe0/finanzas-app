import { Movimiento } from '../entities/Movimiento'

export interface IMovimientoRepository {
  save(movimiento: Movimiento): Promise<Movimiento>
  findByFuenteId(fuenteId: string): Promise<Movimiento[]>
  findByMes(mes: string): Promise<Movimiento[]>
}
