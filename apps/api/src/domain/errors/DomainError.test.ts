import { describe, expect, it } from 'vitest'
import { DomainError, InsufficientFundsError, NotFoundError } from './DomainError'

describe('errores de dominio', () => {
  it('NotFoundError incluye la entidad y el id en el mensaje', () => {
    const error = new NotFoundError('Deuda', 'abc')

    expect(error.message).toBe('Deuda con id "abc" no encontrado')
    expect(error.name).toBe('NotFoundError')
  })

  it('InsufficientFundsError es un DomainError con el saldo y el monto requerido', () => {
    const error = new InsufficientFundsError('Efectivo', 5000, 1000)

    expect(error).toBeInstanceOf(DomainError)
    expect(error.message).toContain('Efectivo')
    expect(error.message).toContain('Disponible: 1000')
    expect(error.message).toContain('requerido: 5000')
  })
})
