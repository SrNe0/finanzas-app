import { IDeudaRepository } from '../../../domain/repositories/IDeudaRepository'
import { IGastoRepository } from '../../../domain/repositories/IGastoRepository'
import { IFuenteRepository } from '../../../domain/repositories/IFuenteRepository'
import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository'
import { ResumenMensualDTO } from 'shared-types'
import { DeudaMapper } from '../../../infrastructure/mappers/DeudaMapper'
import { GastoMapper } from '../../../infrastructure/mappers/GastoMapper'
import { MovimientoMapper } from '../../../infrastructure/mappers/MovimientoMapper'

export class ObtenerResumenMensualUseCase {
  constructor(
    private deudaRepo: IDeudaRepository,
    private gastoRepo: IGastoRepository,
    private fuenteRepo: IFuenteRepository,
    private movimientoRepo: IMovimientoRepository
  ) {}

  async execute(mes: string): Promise<ResumenMensualDTO> {
    const [deudas, gastos, fuentes, movimientos] = await Promise.all([
      this.deudaRepo.findByMes(mes),
      this.gastoRepo.findByMes(mes),
      this.fuenteRepo.findAll(),
      this.movimientoRepo.findByMes(mes),
    ])

    const totalDeudas = deudas.reduce((s, d) => s + d.valor, 0)
    const totalDeudasPagadas = deudas.filter(d => !d.estaPendiente).reduce((s, d) => s + d.valor, 0)
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
    const totalDisponible = fuentes.reduce((s, f) => s + f.saldo, 0)
    const totalIngresos = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((s, m) => s + m.monto, 0)
    const totalPagosDeuda = movimientos
      .filter(m => m.tipo === 'pago_deuda')
      .reduce((s, m) => s + m.monto, 0)

    const ultimosMovimientos = movimientos
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 10)

    return {
      mes,
      totalIngresos,
      totalDeudas,
      totalDeudasPagadas,
      totalPagosDeuda,
      totalGastos,
      totalDisponible,
      deudas: deudas.map(DeudaMapper.toDTO),
      gastos: gastos.map(GastoMapper.toDTO),
      ultimosMovimientos: ultimosMovimientos.map(MovimientoMapper.toDTO),
    }
  }
}
