import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildApp, HOST } from '../src/app'
import { buildContainer } from '../src/shared/container'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp(buildContainer(), { logger: false })
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

async function pedir(origin: string) {
  return app.inject({ method: 'GET', url: '/api/ruta-que-no-existe', headers: { origin } })
}

describe('CORS', () => {
  it.each(['http://localhost:5173', 'http://127.0.0.1:5173'])('permite el origen de Vite %s', async origin => {
    const respuesta = await pedir(origin)

    expect(respuesta.headers['access-control-allow-origin']).toBe(origin)
  })

  it.each(['http://sitio-malicioso.example', 'http://localhost:3000', 'http://192.168.1.50:5173'])(
    'no devuelve cabeceras CORS para el origen %s',
    async origin => {
      const respuesta = await pedir(origin)

      expect(respuesta.headers['access-control-allow-origin']).toBeUndefined()
    }
  )

  it('el preflight de un origen no permitido no recibe cabeceras CORS', async () => {
    const respuesta = await app.inject({
      method: 'OPTIONS',
      url: '/api/deudas/abc',
      headers: { origin: 'http://sitio-malicioso.example', 'access-control-request-method': 'DELETE' },
    })

    expect(respuesta.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('el preflight del origen de Vite sí recibe cabeceras CORS', async () => {
    const respuesta = await app.inject({
      method: 'OPTIONS',
      url: '/api/deudas/abc',
      headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'DELETE' },
    })

    expect(respuesta.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })
})

describe('servidor', () => {
  it('escucha solo en la interfaz local', () => {
    expect(HOST).toBe('127.0.0.1')
  })
})
