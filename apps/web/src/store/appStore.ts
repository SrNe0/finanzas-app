import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppStore {
  mesActivo: string
  setMesActivo: (mes: string) => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

function getCurrentMes(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      mesActivo: getCurrentMes(),
      setMesActivo: (mes) => set({ mesActivo: mes }),
      theme: 'dark',
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark'
          applyTheme(next)
          return { theme: next }
        }),
    }),
    {
      name: 'finanzas-app-store',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    }
  )
)
