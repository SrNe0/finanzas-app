import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { Container } from './shared/container'
import { deudasRoutes } from './interface/routes/deudas.routes'
import { fuentesRoutes } from './interface/routes/fuentes.routes'
import { gastosRoutes } from './interface/routes/gastos.routes'
import { resumenRoutes } from './interface/routes/resumen.routes'
import { DomainError, NotFoundError } from './domain/errors/DomainError'

export const HOST = '127.0.0.1'
export const PORT = 3001
export const ORIGENES_PERMITIDOS = ['http://localhost:5173', 'http://127.0.0.1:5173']

export async function buildApp(container: Container, opciones: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: opciones.logger ?? true })

  await fastify.register(cors, { origin: ORIGENES_PERMITIDOS })

  fastify.register(
    async app => {
      await deudasRoutes(app, container)
      await fuentesRoutes(app, container)
      await gastosRoutes(app, container)
      await resumenRoutes(app, container)
    },
    { prefix: '/api' }
  )

  fastify.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } })
    }
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: error.message } })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } })
    }
    if (error instanceof DomainError) {
      return reply.code(422).send({ error: { code: 'DOMAIN_ERROR', message: error.message } })
    }
    fastify.log.error(error)
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } })
  })

  return fastify
}
