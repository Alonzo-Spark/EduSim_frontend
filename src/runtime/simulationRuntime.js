import Matter from "matter-js";
import { normalizeSimulationDsl } from "./dslRuntimeMapper";
import { validatePhysicsScene } from "./validators/physicsValidator";
import { preloadAssets, getCachedImage } from "./assets/preloadAssets";
import { PhysicsInteractionEngine } from "./PhysicsInteractionEngine";
import runtimeEvents from "@/runtime/events/runtimeEvents";

const DEFAULT_METERS_TO_PIXELS = 50;
const FRAME_STEP = 1000 / 60;

function toPx(value, scale) {
  return Number(value || 0) * scale;
}

function createTextureCache() {
  const cache = new Map();
  const failedAssets = new Set();
  const onReadyCallbacks = new Map();

  const FALLBACK_ASSETS = [
    "/assets/physics/balls/ball_generic/ball_generic1.png",
    "/assets/physics/interactables/block_locked_square/block_locked_square.png",
    "/assets/terrain/road/road_asphalt/road_asphalt.png",
  ];

  function getFallbackAsset(attemptIndex = 0) {
    return FALLBACK_ASSETS[attemptIndex % FALLBACK_ASSETS.length];
  }

  function load(path, onReady) {
    if (!path) return null;

    if (onReady && typeof onReady === "function") {
      if (!onReadyCallbacks.has(path)) onReadyCallbacks.set(path, []);
      onReadyCallbacks.get(path).push(onReady);
    }

    if (cache.has(path)) {
      const img = cache.get(path);
      if (img.complete && (img.naturalWidth > 0 || failedAssets.has(path)) && onReady) {
        onReady(img);
      }
      return img;
    }

    // Check global preloader cache to reuse already-loaded images
    try {
      const preImg = getCachedImage(path);
      if (preImg) {
        cache.set(path, preImg);
        if (onReady) onReady(preImg);
        return preImg;
      }
    } catch (e) {
      // ignore
    }

    console.log("[TextureCache] Loading sprite:", path);
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";

    let fallbackAttempts = 0;
    const maxFallbackAttempts = FALLBACK_ASSETS.length;

    const handleLoad = () => {
      if (image.naturalWidth > 0) {
        console.log("[TextureCache] Loaded successfully:", path);
        const cbs = onReadyCallbacks.get(path) || [];
        for (const cb of cbs) cb(image);
        onReadyCallbacks.delete(path);
      } else {
        handleError();
      }
    };

    const handleError = () => {
      if (failedAssets.has(path)) {
        console.warn("[TextureCache] All fallbacks exhausted for:", path);
        return;
      }

      fallbackAttempts += 1;
      if (fallbackAttempts < maxFallbackAttempts) {
        const fallback = getFallbackAsset(fallbackAttempts);
        console.warn("[TextureCache] Failed to load:", path, "trying fallback:", fallback);
        image.src = fallback;
      } else {
        console.error("[TextureCache] Cannot load any fallback for:", path);
        failedAssets.add(path);
        const cbs = onReadyCallbacks.get(path) || [];
        for (const cb of cbs) cb(image);
        onReadyCallbacks.delete(path);
      }
    };

    image.onload = handleLoad;
    image.onerror = handleError;

    try {
      image.src = path;
    } catch (err) {
      console.error("[TextureCache] Error setting src:", path, err);
      handleError();
    }

    cache.set(path, image);
    return image;
  }

  return { cache, load };
}

function getBodyRuntimeObject(body) {
  return body?.plugin?.runtimeObject || null;
}

function cloneRuntimeObject(runtimeObject) {
  return JSON.parse(JSON.stringify(runtimeObject));
}

