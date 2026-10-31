import { beforeEach, describe, expect, it } from 'vitest'
import { TipoFuente, TipoMovimiento } from 'shared-types'
import { DomainError, InsufficientFundsError, NotFoundError } from '../../src/domain/errors/DomainError'
import { CrearFuenteUseCase } from '../../src/application/usecases/fuentes/CrearFuenteUseCase'
import { ListarFuentesUseCase } from '../../src/application/usecases/fuentes/ListarFuentesUseCase'
import { RegistrarIngresoUseCase } from '../../src/application/usecases/fuentes/RegistrarIngresoUseCase'
import { ObtenerHistorialFuenteUseCase } from '../../src/application/usecases/fuentes/ObtenerHistorialFuenteUseCase'
import { TransferirFuentesUseCase } from '../../src/application/usecases/fuentes/TransferirFuentesUseCase'
import { crearMemoria, Memoria } from '../helpers/memoria'

let m: Memoria

beforeEach(() => {
  m = crearMemoria()
})

describe('CrearFuente y ListarFuentes', () => {
  it('crea la fuente con saldo 0', async () => {
    const dto = await new CrearFuenteUseCase(m.repos.fuentes).execute({ nombre: 'Efectivo', tipo: TipoFuente.EFECTIVO })

    expect(dto).toMatchObject({ nombre: 'Efectivo', tipo: TipoFuente.EFECTIVO, saldo: 0 })
  })

  it('lista las fuentes ordenadas por nombre', async () => {
    m.agregarFuente('Zeta', 1)
    m.agregarFuente('Alfa', 2)
    m.agregarFuente('Medio', 3)

    const lista = await new ListarFuentesUseCase(m.repos.fuentes).execute()

    expect(lista.map((f) => f.nombre)).toEqual(['Alfa', 'Medio', 'Zeta'])
  })
})

describe('RegistrarIngreso', () => {
  it('suma el monto a la fuente y registra el movimiento con su descripción', async () => {
    const fuente = m.agregarFuente('Cuenta', 10_000)

    const resultado = await new RegistrarIngresoUseCase(m.uow).execute(fuente.id, { monto: 500_000, descripcion: 'Quincena' })

    expect(resultado.fuente.saldo).toBe(510_000)
    expect(resultado.movimiento).toMatchObject({ tipo: TipoMovimiento.INGRESO, monto: 500_000, descripcion: 'Quincena', fuenteId: fuente.id })
  })

  it('sin descripción guarda el movimiento con descripción nula', async () => {
    const fuente = m.agregarFuente('Cuenta', 0)

    const resultado = await new RegistrarIngresoUseCase(m.uow).execute(fuente.id, { monto: 1_000 })

    expect(resultado.movimiento.descripcion).toBeNull()
  })

  it('lanza NotFoundError si la fuente no existe', async () => {
    await expect(new RegistrarIngresoUseCase(m.uow).execute('no-existe', { monto: 1_000 })).rejects.toBeInstanceOf(NotFoundError)
  })

  it('rechaza un monto inválido y no deja movimientos', async () => {
    const fuente = m.agregarFuente('Cuenta', 10_000)

    await expect(new RegistrarIngresoUseCase(m.uow).execute(fuente.id, { monto: -5 })).rejects.toBeInstanceOf(DomainError)

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(10_000)
    expect(m.datos.movimientos.size).toBe(0)
  })
})

describe('ObtenerHistorialFuente', () => {
  it('devuelve solo los movimientos de esa fuente, del más reciente al más antiguo', async () => {
    const a = m.agregarFuente('A', 0)
    const b = m.agregarFuente('B', 0)
    m.agregarMovimiento({ tipo: TipoMovimiento.INGRESO, monto: 1, fuenteId: a.id, fecha: new Date('2026-10-01T12:00:00Z') })
    m.agregarMovimiento({ tipo: TipoMovimiento.INGRESO, monto: 2, fuenteId: a.id, fecha: new Date('2026-10-05T12:00:00Z') })
    m.agregarMovimiento({ tipo: TipoMovimiento.INGRESO, monto: 3, fuenteId: b.id })

    const historial = await new ObtenerHistorialFuenteUseCase(m.repos.movimientos).execute(a.id)

    expect(historial.map((h) => h.monto)).toEqual([2, 1])
  })
})

describe('TransferirFuentes', () => {
  it('mueve el dinero y registra una salida y una entrada con la descripción por defecto', async () => {
    const origen = m.agregarFuente('Cuenta', 100_000)
    const destino = m.agregarFuente('Efectivo', 5_000)

    const resultado = await new TransferirFuentesUseCase(m.uow).execute({ origenId: origen.id, destinoId: destino.id, monto: 30_000 })

    expect(resultado.origen.saldo).toBe(70_000)
    expect(resultado.destino.saldo).toBe(35_000)
    const movimientos = [...m.datos.movimientos.values()]
    expect(movimientos.map((x) => x.tipo).sort()).toEqual([TipoMovimiento.TRANSFERENCIA_ENTRADA, TipoMovimiento.TRANSFERENCIA_SALIDA])
    expect(movimientos.every((x) => x.descripcion?.startsWith('Transferencia Cuenta → Efectivo'))).toBe(true)
  })

  it('usa la descripción indicada', async () => {
    const origen = m.agregarFuente('Cuenta', 100_000)
    const destino = m.agregarFuente('Efectivo', 0)

    await new TransferirFuentesUseCase(m.uow).execute({ origenId: origen.id, destinoId: destino.id, monto: 1_000, descripcion: 'Retiro' })

    expect([...m.datos.movimientos.values()].map((x) => x.descripcion).sort()).toEqual(['Retiro (entrada)', 'Retiro (salida)'])
  })

  it('rechaza transferir a la misma fuente', async () => {
    const fuente = m.agregarFuente('Cuenta', 100_000)

    await expect(
      new TransferirFuentesUseCase(m.uow).execute({ origenId: fuente.id, destinoId: fuente.id, monto: 1_000 })
    ).rejects.toBeInstanceOf(DomainError)
  })

  it('lanza NotFoundError si el origen o el destino no existen', async () => {
    const fuente = m.agregarFuente('Cuenta', 100_000)
    const caso = new TransferirFuentesUseCase(m.uow)

    await expect(caso.execute({ origenId: 'no-existe', destinoId: fuente.id, monto: 1 })).rejects.toBeInstanceOf(NotFoundError)
    await expect(caso.execute({ origenId: fuente.id, destinoId: 'no-existe', monto: 1 })).rejects.toBeInstanceOf(NotFoundError)
  })

  it('con fondos insuficientes no cambia ningún saldo ni registra movimientos', async () => {
    const origen = m.agregarFuente('Cuenta', 1_000)
    const destino = m.agregarFuente('Efectivo', 0)

    await expect(
      new TransferirFuentesUseCase(m.uow).execute({ origenId: origen.id, destinoId: destino.id, monto: 5_000 })
    ).rejects.toBeInstanceOf(InsufficientFundsError)

    expect(m.datos.fuentes.get(origen.id)?.saldo).toBe(1_000)
    expect(m.datos.fuentes.get(destino.id)?.saldo).toBe(0)
    expect(m.datos.movimientos.size).toBe(0)
  })
})
