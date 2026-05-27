import { X, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCOP } from '@/shared/lib/utils'
import { useHistorialFuente } from '../hooks/useFuentes'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FuenteDTO } from 'shared-types'

interface Props {
  fuente: FuenteDTO | null
  onClose: () => void
}

export function HistorialFuente({ fuente, onClose }: Props) {
  const { data: movimientos, isLoading } = useHistorialFuente(fuente?.id ?? '')

  if (!fuente) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface border-l border-border shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-text-primary">{fuente.nombre}</h3>
          <p className="text-xs text-text-secondary capitalize">{fuente.tipo}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        {!isLoading && movimientos?.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">Sin movimientos</p>
        )}
        {movimientos?.map(m => (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-2">
              {m.tipo === 'ingreso'
                ? <TrendingUp className="h-4 w-4 text-accent-green shrink-0" />
                : <TrendingDown className="h-4 w-4 text-accent-red shrink-0" />}
              <div>
                <p className="text-xs text-text-primary">{m.descripcion ?? m.tipo}</p>
                <p className="text-[11px] text-text-secondary">
                  {format(new Date(m.fecha), 'd MMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
            <span className={`font-mono text-sm ${m.tipo === 'ingreso' ? 'text-accent-green' : 'text-accent-red'}`}>
              {m.tipo === 'ingreso' ? '+' : '-'}{formatCOP(m.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
