import { TipoFuente } from 'shared-types'
import { InsufficientFundsError } from '../errors/DomainError'

export class Fuente {
  constructor(
    public readonly id: string,
    public nombre: string,
    public tipo: TipoFuente,
    public saldo: number
  ) {}

  depositar(monto: number): void {
    this.saldo += monto
  }

  debitar(monto: number): void {
    if (monto > this.saldo) throw new InsufficientFundsError(this.nombre, monto, this.saldo)
    this.saldo -= monto
  }
}
