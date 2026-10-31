import { PrismaClient } from '@prisma/client'
import { TipoFuente } from 'shared-types'
import { buildContainer } from '../src/shared/container'

const ZONA = 'America/Bogota'

function parteDeFecha(fecha: Date, opciones: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, ...opciones }).format(fecha)
}

/** Mes (AAAA-MM) de una fecha en hora de Bogotá. */
function mesDe(fecha: Date): string {
  return parteDeFecha(fecha, { year: 'numeric', month: '2-digit' }).slice(0, 7)
}

function mesAnterior(mes: string): string {
  const [anio, numero] = mes.split('-').map(Number)
  return numero === 1 ? `${anio - 1}-12` : `${anio}-${String(numero - 1).padStart(2, '0')}`
}

/** Mediodía (hora de Bogotá) de un día del mes. */
function fechaDe(mes: string, dia: number): Date {
  return new Date(`${mes}-${String(dia).padStart(2, '0')}T12:00:00-05:00`)
}

export interface ResumenDemo {
  fuentes: number
  deudas: number
  gastos: number
  movimientos: number
}

/**
 * Carga datos de demostración ficticios (mes actual y anterior) usando los casos de uso reales,
 * de modo que saldos, estados y movimientos son coherentes. Solo funciona en una base sin datos.
 */
