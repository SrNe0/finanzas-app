import { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EstadoDeuda } from 'shared-types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../api/deudas.api', () => ({
  deudasApi: { listar: vi.fn(), crear: vi.fn(), actualizar: vi.fn(), pagar: vi.fn(), eliminar: vi.fn() },
}))
vi.mock('@/features/disponible/api/fuentes.api', () => ({
  fuentesApi: { listar: vi.fn(), crear: vi.fn(), ingresar: vi.fn(), movimientos: vi.fn(), transferir: vi.fn() },
}))

import { deudasApi } from '../api/deudas.api'
import { fuentesApi } from '@/features/disponible/api/fuentes.api'
import { DeudasTable } from './DeudasTable'

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<DeudasTable mes="2026-10" />, { wrapper })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fuentesApi.listar).mockResolvedValue([])
})

afterEach(cleanup)

describe('DeudasTable', () => {
  it('cuando la consulta falla muestra el error en vez de una lista vacía', async () => {
    vi.mocked(deudasApi.listar).mockRejectedValue(new Error('No hay conexión con el servidor'))

    renderizar()

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText('No hay conexión con el servidor')).toBeTruthy()
    expect(screen.queryByText('Sin deudas para este mes')).toBeNull()
  })

  it('Reintentar vuelve a consultar y muestra los datos cuando el servidor responde', async () => {
    vi.mocked(deudasApi.listar)
      .mockRejectedValueOnce(new Error('falla temporal'))
      .mockResolvedValue({ delMes: [], arrastradas: [] })

    renderizar()
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    await waitFor(() => expect(screen.getByText('Sin deudas para este mes')).toBeTruthy())
    expect(screen.queryByRole('alert')).toBeNull()
    expect(deudasApi.listar).toHaveBeenCalledTimes(2)
  })

  it('sin errores muestra la lista vacía', async () => {
    vi.mocked(deudasApi.listar).mockResolvedValue({ delMes: [], arrastradas: [] })

    renderizar()

    expect(await screen.findByText('Sin deudas para este mes')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('con deudas, la tabla se desplaza horizontalmente en pantallas pequeñas en vez de recortarse', async () => {
    vi.mocked(deudasApi.listar).mockResolvedValue({
      delMes: [
        {
          id: 'd1',
          nombre: 'Tarjeta',
          valor: 100_000,
          saldo: 100_000,
          estado: EstadoDeuda.PENDIENTE,
          mes: '2026-10',
          creadoEn: '2026-10-01T00:00:00.000Z',
        },
      ],
      arrastradas: [],
    })

    renderizar()

    const contenedor = (await screen.findByRole('table')).parentElement
    expect(contenedor?.className).toContain('overflow-x-auto')
    expect(contenedor?.className).not.toContain('overflow-hidden')
  })
})
