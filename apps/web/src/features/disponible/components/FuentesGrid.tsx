import { useState } from 'react'
import { Plus, History, ArrowLeftRight, Landmark } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCOP } from '@/shared/lib/utils'
import { useFuentes } from '../hooks/useFuentes'
import { NuevoIngresoModal } from './NuevoIngresoModal'
import { NuevaFuenteModal } from './NuevaFuenteModal'
import { HistorialFuente } from './HistorialFuente'
import { TransferenciaModal } from './TransferenciaModal'
import type { FuenteDTO } from 'shared-types'

const TIPO_ICONS: Record<string, string> = {
  cuenta: '🏦',
  efectivo: '💵',
  bono: '🎁',
  otro: '💼',
}

export function FuentesGrid() {
  const { data: fuentes = [], isLoading } = useFuentes()
  const [ingresoOpen, setIngresoOpen] = useState(false)
  const [transferenciaOpen, setTransferenciaOpen] = useState(false)
  const [nuevaFuenteOpen, setNuevaFuenteOpen] = useState(false)
  const [historialFuente, setHistorialFuente] = useState<FuenteDTO | null>(null)

  const totalDisponible = fuentes.reduce((s, f) => s + f.saldo, 0)

  if (isLoading) {
    return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Disponible</h2>
          <p className="text-2xl font-mono font-bold text-accent-green mt-1">{formatCOP(totalDisponible)}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setNuevaFuenteOpen(true)}>
            <Landmark className="h-4 w-4 mr-1" /> Nueva fuente
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTransferenciaOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-1" /> Mover plata
          </Button>
          <Button size="sm" onClick={() => setIngresoOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo ingreso
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fuentes.map(f => (
          <div key={f.id} className="bg-surface border border-border rounded-lg p-4 hover:border-text-secondary transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg">{TIPO_ICONS[f.tipo] ?? '💼'}</div>
                <h3 className="text-sm font-medium text-text-primary mt-1">{f.nombre}</h3>
                <p className="text-xs text-text-secondary capitalize">{f.tipo}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary" onClick={() => setHistorialFuente(f)}>
                <History className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="font-mono text-xl font-bold text-text-primary mt-3">{formatCOP(f.saldo)}</p>
          </div>
        ))}
      </div>

      <NuevoIngresoModal open={ingresoOpen} onClose={() => setIngresoOpen(false)} fuentes={fuentes} />
      <TransferenciaModal open={transferenciaOpen} onClose={() => setTransferenciaOpen(false)} fuentes={fuentes} />
      <NuevaFuenteModal open={nuevaFuenteOpen} onClose={() => setNuevaFuenteOpen(false)} />
      {historialFuente && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setHistorialFuente(null)} />}
      <HistorialFuente fuente={historialFuente} onClose={() => setHistorialFuente(null)} />
    </div>
  )
}
