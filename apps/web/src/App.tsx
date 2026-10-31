import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { Layout } from './pages/Layout'
import { ResumenPageWrapper } from './pages/ResumenPageWrapper'
import { DeudasPage } from './pages/DeudasPage'
import { GastosPage } from './pages/GastosPage'
import { DisponiblePage } from './pages/DisponiblePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export function App() {
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
      <Toaster theme="dark" position="bottom-right" richColors />
    </QueryClientProvider>
  )
}
