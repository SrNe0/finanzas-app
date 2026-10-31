import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../shared/container'
import { MesSchema } from './schemas'

export async function resumenRoutes(fastify: FastifyInstance, container: Container) {
  fastify.get('/resumen', async (req) => {
    const { mes } = z.object({ mes: MesSchema }).parse(req.query)
    return container.resumen.obtener.execute(mes)
  })
}
