import { useAppStore } from '@/store/appStore'
import { ResumenPage } from '@/features/resumen/components/ResumenPage'

export function ResumenPageWrapper() {
  const { mesActivo } = useAppStore()
  return <ResumenPage mes={mesActivo} />
}
