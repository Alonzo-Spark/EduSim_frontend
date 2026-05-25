import { create } from 'zustand'

export interface Message {
  id?: string
  sender: string
  text: string
  type?: string
  timestamp?: string
}

interface ExplanationState {
  messages: Message[]
  addMessage: (msg: Message) => void
  clearMessages: () => void
}

export const useExplanationStore = create<ExplanationState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg]
    })),
  clearMessages: () => set({ messages: [] })
}))
