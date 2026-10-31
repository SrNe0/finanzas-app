import type { DeudaDTO } from 'shared-types'

export type EstadoPorcion = 'Pendiente' | 'En proceso' | 'Pagado'

export interface PorcionDeudas {
  name: EstadoPorcion
  value: number
}

/**
 * Reparte el valor total de las deudas en tres porciones:
 * - Pendiente / En proceso: lo que aún se debe (saldo) de las deudas en ese estado.
 * - Pagado: lo ya abonado (valor - saldo) de todas las deudas, incluidos los abonos parciales.
 * La suma de las porciones es el valor total de las deudas.
 */
export function calcularDeudasPorEstado(deudas: DeudaDTO[]): PorcionDeudas[] {
  const saldoEn = (estado: string) =>
    deudas.filter(d => d.estado === estado).reduce((suma, d) => suma + d.saldo, 0)

  const porciones: PorcionDeudas[] = [
    { name: 'Pendiente', value: saldoEn('Pendiente') },
    { name: 'En proceso', value: saldoEn('En proceso') },
    { name: 'Pagado', value: deudas.reduce((suma, d) => suma + (d.valor - d.saldo), 0) },
  ]

  return porciones.filter(p => p.value > 0)
}
