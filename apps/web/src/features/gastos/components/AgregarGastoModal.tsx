import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useRegistrarGasto } from '../hooks/useGastos'
import { useFuentes } from '@/features/disponible/hooks/useFuentes'
import { Controller } from 'react-hook-form'

const CATEGORIAS = ['Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Ropa', 'Servicios', 'Educación', 'Otro']

const schema = z.object({
  descripcion: z.string().min(1, 'Requerido'),
  categoria: z.string().min(1, 'Requerido'),
  monto: z.coerce.number().int().positive('Debe ser positivo'),
  fuenteId: z.string().optional(),
})

interface Props {
  open: boolean
  onClose: () => void
  mes: string
}

export function AgregarGastoModal({ open, onClose, mes }: Props) {
  const registrar = useRegistrarGasto()
  const { data: fuentes = [] } = useFuentes()
  type FormData = z.infer<typeof schema>
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (data: FormData) => {
    await registrar.mutateAsync({ descripcion: data.descripcion, categoria: data.categoria, monto: data.monto, mes, fuenteId: data.fuenteId || undefined })
    reset()
    onClose()
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Descripción</Label>
            <Input {...register('descripcion')} placeholder="Ej: Mercado" className="mt-1" />
            {errors.descripcion && <p className="text-xs text-accent-red mt-1">{errors.descripcion.message as string}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoría</Label>
              <Controller
                control={control}
                name="categoria"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoria && <p className="text-xs text-accent-red mt-1">{errors.categoria.message as string}</p>}
            </div>
            <div>
              <Label>Monto (COP)</Label>
              <Input type="number" {...register('monto')} placeholder="50000" className="mt-1 font-mono" />
              {errors.monto && <p className="text-xs text-accent-red mt-1">{errors.monto.message as string}</p>}
            </div>
          </div>
          <div>
            <Label>Fuente (opcional)</Label>
            <Controller
              control={control}
              name="fuenteId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sin fuente" /></SelectTrigger>
                  <SelectContent>
                    {fuentes.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={registrar.isPending}>
              {registrar.isPending ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
