import { useAppStore } from '@/store/appStore'
import { GastosTable } from '@/features/gastos/components/GastosTable'

export function GastosPage() {
  const { mesActivo } = useAppStore()
  return <GastosTable mes={mesActivo} />
}
