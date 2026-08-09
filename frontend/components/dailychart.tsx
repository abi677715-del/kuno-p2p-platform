'use client';

import { useState } from 'react';

type Point = { date: string; value: number };

/** A small single-series line chart with a hover crosshair + tooltip. Built for the admin dashboard's dark surface — not a themeable component. */
export function DailyChart({
  title,
  points,
  color,
  formatValue = (v: number) => v.toLocaleString(),
}: {
  title: string;
  points: Point[];
  color: string;
  formatValue?: (v: number) => string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 600;
  const height = 160;
  const padding = { top: 12, right: 12, bottom: 20, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
  const xFor = (i: number) => padding.left + i * stepX;
  const yFor = (v: number) => padding.top + innerH - (v / max) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`).join(' ');
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${padding.top + innerH} L ${xFor(0)} ${padding.top + innerH} Z`;

  const total = points.reduce((sum, p) => sum + p.value, 0);
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="bg-surface border border-white/10 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-medium text-paper">{title}</h3>
        <span className="text-xs text-muted">Total: {formatValue(total)}</span>
      </div>
      {points.length === 0 ? (
        <p className="text-muted text-sm">No data yet.</p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseLeave={() => setHoverIndex(null)}
          role="img"
          aria-label={title}
        >
          {/* recessive baseline */}
          <line x1={padding.left} y1={padding.top + innerH} x2={width - padding.right} y2={padding.top + innerH} stroke="currentColor" className="text-white/10" strokeWidth={1} />

          <path d={areaPath} fill={color} opacity={0.12} />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {hovered && (
            <>
              <line x1={xFor(hoverIndex!)} y1={padding.top} x2={xFor(hoverIndex!)} y2={padding.top + innerH} stroke="currentColor" className="text-white/20" strokeWidth={1} />
              <circle cx={xFor(hoverIndex!)} cy={yFor(hovered.value)} r={4} fill={color} stroke="#12161F" strokeWidth={2} />
            </>
          )}

          {/* invisible hover targets, one per point */}
          {points.map((p, i) => (
            <rect
              key={p.date}
              x={xFor(i) - stepX / 2}
              y={0}
              width={stepX || width}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}
        </svg>
      )}
      {hovered && (
        <p className="text-xs text-muted mt-1">
          {new Date(hovered.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} —{' '}
          <span className="text-paper">{formatValue(hovered.value)}</span>
        </p>
      )}
    </div>
  );
}
