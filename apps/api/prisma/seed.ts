import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.deuda.count()
  if (count > 0) {
    console.log('DB ya tiene datos, omitiendo seed.')
    return
  }

  await Promise.all([
    prisma.fuente.create({ data: { nombre: 'Cuenta bancaria', tipo: 'cuenta', saldo: 0 } }),
    prisma.fuente.create({ data: { nombre: 'Efectivo', tipo: 'efectivo', saldo: 0 } }),
  ])

  console.log('Seed completado.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
