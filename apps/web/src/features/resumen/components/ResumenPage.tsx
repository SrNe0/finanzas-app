import { Skeleton } from '@/shared/components/ui/skeleton'
import { Progress } from '@/shared/components/ui/progress'
import { formatCOP } from '@/shared/lib/utils'
import { getTooltipProps } from '@/shared/lib/chartConfig'
import { useResumen } from '../hooks/useResumen'
import { useFuentes } from '@/features/disponible/hooks/useFuentes'
import { useAppStore } from '@/store/appStore'
import { TrendingUp, TrendingDown, CreditCard, Wallet } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props { mes: string }

const CATEGORIA_COLORS = ['#58A6FF', '#3FB950', '#F85149', '#D29922', '#79C0FF', '#56D364', '#FFA657', '#8B949E']
const FUENTE_COLORS = ['#58A6FF', '#3FB950', '#D29922', '#79C0FF']

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: '#F85149',
  'En proceso': '#D29922',
  Pagado: '#3FB950',
}

function DonutLabel({ cx, cy, label, value }: { cx: number; cy: number; label: string; value: string }) {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--color-text-primary)" fontSize={13} fontWeight={600} fontFamily="DM Mono, monospace">
        {value}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--color-text-sec)" fontSize={10}>
        {label}
      </text>
    </g>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-text-primary mb-3">{title}</h3>
      {children}
    </div>
  )
}

function EmptyChart({ msg }: { msg: string }) {
  return <div className="flex items-center justify-center h-36 text-sm text-text-secondary">{msg}</div>
}

