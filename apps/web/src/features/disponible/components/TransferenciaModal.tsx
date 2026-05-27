import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { formatCOP } from '@/shared/lib/utils'
import { useTransferirFuentes } from '../hooks/useFuentes'
import type { FuenteDTO } from 'shared-types'

const TIPO_ICONS: Record<string, string> = {
  cuenta: '🏦',
  efectivo: '💵',
  bono: '🎁',
  otro: '💼',
}

interface Props {
  open: boolean
  onClose: () => void
  fuentes: FuenteDTO[]
}

export function TransferenciaModal({ open, onClose, fuentes }: Props) {
  const transferir = useTransferirFuentes()
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const origen = fuentes.find(f => f.id === origenId)
  const destino = fuentes.find(f => f.id === destinoId)
  const montoNum = parseInt(monto) || 0
  const saldoInsuficiente = origen ? montoNum > origen.saldo : false
  const canSubmit = origenId && destinoId && origenId !== destinoId && montoNum > 0 && !saldoInsuficiente

  const handleClose = () => {
    setOrigenId('')
    setDestinoId('')
    setMonto('')
    setDescripcion('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    await transferir.mutateAsync({ origenId, destinoId, monto: montoNum, descripcion: descripcion || undefined })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mover plata entre fuentes</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block">Origen</Label>
              <div className="space-y-1.5">
                {fuentes.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setOrigenId(f.id); if (destinoId === f.id) setDestinoId('') }}
                    disabled={destinoId === f.id}
                    className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      origenId === f.id
                        ? 'border-accent-red bg-accent-red/10 text-text-primary'
                        : 'border-border hover:border-text-secondary text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{TIPO_ICONS[f.tipo] ?? '💼'}</span>
                      <span className="font-medium truncate">{f.nombre}</span>
                    </div>
                    <div className="font-mono text-xs mt-0.5 text-accent-green">{formatCOP(f.saldo)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Destino</Label>
              <div className="space-y-1.5">
                {fuentes.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setDestinoId(f.id); if (origenId === f.id) setOrigenId('') }}
                    disabled={origenId === f.id}
                    className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      destinoId === f.id
                        ? 'border-accent-blue bg-accent-blue/10 text-text-primary'
                        : 'border-border hover:border-text-secondary text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{TIPO_ICONS[f.tipo] ?? '💼'}</span>
                      <span className="font-medium truncate">{f.nombre}</span>
                    </div>
                    <div className="font-mono text-xs mt-0.5 text-accent-green">{formatCOP(f.saldo)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {origen && destino && (
            <div className="flex items-center justify-center gap-2 text-xs text-text-secondary">
              <span className="text-accent-red font-medium">{origen.nombre}</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="text-accent-blue font-medium">{destino.nombre}</span>
            </div>
          )}

          <div>
            <Label htmlFor="monto-transferencia">Monto (COP)</Label>
            <Input
              id="monto-transferencia"
              type="number"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="100000"
              className="mt-1 font-mono"
            />
            {saldoInsuficiente && (
              <p className="text-xs text-accent-amber mt-1">
                Saldo insuficiente. Disponible en {origen?.nombre}: {formatCOP(origen?.saldo ?? 0)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="desc-transferencia">Descripción (opcional)</Label>
            <Input
              id="desc-transferencia"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Retiro del cajero"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button disabled={!canSubmit || transferir.isPending} onClick={handleSubmit}>
              {transferir.isPending ? 'Transfiriendo...' : 'Transferir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
