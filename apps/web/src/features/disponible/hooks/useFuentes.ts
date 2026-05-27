import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fuentesApi } from '../api/fuentes.api'
import { toast } from 'sonner'

export function useFuentes() {
  return useQuery({ queryKey: ['fuentes'], queryFn: fuentesApi.listar })
}

export function useCrearFuente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fuentesApi.crear,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fuentes'] }); toast.success('Fuente creada') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRegistrarIngreso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { monto: number; descripcion?: string } }) =>
      fuentesApi.ingresar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuentes'] })
      qc.invalidateQueries({ queryKey: ['resumen'] })
      toast.success('Ingreso registrado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useHistorialFuente(fuenteId: string) {
  return useQuery({
    queryKey: ['fuente-historial', fuenteId],
    queryFn: () => fuentesApi.movimientos(fuenteId),
    enabled: !!fuenteId,
  })
}

export function useTransferirFuentes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fuentesApi.transferir,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuentes'] })
      qc.invalidateQueries({ queryKey: ['resumen'] })
      toast.success('Transferencia realizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