function drawBackground(ctx, width, height, background) {
  ctx.save();
  ctx.fillStyle = background || "#050816";
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(13, 18, 37, 0.25)");
  gradient.addColorStop(1, "rgba(3, 7, 18, 0.65)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBody(ctx, body, runtimeObject, scale, textures, onTextureReady) {
  const { position, angle } = body;
  const shape = runtimeObject.shape;
  const spritePath = body.render?.sprite?.texture || runtimeObject.asset?.filePath;
  // Pass onTextureReady so the rAF loop gets a repaint nudge when the image loads
  const texture = spritePath ? textures.load(spritePath, onTextureReady) : null;
  const visual = runtimeObject.visual || {};

  // Physics body dimensions in pixels scaled by custom visual scale multiplier
  const scaleMultiplier = visual.scaleMultiplier ?? 1;
  const rawWidth = shape.type === "circle" ? shape.radius * 2 * scale : shape.width * scale;
  const rawHeight = shape.type === "circle" ? shape.radius * 2 * scale : shape.height * scale;
  // Clamp to at least 20px so a zero/missing radius still renders something visible
  const physWidth = Math.max(20, rawWidth) * scaleMultiplier;
  const physHeight = Math.max(20, rawHeight) * scaleMultiplier;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle || 0);

  // Drop shadow for realism
  if (!body.isStatic) {
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 10;
  }

  if (texture && texture.complete && texture.naturalWidth > 0) {
    ctx.globalAlpha = visual.opacity ?? (body.render?.opacity ?? 1);

    // object-fit: contain logic to preserve aspect ratio
    const nativeRatio = texture.naturalWidth / texture.naturalHeight;
    const physRatio = physWidth / physHeight;

    let drawWidth = physWidth;
    let drawHeight = physHeight;

    if (nativeRatio > physRatio) {
      drawHeight = physWidth / nativeRatio;
    } else {
      drawWidth = physHeight * nativeRatio;
    }

    ctx.drawImage(texture, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } else {
    // Fallback: colored shape + emoji
    ctx.globalAlpha = visual.opacity ?? (body.render?.opacity ?? 1);

    // Draw primitive shape
    ctx.fillStyle = visual.color || "#7dd3fc";
    if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, physWidth / 2), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-physWidth / 2, -physHeight / 2, physWidth, physHeight);
    }

    // Draw Emoji Placeholder if available
    if (visual.emoji) {
      ctx.font = `${Math.min(physWidth, physHeight) * 0.8}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(visual.emoji, 0, 0);
    }
  }

  ctx.restore();
}

function drawLabels(ctx, runtimeObject) {
  const body = runtimeObject.body;
  if (!body) return;

  const label = runtimeObject.visual?.label || runtimeObject.name;

  // Skip generic fallback labels if a real asset is being rendered
  if (runtimeObject.asset?.matched && /^Obj(ect)?\s*\d+$/i.test(label)) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, body.position.x, body.position.y - 24);
  ctx.restore();
}

function drawGlow(ctx, body, runtimeObject) {
  const shape = runtimeObject.shape;
  const radius = shape.type === "circle" ? Math.max(10, shape.radius * 50) : Math.max(shape.width, shape.height) * 18;
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = runtimeObject.visual?.color || "#7dd3fc";
  ctx.beginPath();
  ctx.arc(body.position.x, body.position.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function createBodyForRuntimeObject(runtimeObject, scale) {
  const shape = runtimeObject.shape;
  const imagePath = runtimeObject.asset?.filePath;

  if (imagePath) {
    console.log("Loading sprite:", imagePath);
  }

  const w = toPx(shape.width, scale);
  const h = toPx(shape.height, scale);
  const r = toPx(shape.radius, scale);

  let scaleX = 1;
  let scaleY = 1;

  if (imagePath && runtimeObject.asset) {
    const nativeWidth = runtimeObject.asset.width || (shape.type === "circle" ? r * 2 : w);
    const nativeHeight = runtimeObject.asset.height || (shape.type === "circle" ? r * 2 : h);

    const nativeWidthPx = nativeWidth < 20 ? toPx(nativeWidth, scale) : nativeWidth;
    const nativeHeightPx = nativeHeight < 20 ? toPx(nativeHeight, scale) : nativeHeight;

    const targetWidth = shape.type === "circle" ? r * 2 : w;
    const targetHeight = shape.type === "circle" ? r * 2 : h;
    const containScale = Math.min(
      targetWidth / (nativeWidthPx || 1),
      targetHeight / (nativeHeightPx || 1)
    );

    scaleX = containScale;
    scaleY = containScale;
  }

  const bodyOptions = {
    mass: runtimeObject.physics.mass,
    density: runtimeObject.physics.density,
    friction: runtimeObject.physics.friction,
    restitution: runtimeObject.physics.restitution,
    isStatic: runtimeObject.physics.isStatic,
    angle: runtimeObject.angle,
    render: {
      opacity: runtimeObject.visual.opacity,
    },
  };

  if (imagePath) {
    bodyOptions.render.sprite = {
      texture: imagePath,
      xScale: scaleX,
      yScale: scaleY,
    };
  }

  const x = toPx(runtimeObject.position.x, scale);
  const y = toPx(runtimeObject.position.y, scale);

  let body;
  if (shape.type === "circle") {
    body = Matter.Bodies.circle(x, y, r, bodyOptions);
  } else {
    body = Matter.Bodies.rectangle(x, y, w, h, bodyOptions);
  }

  Matter.Body.setVelocity(body, {
    x: toPx(runtimeObject.velocity.x, scale) / 60,
    y: toPx(runtimeObject.velocity.y, scale) / 60,
  });

  body.plugin = body.plugin || {};
  body.plugin.runtimeObject = runtimeObject;

  return body;
}

function buildBodies(scene, scale) {
  const bodiesById = new Map();
  const bodies = [];

  for (const runtimeObject of scene.objects) {
    const body = createBodyForRuntimeObject(runtimeObject, scale);
    runtimeObject.body = body;
    bodiesById.set(runtimeObject.id, body);
    bodies.push(body);
  }

  return { bodies, bodiesById };
}

export function createSimulationRuntime({
  canvas,
  dsl,
  meterScale = DEFAULT_METERS_TO_PIXELS,
  onCollision,
  onStateChange,
  onSelectionChange,
  onAssetsProgress,
} = {}) {
  if (!canvas) {
    throw new Error("Simulation runtime requires a canvas element");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create 2D canvas context");
  }

  const textures = createTextureCache();
  const engine = Matter.Engine.create();
  engine.gravity.y = 1;
  engine.gravity.scale = 0.001;
  const runner = Matter.Runner.create();

  const interactionEngine = new PhysicsInteractionEngine({ engine, meterScale, onCollision });

  const state = {
    paused: false,
    time: 0,
    timeScale: 1,
    zoom: 1,
    cameraOffset: { x: 0, y: 0 },
    dsl: normalizeSimulationDsl(dsl),
    bodiesById: new Map(),
    rafId: 0,
    lastFrame: 0,
    selectedBodyId: null,
    particles: [], // For effects like rocket smoke
  };

  function resizeCanvas() {
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth || canvas.clientWidth || 800;
    const height = parent.clientHeight || canvas.clientHeight || 600;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function syncState() {
    if (typeof onStateChange === "function") {
      // Calculate real-time physics telemetry
      let totalKineticEnergy = 0;
      let totalMomentum = 0;
      let maxVelocity = 0;
      let dynamicCount = 0;
      let totalAcceleration = 0;

      const bodies = Matter.Composite.allBodies(engine.world);
      for (const body of bodies) {
        if (!body.isStatic && body.plugin?.runtimeObject) {
          const velocityMag = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
          const mass = body.mass;

          totalKineticEnergy += 0.5 * mass * velocityMag ** 2;
          totalMomentum += mass * velocityMag;
          maxVelocity = Math.max(maxVelocity, velocityMag);

          // Estimate acceleration simply using forces/mass
          const forceMag = Math.sqrt(body.force.x ** 2 + body.force.y ** 2);
          totalAcceleration += forceMag / mass;

          dynamicCount++;
        }
      }

      onStateChange({
        paused: state.paused,
        time: state.time,
        objectCount: state.dsl.objects.length,
        collisions: interactionEngine.getCollisionEffects().length,
        selectedBodyId: state.selectedBodyId,
        selectedObject: getSelectedObject(),
        telemetry: {
          velocity: maxVelocity,
          energy: totalKineticEnergy / 10,
          momentum: totalMomentum,
          acceleration: dynamicCount > 0 ? totalAcceleration / dynamicCount : 0,
        },
      });
    }
  }

  function getSelectedObject() {
    return state.selectedBodyId
      ? state.dsl.objects.find((item) => item.id === state.selectedBodyId) || null
      : null;
  }

  function emitSelectionChange() {
    if (typeof onSelectionChange === "function") {
      onSelectionChange({
        bodyId: state.selectedBodyId,
        object: getSelectedObject(),
      });
    }
  }

  function selectBody(bodyOrId) {
    const id = typeof bodyOrId === "string" ? bodyOrId : bodyOrId?.id;
    state.selectedBodyId = id || null;
    emitSelectionChange();
    syncState();
    return getSelectedObject();
  }

  function getSelectedBody() {
    return state.selectedBodyId ? state.bodiesById.get(state.selectedBodyId) || null : null;
  }

  function deselectBody() {
    state.selectedBodyId = null;
    emitSelectionChange();
    syncState();
  }

  function refreshRuntimeObject(body) {
    const runtimeObject = getBodyRuntimeObject(body);
    if (!runtimeObject) return;

    runtimeObject.physics.position = {
      x: body.position.x / meterScale,
      y: body.position.y / meterScale,
    };
    runtimeObject.physics.velocity = {
      x: body.velocity.x / meterScale,
      y: body.velocity.y / meterScale,
    };
    runtimeObject.physics.mass = body.mass;
    runtimeObject.physics.friction = body.friction;
    runtimeObject.physics.restitution = body.restitution;
    runtimeObject.physics.angle = body.angle;
    runtimeObject.angle = body.angle;
    runtimeObject.raw.position = runtimeObject.physics.position;
    runtimeObject.raw.velocity = runtimeObject.physics.velocity;
    runtimeObject.raw.angle = runtimeObject.angle;
  }

  async function rebuildWorld(nextDsl = state.dsl.raw) {
    Matter.Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    Matter.Engine.clear(engine);
    engine.gravity.y = 1;
    engine.gravity.scale = 0.001;

    state.dsl = normalizeSimulationDsl(nextDsl);
    interactionEngine.clear();
    interactionEngine.setRuntimeObjects(state.dsl.objects);
    state.selectedBodyId = null;
    state.particles = [];

    // Validate physics inputs before creating Matter bodies to prevent explosions
    try {
      validatePhysicsScene(state.dsl);
    } catch (err) {
      console.error("Physics validation failed:", err);
      throw err;
    }

    // Preload all assets referenced by this scene before creating bodies
    try {
      const assetList = (state.dsl.objects || []).map((o) => o?.asset?.filePath).filter(Boolean);
      if (assetList.length > 0) {
        await preloadAssets(assetList, (progress) => {
          // forward progress to consumer if provided
          try {
            if (typeof onAssetsProgress === 'function') onAssetsProgress(progress);
          } catch (e) {
            // ignore
          }
        }, { retries: 1, timeoutMs: 8000 });
        runtimeEvents.emit("preload_complete", { total: assetList.length });
      }
    } catch (err) {
      console.warn('[Preloader] Some assets failed to load, continuing with fallbacks.', err);
    }

    const { bodies, bodiesById } = buildBodies(state.dsl, meterScale);
    state.bodiesById = bodiesById;
    for (const runtimeObject of state.dsl.objects) {
      if (runtimeObject.body) {
        interactionEngine.registerBody(runtimeObject.body, runtimeObject);
      }
    }
    Matter.World.add(engine.world, bodies);

    // Create a visual floor — use clientHeight so it isn't inflated by devicePixelRatio
    const groundHeight = 120;
    const clientHeight = canvas.clientHeight || canvas.height;
    const floorY = clientHeight - 20; // 20px above bottom
    const ground = Matter.Bodies.rectangle(
      canvas.width / 2,
      floorY + groundHeight / 2,
      canvas.width * 2,
      groundHeight,
      {
        isStatic: true,
        friction: 1,
        restitution: 0.1,
        plugin: { isFloor: true }, // Mark for renderer
      }
    );
    Matter.World.add(engine.world, ground);

    for (const interaction of state.dsl.interactions) {
      if (String(interaction?.type || "").toLowerCase() !== "spring_force") {
        continue;
      }

      const targetId = interaction?.target || interaction?.bind || interaction?.object;
      const body = targetId ? bodiesById.get(targetId) : null;
      if (!body) continue;

      const params = interaction?.parameters || interaction || {};
      const anchor = Array.isArray(params.anchor)
        ? { x: toPx(params.anchor[0], meterScale), y: toPx(params.anchor[1], meterScale) }
        : { x: body.position.x, y: Math.max(40, body.position.y - meterScale * 2) };

      const constraint = Matter.Constraint.create({
        pointA: anchor,
        bodyB: body,
        length: Number(params.natural_length ?? 1) * meterScale,
        stiffness: Math.min(0.02, Math.max(0.0005, Number(params.spring_constant ?? 100) / 100000)),
      });
      Matter.World.add(engine.world, constraint);
    }

    if (!state.paused) {
      Matter.Runner.run(runner, engine);
    }
    syncState();
  }

  function renderFrame() {
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;

    // Clear display buffer
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    drawBackground(ctx, width, height, state.dsl.environment.background);

    ctx.save();
    // Integrated active camera navigation transforms
    if (state.zoom !== 1 || state.cameraOffset.x !== 0 || state.cameraOffset.y !== 0) {
      ctx.translate(width / 2, height / 2);
      ctx.scale(state.zoom, state.zoom);
      ctx.translate(-width / 2 + state.cameraOffset.x, -height / 2 + state.cameraOffset.y);
    }

    // Draw Particles (Smoke etc)
    for (const p of state.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color || "rgba(200, 200, 200, 0.5)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const bodies = Matter.Composite.allBodies(engine.world);

    // Draw floor
    for (const body of bodies) {
      if (body.plugin?.isFloor) {
        ctx.save();
        const yTop = body.position.y - 60; // groundHeight / 2
        const grad = ctx.createLinearGradient(0, yTop, 0, yTop + 120);
        grad.addColorStop(0, "rgba(99, 102, 241, 0.15)");
        grad.addColorStop(1, "rgba(99, 102, 241, 0.0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, yTop, canvas.width, 120);

        // Solid line for ground
        ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, yTop);
        ctx.lineTo(canvas.width, yTop);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // Legacy static fallback
      if (body.isStatic && body.plugin?.runtimeObject == null) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(body.position.x - 100, body.position.y - 12, 200, 24);
        ctx.restore();
        continue;
      }

      const runtimeObject = body.plugin?.runtimeObject;
      if (!runtimeObject) continue;
      if (state.selectedBodyId === runtimeObject.id) {
        drawGlow(ctx, body, runtimeObject);
      }
      // onTextureReady: when the sprite image finishes loading, force a single
      // extra renderFrame so the ball image replaces the fallback immediately.
      drawBody(ctx, body, runtimeObject, meterScale, textures, () => renderFrame());
      drawLabels(ctx, runtimeObject);
    }

    interactionEngine.drawOverlays(ctx);
    ctx.restore();
  }

  function tick(now) {
    if (!state.lastFrame) {
      state.lastFrame = now;
    }

    const delta = Math.min(now - state.lastFrame, FRAME_STEP);
    state.lastFrame = now;

    if (!state.paused) {
      interactionEngine.applyInteractions(delta, state.bodiesById);

      // Particle logic
      if (Math.random() > 0.5) {
        for (const body of state.bodiesById.values()) {
          const ro = getBodyRuntimeObject(body);
          if (ro && (ro.type === "rocket" || ro.name?.toLowerCase().includes("rocket"))) {
            // Only emit smoke if there's significant upward velocity or active thrust
            if (body.velocity.y < -0.1) {
              state.particles.push({
                x: body.position.x + (Math.random() - 0.5) * 20,
                y: body.position.y + 40, // Below rocket
                vx: (Math.random() - 0.5) * 1,
                vy: 1 + Math.random() * 2,
                size: 5 + Math.random() * 10,
                alpha: 0.8,
                color: Math.random() > 0.5 ? "#f97316" : "#94a3b8", // Orange or Gray
                life: 1.0,
              });
            }
          }
        }
      }

      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.alpha = Math.max(0, p.life);
        p.size += 0.2;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // Physics integration managed independently via continuous Matter.Runner to guarantee fixed timesteps
      interactionEngine.syncTrails();
      state.time += (delta / 1000) * state.timeScale;
      for (const body of state.bodiesById.values()) {
        refreshRuntimeObject(body);
      }
    }

    renderFrame();
    syncState();
    state.rafId = window.requestAnimationFrame(tick);
  }

  Matter.Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      interactionEngine.addCollisionEffect(pair);
      if (typeof onCollision === "function") {
        onCollision(pair, state);
      }
    }
  });

  resizeCanvas();
  rebuildWorld(state.dsl.raw);
  state.rafId = window.requestAnimationFrame(tick);

  function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;

    if (state.zoom !== 1 || state.cameraOffset.x !== 0 || state.cameraOffset.y !== 0) {
      return {
        x: (screenX - width / 2) / state.zoom + width / 2 - state.cameraOffset.x,
        y: (screenY - height / 2) / state.zoom + height / 2 - state.cameraOffset.y,
      };
    }
    return { x: screenX, y: screenY };
  }

  function pickBodyAtPoint(point) {
    const bodies = Matter.Composite.allBodies(engine.world).filter(
      (body) => !body.isStatic || body.plugin?.runtimeObject
    );
    const matches = Matter.Query.point(bodies, point);
    return matches[matches.length - 1] || null;
  }

  let dragState = null;

  function onPointerDown(event) {
    const body = pickBodyAtPoint(getPointerPosition(event));
    if (!body) {
      deselectBody();
      return;
    }

    selectBody(body);
    dragState = {
      body,
      offset: {
        x: body.position.x - getPointerPosition(event).x,
        y: body.position.y - getPointerPosition(event).y,
      },
    };
    Matter.Body.setStatic(body, false);
  }

  function onPointerMove(event) {
    if (!dragState?.body) return;
    const point = getPointerPosition(event);
    Matter.Body.setPosition(dragState.body, {
      x: point.x + dragState.offset.x,
      y: point.y + dragState.offset.y,
    });
    Matter.Body.setVelocity(dragState.body, { x: 0, y: 0 });
    refreshRuntimeObject(dragState.body);
  }

  function onPointerUp() {
    if (dragState?.body) {
      refreshRuntimeObject(dragState.body);
    }
    dragState = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  const resizeObserver = new ResizeObserver(() => {
    try {
      resizeCanvas();
      rebuildWorld(state.dsl.raw);
    } catch (err) {
      console.error("[SimulationRuntime] Resize failed:", err);
    }
  });
  if (canvas.parentElement) {
    resizeObserver.observe(canvas.parentElement);
  }

  return {
    engine,
    canvas,
    getState: () => ({
      paused: state.paused,
      time: state.time,
      timeScale: state.timeScale,
      dsl: state.dsl,
    }),
    setDsl(nextDsl) {
      try {
        rebuildWorld(nextDsl);
      } catch (err) {
        console.error("[SimulationRuntime] DSL rebuild failed:", err);
      }
    },
    play() {
      state.paused = false;
      // start runner if not already running
      try {
        Matter.Runner.run(runner, engine);
      } catch (e) {
        // ignore
      }
      syncState();
      runtimeEvents.emit("runtime_resumed", { time: state.time });
    },
    pause() {
      state.paused = true;
      try {
        Matter.Runner.stop(runner);
      } catch (e) {}
      syncState();
      runtimeEvents.emit("runtime_paused", { time: state.time });
    },
    reset() {
      state.time = 0;
      state.paused = true;
      try { Matter.Runner.stop(runner); } catch (e) {}
      rebuildWorld(state.dsl.raw);
      syncState();
    },
    setSpeed(factor) {
      state.timeScale = Math.max(0, Math.min(2, factor));
      syncState();
    },
    // Deterministic single-step: advance physics by one fixed frame and render once
    step() {
      try {
        // advance physics by FRAME_STEP scaled by timeScale
        const delta = FRAME_STEP * (state.timeScale || 1);
        Matter.Engine.update(engine, delta, 1);
        // update time and refresh objects
        state.time += delta / 1000;
        for (const body of state.bodiesById.values()) refreshRuntimeObject(body);
        renderFrame();
        syncState();
        runtimeEvents.emit("equation_updated", { kind: "step", time: state.time });
      } catch (e) {
        console.error('[SimulationRuntime] step failed', e);
      }
    },
    setTime(t) {
      // best-effort setter for the runtime time (doesn't rewind physics state)
      state.time = Number(t) || 0;
      syncState();
    },
    // FIX: deduplicated — single spawnObject implementation
    spawnObject(object, position, overrides = {}) {
      const runtimeObject = normalizeSimulationDsl({
        dsl: {
          objects: [
            {
              ...object,
              position: position || object.position,
              ...overrides,
            },
          ],
        },
      }).objects[0];
      runtimeObject.body = createBodyForRuntimeObject(runtimeObject, meterScale);
      Matter.World.add(engine.world, runtimeObject.body);
      state.dsl.objects.push(runtimeObject);
      interactionEngine.runtimeObjects.push(runtimeObject);
      interactionEngine.runtimeById.set(runtimeObject.id, runtimeObject);
      state.bodiesById.set(runtimeObject.id, runtimeObject.body);
      syncState();
      return runtimeObject.body;
    },
    duplicateSelected() {
      const selected = getSelectedObject();
      const body = getSelectedBody();
      if (!selected || !body) return null;

      const cloned = cloneRuntimeObject(selected.raw || selected);
      cloned.id = `${selected.id}_copy_${Date.now().toString(36)}`;
      cloned.position = {
        x: (selected.physics.position?.x || selected.position.x / meterScale) + 1.2,
        y: (selected.physics.position?.y || selected.position.y / meterScale) + 0.4,
      };
      const nextRuntimeObject = normalizeSimulationDsl({ dsl: { objects: [cloned] } }).objects[0];
      const nextBody = createBodyForRuntimeObject(nextRuntimeObject, meterScale);
      nextRuntimeObject.body = nextBody;
      Matter.World.add(engine.world, nextBody);
      state.dsl.objects.push(nextRuntimeObject);
      interactionEngine.runtimeObjects.push(nextRuntimeObject);
      state.bodiesById.set(nextRuntimeObject.id, nextBody);
      selectBody(nextRuntimeObject.id);
      return nextRuntimeObject;
    },
    deleteSelected() {
      const body = getSelectedBody();
      if (!body) return false;
      Matter.World.remove(engine.world, body);
      state.bodiesById.delete(body.id);
      state.dsl.objects = state.dsl.objects.filter(
        (item) => item.id !== body.plugin?.runtimeObject?.id
      );
      interactionEngine.runtimeObjects = interactionEngine.runtimeObjects.filter(
        (item) => item.id !== body.plugin?.runtimeObject?.id
      );
      deselectBody();
      return true;
    },
    toggleLockSelected() {
      const body = getSelectedBody();
      if (!body) return false;
      Matter.Body.setStatic(body, !body.isStatic);
      refreshRuntimeObject(body);
      return body.isStatic;
    },
    scaleSelected(factor = 1) {
      const body = getSelectedBody();
      if (!body) return false;
      Matter.Body.scale(body, factor, factor);
      refreshRuntimeObject(body);
      return true;
    },
    rotateSelected(angle = 0.1) {
      const body = getSelectedBody();
      if (!body) return false;
      Matter.Body.rotate(body, angle);
      refreshRuntimeObject(body);
      return true;
    },
    setSelectedVelocity(vector) {
      const body = getSelectedBody();
      if (!body) return false;
      Matter.Body.setVelocity(body, vector);
      refreshRuntimeObject(body);
      return true;
    },
    setSelectedForce(vector) {
      const body = getSelectedBody();
      if (!body) return false;
      Matter.Body.applyForce(body, body.position, vector);
      refreshRuntimeObject(body);
      return true;
    },
    updateSelectedObject(patch = {}) {
      const body = getSelectedBody();
      const object = getSelectedObject();
      if (!body || !object) return false;

      if (patch.physics) {
        object.physics = { ...object.physics, ...patch.physics };
        if (patch.physics.mass != null) {
          Matter.Body.setMass(body, Number(patch.physics.mass));
        }
        if (patch.physics.position) {
          Matter.Body.setPosition(body, {
            x: Number(patch.physics.position.x ?? body.position.x),
            y: Number(patch.physics.position.y ?? body.position.y),
          });
        }
        if (patch.physics.velocity) {
          Matter.Body.setVelocity(body, {
            x: Number(patch.physics.velocity.x ?? body.velocity.x),
            y: Number(patch.physics.velocity.y ?? body.velocity.y),
          });
        }
      }

      if (patch.material) {
        object.material = { ...object.material, ...patch.material };
        if (patch.material.friction != null) body.friction = Number(patch.material.friction);
        if (patch.material.restitution != null) body.restitution = Number(patch.material.restitution);
      }

      if (patch.visual) {
        object.visual = { ...object.visual, ...patch.visual };
      }

      if (patch.shape) {
        object.shape = { ...object.shape, ...patch.shape };
      }

      refreshRuntimeObject(body);
      syncState();
      return true;
    },
    setTimeScale(scale = 1) {
      state.timeScale = Math.max(0.1, Math.min(5, Number(scale) || 1));
      syncState();
      return state.timeScale;
    },
    stepFrame() {
      const previousPaused = state.paused;
      state.paused = true;
      Matter.Engine.update(engine, FRAME_STEP);
      interactionEngine.syncTrails();
      state.time += FRAME_STEP / 1000;
      for (const body of state.bodiesById.values()) {
        refreshRuntimeObject(body);
      }
      renderFrame();
      state.paused = previousPaused;
      syncState();
    },
    seekTo(targetSeconds = 0) {
      const target = Math.max(0, Number(targetSeconds) || 0);
      const sourceDsl = state.dsl.raw;
      rebuildWorld(sourceDsl);
      state.time = 0;
      state.paused = true;

      let remaining = target;
      while (remaining > 0) {
        const step = Math.min(FRAME_STEP, remaining * 1000);
        interactionEngine.applyInteractions(step, state.bodiesById);
        Matter.Engine.update(engine, step);
        interactionEngine.syncTrails();
        state.time += step / 1000;
        remaining -= step / 1000;
      }

      for (const body of state.bodiesById.values()) {
        refreshRuntimeObject(body);
      }
      renderFrame();
      syncState();
    },
    getSelection() {
      return {
        bodyId: state.selectedBodyId,
        object: getSelectedObject(),
      };
    },
    pause() {
      state.paused = true;
      Matter.Runner.stop(runner);
      syncState();
    },
    resume() {
      state.paused = false;
      Matter.Runner.run(runner, engine);
      syncState();
    },
    togglePause() {
      state.paused = !state.paused;
      if (state.paused) {
        Matter.Runner.stop(runner);
      } else {
        Matter.Runner.run(runner, engine);
      }
      syncState();
      return state.paused;
    },
    reset(nextDsl = state.dsl.raw) {
      state.time = 0;
      state.lastFrame = 0;
      state.paused = false;
      Matter.Runner.stop(runner);
      rebuildWorld(nextDsl);
      Matter.Runner.run(runner, engine);
      syncState();
    },
    resize() {
      resizeCanvas();
      rebuildWorld(state.dsl.raw);
    },
    destroy() {
      window.cancelAnimationFrame(state.rafId);
      Matter.Runner.stop(runner);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    // ---- Slider-wired live physics controls ----
    /** Expose engine for gravity slider */
    _engine: engine,
    /** Expose Matter.js for Body operations */
    _Matter: Matter,

    /** Removes the currently selected body */
    removeSelectedObject() {
      const body = getSelectedBody();
      if (!body) return false;
      const obj = getSelectedObject();
      Matter.World.remove(engine.world, body);
      state.bodiesById.delete(state.selectedBodyId);
      if (obj) {
        state.dsl.objects = state.dsl.objects.filter((o) => o.id !== obj.id);
      }
      state.selectedBodyId = null;
      emitSelectionChange();
      syncState();
      return true;
    },

    /** Returns all live bodies (excluding invisible ground) */
    getAllBodies() {
      return Matter.Composite.allBodies(engine.world).filter(
        (b) => b.plugin?.runtimeObject != null
      );
    },

    /** Live-update gravity — val in m/s² (9.8 = earth) */
    setGravity(mps2 = 9.8) {
      engine.gravity.y = Math.max(0, Number(mps2)) / 9.8;
    },

    /** Apply mass to all dynamic bodies */
    setGlobalMass(kg = 1) {
      for (const body of Matter.Composite.allBodies(engine.world)) {
        if (!body.isStatic && body.plugin?.runtimeObject) {
          Matter.Body.setMass(body, Math.max(0.01, Number(kg)));
        }
      }
    },

    /** Apply friction to all dynamic bodies */
    setGlobalFriction(f = 0.1) {
      for (const body of Matter.Composite.allBodies(engine.world)) {
        if (!body.isStatic && body.plugin?.runtimeObject) {
          body.friction = Math.max(0, Math.min(1, Number(f)));
        }
      }
    },

    /** Impulse the first dynamic body forward */
    impulseFirstBody(vx = 5) {
      const bodies = Matter.Composite.allBodies(engine.world).filter(
        (b) => !b.isStatic && b.plugin?.runtimeObject
      );
      if (bodies[0]) {
        Matter.Body.setVelocity(bodies[0], { x: Number(vx), y: bodies[0].velocity.y });
      }
    },

    /** Toggle mechanical collisions for dynamic bodies */
    toggleCollisions(enabled = true) {
      for (const body of Matter.Composite.allBodies(engine.world)) {
        if (!body.isStatic && body.plugin?.runtimeObject) {
          body.isSensor = !enabled;
        }
      }
      syncState();
    },

    /** Globally patch visual properties (e.g. showForces, showVelocity, trail) */
    setGlobalVisuals(patch = {}) {
      for (const runtimeObject of state.dsl.objects) {
        runtimeObject.visual = { ...runtimeObject.visual, ...patch };
      }
      syncState();
    },

    /** Update selected or primary dynamic body mass instantly */
    setSelectedBodyMass(kg) {
      const targetBody =
        getSelectedBody() ||
        Matter.Composite.allBodies(engine.world).find(
          (b) => !b.isStatic && b.plugin?.runtimeObject
        );
      if (targetBody && targetBody.plugin?.runtimeObject) {
        const initialMass =
          targetBody.plugin.runtimeObject.physics.initialMass || targetBody.mass || 1;
        targetBody.plugin.runtimeObject.physics.initialMass = initialMass;
        const newMass = Math.max(0.01, Number(kg));
        Matter.Body.setMass(targetBody, newMass);
        // larger mass = larger object scale proportionally
        targetBody.plugin.runtimeObject.visual = targetBody.plugin.runtimeObject.visual || {};
        targetBody.plugin.runtimeObject.visual.scaleMultiplier = Math.cbrt(newMass / initialMass);
        syncState();
      }
    },

    /** Update selected or primary dynamic body velocity instantly */
    setSelectedBodyVelocity(vx) {
      const targetBody =
        getSelectedBody() ||
        Matter.Composite.allBodies(engine.world).find(
          (b) => !b.isStatic && b.plugin?.runtimeObject
        );
      if (targetBody) {
        Matter.Body.setVelocity(targetBody, { x: Number(vx), y: targetBody.velocity.y });
        syncState();
      }
    },

    /** Apply continuous or impulse force to selected or primary dynamic body */
    setSelectedBodyForce(fx) {
      const targetBody =
        getSelectedBody() ||
        Matter.Composite.allBodies(engine.world).find(
          (b) => !b.isStatic && b.plugin?.runtimeObject
        );
      if (targetBody) {
        Matter.Body.applyForce(targetBody, targetBody.position, { x: Number(fx) * 0.005, y: 0 });
        syncState();
      }
    },

    /** Modify surface friction of selected or primary dynamic body */
    setSelectedBodyFriction(f) {
      const targetBody =
        getSelectedBody() ||
        Matter.Composite.allBodies(engine.world).find(
          (b) => !b.isStatic && b.plugin?.runtimeObject
        );
      if (targetBody && targetBody.plugin?.runtimeObject) {
        targetBody.friction = Math.max(0, Math.min(1, Number(f)));
        targetBody.plugin.runtimeObject.physics.friction = targetBody.friction;
        syncState();
      }
    },

    /** Set absolute zoom level scale */
    setZoom(z) {
      state.zoom = Math.max(0.2, Math.min(5, Number(z) || 1));
      syncState();
    },

    /** Get current zoom level scale */
    getZoom() {
      return state.zoom;
    },

    /** Refocus view matrix exactly to the average spatial center of active mass objects */
    centerCamera() {
      const bodies = Matter.Composite.allBodies(engine.world).filter(
        (b) => !b.isStatic && b.plugin?.runtimeObject
      );
      if (bodies.length > 0) {
        let sumX = 0;
        let sumY = 0;
        for (const b of bodies) {
          sumX += b.position.x;
          sumY += b.position.y;
        }
        const avgX = sumX / bodies.length;
        const avgY = sumY / bodies.length;
        const width = canvas.clientWidth || canvas.width;
        const height = canvas.clientHeight || canvas.height;
        state.cameraOffset = {
          x: width / 2 - avgX,
          y: height / 2 - avgY,
        };
      } else {
        state.cameraOffset = { x: 0, y: 0 };
      }
      state.zoom = 1;
      syncState();
    },
  };
}

export default createSimulationRuntime;