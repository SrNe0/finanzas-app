import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../shared/container'

export async function resumenRoutes(fastify: FastifyInstance, container: Container) {
  fastify.get('/resumen', async (req) => {
    const { mes } = z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query)
    return container.resumen.obtener.execute(mes)
  })
}
