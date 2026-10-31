import { beforeEach, describe, expect, it } from 'vitest'
import { EstadoDeuda, TipoMovimiento } from 'shared-types'
import { Gasto } from '../../src/domain/entities/Gasto'
import { ObtenerResumenMensualUseCase } from '../../src/application/usecases/resumen/ObtenerResumenMensualUseCase'
import { crearMemoria, Memoria } from '../helpers/memoria'

let m: Memoria
let obtener: ObtenerResumenMensualUseCase

beforeEach(() => {
  m = crearMemoria()
  obtener = new ObtenerResumenMensualUseCase(m.repos.deudas, m.repos.gastos, m.repos.fuentes, m.repos.movimientos)
})

// Mediodía en Bogotá (UTC-5) de un día de octubre de 2026
const octubre = (dia: number) => new Date(`2026-10-${String(dia).padStart(2, '0')}T12:00:00-05:00`)

describe('ObtenerResumenMensual', () => {
  it('sin datos devuelve todo en cero', async () => {
    const resumen = await obtener.execute('2026-10')

    expect(resumen).toMatchObject({
      mes: '2026-10',
      totalIngresos: 0,
      totalDeudas: 0,
      totalDeudasPagadas: 0,
      totalPagosDeuda: 0,
      totalGastos: 0,
      totalDisponible: 0,
      deudas: [],
      gastos: [],
      ultimosMovimientos: [],
    })
  })

  it('calcula los totales del mes', async () => {
    const fuente = m.agregarFuente('Cuenta', 70_000)
    m.agregarFuente('Efectivo', 30_000)
    m.agregarDeuda(100_000, 0, EstadoDeuda.PAGADO)
    m.agregarDeuda(200_000, 50_000, EstadoDeuda.EN_PROCESO)
    m.agregarMovimiento({ tipo: TipoMovimiento.INGRESO, monto: 500_000, fuenteId: fuente.id, fecha: octubre(2) })
    m.agregarMovimiento({ tipo: TipoMovimiento.INGRESO, monto: 100_000, fuenteId: fuente.id, fecha: octubre(10) })
    m.agregarMovimiento({ tipo: TipoMovimiento.PAGO_DEUDA, monto: 250_000, fuenteId: fuente.id, fecha: octubre(11) })
    m.agregarMovimiento({ tipo: TipoMovimiento.GASTO, monto: 20_000, fuenteId: fuente.id, fecha: octubre(12) })
    m.datos.gastos.set('g1', new Gasto('g1', 'Mercado', 'Alimentación', 20_000, '2026-10', fuente.id, octubre(12)))
    m.datos.gastos.set('g2', new Gasto('g2', 'Bus', 'Transporte', 5_000, '2026-10', null, octubre(13)))

    const resumen = await obtener.execute('2026-10')

    expect(resumen.totalIngresos).toBe(600_000)
    expect(resumen.totalPagosDeuda).toBe(250_000)
    expect(resumen.totalDeudas).toBe(300_000)
    expect(resumen.totalDeudasPagadas).toBe(250_000)
    expect(resumen.totalGastos).toBe(25_000)
    expect(resumen.totalDisponible).toBe(100_000)
  })

  it('no mezcla los datos de otros meses', async () => {
    const fuente = m.agregarFuente('Cuenta', 0)
    m.agregarDeuda(100_000, 100_000, EstadoDeuda.PENDIENTE, '2026-09')
    m.agregarMovimiento({ tipo: TipoMovimiento.INGRESO, monto: 999, fuenteId: fuente.id, fecha: new Date('2026-09-15T12:00:00-05:00') })
    m.datos.gastos.set('g1', new Gasto('g1', 'Viejo', 'Otro', 777, '2026-09', null, new Date('2026-09-15T12:00:00-05:00')))

    const resumen = await obtener.execute('2026-10')

    expect(resumen).toMatchObject({ totalDeudas: 0, totalIngresos: 0, totalGastos: 0 })
    expect(resumen.ultimosMovimientos).toEqual([])
  })

  it('un movimiento hecho el 31 a las 9 p. m. en Bogotá cuenta en ese mes', async () => {
    const fuente = m.agregarFuente('Cuenta', 0)
    m.agregarMovimiento({ tipo: TipoMovimiento.INGRESO, monto: 1_000, fuenteId: fuente.id, fecha: new Date('2026-10-31T21:00:00-05:00') })

    expect((await obtener.execute('2026-10')).totalIngresos).toBe(1_000)
    expect((await obtener.execute('2026-11')).totalIngresos).toBe(0)
  })

  it('los últimos movimientos son 10, del más reciente al más antiguo', async () => {
    const fuente = m.agregarFuente('Cuenta', 0)
    for (let dia = 1; dia <= 12; dia++) {
      m.agregarMovimiento({ tipo: TipoMovimiento.INGRESO, monto: dia, fuenteId: fuente.id, fecha: octubre(dia) })
    }

    const resumen = await obtener.execute('2026-10')

    expect(resumen.ultimosMovimientos).toHaveLength(10)
    expect(resumen.ultimosMovimientos.map((x) => x.monto)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3])
  })
})
