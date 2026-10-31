import { useState, useEffect } from 'react'
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
  const [saldoInput, setSaldoInput] = useState(String(deuda.saldo))

  useEffect(() => {
    setSaldoInput(String(deuda.saldo))
  }, [deuda.saldo])

  const estadoColor = {
    Pendiente: 'red',
    'En proceso': 'amber',
    Pagado: 'green',
  } as const

  const handleEstadoChange = (nuevoEstado: string) => {
    if (nuevoEstado === 'Pagado' && deuda.saldo > 0) {
      setMontoParaPagar(deuda.saldo)
      setPagarModal(true)
    } else {
      actualizar.mutate({ id: deuda.id, data: { estado: nuevoEstado } })
    }
  }

  const restaurarSaldo = () => setSaldoInput(String(deuda.saldo))

  // El saldo solo se registra con una acción explícita (Enter), no al salir del campo.
  const confirmarSaldo = () => {
    const val = parseInt(saldoInput, 10)
    if (isNaN(val) || val < 0 || val === deuda.saldo) {
      restaurarSaldo()
      return
    }
    if (val < deuda.saldo) {
      setMontoParaPagar(deuda.saldo - val)
      setPagarModal(true)
    } else {
      actualizar.mutate({ id: deuda.id, data: { saldo: val } }, { onError: restaurarSaldo })
    }
  }

  const cancelarPago = () => {
    setPagarModal(false)
    restaurarSaldo()
  }

  const handlePagarConfirm = (fuenteId: string) => {
    if (montoParaPagar === deuda.saldo) {
      pagar.mutate({ id: deuda.id, data: { fuenteId } }, { onError: restaurarSaldo })
    } else {
      actualizar.mutate(
        { id: deuda.id, data: { saldo: deuda.saldo - montoParaPagar, fuenteId } },
        { onError: restaurarSaldo }
      )
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
            type="number"
            min={0}
            value={saldoInput}
            onChange={e => setSaldoInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmarSaldo()
              if (e.key === 'Escape') restaurarSaldo()
            }}
            onBlur={() => { if (!pagarModal) restaurarSaldo() }}
            title="Enter para registrar el pago, Esc para cancelar"
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
                <AlertDialogDescription>
                  Se eliminará "{deuda.nombre}" permanentemente.
                  {deuda.valor > deuda.saldo && (
                    <> Se devolverán a las fuentes los abonos registrados (hasta {formatCOP(deuda.valor - deuda.saldo)}).</>
                  )}
                </AlertDialogDescription>
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
        onClose={cancelarPago}
        onConfirm={handlePagarConfirm}
        fuentes={fuentes}
        monto={montoParaPagar}
        loading={pagar.isPending || actualizar.isPending}
      />
    </>
  )
}
