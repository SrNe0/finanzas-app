import { describe, expect, it } from 'vitest'
import { TipoFuente } from 'shared-types'
import { DomainError, InsufficientFundsError } from '../errors/DomainError'
import { Fuente } from './Fuente'

function fuente(saldo = 10_000) {
  return new Fuente('f1', 'Cuenta', TipoFuente.CUENTA, saldo)
}

const MONTOS_INVALIDOS = [0, -1, -5_000, 1.5, Number.NaN, Number.POSITIVE_INFINITY]

describe('Fuente.depositar', () => {
  it('suma el monto al saldo', () => {
    const f = fuente(10_000)

    f.depositar(2_500)

    expect(f.saldo).toBe(12_500)
  })

  it.each(MONTOS_INVALIDOS)('rechaza el monto %s y deja el saldo igual', (monto) => {
    const f = fuente(10_000)

    expect(() => f.depositar(monto)).toThrow(DomainError)
    expect(f.saldo).toBe(10_000)
  })
})

describe('Fuente.debitar', () => {
  it('resta el monto del saldo', () => {
    const f = fuente(10_000)

    f.debitar(4_000)

    expect(f.saldo).toBe(6_000)
  })

  it('permite debitar todo el saldo', () => {
    const f = fuente(10_000)

    f.debitar(10_000)

    expect(f.saldo).toBe(0)
  })

  it('lanza InsufficientFundsError si el monto supera el saldo', () => {
    const f = fuente(1_000)

    expect(() => f.debitar(1_001)).toThrow(InsufficientFundsError)
    expect(f.saldo).toBe(1_000)
  })

  it.each(MONTOS_INVALIDOS)('rechaza el monto %s y deja el saldo igual', (monto) => {
    const f = fuente(10_000)

    expect(() => f.debitar(monto)).toThrow(DomainError)
    expect(f.saldo).toBe(10_000)
  })
})

describe('Fuente — secuencias', () => {
  it('conserva sus datos al construirse', () => {
    const f = new Fuente('f9', 'Bono comida', TipoFuente.BONO, 25_000)

    expect(f).toMatchObject({ id: 'f9', nombre: 'Bono comida', tipo: TipoFuente.BONO, saldo: 25_000 })
  })

  it('depositar y debitar se combinan sobre el mismo saldo', () => {
    const f = fuente(10_000)

    f.depositar(5_000)
    f.debitar(12_000)
    f.depositar(1_000)

    expect(f.saldo).toBe(4_000)
  })

  it('el mensaje de fondos insuficientes incluye la fuente, el saldo y el monto requerido', () => {
    const f = fuente(1_000)

    expect(() => f.debitar(5_000)).toThrow(/Cuenta.*1000.*5000/)
  })

  it('después de un débito rechazado se puede seguir operando', () => {
    const f = fuente(1_000)

    expect(() => f.debitar(2_000)).toThrow(InsufficientFundsError)
    f.debitar(1_000)

    expect(f.saldo).toBe(0)
  })
})
