import { lazy, ReactElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'

afterEach(cleanup)

function renderizar(pagina: ReactElement) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={pagina} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Layout con páginas de carga diferida', () => {
  it('mientras llega la página muestra un estado de carga y deja el menú a la vista', () => {
    const Lenta = lazy(() => new Promise<{ default: () => ReactElement }>(() => {}))

    renderizar(<Lenta />)

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Deudas' })).toBeTruthy()
  })

  it('cuando llega la página la muestra y quita el estado de carga', async () => {
    const Rapida = lazy(async () => ({ default: () => <p>contenido cargado</p> }))

    renderizar(<Rapida />)

    expect(await screen.findByText('contenido cargado')).toBeTruthy()
    expect(screen.queryByRole('status', { name: 'Cargando' })).toBeNull()
  })
})
