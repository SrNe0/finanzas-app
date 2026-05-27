import { api } from '@/shared/lib/api'
import type { FuenteDTO, MovimientoDTO } from 'shared-types'

export const fuentesApi = {
  listar: () => api.get<FuenteDTO[]>('/fuentes'),
  crear: (data: { nombre: string; tipo: string }) => api.post<FuenteDTO>('/fuentes', data),
  ingresar: (id: string, data: { monto: number; descripcion?: string }) =>
    api.post<{ fuente: FuenteDTO; movimiento: MovimientoDTO }>(`/fuentes/${id}/ingresar`, data),
  movimientos: (id: string) => api.get<MovimientoDTO[]>(`/fuentes/${id}/movimientos`),
  transferir: (data: { origenId: string; destinoId: string; monto: number; descripcion?: string }) =>
    api.post<{ origen: FuenteDTO; destino: FuenteDTO }>('/fuentes/transferir', data),
}
