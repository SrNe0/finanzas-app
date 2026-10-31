import { TipoFuente } from 'shared-types'
import { InsufficientFundsError } from '../errors/DomainError'
import { validarMonto } from '../validaciones'

export class Fuente {
  constructor(
    public readonly id: string,
    public nombre: string,
    public tipo: TipoFuente,
    public saldo: number
  ) {}

  depositar(monto: number): void {
    validarMonto(monto)
    this.saldo += monto
  }

  debitar(monto: number): void {
    validarMonto(monto)
    if (monto > this.saldo) throw new InsufficientFundsError(this.nombre, monto, this.saldo)
    this.saldo -= monto
  }
}
