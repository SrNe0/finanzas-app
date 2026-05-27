import { TipoMovimiento } from 'shared-types'

export class Movimiento {
  constructor(
    public readonly id: string | null,
    public tipo: TipoMovimiento,
    public fuenteId: string | null,
    public deudaId: string | null,
    public descripcion: string | null,
    public monto: number,
    public fecha: Date
  ) {}
}
