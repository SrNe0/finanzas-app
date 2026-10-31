import { Skeleton } from './ui/skeleton'

/** Estado de carga mientras llega el código de una página que se carga de forma diferida. */
export function Cargando() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
