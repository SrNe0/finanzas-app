import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const CLAVE = 'finanzas-app-store'

async function cargarStore() {
  vi.resetModules()
  return (await import('./appStore')).useAppStore
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-15T12:00:00-05:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('appStore', () => {
  it('el mes activo inicia en el mes actual', async () => {
    const store = await cargarStore()

    expect(store.getState().mesActivo).toBe('2026-10')
  })

  it('ignora un mes activo guardado por versiones anteriores y conserva el tema', async () => {
    localStorage.setItem(CLAVE, JSON.stringify({ state: { mesActivo: '2025-01', theme: 'light' }, version: 0 }))

    const store = await cargarStore()

    expect(store.getState().mesActivo).toBe('2026-10')
    expect(store.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('al cambiar de mes solo se guarda el tema', async () => {
    const store = await cargarStore()

    store.getState().setMesActivo('2026-03')

    expect(store.getState().mesActivo).toBe('2026-03')
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}')
    expect(guardado.state).toEqual({ theme: 'dark' })
  })

  it('el tema elegido se guarda y se recupera', async () => {
    const primera = await cargarStore()
    primera.getState().toggleTheme()
    expect(primera.getState().theme).toBe('light')

    const segunda = await cargarStore()

    expect(segunda.getState().theme).toBe('light')
  })
})
