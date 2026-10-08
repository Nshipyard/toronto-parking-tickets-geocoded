"use client";

import { useEffect, useMemo, useState } from "react";

interface Feature {
  type: string;
  properties: { code: string; name: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}

// 5-step sequential red scale, light to strong
const STOPS = ["#fde8e8", "#f5b5b5", "#e97f7f", "#d80621", "#8f0416"];

function ringPath(ring: number[][], px: (x: number, y: number) => [number, number]) {
  return ring.map((c, i) => `${i === 0 ? "M" : "L"}${px(c[0], c[1]).join(",")}`).join(" ") + " Z";
}

export default function TicketMap({
  values,
  selected,
  onSelect,
  formatTip,
}: {
  values: Record<string, number>;
  selected: string | null;
  onSelect: (code: string | null) => void;
  formatTip: (code: string, name: string, tickets: number) => string;
}) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    fetch("/geo/neighbourhoods_158_simple.geojson")
      .then((r) => r.json())
      .then((d) => setFeatures(d.features))
      .catch(() => {});
  }, []);

  const { paths, names } = useMemo(() => {
    if (!features.length) return { paths: [], names: {} as Record<string, string> };
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const f of features) {
      const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys as number[][][][])
        for (const ring of poly)
          for (const c of ring) {
            if (c[0] < minX) minX = c[0];
            if (c[0] > maxX) maxX = c[0];
            if (c[1] < minY) minY = c[1];
            if (c[1] > maxY) maxY = c[1];
          }
    }
    const W = 1000, H = 620;
    const sx = W / (maxX - minX), sy = H / (maxY - minY);
    const s = Math.min(sx, sy);
    const ox = (W - (maxX - minX) * s) / 2, oy = (H - (maxY - minY) * s) / 2;
    const px = (x: number, y: number): [number, number] => [ox + (x - minX) * s, oy + (maxY - y) * s];
    const paths: { code: string; d: string }[] = [];
    const names: Record<string, string> = {};
    for (const f of features) {
      const code = f.properties.code;
      names[code] = f.properties.name;
      const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      const d = (polys as number[][][][]).map((poly) => poly.map((ring) => ringPath(ring, px)).join(" ")).join(" ");
      paths.push({ code, d });
    }
    return { paths, names };
  }, [features]);

  const max = useMemo(() => Math.max(1, ...Object.values(values)), [values]);

  function colorFor(code: string) {
    const v = values[code] ?? 0;
    if (v <= 0) return "#f1f1f1";
    const t = Math.log10(v + 1) / Math.log10(max + 1);
    const idx = Math.min(STOPS.length - 1, Math.floor(t * STOPS.length));
    return STOPS[idx];
  }

  const hoverCode = hover ?? selected;

  return (
    <div className="relative">
      <svg viewBox="0 0 1000 620" className="w-full rounded-[24px] border border-line bg-paper" role="img" aria-label="Choropleth map of parking tickets by neighbourhood">
        {paths.map((p) => (
          <path
            key={p.code}
            d={p.d}
            fill={colorFor(p.code)}
            stroke={selected === p.code ? "#0a0f1e" : "#ffffff"}
            strokeWidth={selected === p.code ? 2.5 : 1}
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHover(p.code)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect(selected === p.code ? null : p.code)}
          />
        ))}
      </svg>
      {hoverCode && names[hoverCode] && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-[280px] rounded-[16px] bg-ink px-4 py-3 text-white shadow-lg">
          <p className="text-[14px] font-semibold">{names[hoverCode]}</p>
          <p className="mt-0.5 font-mono text-[13px] text-white/75">
            {formatTip(hoverCode, names[hoverCode], values[hoverCode] ?? 0)}
          </p>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 text-[13px] text-ink/60">
        <span>Fewer</span>
        <div className="flex overflow-hidden rounded-full">
          {STOPS.map((c) => (
            <span key={c} className="h-3 w-8" style={{ background: c }} />
          ))}
        </div>
        <span>More tickets (log scale)</span>
      </div>
    </div>
  );
}
