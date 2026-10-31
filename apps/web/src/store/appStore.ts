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
    set => ({
      mesActivo: getCurrentMes(),
      setMesActivo: mes => set({ mesActivo: mes }),
      theme: 'dark',
      toggleTheme: () =>
        set(state => {
          const next = state.theme === 'dark' ? 'light' : 'dark'
          applyTheme(next)
          return { theme: next }
        }),
    }),
    {
      name: 'finanzas-app-store',
      // Solo se guarda el tema: el mes activo siempre arranca en el mes actual.
      partialize: state => ({ theme: state.theme }),
      // Descarta un mes activo guardado por versiones anteriores.
      merge: (persisted, current) => ({
        ...current,
        theme: (persisted as { theme?: 'dark' | 'light' } | undefined)?.theme ?? current.theme,
      }),
      onRehydrateStorage: () => state => {
        if (state) applyTheme(state.theme)
      },
    }
  )
)
