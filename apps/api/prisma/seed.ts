import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.deuda.count()
  if (count > 0) {
    console.log('DB ya tiene datos, omitiendo seed.')
    return
  }

  const fuentes = await Promise.all([
    prisma.fuente.create({ data: { nombre: 'Cuenta bancaria', tipo: 'cuenta', saldo: 3244099 } }),
    prisma.fuente.create({ data: { nombre: 'Efectivo', tipo: 'efectivo', saldo: 140000 } }),
    prisma.fuente.create({ data: { nombre: 'Bono', tipo: 'bono', saldo: 165000 } }),
  ])

  const cuenta = fuentes[0]

  const deudasData = [
    { nombre: 'Steven TG',         valor: 600000, saldo: 0,      estado: 'Pagado',    mes: '2026-05' },
    { nombre: 'Arriendo',          valor: 500000, saldo: 500000, estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'Guillo Hermano',    valor: 140000, saldo: 140000, estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'Manuela UIS',       valor: 50000,  saldo: 50000,  estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'Janer Vega',        valor: 390000, saldo: 390000, estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'Alexandra Garcia',  valor: 200000, saldo: 200000, estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'Yuliana',           valor: 197000, saldo: 197000, estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'Guillermo Caceres', valor: 140000, saldo: 140000, estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'GYM',               valor: 100000, saldo: 100000, estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'Movistar',          valor: 63779,  saldo: 63779,  estado: 'Pendiente', mes: '2026-05' },
    { nombre: 'Tigo',              valor: 30800,  saldo: 30800,  estado: 'Pendiente', mes: '2026-05' },
  ]

  const deudas = await Promise.all(deudasData.map(d => prisma.deuda.create({ data: d })))
  const stevenDeuda = deudas[0]

  await prisma.movimiento.create({
    data: {
      tipo: 'pago_deuda',
      fuenteId: cuenta.id,
      deudaId: stevenDeuda.id,
      descripcion: 'Pago Steven TG',
      monto: 600000,
    },
  })

  console.log('Seed completado.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
