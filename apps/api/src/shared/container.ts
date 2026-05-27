import { PrismaClient } from '@prisma/client'
import { PrismaDeudaRepository } from '../infrastructure/repositories/PrismaDeudaRepository'
import { PrismaFuenteRepository } from '../infrastructure/repositories/PrismaFuenteRepository'
import { PrismaMovimientoRepository } from '../infrastructure/repositories/PrismaMovimientoRepository'
import { PrismaGastoRepository } from '../infrastructure/repositories/PrismaGastoRepository'

import { CrearDeudaUseCase } from '../application/usecases/deudas/CrearDeudaUseCase'
import { PagarDeudaUseCase } from '../application/usecases/deudas/PagarDeudaUseCase'
import { ActualizarSaldoDeudaUseCase } from '../application/usecases/deudas/ActualizarSaldoDeudaUseCase'
import { EliminarDeudaUseCase } from '../application/usecases/deudas/EliminarDeudaUseCase'
import { ListarDeudasPorMesUseCase } from '../application/usecases/deudas/ListarDeudasPorMesUseCase'

import { RegistrarGastoUseCase } from '../application/usecases/gastos/RegistrarGastoUseCase'
import { EliminarGastoUseCase } from '../application/usecases/gastos/EliminarGastoUseCase'
import { ListarGastosPorMesUseCase } from '../application/usecases/gastos/ListarGastosPorMesUseCase'

import { CrearFuenteUseCase } from '../application/usecases/fuentes/CrearFuenteUseCase'
import { RegistrarIngresoUseCase } from '../application/usecases/fuentes/RegistrarIngresoUseCase'
import { ListarFuentesUseCase } from '../application/usecases/fuentes/ListarFuentesUseCase'
import { ObtenerHistorialFuenteUseCase } from '../application/usecases/fuentes/ObtenerHistorialFuenteUseCase'
import { TransferirFuentesUseCase } from '../application/usecases/fuentes/TransferirFuentesUseCase'

import { ObtenerResumenMensualUseCase } from '../application/usecases/resumen/ObtenerResumenMensualUseCase'

export function buildContainer() {
  const prisma = new PrismaClient()

  const deudaRepo = new PrismaDeudaRepository(prisma)
  const fuenteRepo = new PrismaFuenteRepository(prisma)
  const movimientoRepo = new PrismaMovimientoRepository(prisma)
  const gastoRepo = new PrismaGastoRepository(prisma)

  return {
    prisma,
    deudas: {
      crear: new CrearDeudaUseCase(deudaRepo),
      pagar: new PagarDeudaUseCase(deudaRepo, fuenteRepo, movimientoRepo),
      actualizar: new ActualizarSaldoDeudaUseCase(deudaRepo, fuenteRepo, movimientoRepo),
      eliminar: new EliminarDeudaUseCase(deudaRepo),
      listar: new ListarDeudasPorMesUseCase(deudaRepo),
    },
    gastos: {
      registrar: new RegistrarGastoUseCase(gastoRepo, fuenteRepo, movimientoRepo),
      eliminar: new EliminarGastoUseCase(gastoRepo),
      listar: new ListarGastosPorMesUseCase(gastoRepo),
    },
    fuentes: {
      crear: new CrearFuenteUseCase(fuenteRepo),
      ingreso: new RegistrarIngresoUseCase(fuenteRepo, movimientoRepo),
      listar: new ListarFuentesUseCase(fuenteRepo),
      historial: new ObtenerHistorialFuenteUseCase(movimientoRepo),
      transferir: new TransferirFuentesUseCase(fuenteRepo, movimientoRepo),
    },
    resumen: {
      obtener: new ObtenerResumenMensualUseCase(deudaRepo, gastoRepo, fuenteRepo, movimientoRepo),
    },
  }
}

export type Container = ReturnType<typeof buildContainer>
