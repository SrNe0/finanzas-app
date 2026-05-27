import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../shared/container'

const RegistrarGastoSchema = z.object({
  descripcion: z.string().min(1),
  categoria: z.string().min(1),
  monto: z.number().int().positive(),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  fuenteId: z.string().optional(),
})

export async function gastosRoutes(fastify: FastifyInstance, container: Container) {
  fastify.get('/gastos', async (req) => {
    const { mes } = z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query)
    return container.gastos.listar.execute(mes)
  })

  fastify.post('/gastos', async (req, reply) => {
    const body = RegistrarGastoSchema.parse(req.body)
    const gasto = await container.gastos.registrar.execute(body)
    return reply.code(201).send(gasto)
  })

  fastify.delete('/gastos/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await container.gastos.eliminar.execute(id)
    return reply.code(204).send()
  })
}