export function ResumenPage({ mes }: Props) {
  const { data, isLoading } = useResumen(mes)
  const { data: fuentes = [] } = useFuentes()
  const { theme } = useAppStore()
  const tt = getTooltipProps(theme)

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
  }

  if (!data) return null

  const porcentajePagado = data.totalDeudas > 0
    ? Math.round((data.totalDeudasPagadas / data.totalDeudas) * 100)
    : 0

  const deudaPendiente = data.totalDeudas - data.totalDeudasPagadas

  // --- Donut 1: Balance general ---
  // Total = Disponible actual + Pagos de deuda del mes + Gastos del mes
  // Esto representa "de todo el dinero en juego, dónde está"
  const balanceData = [
    { name: 'Disponible actual', value: data.totalDisponible, color: '#3FB950' },
    { name: 'Pagos de deuda', value: data.totalPagosDeuda, color: '#58A6FF' },
    { name: 'Gastos del mes', value: data.totalGastos, color: '#D29922' },
  ].filter(d => d.value > 0)

  const balanceTotal = balanceData.reduce((s, d) => s + d.value, 0)

  // --- Donut 2: Deudas por estado (por monto) ---
  // Pendiente / En proceso → usar saldo restante
  // Pagado → usar valor original (saldo=0 al estar pagada)
  const deudasPorEstado = [
    {
      name: 'Pendiente',
      value: data.deudas.filter(d => d.estado === 'Pendiente').reduce((s, d) => s + d.saldo, 0),
      color: ESTADO_COLORS['Pendiente'],
    },
    {
      name: 'En proceso',
      value: data.deudas.filter(d => d.estado === 'En proceso').reduce((s, d) => s + d.saldo, 0),
      color: ESTADO_COLORS['En proceso'],
    },
    {
      name: 'Pagado',
      value: data.deudas.filter(d => d.estado === 'Pagado').reduce((s, d) => s + d.valor, 0),
      color: ESTADO_COLORS['Pagado'],
    },
  ].filter(d => d.value > 0)

  // --- Donut 3: Gastos por categoría ---
  const categorias = [...new Set(data.gastos.map(g => g.categoria))]
  const gastosPorCategoria = categorias.map((cat, i) => ({
    name: cat,
    value: data.gastos.filter(g => g.categoria === cat).reduce((s, g) => s + g.monto, 0),
    color: CATEGORIA_COLORS[i % CATEGORIA_COLORS.length],
  })).sort((a, b) => b.value - a.value)

  // --- Donut 4: Disponible por fuente ---
  const disponiblePorFuente = fuentes
    .filter(f => f.saldo > 0)
    .map((f, i) => ({
      name: f.nombre,
      value: f.saldo,
      color: FUENTE_COLORS[i % FUENTE_COLORS.length],
    }))

  const metricCards = [
    { label: 'Total ingresos', value: data.totalIngresos, icon: TrendingUp, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    { label: 'Pagos del mes', value: data.totalPagosDeuda, icon: CreditCard, color: 'text-accent-red', bg: 'bg-accent-red/10' },
    { label: 'Total gastos', value: data.totalGastos, icon: TrendingDown, color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
    { label: 'Total disponible', value: data.totalDisponible, icon: Wallet, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
  ]

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metricCards.map(card => (
          <div key={card.label} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-secondary">{card.label}</span>
              <div className={`p-1.5 rounded-md ${card.bg}`}>
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
            </div>
            <p className={`font-mono text-lg font-bold ${card.color}`}>{formatCOP(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Progress bar deudas */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-text-primary">
            Progreso de pagos &nbsp;
            <span className="text-text-secondary font-normal text-xs">
              ({data.deudas.filter(d => d.estado === 'Pagado').length}/{data.deudas.length} deudas pagadas)
            </span>
          </h3>
          <span className="text-sm font-mono text-accent-green font-semibold">{porcentajePagado}%</span>
        </div>
        <Progress value={porcentajePagado} />
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <span>Pagado: <span className="font-mono text-accent-green">{formatCOP(data.totalDeudasPagadas)}</span></span>
          <span>Pendiente: <span className="font-mono text-accent-red">{formatCOP(deudaPendiente)}</span></span>
        </div>
      </div>

      {/* 4 charts grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Chart 1: Balance general */}
        <ChartCard title="Balance general">
          {balanceData.length === 0 ? <EmptyChart msg="Sin datos este mes" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={balanceData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                  label={({ cx, cy }) => (
                    <DonutLabel
                      cx={cx} cy={cy}
                      label="Total"
                      value={formatCOP(balanceTotal)}
                    />
                  )}
                  labelLine={false}
                >
                  {balanceData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCOP(v)}
                  contentStyle={tt.contentStyle}
                  labelStyle={tt.labelStyle}
                  itemStyle={tt.itemStyle}
                />
                <Legend
                  formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 2: Deudas por estado */}
        <ChartCard title="Deudas por estado">
          {deudasPorEstado.length === 0 ? <EmptyChart msg="Sin deudas" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deudasPorEstado}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                  label={({ cx, cy }) => (
                    <DonutLabel
                      cx={cx} cy={cy}
                      label="Saldo total"
                      value={formatCOP(deudasPorEstado.reduce((s, d) => s + d.value, 0))}
                    />
                  )}
                  labelLine={false}
                >
                  {deudasPorEstado.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCOP(v)}
                  contentStyle={tt.contentStyle}
                  labelStyle={tt.labelStyle}
                  itemStyle={tt.itemStyle}
                />
                <Legend
                  formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 3: Gastos por categoría */}
        <ChartCard title="Gastos por categoría">
          {gastosPorCategoria.length === 0 ? <EmptyChart msg="Sin gastos este mes" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={gastosPorCategoria}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                  label={({ cx, cy }) => (
                    <DonutLabel
                      cx={cx} cy={cy}
                      label="Total gastos"
                      value={formatCOP(data.totalGastos)}
                    />
                  )}
                  labelLine={false}
                >
                  {gastosPorCategoria.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [formatCOP(v), name]}
                  contentStyle={tt.contentStyle}
                  labelStyle={tt.labelStyle}
                  itemStyle={tt.itemStyle}
                />
                <Legend
                  formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 4: Disponible por fuente */}
        <ChartCard title="Disponible por fuente">
          {disponiblePorFuente.length === 0 ? <EmptyChart msg="Sin saldos" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={disponiblePorFuente}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                  label={({ cx, cy }) => (
                    <DonutLabel
                      cx={cx} cy={cy}
                      label="Total"
                      value={formatCOP(data.totalDisponible)}
                    />
                  )}
                  labelLine={false}
                >
                  {disponiblePorFuente.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCOP(v)}
                  contentStyle={tt.contentStyle}
                  labelStyle={tt.labelStyle}
                  itemStyle={tt.itemStyle}
                />
                <Legend
                  formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Últimos movimientos */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-text-primary mb-3">Últimos movimientos</h3>
        {data.ultimosMovimientos.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">Sin movimientos este mes</p>
        ) : (
          <div className="divide-y divide-border">
            {data.ultimosMovimientos.map(m => {
              const isPositivo = m.tipo === 'ingreso' || m.tipo === 'transferencia_entrada'
              return (
                <div key={m.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-text-primary">{m.descripcion ?? m.tipo}</p>
                    <p className="text-xs text-text-secondary">
                      {format(new Date(m.fecha), 'd MMM yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <span className={`font-mono text-sm ${isPositivo ? 'text-accent-green' : 'text-accent-red'}`}>
                    {isPositivo ? '+' : '-'}{formatCOP(m.monto)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
