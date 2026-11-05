import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { DemoBanner } from './DemoBanner'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

describe('DemoBanner', () => {
  it('no se muestra en la app normal', () => {
    vi.stubEnv('VITE_DEMO_BANNER', '')

    render(<DemoBanner />)

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('se muestra cuando la web se compila para la demo', () => {
    vi.stubEnv('VITE_DEMO_BANNER', '1')

    render(<DemoBanner />)

    expect(screen.getByRole('status').textContent).toContain('Demo pública compartida')
    expect(screen.getByRole('status').textContent).toContain('No escribas información real')
  })
})
