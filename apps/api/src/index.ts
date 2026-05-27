import Fastify from 'fastify'
import cors from '@fastify/cors'
import { buildContainer } from './shared/container'
import { deudasRoutes } from './interface/routes/deudas.routes'
import { fuentesRoutes } from './interface/routes/fuentes.routes'
import { gastosRoutes } from './interface/routes/gastos.routes'
import { resumenRoutes } from './interface/routes/resumen.routes'
import { DomainError, NotFoundError } from './domain/errors/DomainError'
import { ZodError } from 'zod'

const fastify = Fastify({ logger: true })

async function start() {
  await fastify.register(cors, { origin: true })

  const container = buildContainer()

  fastify.register(async (app) => {
    await deudasRoutes(app, container)
    await fuentesRoutes(app, container)
    await gastosRoutes(app, container)
    await resumenRoutes(app, container)
  }, { prefix: '/api' })

  fastify.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } })
    }
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: error.message } })
    }
    if (error instanceof DomainError) {
      return reply.code(422).send({ error: { code: 'DOMAIN_ERROR', message: error.message } })
    }
    fastify.log.error(error)
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } })
  })

  await fastify.listen({ port: 3001, host: '0.0.0.0' })
}

start().catch(console.error)
