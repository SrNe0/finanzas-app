import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog'
import { formatCOP, getMesAbr } from '@/shared/lib/utils'
import { useActualizarDeuda, usePagarDeuda, useEliminarDeuda } from '../hooks/useDeudas'
import { PagarDesdeModal } from './PagarDesdeModal'
import type { DeudaDTO, FuenteDTO } from 'shared-types'

const ESTADOS = ['Pendiente', 'En proceso', 'Pagado'] as const

interface Props {
  deuda: DeudaDTO
  arrastrada?: boolean
  fuentes: FuenteDTO[]
}

export function DeudaRow({ deuda, arrastrada, fuentes }: Props) {
  const actualizar = useActualizarDeuda()
  const pagar = usePagarDeuda()
  const eliminar = useEliminarDeuda()
  const [pagarModal, setPagarModal] = useState(false)
  const [montoParaPagar, setMontoParaPagar] = useState(0)
  const saldoRef = useRef<HTMLInputElement>(null)

  const estadoColor = {
    Pendiente: 'red',
    'En proceso': 'amber',
    Pagado: 'green',
  } as const

  const handleEstadoChange = (nuevoEstado: string) => {
    if (nuevoEstado === 'Pagado') {
      setMontoParaPagar(deuda.saldo)
      setPagarModal(true)
    } else {
      actualizar.mutate({ id: deuda.id, data: { estado: nuevoEstado } })
    }
  }

  const handleSaldoBlur = () => {
    const val = parseInt(saldoRef.current?.value ?? String(deuda.saldo))
    if (isNaN(val) || val === deuda.saldo) return
    if (val < deuda.saldo) {
      setMontoParaPagar(deuda.saldo - val)
      setPagarModal(true)
    } else {
      actualizar.mutate({ id: deuda.id, data: { saldo: val } })
    }
  }

  const handlePagarConfirm = (fuenteId: string) => {
    if (montoParaPagar === deuda.saldo) {
      pagar.mutate({ id: deuda.id, data: { fuenteId } })
    } else {
      actualizar.mutate({ id: deuda.id, data: { saldo: deuda.saldo - montoParaPagar, fuenteId } })
    }
    setPagarModal(false)
  }

  return (
    <>
      <tr className={`border-b border-border transition-colors hover:bg-surface/50 ${arrastrada ? 'bg-accent-amber/5' : ''}`}>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-primary">{deuda.nombre}</span>
            {arrastrada && (
              <Badge variant="amber" className="text-[10px] px-1.5 py-0">{getMesAbr(deuda.mes)}</Badge>
            )}
          </div>
        </td>
        <td className="py-3 px-4 font-mono text-sm text-text-secondary">{formatCOP(deuda.valor)}</td>
        <td className="py-3 px-4">
          <input
            ref={saldoRef}
            type="number"
            defaultValue={deuda.saldo}
            key={deuda.saldo}
            onBlur={handleSaldoBlur}
            className="w-28 font-mono text-sm bg-transparent border-b border-transparent hover:border-border focus:border-accent-blue focus:outline-none text-text-primary py-0.5 px-1"
          />
        </td>
        <td className="py-3 px-4">
          <select
            value={deuda.estado}
            onChange={e => handleEstadoChange(e.target.value)}
            className="text-xs bg-transparent border border-border rounded px-2 py-1 text-text-secondary focus:outline-none focus:border-accent-blue"
          >
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </td>
        <td className="py-3 px-4">
          <Badge variant={estadoColor[deuda.estado as keyof typeof estadoColor] ?? 'outline'}>
            {deuda.estado}
          </Badge>
        </td>
        <td className="py-3 px-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-accent-red">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar deuda?</AlertDialogTitle>
                <AlertDialogDescription>Se eliminará "{deuda.nombre}" permanentemente.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => eliminar.mutate(deuda.id)}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </td>
      </tr>
      <PagarDesdeModal
        open={pagarModal}
        onClose={() => setPagarModal(false)}
        onConfirm={handlePagarConfirm}
        fuentes={fuentes}
        monto={montoParaPagar}
        loading={pagar.isPending || actualizar.isPending}
      />
    </>
  )
}
