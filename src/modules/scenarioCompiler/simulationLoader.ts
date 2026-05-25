import { SimulationBlueprint } from './types'
import { spawnObjects } from '../sandbox/objectSpawner'
import { loadAssets } from './assetMapper'
import { createControllers } from './controllerMapper'
import { renderFormulaCards } from '../formulaLab/formulaRenderer'
import { loadAIExplanations } from './explanationEngine'

export async function loadScenario(
  blueprint: SimulationBlueprint
) {
  console.log("Loading AI-compiled textbook scenario:", blueprint.scenario?.title);

  if (blueprint.assets && Array.isArray(blueprint.assets)) {
    await loadAssets(blueprint.assets)
  }

  if (blueprint.objects && Array.isArray(blueprint.objects)) {
    await spawnObjects(blueprint.objects)
  }

  if (blueprint.controllers && Array.isArray(blueprint.controllers)) {
    await createControllers(blueprint.controllers)
  }

  if (blueprint.formulas && Array.isArray(blueprint.formulas)) {
    await renderFormulaCards(blueprint.formulas)
  }

  if (blueprint.aiExplanations && Array.isArray(blueprint.aiExplanations)) {
    await loadAIExplanations(blueprint.aiExplanations)
  }
  
  console.log("Loaded textbook scenario blueprint successfully!");
}
