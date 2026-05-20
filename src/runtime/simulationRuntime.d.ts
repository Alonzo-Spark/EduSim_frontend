import { SimulationRuntime as SimulationDsl } from "./schema/simulationDslSchema";

export interface SimulationRuntimeInstance {
  engine: any;
  canvas: HTMLCanvasElement;
  getState: () => {
    paused: boolean;
    time: number;
    timeScale: number;
    dsl: SimulationDsl;
  };
  setDsl: (dsl: any) => void;
  play: () => void;
  pause: () => void;
  reset: (dsl?: any) => void;
  setSpeed: (factor: number) => void;
  step: () => void;
  setTime: (t: number) => void;
  spawnObject: (object: any, position?: { x: number, y: number }, overrides?: any) => any;
  duplicateSelected: () => any;
  deleteSelected: () => boolean;
  toggleLockSelected: () => boolean;
  scaleSelected: (factor?: number) => boolean;
  rotateSelected: (angle?: number) => boolean;
  setSelectedVelocity: (vector: { x: number, y: number }) => boolean;
  setSelectedForce: (vector: { x: number, y: number }) => boolean;
  updateSelectedObject: (patch?: any) => boolean;
  setTimeScale: (scale?: number) => number;
  stepFrame: () => void;
  seekTo: (targetSeconds?: number) => void;
  getSelection: () => any;
  resume: () => void;
  togglePause: () => boolean;
  resize: () => void;
  destroy: () => void;
  removeSelectedObject: () => boolean;
  getAllBodies: () => any[];
  setGravity: (mps2?: number) => void;
  setGlobalMass: (kg?: number) => void;
  setGlobalFriction: (f?: number) => void;
  impulseFirstBody: (vx?: number) => void;
  toggleCollisions: (enabled?: boolean) => void;
  setGlobalVisuals: (patch?: any) => void;
  setSelectedBodyMass: (kg: number) => void;
  setSelectedBodyVelocity: (vx: number) => void;
  setSelectedBodyForce: (fx: number) => void;
  setSelectedBodyFriction: (f: number) => void;
  setZoom: (z: number) => void;
  getZoom: () => number;
  centerCamera: () => void;
  _engine: any;
  _Matter: any;
}

export function createSimulationRuntime(options?: {
  canvas: HTMLCanvasElement;
  dsl: any;
  meterScale?: number;
  onCollision?: (event: any) => void;
  onStateChange?: (state: any) => void;
  onSelectionChange?: (selection: any) => void;
  onAssetsProgress?: (progress: { loaded: number; total: number; failed: number; current?: string }) => void;
}): SimulationRuntimeInstance;

export default createSimulationRuntime;
