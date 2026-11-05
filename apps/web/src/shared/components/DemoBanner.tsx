/** Aviso de la demo pública. Solo se muestra si la web se compiló con VITE_DEMO_BANNER; en la app normal no aparece. */
export function DemoBanner() {
  if (!import.meta.env.VITE_DEMO_BANNER) return null

  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-300"
    >
      <strong>Demo pública compartida:</strong> todos los visitantes ven y modifican los mismos datos ficticios. Se
      restablece cada noche. No escribas información real.
    </div>
  )
}
