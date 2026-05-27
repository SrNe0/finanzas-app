export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} con id "${id}" no encontrado`)
    this.name = 'NotFoundError'
  }
}

export class InsufficientFundsError extends DomainError {
  constructor(fuente: string, monto: number, saldo: number) {
    super(`Fuente "${fuente}" no tiene saldo suficiente. Disponible: ${saldo}, requerido: ${monto}`)
    this.name = 'InsufficientFundsError'
  }
}
