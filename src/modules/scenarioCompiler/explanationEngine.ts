import { useExplanationStore } from '../aiExplanation/explanationStore'

export async function loadAIExplanations(explanations: any[]) {
  const addMessage = useExplanationStore.getState().addMessage
  
  if (explanations && Array.isArray(explanations)) {
    explanations.forEach((exp) => {
      addMessage({
        id: `compiler-${Date.now()}-${Math.random()}`,
        sender: 'AI Scenario Compiler',
        text: exp.content || exp.text || '',
        type: exp.type || 'initial',
        timestamp: new Date().toLocaleTimeString()
      })
    })
  }
}
