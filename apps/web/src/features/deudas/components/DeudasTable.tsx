import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useDeudas } from '../hooks/useDeudas'
import { DeudaRow } from './DeudaRow'
import { CrearDeudaModal } from './CrearDeudaModal'
import { useFuentes } from '@/features/disponible/hooks/useFuentes'

interface Props {
  mes: string
}

export function DeudasTable({ mes }: Props) {
  const { data, isLoading } = useDeudas(mes)
  const { data: fuentes = [] } = useFuentes()
  const [crearOpen, setCrearOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  const delMes = data?.delMes ?? []
  const arrastradas = data?.arrastradas ?? []
  const total = delMes.length + arrastradas.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">
          Deudas <span className="text-text-secondary font-normal text-sm">({total})</span>
        </h2>
        <Button size="sm" onClick={() => setCrearOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva deuda
        </Button>
      </div>

      {total === 0 ? (
        <div className="text-center py-12 text-text-secondary text-sm">Sin deudas para este mes</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Nombre</th>
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Valor</th>
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Saldo</th>
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Cambiar estado</th>
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Estado</th>
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {arrastradas.length > 0 && (
                <>
                  <tr className="bg-accent-amber/5">
                    <td colSpan={6} className="px-4 py-1.5 text-xs text-accent-amber font-medium">Arrastradas de meses anteriores</td>
                  </tr>
                  {arrastradas.map(d => <DeudaRow key={d.id} deuda={d} arrastrada fuentes={fuentes} />)}
                </>
              )}
              {delMes.map(d => <DeudaRow key={d.id} deuda={d} fuentes={fuentes} />)}
            </tbody>
          </table>
        </div>
      )}

      <CrearDeudaModal open={crearOpen} onClose={() => setCrearOpen(false)} mes={mes} />
    </div>
  )
}
