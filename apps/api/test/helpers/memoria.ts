import { EstadoDeuda, TipoFuente, TipoMovimiento } from 'shared-types'
import { Deuda } from '../../src/domain/entities/Deuda'
import { Fuente } from '../../src/domain/entities/Fuente'
import { Gasto } from '../../src/domain/entities/Gasto'
import { Movimiento } from '../../src/domain/entities/Movimiento'
import { IDeudaRepository } from '../../src/domain/repositories/IDeudaRepository'
import { IFuenteRepository } from '../../src/domain/repositories/IFuenteRepository'
import { IGastoRepository } from '../../src/domain/repositories/IGastoRepository'
import { IMovimientoRepository } from '../../src/domain/repositories/IMovimientoRepository'
import { IUnitOfWork, Repos } from '../../src/domain/repositories/IUnitOfWork'

/** Copia superficial que conserva el prototipo: así cada lectura devuelve una instancia nueva, como una base de datos. */
function clonar<T extends object>(entidad: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(entidad)), entidad)
}

/** Mes (AAAA-MM) de una fecha en la zona horaria de Bogotá. */
export function mesDeBogota(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(fecha)
  const dato = (tipo: string) => partes.find(p => p.type === tipo)?.value
  return `${dato('year')}-${dato('month')}`
}

export interface Datos {
  deudas: Map<string, Deuda>
  fuentes: Map<string, Fuente>
  gastos: Map<string, Gasto>
  movimientos: Map<string, Movimiento>
  contador: number
}

type Generador = () => string

class MemoriaDeudaRepository implements IDeudaRepository {
  constructor(
    private datos: Datos,
    private nuevoId: Generador
  ) {}

  async findById(id: string) {
    const d = this.datos.deudas.get(id)
    return d ? clonar(d) : null
  }

  async findByMes(mes: string) {
    return [...this.datos.deudas.values()]
      .filter(d => d.mes === mes)
      .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime())
      .map(clonar)
  }

  async findPendientesAnterioresA(mes: string) {
    return [...this.datos.deudas.values()]
      .filter(d => d.mes < mes && d.estado !== EstadoDeuda.PAGADO)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map(clonar)
  }

  async save(deuda: Deuda) {
    const guardada = new Deuda(
      this.nuevoId(),
      deuda.nombre,
      deuda.valor,
      deuda.saldo,
      deuda.estado,
      deuda.mes,
      deuda.creadoEn
    )
    this.datos.deudas.set(guardada.id, clonar(guardada))
    return guardada
  }

  async update(deuda: Deuda) {
    this.datos.deudas.set(deuda.id, clonar(deuda))
    return clonar(deuda)
  }

  async delete(id: string) {
    this.datos.deudas.delete(id)
  }
}

class MemoriaFuenteRepository implements IFuenteRepository {
  constructor(
    private datos: Datos,
    private nuevoId: Generador
  ) {}

  async findById(id: string) {
    const f = this.datos.fuentes.get(id)
    return f ? clonar(f) : null
  }

  async findAll() {
    return [...this.datos.fuentes.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)).map(clonar)
  }

  async save(fuente: Fuente) {
    const guardada = new Fuente(this.nuevoId(), fuente.nombre, fuente.tipo, fuente.saldo)
    this.datos.fuentes.set(guardada.id, clonar(guardada))
    return guardada
  }

  async update(fuente: Fuente) {
    this.datos.fuentes.set(fuente.id, clonar(fuente))
    return clonar(fuente)
  }
}

class MemoriaGastoRepository implements IGastoRepository {
  constructor(
    private datos: Datos,
    private nuevoId: Generador
  ) {}

  async findById(id: string) {
    const g = this.datos.gastos.get(id)
    return g ? clonar(g) : null
  }

  async findByMes(mes: string) {
    return [...this.datos.gastos.values()]
      .filter(g => g.mes === mes)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .map(clonar)
  }

  async save(gasto: Gasto) {
    const guardado = new Gasto(
      this.nuevoId(),
      gasto.descripcion,
      gasto.categoria,
      gasto.monto,
      gasto.mes,
      gasto.fuenteId,
      gasto.fecha
    )
    this.datos.gastos.set(guardado.id as string, clonar(guardado))
    return guardado
  }

  async delete(id: string) {
    this.datos.gastos.delete(id)
  }
}

