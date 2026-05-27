import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../shared/container'

const CrearDeudaSchema = z.object({
  nombre: z.string().min(1),
  valor: z.number().int().positive(),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
})

const PagarDeudaSchema = z.object({
  fuenteId: z.string().min(1),
  monto: z.number().int().positive().optional(),
})

const ActualizarDeudaSchema = z.object({
  nombre: z.string().min(1).optional(),
  saldo: z.number().int().min(0).optional(),
  estado: z.enum(['Pendiente', 'En proceso', 'Pagado']).optional(),
  fuenteId: z.string().optional(),
})

export async function deudasRoutes(fastify: FastifyInstance, container: Container) {
  fastify.get('/deudas', async (req) => {
    const query = z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query)
    return container.deudas.listar.execute(query.mes)
  })

  fastify.post('/deudas', async (req, reply) => {
    const body = CrearDeudaSchema.parse(req.body)
    const deuda = await container.deudas.crear.execute(body)
    return reply.code(201).send(deuda)
  })

  fastify.patch('/deudas/:id', async (req) => {
    const { id } = req.params as { id: string }
    const body = ActualizarDeudaSchema.parse(req.body)
    const { deuda } = await container.deudas.actualizar.execute({
      deudaId: id,
      nombre: body.nombre,
      nuevoSaldo: body.saldo,
      nuevoEstado: body.estado as any,
      fuenteId: body.fuenteId,
    })
    return deuda
  })

  fastify.post('/deudas/:id/pagar', async (req) => {
    const { id } = req.params as { id: string }
    const body = PagarDeudaSchema.parse(req.body)
    return container.deudas.pagar.execute({ deudaId: id, ...body })
  })

  fastify.delete('/deudas/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await container.deudas.eliminar.execute(id)
    return reply.code(204).send()
  })
}
