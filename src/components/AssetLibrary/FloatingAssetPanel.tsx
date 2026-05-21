import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetCategory } from './AssetCategory';
import { assetsRegistry, type AssetDefinition } from '../../config/assetsRegistry';

interface FloatingAssetPanelProps {
  onAssetDrop?: (asset: AssetDefinition, canvasX: number, canvasY: number) => void;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const PANEL_W = 520;
const PANEL_H = 260;
const PILL_W = 148;
const PILL_H = 36;

const GLASS_BG     = 'rgba(10, 15, 35, 0.55)';
const GLASS_BORDER = '1px solid rgba(255,255,255,0.09)';
const GLASS_SHADOW = `
  0 0 0 1px rgba(90,120,255,0.15),
  0 0 24px rgba(90,120,255,0.18),
  0 0 60px rgba(90,120,255,0.08),
  0 8px 32px rgba(0,0,0,0.45)
`;
const GLASS_SHADOW_HOVER = `
  0 0 0 1px rgba(120,140,255,0.30),
  0 0 28px rgba(120,140,255,0.28),
  0 0 60px rgba(90,120,255,0.12),
  0 8px 32px rgba(0,0,0,0.5)
`;

export function FloatingAssetPanel({ onAssetDrop, canvasRef }: FloatingAssetPanelProps) {
  // ── State ────────────────────────────────────────────────────────────────────
  const [collapsed, setCollapsed]     = useState(false);
  const [pillHovered, setPillHovered] = useState(false);
  const [search, setSearch]           = useState('');

  const rndRef       = useRef<Rnd | null>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  // Drag-guard: record pointer position on mousedown to distinguish
  // a panel reposition drag from an intentional click on the pill.
  const dragGuardRef = useRef<{ x: number; y: number } | null>(null);

  // ── Search filter ────────────────────────────────────────────────────────────
  const filteredRegistry = useMemo(() => {
    if (!search.trim()) return assetsRegistry;
    const q = search.toLowerCase();
    const result: typeof assetsRegistry = {};
    for (const [cat, assets] of Object.entries(assetsRegistry)) {
      const filtered = assets.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q))
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [search]);

  const totalAssets = useMemo(() =>
    Object.values(assetsRegistry).reduce((sum, arr) => sum + arr.length, 0),
  []);

  // ── Collapse / Expand ────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    // Save scroll position before collapsing
    if (!collapsed && scrollRef.current) {
      scrollPosRef.current = scrollRef.current.scrollTop;
    }
    setCollapsed(c => !c);
  }, [collapsed]);

  // Only expand if the user actually clicked (didn't drag the panel).
  const handlePillClick = useCallback((e: React.MouseEvent) => {
    const start = dragGuardRef.current;
    if (start) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > 4) return; // was a drag — ignore
    }
    toggle();
  }, [toggle]);

  // Restore scroll position after expanding
  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollPosRef.current;
    }
  }, [collapsed]);

  // Resize Rnd to match collapsed/expanded dimensions
  useEffect(() => {
    if (!rndRef.current) return;
    if (collapsed) {
      rndRef.current.updateSize({ width: PILL_W, height: PILL_H });
    } else {
      rndRef.current.updateSize({ width: PANEL_W, height: PANEL_H });
    }
  }, [collapsed]);

  // ── Keyboard shortcut: Tab toggles ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only fire when no input/textarea is focused
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Tab') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  // ── Drag-start handler (unchanged) ──────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, asset: AssetDefinition) => {
    e.dataTransfer.setData('application/edusim-asset', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Rnd
        ref={rndRef}
        default={{
          x: 0,
          y: 8,
          width: PANEL_W,
          height: PANEL_H,
        }}
        minWidth={collapsed ? PILL_W : 320}
        minHeight={collapsed ? PILL_H : 160}
        bounds="parent"
        enableResizing={!collapsed}
        style={{ zIndex: 200 }}
        dragHandleClassName="asset-panel-drag-handle"
      >
        <AnimatePresence mode="wait" initial={false}>
          {/* ── COLLAPSED PILL ── */}
          {collapsed && (
            <motion.button
              key="pill"
              className="asset-panel-drag-handle"
              initial={{ opacity: 0, scale: 0.88, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: -6 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              onClick={handlePillClick}
              onMouseDown={(e) => { dragGuardRef.current = { x: e.clientX, y: e.clientY }; }}
              onMouseEnter={() => setPillHovered(true)}
              onMouseLeave={() => setPillHovered(false)}
              aria-label="Expand Asset Library"
              title="Expand Asset Library (Tab)"
              style={{
                // Layout
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 12px',
                // Glass look — identical tokens to the panel
                background: GLASS_BG,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: GLASS_BORDER,
                borderRadius: 999,           // pill shape
                boxShadow: pillHovered ? GLASS_SHADOW_HOVER : GLASS_SHADOW,
                // Typography + UX
                cursor: 'grab',
                fontFamily: "'Inter', sans-serif",
                // Transitions
                transition: 'box-shadow 0.2s ease, filter 0.2s ease',
                filter: pillHovered ? 'brightness(1.12)' : 'brightness(1)',
                // Reset button defaults
                outline: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              {/* Neon dot — identical to panel header */}
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: '#818cf8',
                boxShadow: '0 0 6px #818cf8, 0 0 12px rgba(129,140,248,0.4)',
              }} />

              {/* Label */}
              <span style={{
                fontSize: 11.5, fontWeight: 700, color: '#c7d2fe',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', flex: 1,
              }}>
                📦 Assets
              </span>

              {/* Item count badge */}
              <span style={{
                fontSize: 9, background: 'rgba(129,140,248,0.2)', color: '#a5b4fc',
                borderRadius: 5, padding: '1px 6px', fontWeight: 600, flexShrink: 0,
              }}>
                {totalAssets}
              </span>

              {/* Expand chevron */}
              <span style={{
                fontSize: 10, color: '#64748b', flexShrink: 0,
                transform: 'rotate(180deg)',    // points down = "expand downward"
                transition: 'transform 0.2s',
              }}>
                ▼
              </span>
            </motion.button>
          )}

          {/* ── EXPANDED PANEL ── */}
          {!collapsed && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{
                width: '100%',
                height: '100%',
                background: GLASS_BG,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: GLASS_BORDER,
                borderRadius: 16,
                boxShadow: GLASS_SHADOW,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {/* ── Header (drag handle) — pixel-identical to original ── */}
              <div
                className="asset-panel-drag-handle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'grab',
                  background: 'rgba(255,255,255,0.02)',
                  flexShrink: 0,
                }}
              >
                {/* Left: title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Neon dot */}
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#818cf8',
                    boxShadow: '0 0 6px #818cf8, 0 0 12px rgba(129,140,248,0.4)',
                  }} />
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, color: '#c7d2fe',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    📦 Asset Library
                  </span>
                  <span style={{
                    fontSize: 9, background: 'rgba(129,140,248,0.2)', color: '#a5b4fc',
                    borderRadius: 5, padding: '1px 6px', fontWeight: 600,
                  }}>
                    {totalAssets} items
                  </span>
                </div>

                {/* Right: collapse button */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    onClick={toggle}
                    aria-label="Collapse Asset Library"
                    title="Collapse (Tab)"
                    style={{
                      width: 22, height: 22,
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#94a3b8', fontSize: 12, fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* ── Body — pixel-identical to original ── */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  flex: 1,
                }}
              >
                {/* Search bar */}
                <div style={{ padding: '8px 14px 6px', flexShrink: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, padding: '6px 12px',
                  }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>🔍</span>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search assets…"
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        color: '#e2e8f0', fontSize: 12, fontFamily: "'Inter', sans-serif",
                      }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        style={{
                          background: 'transparent', border: 'none',
                          cursor: 'pointer', color: '#64748b', fontSize: 14, lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Tip */}
                <div style={{ padding: '0 14px 4px', flexShrink: 0 }}>
                  <span style={{ fontSize: 9.5, color: '#475569', fontStyle: 'italic' }}>
                    Drag any asset onto the simulation canvas to spawn it
                  </span>
                </div>

                {/* Categories + scroll */}
                <div
                  ref={scrollRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '4px 14px 10px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.1) transparent',
                  }}
                >
                  {Object.entries(filteredRegistry).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, paddingTop: 16 }}>
                      No assets match "{search}"
                    </div>
                  ) : (
                    Object.entries(filteredRegistry).map(([cat, assets]) => (
                      <AssetCategory
                        key={cat}
                        name={cat}
                        assets={assets}
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Rnd>
    </>
  );
}
