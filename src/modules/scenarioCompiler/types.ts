export interface SimulationBlueprint {
  scenario: ScenarioConfig
  assets: AssetConfig[]
  world: WorldConfig
  objects: SimulationObject[]
  constraints: ConstraintConfig[]
  controllers: ControllerConfig[]
  formulas: FormulaConfig[]
  aiExplanations: AIExplanation[]
  interactions: RuntimeInteraction[]
  educationalInsights: EducationalInsight[]
  misconceptions: Misconception[]
  questions: LearningQuestion[]
}

export interface ScenarioConfig {
  title: string
  topic: string
  subject: string
  difficulty: string
  simulationType: string
  learningObjectives: string[]
  description?: string
}

export interface AssetConfig {
  id: string
  name: string
  category: string
  icon?: string
}

export interface WorldConfig {
  gravity: {
    x: number
    y: number
    scale?: number
  }
  background: string
  cameraMode: string
  simulationSpeed: string
  showGrid: boolean
  showVectors: boolean
}

export interface SimulationObject {
  id: string
  type: string
  label: string
  position: {
    x: number
    y: number
  }
  physics: {
    mass?: number
    friction?: number
    restitution?: number
    velocity?: {
      x: number
      y: number
    }
  }
  visual: {
    color?: string
    radius?: number
    width?: number
    height?: number
  }
  educationalRole: string
}

export interface ConstraintConfig {
  id: string
  type: string
  source: string
  target: string
  stiffness?: number
}

export interface ControllerConfig {
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

export interface FormulaConfig {
  title: string
  latex: string
  variables: string[]
  intuition: string
}

export interface RuntimeInteraction {
  trigger: string
  target: string
  effect: string
  aiExplanation: string
}

export interface AIExplanation {
  type: string
  content: string
}

export interface EducationalInsight {
  title: string
  content: string
}

export interface Misconception {
  misconception: string
  correction: string
}

export interface LearningQuestion {
  question: string
}
