import React, { memo } from 'react';
import type { AssetDefinition } from '../../config/assetsRegistry';

interface AssetCardProps {
  asset: AssetDefinition;
  onDragStart: (e: React.DragEvent, asset: AssetDefinition) => void;
}

export const AssetCard = memo(function AssetCard({ asset, onDragStart }: AssetCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, asset)}
      title={`${asset.name} — drag to canvas`}
      style={{
        width: 76,
        height: 76,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: 'grab',
        userSelect: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(120,140,255,0.12)';
        el.style.border = '1px solid rgba(120,140,255,0.35)';
        el.style.transform = 'translateY(-2px) scale(1.04)';
        el.style.boxShadow = '0 0 18px rgba(120,140,255,0.3), 0 4px 12px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(255,255,255,0.04)';
        el.style.border = '1px solid rgba(255,255,255,0.07)';
        el.style.transform = 'translateY(0) scale(1)';
        el.style.boxShadow = 'none';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.cursor = 'grabbing';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.cursor = 'grab';
      }}
    >
      {/* Emoji Icon */}
      <span style={{ fontSize: 26, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
        {asset.emoji}
      </span>

      {/* Name */}
      <span style={{
        fontSize: 9.5,
        fontWeight: 600,
        color: '#94a3b8',
        textAlign: 'center',
        letterSpacing: '0.03em',
        lineHeight: 1.2,
        maxWidth: 68,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: "'Inter', sans-serif",
      }}>
        {asset.name}
      </span>

      {/* Static badge */}
      {asset.spawnConfig.isStatic && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#f59e0b',
          boxShadow: '0 0 4px #f59e0b',
        }} title="Static body" />
      )}
    </div>
  );
});
