import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/lib/api'
import type { ResumenMensualDTO } from 'shared-types'

export function useResumen(mes: string) {
  return useQuery({
    queryKey: ['resumen', mes],
    queryFn: () => api.get<ResumenMensualDTO>(`/resumen?mes=${mes}`),
  })
}
