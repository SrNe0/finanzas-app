import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useRegistrarIngreso } from '../hooks/useFuentes'
import { formatCOP } from '@/shared/lib/utils'
import type { FuenteDTO } from 'shared-types'

const schema = z.object({
  fuenteId: z.string().min(1, 'Selecciona una fuente'),
  monto: z.coerce.number().int().positive('Debe ser positivo'),
  descripcion: z.string().optional(),
})

interface Props {
  open: boolean
  onClose: () => void
  fuentes: FuenteDTO[]
}

export function NuevoIngresoModal({ open, onClose, fuentes }: Props) {
  const ingreso = useRegistrarIngreso()
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async ({ fuenteId, monto, descripcion }) => {
    await ingreso.mutateAsync({ id: fuenteId, data: { monto, descripcion } })
    reset()
    onClose()
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Ingreso</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Destino</Label>
            <div className="mt-1 space-y-2">
              {fuentes.map(f => (
                <label key={f.id} className="flex items-center justify-between p-2.5 border border-border rounded-lg cursor-pointer hover:border-text-secondary has-[:checked]:border-accent-blue has-[:checked]:bg-accent-blue/10">
                  <div className="flex items-center gap-2">
                    <input type="radio" value={f.id} {...register('fuenteId')} className="accent-accent-blue" />
                    <span className="text-sm text-text-primary">{f.nombre}</span>
                    <span className="text-xs text-text-secondary capitalize">({f.tipo})</span>
                  </div>
                  <span className="font-mono text-sm text-accent-green">{formatCOP(f.saldo)}</span>
                </label>
              ))}
            </div>
            {errors.fuenteId && <p className="text-xs text-accent-red mt-1">{errors.fuenteId.message as string}</p>}
          </div>
          <div>
            <Label htmlFor="monto">Monto (COP)</Label>
            <Input id="monto" type="number" {...register('monto')} placeholder="1000000" className="mt-1 font-mono" />
            {errors.monto && <p className="text-xs text-accent-red mt-1">{errors.monto.message as string}</p>}
          </div>
          <div>
            <Label htmlFor="desc">Descripción (opcional)</Label>
            <Input id="desc" {...register('descripcion')} placeholder="Ej: Quincena" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={ingreso.isPending}>
              {ingreso.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
