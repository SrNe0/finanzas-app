import { EstadoDeuda } from 'shared-types'
import { DomainError } from '../errors/DomainError'

export class Deuda {
  constructor(
    public readonly id: string,
    public nombre: string,
    public valor: number,
    public saldo: number,
    public estado: EstadoDeuda,
    public mes: string,
    public readonly creadoEn: Date
  ) {}

  pagar(monto: number): void {
    if (this.saldo === 0) throw new DomainError('La deuda ya está pagada')
    if (monto > this.saldo) throw new DomainError('Monto supera el saldo')
    this.saldo -= monto
    this.estado = this.saldo === 0 ? EstadoDeuda.PAGADO : EstadoDeuda.EN_PROCESO
  }

  actualizarSaldo(nuevoSaldo: number): void {
    if (nuevoSaldo < 0) throw new DomainError('Saldo no puede ser negativo')
    if (nuevoSaldo > this.valor) throw new DomainError('El saldo no puede superar el valor de la deuda')
    this.saldo = nuevoSaldo
    if (nuevoSaldo === 0) this.estado = EstadoDeuda.PAGADO
    else if (nuevoSaldo < this.valor) this.estado = EstadoDeuda.EN_PROCESO
    else this.estado = EstadoDeuda.PENDIENTE
  }

  get estaPendiente(): boolean {
    return this.estado !== EstadoDeuda.PAGADO
  }
}
