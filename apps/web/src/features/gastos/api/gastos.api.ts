import { api } from '@/shared/lib/api'
import type { GastoDTO } from 'shared-types'

export const gastosApi = {
  listar: (mes: string) => api.get<GastoDTO[]>(`/gastos?mes=${mes}`),
  registrar: (data: { descripcion: string; categoria: string; monto: number; mes: string; fuenteId?: string }) =>
    api.post<GastoDTO>('/gastos', data),
  eliminar: (id: string) => api.delete(`/gastos/${id}`),
}
