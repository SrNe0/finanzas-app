import { Button } from './ui/button'

interface Props {
  titulo?: string
  mensaje: string
  onReintentar?: () => void
}

export function ErrorMensaje({ titulo = 'No se pudo cargar la información', mensaje, onReintentar }: Props) {
  return (
    <div role="alert" className="rounded-lg border border-accent-red/40 bg-accent-red/10 p-4 text-sm">
      <p className="font-medium text-text-primary">{titulo}</p>
      <p className="mt-1 text-text-secondary">{mensaje}</p>
      {onReintentar && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
