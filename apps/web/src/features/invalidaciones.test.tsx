import { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./gastos/api/gastos.api', () => ({
  gastosApi: { listar: vi.fn(), registrar: vi.fn(), eliminar: vi.fn() },
}))
vi.mock('./deudas/api/deudas.api', () => ({
  deudasApi: { listar: vi.fn(), crear: vi.fn(), actualizar: vi.fn(), pagar: vi.fn(), eliminar: vi.fn() },
}))
vi.mock('./disponible/api/fuentes.api', () => ({
  fuentesApi: { listar: vi.fn(), crear: vi.fn(), ingresar: vi.fn(), movimientos: vi.fn(), transferir: vi.fn() },
}))

import { gastosApi } from './gastos/api/gastos.api'
import { deudasApi } from './deudas/api/deudas.api'
import { fuentesApi } from './disponible/api/fuentes.api'
import { useRegistrarGasto, useEliminarGasto } from './gastos/hooks/useGastos'
import { usePagarDeuda, useActualizarDeuda, useEliminarDeuda } from './deudas/hooks/useDeudas'
import { useRegistrarIngreso, useTransferirFuentes } from './disponible/hooks/useFuentes'

// Mutaciones que mueven dinero entre fuentes: deben refrescar los saldos y el historial de cada fuente.
const MUTACIONES = [
  {
    nombre: 'useRegistrarGasto',
    hook: useRegistrarGasto,
    api: gastosApi.registrar,
    variables: { descripcion: 'x', categoria: 'Otro', monto: 1, mes: '2026-10' },
  },
  { nombre: 'useEliminarGasto', hook: useEliminarGasto, api: gastosApi.eliminar, variables: 'id' },
  {
    nombre: 'usePagarDeuda',
    hook: usePagarDeuda,
    api: deudasApi.pagar,
    variables: { id: 'd', data: { fuenteId: 'f' } },
  },
  {
    nombre: 'useActualizarDeuda',
    hook: useActualizarDeuda,
    api: deudasApi.actualizar,
    variables: { id: 'd', data: { saldo: 1 } },
  },
  { nombre: 'useEliminarDeuda', hook: useEliminarDeuda, api: deudasApi.eliminar, variables: 'id' },
  {
    nombre: 'useRegistrarIngreso',
    hook: useRegistrarIngreso,
    api: fuentesApi.ingresar,
    variables: { id: 'f', data: { monto: 1 } },
  },
  {
    nombre: 'useTransferirFuentes',
    hook: useTransferirFuentes,
    api: fuentesApi.transferir,
    variables: { origenId: 'a', destinoId: 'b', monto: 1 },
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('invalidación de caché tras mover dinero', () => {
  it.each(MUTACIONES)('$nombre invalida fuentes, historial de fuente y resumen', async ({ hook, api, variables }) => {
    vi.mocked(api as (...args: unknown[]) => Promise<unknown>).mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => (hook as () => { mutate: (v: unknown) => void })(), { wrapper })
    result.current.mutate(variables)

    await waitFor(() => {
      const claves = invalidar.mock.calls.map(([filtros]) => JSON.stringify(filtros?.queryKey))
      expect(claves).toContain(JSON.stringify(['fuentes']))
      expect(claves).toContain(JSON.stringify(['fuente-historial']))
      expect(claves).toContain(JSON.stringify(['resumen']))
    })
  })
})
