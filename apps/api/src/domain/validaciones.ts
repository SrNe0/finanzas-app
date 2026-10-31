import { DomainError } from './errors/DomainError'

/** Los montos son pesos colombianos enteros y positivos. */
export function validarMonto(monto: number): void {
  if (!Number.isInteger(monto) || monto <= 0) {
    throw new DomainError('El monto debe ser un número entero positivo')
  }
}
