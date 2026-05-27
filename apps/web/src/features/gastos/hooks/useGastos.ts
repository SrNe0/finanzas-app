import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gastosApi } from '../api/gastos.api'
import { toast } from 'sonner'

export function useGastos(mes: string) {
  return useQuery({ queryKey: ['gastos', mes], queryFn: () => gastosApi.listar(mes) })
}

export function useRegistrarGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: gastosApi.registrar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      qc.invalidateQueries({ queryKey: ['fuentes'] })
      qc.invalidateQueries({ queryKey: ['resumen'] })
      toast.success('Gasto registrado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useEliminarGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: gastosApi.eliminar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      qc.invalidateQueries({ queryKey: ['resumen'] })
      toast.success('Gasto eliminado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
