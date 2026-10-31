import { describe, expect, it } from 'vitest'
import { EstadoDeuda } from 'shared-types'
import { DomainError } from '../errors/DomainError'
import { Deuda } from './Deuda'

function deuda(valor = 100_000, saldo = valor, estado = EstadoDeuda.PENDIENTE) {
  return new Deuda('d1', 'Tarjeta', valor, saldo, estado, '2026-10', new Date('2026-10-01T00:00:00Z'))
}

const MONTOS_INVALIDOS = [0, -1, -5_000, 1.5, Number.NaN, Number.POSITIVE_INFINITY]

describe('Deuda.pagar', () => {
  it('un pago parcial baja el saldo y deja la deuda En proceso', () => {
    const d = deuda(100_000)

    d.pagar(40_000)

    expect(d.saldo).toBe(60_000)
    expect(d.estado).toBe(EstadoDeuda.EN_PROCESO)
  })

  it('pagar todo el saldo deja la deuda Pagado', () => {
    const d = deuda(100_000)

    d.pagar(100_000)

    expect(d.saldo).toBe(0)
    expect(d.estado).toBe(EstadoDeuda.PAGADO)
  })

  it('rechaza un monto mayor que el saldo', () => {
    const d = deuda(100_000)

    expect(() => d.pagar(100_001)).toThrow(DomainError)
    expect(d.saldo).toBe(100_000)
  })

  it('rechaza pagar una deuda que ya está pagada', () => {
    const d = deuda(100_000, 0, EstadoDeuda.PAGADO)

    expect(() => d.pagar(1)).toThrow('La deuda ya está pagada')
  })

  it.each(MONTOS_INVALIDOS)('rechaza el monto %s y deja la deuda igual', monto => {
    const d = deuda(100_000)

    expect(() => d.pagar(monto)).toThrow(DomainError)
    expect(d.saldo).toBe(100_000)
    expect(d.estado).toBe(EstadoDeuda.PENDIENTE)
  })
})

describe('Deuda.actualizarSaldo', () => {
  it('el estado sigue al saldo: 0 es Pagado, parcial es En proceso, igual al valor es Pendiente', () => {
    const d = deuda(100_000)

    d.actualizarSaldo(0)
    expect(d.estado).toBe(EstadoDeuda.PAGADO)
    d.actualizarSaldo(30_000)
    expect(d.estado).toBe(EstadoDeuda.EN_PROCESO)
    d.actualizarSaldo(100_000)
    expect(d.estado).toBe(EstadoDeuda.PENDIENTE)
  })

  it('rechaza un saldo negativo', () => {
    expect(() => deuda().actualizarSaldo(-1)).toThrow(DomainError)
  })

  it('rechaza un saldo mayor que el valor', () => {
    expect(() => deuda(100_000).actualizarSaldo(100_001)).toThrow(DomainError)
  })
})

describe('Deuda — secuencias y estado', () => {
  it('varios pagos parciales hasta saldar la deuda la dejan Pagado', () => {
    const d = deuda(100_000)

    d.pagar(30_000)
    expect(d.estado).toBe(EstadoDeuda.EN_PROCESO)
    d.pagar(30_000)
    expect(d.saldo).toBe(40_000)
    d.pagar(40_000)

    expect(d.saldo).toBe(0)
    expect(d.estado).toBe(EstadoDeuda.PAGADO)
    expect(() => d.pagar(1)).toThrow('La deuda ya está pagada')
  })

  it('estaPendiente es verdadero salvo cuando la deuda está Pagado', () => {
    expect(deuda(100_000, 100_000, EstadoDeuda.PENDIENTE).estaPendiente).toBe(true)
    expect(deuda(100_000, 40_000, EstadoDeuda.EN_PROCESO).estaPendiente).toBe(true)
    expect(deuda(100_000, 0, EstadoDeuda.PAGADO).estaPendiente).toBe(false)
  })

  it('un saldo rechazado no modifica la deuda', () => {
    const d = deuda(100_000, 60_000, EstadoDeuda.EN_PROCESO)

    expect(() => d.actualizarSaldo(-1)).toThrow(DomainError)
    expect(() => d.actualizarSaldo(100_001)).toThrow(DomainError)

    expect(d.saldo).toBe(60_000)
    expect(d.estado).toBe(EstadoDeuda.EN_PROCESO)
  })

  it('actualizarSaldo con el valor exacto deja la deuda Pendiente', () => {
    const d = deuda(100_000, 60_000, EstadoDeuda.EN_PROCESO)

    d.actualizarSaldo(100_000)

    expect(d.estado).toBe(EstadoDeuda.PENDIENTE)
  })
})
