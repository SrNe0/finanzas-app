import { describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach } from 'vitest'
import { TipoFuente } from 'shared-types'
import { PagarDesdeModal } from './PagarDesdeModal'

afterEach(cleanup)

const FUENTES = [
  { id: 'rica', nombre: 'Cuenta rica', tipo: TipoFuente.CUENTA, saldo: 100_000 },
  { id: 'pobre', nombre: 'Efectivo pobre', tipo: TipoFuente.EFECTIVO, saldo: 5_000 },
]

function abrir(props: Partial<React.ComponentProps<typeof PagarDesdeModal>> = {}) {
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  const utilidades = render(
    <PagarDesdeModal open onClose={onClose} onConfirm={onConfirm} fuentes={FUENTES} monto={20_000} {...props} />
  )
  return { onConfirm, onClose, ...utilidades }
}

const botonConfirmar = () => screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement

describe('PagarDesdeModal', () => {
  it('no permite confirmar sin elegir una fuente', () => {
    abrir()

    expect(botonConfirmar().disabled).toBe(true)
  })

  it('permite confirmar con una fuente que tiene saldo suficiente', () => {
    const { onConfirm } = abrir()

    fireEvent.click(screen.getByText('Cuenta rica'))
    expect(botonConfirmar().disabled).toBe(false)
    fireEvent.click(botonConfirmar())

    expect(onConfirm).toHaveBeenCalledWith('rica')
  })

  it('no permite confirmar con una fuente sin saldo suficiente', () => {
    const { onConfirm } = abrir()

    fireEvent.click(screen.getByText('Efectivo pobre'))

    expect(botonConfirmar().disabled).toBe(true)
    fireEvent.click(botonConfirmar())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('al cancelar se limpia la fuente elegida', () => {
    const { onClose, rerender, onConfirm } = abrir()
    fireEvent.click(screen.getByText('Cuenta rica'))
    expect(botonConfirmar().disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()

    rerender(<PagarDesdeModal open onClose={onClose} onConfirm={onConfirm} fuentes={FUENTES} monto={20_000} />)
    expect(botonConfirmar().disabled).toBe(true)
  })
})
