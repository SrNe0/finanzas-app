import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useCrearFuente } from '../hooks/useFuentes'

const TIPOS = ['cuenta', 'efectivo', 'bono', 'otro'] as const
const TIPO_LABELS: Record<string, string> = {
  cuenta: '🏦 Cuenta bancaria',
  efectivo: '💵 Efectivo',
  bono: '🎁 Bono / Gift card',
  otro: '💼 Otro',
}

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50),
  tipo: z.enum(TIPOS, { required_error: 'Selecciona un tipo' }),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

export function NuevaFuenteModal({ open, onClose }: Props) {
  const crear = useCrearFuente()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = handleSubmit(async (data) => {
    await crear.mutateAsync(data)
    reset()
    onClose()
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva fuente</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Ej: Cuenta Nequi, Efectivo cartera..."
              className="mt-1"
            />
            {errors.nombre && <p className="text-xs text-accent-red mt-1">{errors.nombre.message as string}</p>}
          </div>

          <div>
            <Label>Tipo</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {TIPOS.map(tipo => (
                <label
                  key={tipo}
                  className="flex items-center gap-2 p-2.5 border border-border rounded-lg cursor-pointer hover:border-text-secondary has-[:checked]:border-accent-blue has-[:checked]:bg-accent-blue/10"
                >
                  <input type="radio" value={tipo} {...register('tipo')} className="accent-accent-blue" />
                  <span className="text-sm text-text-primary">{TIPO_LABELS[tipo]}</span>
                </label>
              ))}
            </div>
            {errors.tipo && <p className="text-xs text-accent-red mt-1">{errors.tipo.message as string}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending ? 'Creando...' : 'Crear fuente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
