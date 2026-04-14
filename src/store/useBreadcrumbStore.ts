import { create } from 'zustand'

interface BreadcrumbStore {
  labels: Record<string, string>
  setLabel: (segment: string, label: string) => void
  clearLabel: (segment: string) => void
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  labels: {},
  setLabel: (segment, label) => 
    set((state) => ({ 
      labels: { ...state.labels, [segment]: label } 
    })),
  clearLabel: (segment) => 
    set((state) => {
      const newLabels = { ...state.labels }
      delete newLabels[segment]
      return { labels: newLabels }
    }),
}))
