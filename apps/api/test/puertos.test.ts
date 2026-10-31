import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('puerto de la API', () => {
  it('por defecto es 3001', async () => {
    vi.stubEnv('PORT', '')
    vi.resetModules()

    const { PORT } = await import('../src/app')

    expect(PORT).toBe(3001)
  })

  it('se puede cambiar con la variable PORT', async () => {
    vi.stubEnv('PORT', '3101')
    vi.resetModules()

    const { PORT } = await import('../src/app')

    expect(PORT).toBe(3101)
  })

  it('un valor inválido vuelve al puerto por defecto', async () => {
    vi.stubEnv('PORT', 'no-es-un-puerto')
    vi.resetModules()

    const { PORT } = await import('../src/app')

    expect(PORT).toBe(3001)
  })
})
