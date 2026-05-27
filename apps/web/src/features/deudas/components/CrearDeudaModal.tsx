import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useCrearDeuda } from '../hooks/useDeudas'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  valor: z.coerce.number().int().positive('Debe ser positivo'),
})

interface Props {
  open: boolean
  onClose: () => void
  mes: string
}

export function CrearDeudaModal({ open, onClose, mes }: Props) {
  const crear = useCrearDeuda()
  type FormData = z.infer<typeof schema>
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (data: FormData) => {
    await crear.mutateAsync({ nombre: data.nombre, valor: data.valor, mes })
    reset()
    onClose()
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Deuda</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre / Acreedor</Label>
            <Input id="nombre" {...register('nombre')} placeholder="Ej: Arriendo" className="mt-1" />
            {errors.nombre && <p className="text-xs text-accent-red mt-1">{errors.nombre.message as string}</p>}
          </div>
          <div>
            <Label htmlFor="valor">Valor (COP)</Label>
            <Input id="valor" type="number" {...register('valor')} placeholder="500000" className="mt-1 font-mono" />
            {errors.valor && <p className="text-xs text-accent-red mt-1">{errors.valor.message as string}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending ? 'Guardando...' : 'Crear Deuda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
