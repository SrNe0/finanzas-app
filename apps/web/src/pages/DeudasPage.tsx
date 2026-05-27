import { useAppStore } from '@/store/appStore'
import { DeudasTable } from '@/features/deudas/components/DeudasTable'

export function DeudasPage() {
  const { mesActivo } = useAppStore()
  return <DeudasTable mes={mesActivo} />
}
