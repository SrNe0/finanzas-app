import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { getMesLabel, addMonths } from '@/shared/lib/utils'
import { Button } from './ui/button'

export function MonthSelector() {
  const { mesActivo, setMesActivo } = useAppStore()

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => setMesActivo(addMonths(mesActivo, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-text-primary min-w-[130px] text-center">
        {getMesLabel(mesActivo)}
      </span>
      <Button variant="ghost" size="icon" onClick={() => setMesActivo(addMonths(mesActivo, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
