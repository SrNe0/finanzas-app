import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import { ErrorMensaje } from './ErrorMensaje'

afterEach(cleanup)

describe('ErrorMensaje', () => {
  it('muestra el título, el mensaje y avisa como alerta', () => {
    render(<ErrorMensaje mensaje="Saldo insuficiente" />)

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('No se pudo cargar la información')).toBeTruthy()
    expect(screen.getByText('Saldo insuficiente')).toBeTruthy()
  })

  it('permite cambiar el título', () => {
    render(<ErrorMensaje titulo="Algo falló" mensaje="x" />)

    expect(screen.getByText('Algo falló')).toBeTruthy()
  })

  it('sin onReintentar no muestra el botón', () => {
    render(<ErrorMensaje mensaje="x" />)

    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull()
  })

  it('el botón Reintentar llama a onReintentar', () => {
    const onReintentar = vi.fn()
    render(<ErrorMensaje mensaje="x" onReintentar={onReintentar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onReintentar).toHaveBeenCalledTimes(1)
  })
})

describe('ErrorBoundary', () => {
  let falla = true

  function Componente() {
    if (falla) throw new Error('boom de prueba')
    return <p>contenido sano</p>
  }

  beforeEach(() => {
    falla = true
    // React registra los errores capturados en la consola; se silencian para no ensuciar la salida de los tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza a sus hijos cuando no hay errores', () => {
    falla = false

    render(
      <ErrorBoundary>
        <Componente />
      </ErrorBoundary>
    )

    expect(screen.getByText('contenido sano')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('en vez de dejar la pantalla en blanco muestra el error capturado', () => {
    render(
      <ErrorBoundary>
        <Componente />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Algo salió mal')).toBeTruthy()
    expect(screen.getByText('boom de prueba')).toBeTruthy()
  })

  it('Reintentar vuelve a renderizar los hijos cuando el problema desapareció', () => {
    render(
      <ErrorBoundary>
        <Componente />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeTruthy()

    falla = false
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(screen.getByText('contenido sano')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
