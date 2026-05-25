import { SimulationBlueprint } from './types'

export async function generateScenario(
  exampleText: string
): Promise<SimulationBlueprint> {
  try {
    const response = await fetch('http://localhost:8000/api/scenario/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: exampleText })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Primary API port 8000 failed. Falling back to active dev port 8001...", error);
    const response = await fetch('http://localhost:8001/api/scenario/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: exampleText })
    });
    if (!response.ok) {
      throw new Error(`HTTP fallback error! status: ${response.status}`);
    }
    return await response.json();
  }
}