class MemoriaMovimientoRepository implements IMovimientoRepository {
  constructor(
    private datos: Datos,
    private nuevoId: Generador
  ) {}

  private todos() {
    return [...this.datos.movimientos.values()]
  }

  async save(m: Movimiento) {
    const guardado = new Movimiento(
      this.nuevoId(),
      m.tipo,
      m.fuenteId,
      m.deudaId,
      m.descripcion,
      m.monto,
      m.fecha,
      m.gastoId
    )
    this.datos.movimientos.set(guardado.id as string, clonar(guardado))
    return guardado
  }

  async findByFuenteId(fuenteId: string) {
    return this.todos()
      .filter(m => m.fuenteId === fuenteId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .map(clonar)
  }

  async findByGastoId(gastoId: string) {
    const m = this.todos().find(x => x.gastoId === gastoId)
    return m ? clonar(m) : null
  }

  async findPagosByDeudaId(deudaId: string) {
    return this.todos()
      .filter(m => m.deudaId === deudaId && m.tipo === TipoMovimiento.PAGO_DEUDA)
      .map(clonar)
  }

  async findByMes(mes: string) {
    return this.todos()
      .filter(m => mesDeBogota(m.fecha) === mes)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .map(clonar)
  }

  async delete(id: string) {
    this.datos.movimientos.delete(id)
  }
}

function copiar(datos: Datos): Datos {
  const copiaMapa = <T extends object>(mapa: Map<string, T>) =>
    new Map([...mapa].map(([id, e]) => [id, clonar(e)] as [string, T]))
  return {
    deudas: copiaMapa(datos.deudas),
    fuentes: copiaMapa(datos.fuentes),
    gastos: copiaMapa(datos.gastos),
    movimientos: copiaMapa(datos.movimientos),
    contador: datos.contador,
  }
}

function restaurar(datos: Datos, copia: Datos) {
  datos.deudas = copia.deudas
  datos.fuentes = copia.fuentes
  datos.gastos = copia.gastos
  datos.movimientos = copia.movimientos
  datos.contador = copia.contador
}

/** Base de datos en memoria con repositorios y una unidad de trabajo que revierte todo si `work` lanza un error. */
export function crearMemoria() {
  const datos: Datos = { deudas: new Map(), fuentes: new Map(), gastos: new Map(), movimientos: new Map(), contador: 0 }
  const nuevoId: Generador = () => `id-${++datos.contador}`

  // Los repositorios leen siempre `datos` (que `restaurar` reasigna), por eso se les pasa el objeto y no los mapas.
  const repos: Repos = {
    deudas: new MemoriaDeudaRepository(datos, nuevoId),
    fuentes: new MemoriaFuenteRepository(datos, nuevoId),
    gastos: new MemoriaGastoRepository(datos, nuevoId),
    movimientos: new MemoriaMovimientoRepository(datos, nuevoId),
  }

  const uow: IUnitOfWork = {
    async run(work) {
      const antes = copiar(datos)
      try {
        return await work(repos)
      } catch (error) {
        restaurar(datos, antes)
        throw error
      }
    },
  }

  const agregarFuente = (nombre: string, saldo: number, tipo: TipoFuente = TipoFuente.CUENTA) => {
    const fuente = new Fuente(nuevoId(), nombre, tipo, saldo)
    datos.fuentes.set(fuente.id, clonar(fuente))
    return fuente
  }

  const agregarDeuda = (
    valor: number,
    saldo = valor,
    estado = EstadoDeuda.PENDIENTE,
    mes = '2026-10',
    nombre = 'Tarjeta'
  ) => {
    const deuda = new Deuda(nuevoId(), nombre, valor, saldo, estado, mes, new Date('2026-10-01T12:00:00Z'))
    datos.deudas.set(deuda.id, clonar(deuda))
    return deuda
  }

  const agregarMovimiento = (m: Partial<Movimiento> & { tipo: TipoMovimiento; monto: number }) => {
    const mov = new Movimiento(
      nuevoId(),
      m.tipo,
      m.fuenteId ?? null,
      m.deudaId ?? null,
      m.descripcion ?? null,
      m.monto,
      m.fecha ?? new Date(),
      m.gastoId ?? null
    )
    datos.movimientos.set(mov.id as string, clonar(mov))
    return mov
  }

  return { datos, repos, uow, agregarFuente, agregarDeuda, agregarMovimiento }
}

export type Memoria = ReturnType<typeof crearMemoria>
