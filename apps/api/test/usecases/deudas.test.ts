import { beforeEach, describe, expect, it } from 'vitest'
import { EstadoDeuda, TipoMovimiento } from 'shared-types'
import { DomainError, InsufficientFundsError, NotFoundError } from '../../src/domain/errors/DomainError'
import { CrearDeudaUseCase } from '../../src/application/usecases/deudas/CrearDeudaUseCase'
import { ListarDeudasPorMesUseCase } from '../../src/application/usecases/deudas/ListarDeudasPorMesUseCase'
import { PagarDeudaUseCase } from '../../src/application/usecases/deudas/PagarDeudaUseCase'
import { ActualizarSaldoDeudaUseCase } from '../../src/application/usecases/deudas/ActualizarSaldoDeudaUseCase'
import { EliminarDeudaUseCase } from '../../src/application/usecases/deudas/EliminarDeudaUseCase'
import { crearMemoria, Memoria } from '../helpers/memoria'

let m: Memoria

beforeEach(() => {
  m = crearMemoria()
})

describe('CrearDeuda', () => {
  it('crea la deuda Pendiente con el saldo igual al valor', async () => {
    const dto = await new CrearDeudaUseCase(m.repos.deudas).execute({
      nombre: 'Tarjeta',
      valor: 100_000,
      mes: '2026-10',
    })

    expect(dto).toMatchObject({
      nombre: 'Tarjeta',
      valor: 100_000,
      saldo: 100_000,
      estado: EstadoDeuda.PENDIENTE,
      mes: '2026-10',
    })
    expect(m.datos.deudas.get(dto.id)).toBeDefined()
  })
})

describe('ListarDeudasPorMes', () => {
  it('separa las deudas del mes de las arrastradas pendientes de meses anteriores', async () => {
    const delMes = m.agregarDeuda(100, 100, EstadoDeuda.PENDIENTE, '2026-10')
    const arrastrada = m.agregarDeuda(500, 200, EstadoDeuda.EN_PROCESO, '2026-08')
    m.agregarDeuda(300, 0, EstadoDeuda.PAGADO, '2026-07') // pagada: no se arrastra
    m.agregarDeuda(400, 400, EstadoDeuda.PENDIENTE, '2026-11') // futura: no se arrastra

    const resultado = await new ListarDeudasPorMesUseCase(m.repos.deudas).execute('2026-10')

    expect(resultado.delMes.map(d => d.id)).toEqual([delMes.id])
    expect(resultado.arrastradas.map(d => d.id)).toEqual([arrastrada.id])
  })

  it('sin deudas devuelve listas vacías', async () => {
    expect(await new ListarDeudasPorMesUseCase(m.repos.deudas).execute('2026-10')).toEqual({
      delMes: [],
      arrastradas: [],
    })
  })
})

describe('PagarDeuda', () => {
  it('un pago parcial debita la fuente, baja el saldo y registra el movimiento', async () => {
    const fuente = m.agregarFuente('Cuenta', 150_000)
    const deuda = m.agregarDeuda(100_000)

    const resultado = await new PagarDeudaUseCase(m.uow).execute({
      deudaId: deuda.id,
      fuenteId: fuente.id,
      monto: 40_000,
    })

    expect(resultado.deuda).toMatchObject({ saldo: 60_000, estado: EstadoDeuda.EN_PROCESO })
    expect(resultado.fuente.saldo).toBe(110_000)
    const movimientos = [...m.datos.movimientos.values()]
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0]).toMatchObject({
      tipo: TipoMovimiento.PAGO_DEUDA,
      monto: 40_000,
      fuenteId: fuente.id,
      deudaId: deuda.id,
    })
  })

  it('sin monto paga todo el saldo pendiente', async () => {
    const fuente = m.agregarFuente('Cuenta', 150_000)
    const deuda = m.agregarDeuda(100_000, 70_000, EstadoDeuda.EN_PROCESO)

    const resultado = await new PagarDeudaUseCase(m.uow).execute({ deudaId: deuda.id, fuenteId: fuente.id })

    expect(resultado.deuda).toMatchObject({ saldo: 0, estado: EstadoDeuda.PAGADO })
    expect(resultado.fuente.saldo).toBe(80_000)
  })

  it('lanza NotFoundError si la deuda o la fuente no existen', async () => {
    const fuente = m.agregarFuente('Cuenta', 1_000)
    const deuda = m.agregarDeuda(100)
    const caso = new PagarDeudaUseCase(m.uow)

    await expect(caso.execute({ deudaId: 'no-existe', fuenteId: fuente.id })).rejects.toBeInstanceOf(NotFoundError)
    await expect(caso.execute({ deudaId: deuda.id, fuenteId: 'no-existe' })).rejects.toBeInstanceOf(NotFoundError)
  })

  it('con fondos insuficientes lanza InsufficientFundsError y no cambia nada', async () => {
    const fuente = m.agregarFuente('Cuenta', 10_000)
    const deuda = m.agregarDeuda(100_000)

    await expect(
      new PagarDeudaUseCase(m.uow).execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 50_000 })
    ).rejects.toBeInstanceOf(InsufficientFundsError)

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(10_000)
    expect(m.datos.deudas.get(deuda.id)?.saldo).toBe(100_000)
    expect(m.datos.movimientos.size).toBe(0)
  })

  it('un monto mayor que el saldo o una deuda ya pagada lanzan DomainError', async () => {
    const fuente = m.agregarFuente('Cuenta', 1_000_000)
    const deuda = m.agregarDeuda(100_000)
    const pagada = m.agregarDeuda(100_000, 0, EstadoDeuda.PAGADO)
    const caso = new PagarDeudaUseCase(m.uow)

    await expect(caso.execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 100_001 })).rejects.toBeInstanceOf(
      DomainError
    )
    await expect(caso.execute({ deudaId: pagada.id, fuenteId: fuente.id })).rejects.toBeInstanceOf(DomainError)
    expect(m.datos.movimientos.size).toBe(0)
  })
})

