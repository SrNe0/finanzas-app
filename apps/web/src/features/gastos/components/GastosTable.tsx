import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { getTooltipProps } from '@/shared/lib/chartConfig'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog'
import { formatCOP } from '@/shared/lib/utils'
import { useGastos, useEliminarGasto } from '../hooks/useGastos'
import { AgregarGastoModal } from './AgregarGastoModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { mes: string }

const COLORS = ['#58A6FF', '#3FB950', '#F85149', '#D29922', '#8B949E', '#79C0FF', '#56D364', '#FFA657']

export function GastosTable({ mes }: Props) {
  const { data: gastos = [], isLoading } = useGastos(mes)
  const eliminar = useEliminarGasto()
  const { theme } = useAppStore()
  const tt = getTooltipProps(theme)
  const [agregarOpen, setAgregarOpen] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const categorias = [...new Set(gastos.map(g => g.categoria))]
  const filtrados = filtroCategoria ? gastos.filter(g => g.categoria === filtroCategoria) : gastos
  const total = gastos.reduce((s, g) => s + g.monto, 0)

  const porCategoria = categorias.map(cat => ({
    name: cat,
    value: gastos.filter(g => g.categoria === cat).reduce((s, g) => s + g.monto, 0),
  }))

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Gastos</h2>
          <p className="text-sm text-text-secondary">Total: <span className="font-mono text-accent-red">{formatCOP(total)}</span></p>
        </div>
        <Button size="sm" onClick={() => setAgregarOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar gasto
        </Button>
      </div>

      {gastos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setFiltroCategoria('')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!filtroCategoria ? 'border-accent-blue text-accent-blue bg-accent-blue/10' : 'border-border text-text-secondary'}`}
              >
                Todas
              </button>
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat === filtroCategoria ? '' : cat)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filtroCategoria === cat ? 'border-accent-blue text-accent-blue bg-accent-blue/10' : 'border-border text-text-secondary'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porCategoria} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                  {porCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCOP(v)}
                  contentStyle={tt.contentStyle}
                  labelStyle={tt.labelStyle}
                  itemStyle={tt.itemStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="text-center py-10 text-text-secondary text-sm">Sin gastos para este mes</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Descripción</th>
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Categoría</th>
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Fecha</th>
                <th className="text-left text-xs text-text-secondary font-medium py-2.5 px-4">Monto</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(g => (
                <tr key={g.id} className="border-b border-border hover:bg-surface/50">
                  <td className="py-3 px-4 text-sm text-text-primary">{g.descripcion}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{g.categoria}</Badge></td>
                  <td className="py-3 px-4 text-xs text-text-secondary">
                    {format(new Date(g.fecha), 'd MMM', { locale: es })}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-accent-red">{formatCOP(g.monto)}</td>
                  <td className="py-3 px-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-accent-red">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
                          <AlertDialogDescription>Se eliminará "{g.descripcion}" permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => eliminar.mutate(g.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AgregarGastoModal open={agregarOpen} onClose={() => setAgregarOpen(false)} mes={mes} />
    </div>
  )
}
