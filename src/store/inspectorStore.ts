import { create } from 'zustand'

export interface Controller {
  id: string
  label: string
  type: string
  target: string
  property: string
  min: number
  max: number
  default: number
  educationalPurpose: string
}

interface InspectorStore {
  controllers: Controller[]
  setControllers: (controllers: Controller[]) => void
}

export const useInspectorStore = create<InspectorStore>((set) => ({
  controllers: [],
  setControllers: (controllers) => set({ controllers })
}))
