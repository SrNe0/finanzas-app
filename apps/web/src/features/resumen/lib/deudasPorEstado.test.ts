import { describe, expect, it } from 'vitest'
import type { DeudaDTO } from 'shared-types'
import { calcularDeudasPorEstado } from './deudasPorEstado'

function deuda(estado: string, valor: number, saldo: number): DeudaDTO {
  return {
    id: 'd',
    nombre: 'Deuda',
    valor,
    saldo,
    estado,
    mes: '2026-10',
    creadoEn: '2026-10-01T00:00:00.000Z',
  } as DeudaDTO
}

const suma = (porciones: { value: number }[]) => porciones.reduce((total, p) => total + p.value, 0)

describe('calcularDeudasPorEstado', () => {
  it('reparte el valor total: pendiente y en proceso por su saldo, pagado por lo abonado', () => {
    const porciones = calcularDeudasPorEstado([
      deuda('Pendiente', 100, 100),
      deuda('En proceso', 200, 50),
      deuda('Pagado', 300, 0),
    ])

    expect(porciones).toEqual([
      { name: 'Pendiente', value: 100 },
      { name: 'En proceso', value: 50 },
      { name: 'Pagado', value: 450 },
    ])
    expect(suma(porciones)).toBe(600)
  })

  it('un abono parcial aparece en Pagado y no desaparece de la torta', () => {
    const porciones = calcularDeudasPorEstado([deuda('En proceso', 60_000, 40_000)])

    expect(porciones).toEqual([
      { name: 'En proceso', value: 40_000 },
      { name: 'Pagado', value: 20_000 },
    ])
  })

  it('omite las porciones en cero', () => {
    expect(calcularDeudasPorEstado([deuda('Pendiente', 100, 100)])).toEqual([{ name: 'Pendiente', value: 100 }])
    expect(calcularDeudasPorEstado([deuda('Pagado', 100, 0)])).toEqual([{ name: 'Pagado', value: 100 }])
  })

  it('sin deudas no hay porciones', () => {
    expect(calcularDeudasPorEstado([])).toEqual([])
  })
})
