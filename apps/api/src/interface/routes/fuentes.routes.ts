import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Container } from '../../shared/container'

const CrearFuenteSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['cuenta', 'efectivo', 'bono', 'otro']),
})

const IngresoSchema = z.object({
  monto: z.number().int().positive(),
  descripcion: z.string().optional(),
})

const TransferirSchema = z.object({
  origenId: z.string().min(1),
  destinoId: z.string().min(1),
  monto: z.number().int().positive(),
  descripcion: z.string().optional(),
})

export async function fuentesRoutes(fastify: FastifyInstance, container: Container) {
  fastify.get('/fuentes', async () => {
    return container.fuentes.listar.execute()
  })

  fastify.post('/fuentes', async (req, reply) => {
    const body = CrearFuenteSchema.parse(req.body)
    const fuente = await container.fuentes.crear.execute(body as any)
    return reply.code(201).send(fuente)
  })

  fastify.post('/fuentes/:id/ingresar', async (req) => {
    const { id } = req.params as { id: string }
    const body = IngresoSchema.parse(req.body)
    return container.fuentes.ingreso.execute(id, body)
  })

  fastify.get('/fuentes/:id/movimientos', async (req) => {
    const { id } = req.params as { id: string }
    return container.fuentes.historial.execute(id)
  })

  fastify.post('/fuentes/transferir', async (req) => {
    const body = TransferirSchema.parse(req.body)
    return container.fuentes.transferir.execute(body)
  })
}
