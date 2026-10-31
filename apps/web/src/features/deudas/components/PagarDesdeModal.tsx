import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { formatCOP } from '@/shared/lib/utils'
import type { FuenteDTO } from 'shared-types'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (fuenteId: string) => void
  fuentes: FuenteDTO[]
  monto: number
  loading?: boolean
}

export function PagarDesdeModal({ open, onClose, onConfirm, fuentes, monto, loading }: Props) {
  const [selected, setSelected] = useState<string>('')

  const fuenteElegida = fuentes.find(f => f.id === selected)
  const saldoInsuficiente = fuenteElegida ? fuenteElegida.saldo < monto : false

  const handleClose = () => {
    setSelected('')
    onClose()
  }

  const handleConfirm = () => {
    onConfirm(selected)
    setSelected('')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿De dónde salió la plata?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-text-secondary mb-4">Monto: <span className="font-mono text-text-primary">{formatCOP(monto)}</span></p>
        <div className="space-y-2">
          {fuentes.map(f => (
            <button
              key={f.id}
              onClick={() => setSelected(f.id)}
              className={`w-full flex justify-between items-center p-3 rounded-lg border transition-colors ${
                selected === f.id ? 'border-accent-blue bg-accent-blue/10' : 'border-border hover:border-text-secondary'
              }`}
            >
              <span className="text-sm text-text-primary">{f.nombre}</span>
              <div className="text-right">
                <div className="text-xs text-text-secondary capitalize">{f.tipo}</div>
                <div className={`font-mono text-sm ${f.saldo < monto ? 'text-accent-amber' : 'text-accent-green'}`}>
                  {formatCOP(f.saldo)}
                </div>
                {f.saldo < monto && <div className="text-xs text-accent-amber">Saldo insuficiente</div>}
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button disabled={!selected || saldoInsuficiente || loading} onClick={handleConfirm}>
            {loading ? 'Procesando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