describe('ActualizarSaldoDeuda', () => {
  it('cambia solo el nombre sin tocar el saldo ni las fuentes', async () => {
    const fuente = m.agregarFuente('Cuenta', 5_000)
    const deuda = m.agregarDeuda(100_000)

    const { deuda: dto } = await new ActualizarSaldoDeudaUseCase(m.uow).execute({ deudaId: deuda.id, nombre: 'Visa' })

    expect(dto).toMatchObject({ nombre: 'Visa', saldo: 100_000, estado: EstadoDeuda.PENDIENTE })
    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(5_000)
  })

  it('un pago parcial con fuente devuelve la fuente actualizada', async () => {
    const fuente = m.agregarFuente('Cuenta', 80_000)
    const deuda = m.agregarDeuda(100_000)

    const resultado = await new ActualizarSaldoDeudaUseCase(m.uow).execute({
      deudaId: deuda.id,
      nuevoSaldo: 70_000,
      fuenteId: fuente.id,
    })

    expect(resultado.deuda).toMatchObject({ saldo: 70_000, estado: EstadoDeuda.EN_PROCESO })
    expect(resultado.fuente?.saldo).toBe(50_000)
  })

  it('subir el saldo con una fuente no mueve dinero', async () => {
    const fuente = m.agregarFuente('Cuenta', 80_000)
    const deuda = m.agregarDeuda(100_000, 50_000, EstadoDeuda.EN_PROCESO)

    await new ActualizarSaldoDeudaUseCase(m.uow).execute({ deudaId: deuda.id, nuevoSaldo: 90_000, fuenteId: fuente.id })

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(80_000)
    expect(m.datos.movimientos.size).toBe(0)
  })

  it('lanza NotFoundError si la deuda o la fuente no existen', async () => {
    const deuda = m.agregarDeuda(100_000)
    const caso = new ActualizarSaldoDeudaUseCase(m.uow)

    await expect(caso.execute({ deudaId: 'no-existe', nombre: 'x' })).rejects.toBeInstanceOf(NotFoundError)
    await expect(caso.execute({ deudaId: deuda.id, nuevoSaldo: 10, fuenteId: 'no-existe' })).rejects.toBeInstanceOf(
      NotFoundError
    )
  })
})

describe('EliminarDeuda', () => {
  it('lanza NotFoundError si la deuda no existe', async () => {
    await expect(new EliminarDeudaUseCase(m.uow).execute('no-existe')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('devuelve los abonos a su fuente y elimina la deuda y sus pagos', async () => {
    const fuente = m.agregarFuente('Cuenta', 100_000)
    const deuda = m.agregarDeuda(100_000)
    await new PagarDeudaUseCase(m.uow).execute({ deudaId: deuda.id, fuenteId: fuente.id, monto: 30_000 })

    await new EliminarDeudaUseCase(m.uow).execute(deuda.id)

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(100_000)
    expect(m.datos.deudas.size).toBe(0)
    expect(m.datos.movimientos.size).toBe(0)
  })
})
