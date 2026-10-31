import { beforeEach, describe, expect, it } from 'vitest'
import { TipoMovimiento } from 'shared-types'
import { InsufficientFundsError, NotFoundError } from '../../src/domain/errors/DomainError'
import { RegistrarGastoUseCase } from '../../src/application/usecases/gastos/RegistrarGastoUseCase'
import { EliminarGastoUseCase } from '../../src/application/usecases/gastos/EliminarGastoUseCase'
import { ListarGastosPorMesUseCase } from '../../src/application/usecases/gastos/ListarGastosPorMesUseCase'
import { crearMemoria, Memoria } from '../helpers/memoria'

let m: Memoria

beforeEach(() => {
  m = crearMemoria()
})

const gasto = { descripcion: 'Mercado', categoria: 'Alimentación', monto: 20_000, mes: '2026-10' }

describe('RegistrarGasto', () => {
  it('con fuente la debita y registra un movimiento enlazado al gasto', async () => {
    const fuente = m.agregarFuente('Cuenta', 50_000)

    const dto = await new RegistrarGastoUseCase(m.uow).execute({ ...gasto, fuenteId: fuente.id })

    expect(dto).toMatchObject({ ...gasto, fuenteId: fuente.id })
    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(30_000)
    const movimientos = [...m.datos.movimientos.values()]
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0]).toMatchObject({
      tipo: TipoMovimiento.GASTO,
      monto: 20_000,
      fuenteId: fuente.id,
      gastoId: dto.id,
    })
  })

  it('sin fuente solo guarda el gasto', async () => {
    const fuente = m.agregarFuente('Cuenta', 50_000)

    const dto = await new RegistrarGastoUseCase(m.uow).execute(gasto)

    expect(dto.fuenteId).toBeNull()
    expect(m.datos.gastos.size).toBe(1)
    expect(m.datos.movimientos.size).toBe(0)
    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(50_000)
  })

  it('lanza NotFoundError si la fuente no existe', async () => {
    await expect(new RegistrarGastoUseCase(m.uow).execute({ ...gasto, fuenteId: 'no-existe' })).rejects.toBeInstanceOf(
      NotFoundError
    )
    expect(m.datos.gastos.size).toBe(0)
  })

  it('con fondos insuficientes no guarda el gasto ni toca la fuente', async () => {
    const fuente = m.agregarFuente('Cuenta', 5_000)

    await expect(new RegistrarGastoUseCase(m.uow).execute({ ...gasto, fuenteId: fuente.id })).rejects.toBeInstanceOf(
      InsufficientFundsError
    )

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(5_000)
    expect(m.datos.gastos.size).toBe(0)
    expect(m.datos.movimientos.size).toBe(0)
  })
})

describe('ListarGastosPorMes', () => {
  it('devuelve solo los gastos del mes', async () => {
    const registrar = new RegistrarGastoUseCase(m.uow)
    await registrar.execute({ ...gasto, mes: '2026-10' })
    await registrar.execute({ ...gasto, mes: '2026-10', descripcion: 'Otro' })
    await registrar.execute({ ...gasto, mes: '2026-09' })

    const lista = await new ListarGastosPorMesUseCase(m.repos.gastos).execute('2026-10')

    expect(lista).toHaveLength(2)
    expect(lista.every(g => g.mes === '2026-10')).toBe(true)
  })
})

describe('EliminarGasto', () => {
  it('devuelve el monto a la fuente y elimina el gasto y su movimiento', async () => {
    const fuente = m.agregarFuente('Cuenta', 50_000)
    const dto = await new RegistrarGastoUseCase(m.uow).execute({ ...gasto, fuenteId: fuente.id })

    await new EliminarGastoUseCase(m.uow).execute(dto.id)

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(50_000)
    expect(m.datos.gastos.size).toBe(0)
    expect(m.datos.movimientos.size).toBe(0)
  })

  it('un gasto sin fuente se elimina sin tocar ninguna fuente', async () => {
    const fuente = m.agregarFuente('Cuenta', 50_000)
    const dto = await new RegistrarGastoUseCase(m.uow).execute(gasto)

    await new EliminarGastoUseCase(m.uow).execute(dto.id)

    expect(m.datos.gastos.size).toBe(0)
    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(50_000)
  })

  it('lanza NotFoundError si el gasto no existe', async () => {
    await expect(new EliminarGastoUseCase(m.uow).execute('no-existe')).rejects.toBeInstanceOf(NotFoundError)
  })
})
