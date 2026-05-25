import { SimulationBlueprint } from './types'

export function parseBlueprint(rawJson: any): SimulationBlueprint {
  if (typeof rawJson === 'string') {
    try {
      return JSON.parse(rawJson) as SimulationBlueprint
    } catch (e) {
      console.error("Failed to parse blueprint JSON string:", e)
      throw new Error("Invalid blueprint JSON format")
    }
  }
  
  if (!rawJson || typeof rawJson !== 'object') {
    throw new Error("Blueprint payload must be a valid JSON object")
  }
  
  return rawJson as SimulationBlueprint
}
