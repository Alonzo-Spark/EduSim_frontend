import runtimeEvents from "@/runtime/events/runtimeEvents";

export type TimelineMarker = {
  id: string;
  frameId?: number;
  time?: number;
  type: string;
  category: string;
  severity: "info" | "warning" | "critical";
  label: string;
  annotation?: string;
  payload?: any;
};

function safeNum(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class RuntimeTimeline {
  private markers: TimelineMarker[] = [];
  private unsubscribe: Array<() => void> = [];

  start() {
    this.stop();
    this.unsubscribe = [
      runtimeEvents.on("collision_start", (payload) => this.addMarker({ type: "collision", category: "collision", severity: "critical", label: "Collision", annotation: "Bodies collided and exchanged momentum.", payload })),
      runtimeEvents.on("collision_end", (payload) => this.addMarker({ type: "collision_end", category: "collision", severity: "info", label: "Collision end", annotation: "Bodies separated after impact.", payload })),
      runtimeEvents.on("force_applied", (payload) => this.addMarker({ type: "force", category: "force", severity: "warning", label: "Force applied", annotation: "A force changed velocity or momentum.", payload })),
      runtimeEvents.on("entity_spawned", (payload) => this.addMarker({ type: "spawn", category: "entity", severity: "info", label: "Entity spawned", annotation: "An object entered the simulation.", payload })),
      runtimeEvents.on("preload_complete", (payload) => this.addMarker({ type: "preload", category: "runtime", severity: "info", label: "Preload complete", annotation: "Assets were loaded before runtime initialization.", payload })),
      runtimeEvents.on("runtime_paused", (payload) => this.addMarker({ type: "pause", category: "runtime", severity: "warning", label: "Paused", annotation: "The simulation paused for inspection.", payload })),
      runtimeEvents.on("runtime_resumed", (payload) => this.addMarker({ type: "resume", category: "runtime", severity: "info", label: "Resumed", annotation: "The simulation resumed motion.", payload })),
      runtimeEvents.on("equation_updated", (payload) => this.addMarker({ type: "equation", category: "education", severity: "info", label: "Equation updated", annotation: "An equation or formula was refreshed in realtime.", payload })),
      runtimeEvents.on("runtime_state_changed", (payload) => this.addMarker({ type: "state", category: "runtime", severity: String(payload?.state) === "ERROR" ? "critical" : "info", label: `State: ${payload?.state || "unknown"}`, annotation: "Runtime state changed.", payload })),
    ];
  }

  stop() {
    this.unsubscribe.forEach((dispose) => dispose());
    this.unsubscribe = [];
  }

  clear() {
    this.markers = [];
  }

  addMarker(marker: Omit<TimelineMarker, "id" | "time"> & Partial<Pick<TimelineMarker, "id" | "time">>) {
    const next: TimelineMarker = {
      id: marker.id || `${marker.type}_${this.markers.length}`,
      frameId: safeNum(marker.payload?.frameId, undefined as any),
      time: safeNum(marker.time ?? marker.payload?.time ?? performance.now(), performance.now()),
      type: marker.type,
      category: marker.category,
      severity: marker.severity,
      label: marker.label,
      annotation: marker.annotation,
      payload: marker.payload,
    };
    this.markers.push(next);
    if (this.markers.length > 250) this.markers.splice(0, this.markers.length - 250);
    return next;
  }

  getMarkers() {
    return this.markers;
  }

  getMarkersByCategory(category: string) {
    return this.markers.filter((marker) => marker.category === category);
  }

  getMarkersByType(type: string) {
    return this.markers.filter((marker) => marker.type === type);
  }

  exportJSON() {
    return JSON.stringify(this.markers, null, 2);
  }

  buildTimelineSummary() {
    return this.markers.map((marker) => `${marker.label}: ${marker.annotation}`).join("\n");
  }
}

export function createRuntimeTimeline() {
  return new RuntimeTimeline();
}

export default RuntimeTimeline;
