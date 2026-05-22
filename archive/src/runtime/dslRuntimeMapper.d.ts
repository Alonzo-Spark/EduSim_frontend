import { SimulationRuntime } from "./schema/simulationDslSchema";

export function normalizeSimulationDsl(dsl: any, subject?: string, prompt?: string): SimulationRuntime;

export function getAssetPreview(type: string): any;

export function mapObjectTypeToAsset(objectType: string): any;

export function isStaticRuntimeType(objectType: string): boolean;

export default normalizeSimulationDsl;
