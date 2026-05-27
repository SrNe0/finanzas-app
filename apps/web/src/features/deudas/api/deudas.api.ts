import { api } from '@/shared/lib/api'
import type { DeudaDTO, FuenteDTO } from 'shared-types'

export const deudasApi = {
  listar: (mes: string) =>
    api.get<{ delMes: DeudaDTO[]; arrastradas: DeudaDTO[] }>(`/deudas?mes=${mes}`),

  crear: (data: { nombre: string; valor: number; mes: string }) =>
    api.post<DeudaDTO>('/deudas', data),

  actualizar: (id: string, data: { nombre?: string; saldo?: number; estado?: string; fuenteId?: string }) =>
    api.patch<DeudaDTO>(`/deudas/${id}`, data),

  pagar: (id: string, data: { fuenteId: string; monto?: number }) =>
    api.post<{ deuda: DeudaDTO; fuente: FuenteDTO }>(`/deudas/${id}/pagar`, data),

  eliminar: (id: string) => api.delete(`/deudas/${id}`),
}
