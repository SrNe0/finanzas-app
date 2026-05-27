export enum EstadoDeuda {
  PENDIENTE = 'Pendiente',
  EN_PROCESO = 'En proceso',
  PAGADO = 'Pagado',
}

export enum TipoFuente {
  CUENTA = 'cuenta',
  EFECTIVO = 'efectivo',
  BONO = 'bono',
  OTRO = 'otro',
}

export enum TipoMovimiento {
  INGRESO = 'ingreso',
  PAGO_DEUDA = 'pago_deuda',
  GASTO = 'gasto',
  TRANSFERENCIA_SALIDA = 'transferencia_salida',
  TRANSFERENCIA_ENTRADA = 'transferencia_entrada',
}

export interface TransferirFuentesInput {
  origenId: string
  destinoId: string
  monto: number
  descripcion?: string
}

export interface DeudaDTO {
  id: string
  nombre: string
  valor: number
  saldo: number
  estado: EstadoDeuda
  mes: string
  creadoEn: string
}

export interface FuenteDTO {
  id: string
  nombre: string
  tipo: TipoFuente
  saldo: number
}

export interface MovimientoDTO {
  id: string
  tipo: TipoMovimiento
  fuenteId: string | null
  deudaId: string | null
  descripcion: string | null
  monto: number
  fecha: string
}

export interface GastoDTO {
  id: string
  descripcion: string
  categoria: string
  monto: number
  mes: string
  fuenteId: string | null
  fecha: string
}

export interface ResumenMensualDTO {
  mes: string
  totalIngresos: number
  totalDeudas: number
  totalDeudasPagadas: number
  totalPagosDeuda: number
  totalGastos: number
  totalDisponible: number
  deudas: DeudaDTO[]
  gastos: GastoDTO[]
  ultimosMovimientos: MovimientoDTO[]
}

export interface CrearDeudaInput {
  nombre: string
  valor: number
  mes: string
}

export interface PagarDeudaInput {
  fuenteId: string
  monto?: number
}

export interface ActualizarDeudaInput {
  nombre?: string
  saldo?: number
  estado?: EstadoDeuda
  fuenteId?: string
}

export interface CrearFuenteInput {
  nombre: string
  tipo: TipoFuente
}

export interface RegistrarIngresoInput {
  monto: number
  descripcion?: string
}

export interface RegistrarGastoInput {
  descripcion: string
  categoria: string
  monto: number
  mes: string
  fuenteId?: string
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
