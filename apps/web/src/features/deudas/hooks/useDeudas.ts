import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deudasApi } from '../api/deudas.api'
import { toast } from 'sonner'

export function useDeudas(mes: string) {
  return useQuery({
    queryKey: ['deudas', mes],
    queryFn: () => deudasApi.listar(mes),
  })
}

export function useCrearDeuda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deudasApi.crear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deudas'] })
      qc.invalidateQueries({ queryKey: ['resumen'] })
      toast.success('Deuda creada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useActualizarDeuda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof deudasApi.actualizar>[1] }) =>
      deudasApi.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deudas'] })
      qc.invalidateQueries({ queryKey: ['fuentes'] })
      qc.invalidateQueries({ queryKey: ['resumen'] })
      toast.success('Deuda actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function usePagarDeuda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { fuenteId: string; monto?: number } }) =>
      deudasApi.pagar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deudas'] })
      qc.invalidateQueries({ queryKey: ['fuentes'] })
      qc.invalidateQueries({ queryKey: ['resumen'] })
      toast.success('Pago registrado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useEliminarDeuda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deudasApi.eliminar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deudas'] })
      qc.invalidateQueries({ queryKey: ['resumen'] })
      toast.success('Deuda eliminada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