export async function sembrarDemo(prisma: PrismaClient, hoy: Date = new Date()): Promise<ResumenDemo> {
  const [deudas, gastos, movimientos] = await Promise.all([
    prisma.deuda.count(),
    prisma.gasto.count(),
    prisma.movimiento.count(),
  ])
  if (deudas + gastos + movimientos > 0) {
    throw new Error('La base ya tiene datos: los datos de demostración solo se cargan en una base vacía.')
  }

  const casos = buildContainer(prisma)
  const mes = mesDe(hoy)
  const previo = mesAnterior(mes)
  const diaHoy = Number(parteDeFecha(hoy, { day: '2-digit' }))

  const del = (mesDelDato: string, dia: number) => fechaDe(mesDelDato, mesDelDato === mes ? Math.min(dia, diaHoy) : dia)

  /** Ejecuta un paso y fecha lo que ese paso creó (los casos de uso usan la hora actual). */
  async function enFecha<T>(fecha: Date, paso: () => Promise<T>): Promise<T> {
    const ids = async () => ({
      movimientos: (await prisma.movimiento.findMany({ select: { id: true } })).map(x => x.id),
      gastos: (await prisma.gasto.findMany({ select: { id: true } })).map(x => x.id),
      deudas: (await prisma.deuda.findMany({ select: { id: true } })).map(x => x.id),
    })
    const antes = await ids()
    const resultado = await paso()
    await prisma.movimiento.updateMany({ where: { id: { notIn: antes.movimientos } }, data: { fecha } })
    await prisma.gasto.updateMany({ where: { id: { notIn: antes.gastos } }, data: { fecha } })
    await prisma.deuda.updateMany({ where: { id: { notIn: antes.deudas } }, data: { creadoEn: fecha } })
    return resultado
  }

  async function fuente(nombre: string, tipo: TipoFuente): Promise<string> {
    const existente = await prisma.fuente.findFirst({ where: { nombre } })
    return existente ? existente.id : (await casos.fuentes.crear.execute({ nombre, tipo })).id
  }

  const cuenta = await fuente('Cuenta bancaria', TipoFuente.CUENTA)
  const efectivo = await fuente('Efectivo', TipoFuente.EFECTIVO)
  const bono = await fuente('Bono de alimentación', TipoFuente.BONO)

  const ingreso = (fuenteId: string, mesDelDato: string, dia: number, monto: number, descripcion: string) =>
    enFecha(del(mesDelDato, dia), () => casos.fuentes.ingreso.execute(fuenteId, { monto, descripcion }))

  const deuda = (mesDelDato: string, dia: number, nombre: string, valor: number) =>
    enFecha(del(mesDelDato, dia), () => casos.deudas.crear.execute({ nombre, valor, mes: mesDelDato }))

  const pago = (mesDelDato: string, dia: number, deudaId: string, fuenteId: string, monto?: number) =>
    enFecha(del(mesDelDato, dia), () => casos.deudas.pagar.execute({ deudaId, fuenteId, monto }))

  const gasto = (
    mesDelDato: string,
    dia: number,
    descripcion: string,
    categoria: string,
    monto: number,
    fuenteId: string
  ) =>
    enFecha(del(mesDelDato, dia), () =>
      casos.gastos.registrar.execute({ descripcion, categoria, monto, mes: mesDelDato, fuenteId })
    )

  // --- Mes anterior
  await ingreso(cuenta, previo, 1, 3_200_000, 'Nómina')
  await ingreso(bono, previo, 1, 400_000, 'Bono de alimentación')
  await ingreso(efectivo, previo, 3, 150_000, 'Efectivo inicial')

  const arriendoPrevio = await deuda(previo, 2, 'Arriendo', 1_100_000)
  await pago(previo, 2, arriendoPrevio.id, cuenta)
  const motoPrevio = await deuda(previo, 4, 'Préstamo de moto', 450_000)
  await pago(previo, 8, motoPrevio.id, cuenta)
  const tarjetaPrevio = await deuda(previo, 5, 'Tarjeta de crédito', 1_200_000)
  await pago(previo, 12, tarjetaPrevio.id, cuenta, 700_000)

  await gasto(previo, 6, 'Mercado de la semana', 'Alimentación', 210_000, bono)
  await gasto(previo, 9, 'Transporte', 'Transporte', 55_000, efectivo)
  await gasto(previo, 14, 'Cine con amigos', 'Entretenimiento', 52_000, cuenta)
  await gasto(previo, 18, 'Droguería', 'Salud', 38_000, efectivo)
  await gasto(previo, 22, 'Restaurante', 'Alimentación', 96_000, cuenta)

  // --- Mes actual
  await ingreso(cuenta, mes, 1, 3_200_000, 'Nómina')
  await ingreso(bono, mes, 1, 400_000, 'Bono de alimentación')
  await ingreso(cuenta, mes, 6, 650_000, 'Trabajo freelance')
  await enFecha(del(mes, 3), () =>
    casos.fuentes.transferir.execute({
      origenId: cuenta,
      destinoId: efectivo,
      monto: 200_000,
      descripcion: 'Retiro del cajero',
    })
  )

  const arriendo = await deuda(mes, 1, 'Arriendo', 1_100_000)
  await pago(mes, 2, arriendo.id, cuenta)
  const tarjeta = await deuda(mes, 2, 'Tarjeta de crédito', 800_000)
  await pago(mes, 10, tarjeta.id, cuenta, 300_000)
  await deuda(mes, 3, 'Servicios públicos', 280_000)
  await deuda(mes, 4, 'Internet y celular', 150_000)

  await gasto(mes, 4, 'Mercado de la semana', 'Alimentación', 185_000, bono)
  await gasto(mes, 5, 'Transporte', 'Transporte', 60_000, efectivo)
  await gasto(mes, 7, 'Netflix y Spotify', 'Entretenimiento', 48_000, cuenta)
  await gasto(mes, 9, 'Ropa', 'Ropa', 120_000, cuenta)
  await gasto(mes, 11, 'Droguería', 'Salud', 45_000, efectivo)
  await gasto(mes, 12, 'Almuerzos', 'Alimentación', 70_000, bono)

  const [nFuentes, nDeudas, nGastos, nMovimientos] = await Promise.all([
    prisma.fuente.count(),
    prisma.deuda.count(),
    prisma.gasto.count(),
    prisma.movimiento.count(),
  ])
  return { fuentes: nFuentes, deudas: nDeudas, gastos: nGastos, movimientos: nMovimientos }
}

// Ejecución desde la línea de comandos: pnpm db:seed:demo
if (typeof require !== 'undefined' && require.main === module) {
  const prisma = new PrismaClient()
  sembrarDemo(prisma)
    .then(r =>
      console.log(
        `Datos de demostración cargados: ${r.fuentes} fuentes, ${r.deudas} deudas, ${r.gastos} gastos y ${r.movimientos} movimientos.`
      )
    )
    .catch((error: Error) => {
      console.error(error.message)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
