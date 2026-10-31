import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { Layout } from './pages/Layout'
import { useAppStore } from './store/appStore'

// Cada página se descarga cuando se visita: Recharts y el resto de sus dependencias no pesan en la carga inicial.
const ResumenPageWrapper = lazy(() =>
  import('./pages/ResumenPageWrapper').then(m => ({ default: m.ResumenPageWrapper }))
)
const DeudasPage = lazy(() => import('./pages/DeudasPage').then(m => ({ default: m.DeudasPage })))
const GastosPage = lazy(() => import('./pages/GastosPage').then(m => ({ default: m.GastosPage })))
const DisponiblePage = lazy(() => import('./pages/DisponiblePage').then(m => ({ default: m.DisponiblePage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export function App() {
  const theme = useAppStore(state => state.theme)

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<ResumenPageWrapper />} />
              <Route path="deudas" element={<DeudasPage />} />
              <Route path="gastos" element={<GastosPage />} />
              <Route path="disponible" element={<DisponiblePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
      <Toaster theme={theme} position="bottom-right" richColors />
    </QueryClientProvider>
  )
}
