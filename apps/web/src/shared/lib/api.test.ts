import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function respuesta(status: number, cuerpo?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'texto',
    json: async () => cuerpo,
  }
}

function cabecerasDeLaLlamada() {
  const opciones = fetchMock.mock.calls[0][1] as RequestInit
  return opciones.headers as Record<string, string> | undefined
}

describe('api', () => {
  it('un DELETE sin body no envía Content-Type (Fastify rechaza un JSON vacío)', async () => {
    fetchMock.mockResolvedValue(respuesta(204))

    await api.delete('/deudas/abc')

    expect(fetchMock).toHaveBeenCalledWith('/api/deudas/abc', expect.objectContaining({ method: 'DELETE' }))
    expect(cabecerasDeLaLlamada()).toBeUndefined()
  })

  it('un GET no envía Content-Type', async () => {
    fetchMock.mockResolvedValue(respuesta(200, []))

    await api.get('/fuentes')

    expect(cabecerasDeLaLlamada()).toBeUndefined()
  })

  it('un POST con body envía Content-Type JSON y el body serializado', async () => {
    fetchMock.mockResolvedValue(respuesta(201, { id: '1' }))

    const resultado = await api.post('/fuentes', { nombre: 'Cuenta' })

    expect(resultado).toEqual({ id: '1' })
    const opciones = fetchMock.mock.calls[0][1] as RequestInit
    expect(cabecerasDeLaLlamada()).toEqual({ 'Content-Type': 'application/json' })
    expect(opciones.body).toBe(JSON.stringify({ nombre: 'Cuenta' }))
  })

  it('un PATCH con body envía Content-Type JSON', async () => {
    fetchMock.mockResolvedValue(respuesta(200, {}))

    await api.patch('/deudas/abc', { saldo: 10 })

    expect(cabecerasDeLaLlamada()).toEqual({ 'Content-Type': 'application/json' })
  })

  it('lanza un Error con el mensaje de la API cuando la respuesta no es ok', async () => {
    fetchMock.mockResolvedValue(respuesta(422, { error: { message: 'Saldo insuficiente' } }))

    await expect(api.post('/deudas/abc/pagar', {})).rejects.toThrow('Saldo insuficiente')
  })
})
