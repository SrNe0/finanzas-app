import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { MonthSelector } from '@/shared/components/MonthSelector'
import { useAppStore } from '@/store/appStore'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

const TABS = [
  { path: '/', label: 'Resumen' },
  { path: '/deudas', label: 'Deudas' },
  { path: '/gastos', label: 'Gastos' },
  { path: '/disponible', label: 'Disponible' },
]

export function Layout() {
  const { theme, toggleTheme } = useAppStore()
  const location = useLocation()
  const isDisponible = location.pathname === '/disponible'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-semibold text-text-primary text-sm whitespace-nowrap">💰 Finanzas</span>
            <nav className="flex ml-4">
              {TABS.map(tab => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-sm rounded-md transition-colors ${isActive ? 'text-text-primary bg-surface' : 'text-text-secondary hover:text-text-primary'}`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {!isDisponible && <MonthSelector />}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
