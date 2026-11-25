import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlaskConical,
  GitBranch,
  Grid,
  Info,
  Lock,
  Plus,
  RotateCcw,
  Scan,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  Unlock,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { CustomSelect } from './CustomControls.tsx';
import { SourceBadge } from './SourceBadge.tsx';
import { BENCHMARK_METHODOLOGIES } from '../data/benchmarkSpecs.ts';
import {
  PLOT_X_OPTIONS,
  PLOT_Y_OPTIONS,
  PLOT_Z_OPTIONS,
  type ModelNode,
  type PlotColorMode,
  type PlotXVar,
  type PlotYVar,
  type PlotZVar,
} from '../types.ts';

interface UniversalPlotterProps {
  models: ModelNode[];
  allModels: ModelNode[];
  xVar: PlotXVar;
  yVar: PlotYVar;
  zVar: PlotZVar;
  colorMode: PlotColorMode;
  onChangeX: (v: PlotXVar) => void;
  onChangeY: (v: PlotYVar) => void;
  onChangeZ: (v: PlotZVar) => void;
  onChangeColor: (v: PlotColorMode) => void;
  selectedModelId: string | null;
  onSelectModel: (id: string | null) => void;
  onInspectModel: (id: string) => void;
  onPlantModel: (node: ModelNode) => void;
  onRemoveCustomModel: (id: string) => void;
  onNavigateSources?: () => void;
}

const FAMILY_COLORS: Record<string, string> = {
  OpenAI: '#D97706',
  Anthropic: '#7C3AED',
  Google: '#2563EB',
  'Google Gemma': '#059669',
  xAI: '#DC2626',
  'Amazon Nova': '#CA8A04',
  DeepSeek: '#0891B2',
  'Meta Llama': '#16A34A',
  Qwen: '#0284C7',
  Mistral: '#0D9488',
  Cohere: '#65A30D',
  'Z.AI (GLM)': '#4F46E5',
  'Moonshot (Kimi)': '#0F766E',
  'NVIDIA Nemotron': '#4D7C0F',
  'Microsoft Phi': '#0369A1',
  'MiniMax / StepFun / MiMo / AI2': '#9333EA',
  Custom: '#DB2777',
};

function getRawX(m: ModelNode, xVar: PlotXVar): number | null {
  switch (xVar) {
    case 'releaseDate':
      return Date.parse(m.releaseDate) || null;
    case 'inputCost1M':
      return m.inputCost1M;
    case 'outputCost1M':
      return m.outputCost1M;
    case 'blendedCost1M':
      return m.blendedCost1M;
    case 'costPerTask':
      return m.costPerTask;
    case 'tokensPerSec':
      return m.tokensPerSec;
    case 'ttftMs':
      return m.ttftMs;
    case 'totalParamsB':
      return m.architecture.totalParamsB;
    case 'activeParamsB':
      return m.architecture.activeParamsB;
    case 'contextWindow':
      return m.contextWindow;
    case 'maxOutputTokens':
      return m.maxOutputTokens;
    case 'trainingFlops':
      return m.trainingFlops;
    case 'trainingCostUsd':
      return m.trainingCostUsd;
    case 'energyWhPer1k':
      return m.energyWhPer1k;
  }
}

function getScaledX(raw: number, xVar: PlotXVar): number {
  const meta = PLOT_X_OPTIONS.find((o) => o.key === xVar);
  if (!meta?.logScale) return raw;
  const floor = xVar === 'trainingFlops' ? 1e22 : xVar === 'trainingCostUsd' ? 1e5 : 0.01;
  return Math.log10(Math.max(floor, raw));
}

function formatXTick(scaled: number, xVar: PlotXVar): string {
  const meta = PLOT_X_OPTIONS.find((o) => o.key === xVar);
  if (xVar === 'releaseDate') {
    const d = new Date(scaled);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  const val = meta?.logScale ? Math.pow(10, scaled) : scaled;
  if (xVar === 'trainingFlops') return `1e${scaled.toFixed(1)}`;
  if (xVar === 'trainingCostUsd') return val >= 1e6 ? `$${(val / 1e6).toFixed(0)}M` : `$${(val / 1e3).toFixed(0)}K`;
  if (xVar.includes('Cost') || xVar === 'costPerTask') return val >= 1 ? `$${val.toFixed(1)}` : `$${val.toFixed(2)}`;
  if (xVar.includes('Params')) return val >= 1000 ? `${(val / 1000).toFixed(1)}T` : `${Math.round(val)}B`;
  if (xVar === 'contextWindow' || xVar === 'maxOutputTokens') {
    return val >= 1e6 ? `${(val / 1e6).toFixed(1)}M` : `${Math.round(val / 1000)}K`;
  }
  return `${Math.round(val)}`;
}

function getZValue(m: ModelNode, zVar: PlotZVar): number {
  switch (zVar) {
    case 'uniform':
      return 1;
    case 'totalParamsB':
      return Math.log10(Math.max(2, m.architecture.totalParamsB));
    case 'activeParamsB':
      return Math.log10(Math.max(2, m.architecture.activeParamsB));
    case 'contextWindow':
      return Math.log10(Math.max(4096, m.contextWindow));
    case 'tokensPerSec':
      return m.tokensPerSec ?? 60;
    case 'costPerTask':
      return Math.log10(Math.max(0.01, m.costPerTask) * 100);
  }
}

export const UniversalPlotter: React.FC<UniversalPlotterProps> = ({
  models,
  allModels,
  xVar,
  yVar,
  zVar,
  colorMode,
  onChangeX,
  onChangeY,
  onChangeZ,
  onChangeColor,
  selectedModelId,
  onSelectModel,
  onInspectModel,
  onPlantModel,
  onRemoveCustomModel,
  onNavigateSources,
}) => {
  const [showLineages, setShowLineages] = useState(true);
  const [showPareto, setShowPareto] = useState(true);
  const [showScalingLaws, setShowScalingLaws] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [labelMode, setLabelMode] = useState<'auto' | 'all' | 'tips'>('auto');
  const [showMethodology, setShowMethodology] = useState(false);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [boxZoomMode, setBoxZoomMode] = useState(false);
  const [dragState, setDragState] = useState<{
    mode: 'pan' | 'box';
    startX: number;
    startY: number;
    curX: number;
    curY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
  } | null>(null);

  const [showPlantModal, setShowPlantModal] = useState(false);
  const [plantName, setPlantName] = useState('');
  const [plantFamily, setPlantFamily] = useState('Custom');
  const [plantWeight, setPlantWeight] = useState<'open-weight' | 'closed-weight'>('open-weight');
  const [plantParentId, setPlantParentId] = useState('');
  const [plantScore, setPlantScore] = useState('84.5');
  const [plantCostOut, setPlantCostOut] = useState('0.40');
  const [plantParamsB, setPlantParamsB] = useState('70');
  const [plantDate, setPlantDate] = useState('2026-11-25');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const width = Math.max(720, containerWidth);
  const height = 460;
  const pad = { top: 22, right: 28, bottom: 44, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const widthRef = useRef(width);
  zoomRef.current = zoom;
  panRef.current = pan;
  widthRef.current = width;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.round(entry.contentRect.width));
        }
      }
    });
    ro.observe(el);
    setContainerWidth(Math.round(el.clientWidth) || 1200);
    return () => ro.disconnect();
  }, []);

  const clampPan = (px: number, py: number, z: number, w = widthRef.current) => ({
    x: Math.min(pad.left * (1 - z), Math.max((w - pad.right) * (1 - z), px)),
    y: Math.min(pad.top * (1 - z), Math.max((height - pad.bottom) * (1 - z), py)),
  });

  // Strict non-passive wheel listener to prevent page-scroll bleeding (1x to 15x)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const curW = widthRef.current;
      const ptX = ((e.clientX - rect.left) / rect.width) * curW;
      const ptY = ((e.clientY - rect.top) / rect.height) * height;

      const curZoom = zoomRef.current;
      const curPan = panRef.current;
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      const nextZoom = Math.min(15, Math.max(1, curZoom * factor));

      if (nextZoom <= 1.01) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      const wx = (ptX - curPan.x) / curZoom;
      const wy = (ptY - curPan.y) / curZoom;
      setZoom(nextZoom);
      setPan(clampPan(ptX - wx * nextZoom, ptY - wy * nextZoom, nextZoom, curW));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const xMeta = PLOT_X_OPTIONS.find((o) => o.key === xVar) ?? PLOT_X_OPTIONS[0];
  const yMeta = PLOT_Y_OPTIONS.find((o) => o.key === yVar) ?? PLOT_Y_OPTIONS[0];
  const methodology = BENCHMARK_METHODOLOGIES[yVar];

  const byId = useMemo(() => {
    const map = new Map<string, ModelNode>();
    for (const m of allModels) map.set(m.id, m);
    return map;
  }, [allModels]);

  const validModels = useMemo(
    () => models.filter((m) => getRawX(m, xVar) !== null && m.benchmarks[yVar] !== null),
    [models, xVar, yVar],
  );

  const paretoIds = useMemo(() => {
    const lowerXBetter = Boolean(xMeta.lowerIsBetter);
    const sorted = [...validModels].sort((a, b) => {
      const xa = getScaledX(getRawX(a, xVar) as number, xVar);
      const xb = getScaledX(getRawX(b, xVar) as number, xVar);
      return lowerXBetter ? xa - xb : xb - xa;
    });
    const frontier = new Set<string>();
    let bestY = -Infinity;
    for (const m of sorted) {
      const y = m.benchmarks[yVar] as number;
      if (y > bestY) {
        bestY = y;
        frontier.add(m.id);
      }
    }
    return frontier;
  }, [validModels, xVar, yVar, xMeta.lowerIsBetter]);

  const getNodeColor = (m: ModelNode): string => {
    switch (colorMode) {
      case 'family':
        return FAMILY_COLORS[m.family] ?? (m.weightClass === 'open-weight' ? '#0891B2' : '#D97706');
      case 'weightClass':
        return m.weightClass === 'open-weight' ? '#0891B2' : '#D97706';
      case 'architecture':
        if (m.architecture.type === 'MoE') return '#0891B2';
        if (m.architecture.type === 'RL-Reasoning') return '#7C3AED';
        if (m.architecture.type === 'Hybrid') return '#059669';
        return '#D97706';
      case 'license':
        if (m.license.includes('MIT') || m.license.includes('Apache')) return '#059669';
        if (m.license.includes('Proprietary')) return '#D97706';
        return '#0284C7';
      case 'pareto':
        return paretoIds.has(m.id) ? '#059669' : '#6B7280';
    }
  };

  const { xMin, xMax, yMin, yMax, zMin, zMax } = useMemo(() => {
    if (validModels.length === 0) {
      return { xMin: 0, xMax: 100, yMin: 0, yMax: 100, zMin: 1, zMax: 2 };
    }
    const xs = validModels.map((m) => getScaledX(getRawX(m, xVar) as number, xVar));
    const ys = validModels.map((m) => m.benchmarks[yVar] as number);
    const zs = validModels.map((m) => getZValue(m, zVar));

    const rXMin = Math.min(...xs);
    const rXMax = Math.max(...xs);
    const xSpan = Math.max(0.15, rXMax - rXMin);
    const rYMin = Math.min(...ys);
    const rYMax = Math.max(...ys);
    const ySpan = Math.max(5, rYMax - rYMin);

    return {
      xMin: rXMin - xSpan * 0.03,
      xMax: rXMax + xSpan * 0.04,
      yMin: Math.max(0, Math.floor(rYMin - ySpan * 0.06)),
      yMax: Math.ceil(rYMax + ySpan * 0.07),
      zMin: Math.min(...zs),
      zMax: Math.max(...zs),
    };
  }, [validModels, xVar, yVar, zVar]);

  const toWorldX = (m: ModelNode) => {
    const raw = getRawX(m, xVar);
    const v = getScaledX(raw ?? xMin, xVar);
    return pad.left + ((v - xMin) / (xMax - xMin || 1)) * plotW;
  };

  const toWorldY = (score: number) =>
    pad.top + plotH - ((score - yMin) / (yMax - yMin || 1)) * plotH;

  // Persistent screen-space X and Y ticks (update dynamically with zoom & pan)
  const screenXTicks = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }, (_, i) => {
      const sx = pad.left + (plotW * i) / (count - 1);
      const wx = (sx - pan.x) / zoom;
      const dataVal = xMin + ((wx - pad.left) / plotW) * (xMax - xMin);
      return { sx, label: formatXTick(dataVal, xVar) };
    });
  }, [pan.x, zoom, xMin, xMax, xVar, plotW, pad.left]);

  const screenYTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count }, (_, i) => {
      const sy = pad.top + (plotH * i) / (count - 1);
      const wy = (sy - pan.y) / zoom;
      const dataVal = yMax - ((wy - pad.top) / plotH) * (yMax - yMin);
      return { sy, label: dataVal >= 100 ? `${Math.round(dataVal)}` : dataVal.toFixed(1) };
    });
  }, [pan.y, zoom, yMin, yMax, plotH, pad.top]);

  const getRadius = (m: ModelNode, isSelected: boolean, isHovered: boolean) => {
    let base = 4.2;
    if (zVar !== 'uniform') {
      const zv = getZValue(m, zVar);
      const norm = (zv - zMin) / (zMax - zMin || 1);
      base = 3.2 + norm * 8.5;
    }
    if (isSelected) base += 2.2;
    else if (isHovered) base += 1.4;
    return base / Math.sqrt(zoom);
  };

  const screenToSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: width / 2, y: height / 2 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = screenToSvgCoords(e.clientX, e.clientY);
    setDragState({
      mode: boxZoomMode || e.shiftKey ? 'box' : 'pan',
      startX: pt.x,
      startY: pt.y,
      curX: pt.x,
      curY: pt.y,
      startPanX: pan.x,
      startPanY: pan.y,
      moved: false,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragState) return;
    const pt = screenToSvgCoords(e.clientX, e.clientY);
    const dx = pt.x - dragState.startX;
    const dy = pt.y - dragState.startY;
    const moved = dragState.moved || Math.hypot(dx, dy) > 4;
    if (dragState.mode === 'pan' && zoom > 1) {
      setPan(clampPan(dragState.startPanX + dx, dragState.startPanY + dy, zoom));
    }
    setDragState({ ...dragState, curX: pt.x, curY: pt.y, moved });
  };

  const handleMouseUp = () => {
    if (!dragState) return;
    if (dragState.mode === 'box' && dragState.moved) {
      const x1 = Math.min(dragState.startX, dragState.curX);
      const x2 = Math.max(dragState.startX, dragState.curX);
      const y1 = Math.min(dragState.startY, dragState.curY);
      const y2 = Math.max(dragState.startY, dragState.curY);
      if (x2 - x1 > 18 && y2 - y1 > 18) {
        const wx1 = (x1 - pan.x) / zoom;
        const wy1 = (y1 - pan.y) / zoom;
        const nextZoom = Math.min(15, Math.max(1, Math.min(plotW / ((x2 - x1) / zoom), plotH / ((y2 - y1) / zoom))));
        setZoom(nextZoom);
        setPan(clampPan(pad.left - wx1 * nextZoom, pad.top - wy1 * nextZoom, nextZoom));
        setBoxZoomMode(false);
      }
    }
    setDragState(null);
  };

  const zoomCenter = (mult: number) => {
    const nextZoom = Math.min(15, Math.max(1, zoom * mult));
    if (nextZoom <= 1.01) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const cx = pad.left + plotW / 2;
    const cy = pad.top + plotH / 2;
    const wx = (cx - pan.x) / zoom;
    const wy = (cy - pan.y) / zoom;
    setZoom(nextZoom);
    setPan(clampPan(cx - wx * nextZoom, cy - wy * nextZoom, nextZoom));
  };

  const highlightedIds = useMemo(() => {
    if (!selectedModelId) return null;
    const set = new Set<string>();
    let cur: ModelNode | undefined = byId.get(selectedModelId);
    while (cur) {
      set.add(cur.id);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    let added = true;
    while (added) {
      added = false;
      for (const m of allModels) {
        if (m.parentId && set.has(m.parentId) && !set.has(m.id)) {
          set.add(m.id);
          added = true;
        }
      }
    }
    return set;
  }, [selectedModelId, byId, allModels]);

  const ancestryChain = useMemo(() => {
    if (!selectedModelId) return [];
    const chain: ModelNode[] = [];
    let cur: ModelNode | undefined = byId.get(selectedModelId);
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return chain;
  }, [selectedModelId, byId]);

  const familySeries = useMemo(() => {
    const groups = new Map<string, ModelNode[]>();
    for (const m of validModels) {
      const arr = groups.get(m.family) ?? [];
      arr.push(m);
      groups.set(m.family, arr);
    }
    return Array.from(groups.entries()).map(([family, list]) => ({
      family,
      color: FAMILY_COLORS[family] ?? '#0891B2',
      nodes: [...list].sort((a, b) => a.generation - b.generation),
    }));
  }, [validModels]);

  // Screen-space label collision avoidance + edge-flipping so 1x zoom is clean & never clips
  const labelPlacement = useMemo(() => {
    const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
    const placement = new Map<string, { anchor: 'start' | 'middle' | 'end'; dx: number }>();

    const candidates: Array<{ node: ModelNode; sx: number; sy: number; priority: number }> = [];
    for (const series of familySeries) {
      series.nodes.forEach((node, idx) => {
        const isLatest = idx === series.nodes.length - 1;
        const isSelected = node.id === selectedModelId;
        const isChain = Boolean(highlightedIds?.has(node.id));
        const wantsLabel =
          labelMode === 'all'
            ? true
            : labelMode === 'tips'
              ? isLatest || isSelected || isChain
              : zoom > 1.5 || isSelected || isChain || node.isCustom || (isLatest && (node.benchmarks.compositeIQ ?? 0) >= 85);

        if (!wantsLabel) return;
        const sx = pan.x + toWorldX(node) * zoom;
        const sy = pan.y + toWorldY(node.benchmarks[yVar] as number) * zoom;
        if (sx < pad.left || sx > width - pad.right || sy < pad.top || sy > height - pad.bottom) return;

        const priority = isSelected ? 4 : isChain ? 3 : isLatest ? 2 : 1;
        candidates.push({ node, sx, sy, priority });
      });
    }

    candidates.sort((a, b) => b.priority - a.priority || b.sy - a.sy);

    for (const c of candidates) {
      const anchor: 'start' | 'middle' | 'end' =
        c.sx > width - pad.right - 95 ? 'end' : c.sx < pad.left + 80 ? 'start' : 'middle';
      const dx = anchor === 'end' ? -6 : anchor === 'start' ? 6 : 0;

      if (labelMode === 'all') {
        placement.set(c.node.id, { anchor, dx });
        continue;
      }

      const boxW = Math.min(145, c.node.name.length * 6.5 + 18);
      const boxH = 18;
      const lx = anchor === 'end' ? c.sx - boxW : anchor === 'start' ? c.sx : c.sx - boxW / 2;
      const ly = c.sy - 20;
      const collides = placed.some(
        (p) => lx < p.x + p.w && lx + boxW > p.x && ly < p.y + p.h && ly + boxH > p.y,
      );
      if (!collides || c.priority >= 3) {
        if (placed.length < 7 || zoom > 1.5 || c.priority >= 3) {
          placement.set(c.node.id, { anchor, dx });
          placed.push({ x: lx, y: ly, w: boxW, h: boxH });
        }
      }
    }
    return placement;
  }, [familySeries, labelMode, zoom, pan, selectedModelId, highlightedIds, yVar, xVar, xMin, xMax, yMin, yMax, width]);

  const paretoPath = useMemo(() => {
    if (!showPareto) return '';
    const pts = validModels
      .filter((m) => paretoIds.has(m.id))
      .map((m) => ({ x: toWorldX(m), y: toWorldY(m.benchmarks[yVar] as number) }))
      .sort((a, b) => a.x - b.x);
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }, [showPareto, validModels, paretoIds, xVar, yVar, xMin, xMax, yMin, yMax]);

  const selectedModel = selectedModelId ? byId.get(selectedModelId) ?? null : null;
  const selectedParent = selectedModel?.parentId ? byId.get(selectedModel.parentId) ?? null : null;
  const hoveredModel = hoveredId ? byId.get(hoveredId) ?? null : null;

  const hoveredScreenPos = useMemo(() => {
    if (!hoveredModel || hoveredModel.benchmarks[yVar] === null) return null;
    return {
      sx: pan.x + toWorldX(hoveredModel) * zoom,
      sy: pan.y + toWorldY(hoveredModel.benchmarks[yVar] as number) * zoom,
    };
  }, [hoveredModel, pan, zoom, xVar, yVar, xMin, xMax, yMin, yMax]);

  const scoreDelta =
    selectedModel && selectedParent && selectedModel.benchmarks[yVar] !== null && selectedParent.benchmarks[yVar] !== null
      ? (selectedModel.benchmarks[yVar] as number) - (selectedParent.benchmarks[yVar] as number)
      : null;

  const applyPreset = (preset: 'iq_cost' | 'speed_iq' | 'scaling' | 'timeline') => {
    if (preset === 'iq_cost') {
      onChangeX('blendedCost1M');
      onChangeY('compositeIQ');
      onChangeZ('activeParamsB');
      setShowPareto(true);
      setShowLineages(false);
      setShowScalingLaws(false);
    } else if (preset === 'speed_iq') {
      onChangeX('tokensPerSec');
      onChangeY('compositeIQ');
      onChangeZ('contextWindow');
      setShowPareto(true);
      setShowLineages(false);
      setShowScalingLaws(false);
    } else if (preset === 'scaling') {
      onChangeX('trainingFlops');
      onChangeY('compositeIQ');
      onChangeZ('totalParamsB');
      setShowScalingLaws(true);
      setShowPareto(true);
      setShowLineages(true);
    } else {
      onChangeX('releaseDate');
      onChangeY('livebenchGlobal');
      onChangeZ('uniform');
      setShowLineages(true);
      setShowPareto(false);
      setShowScalingLaws(false);
    }
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePlantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantName.trim()) return;
    const scoreNum = Number(plantScore);
    const outCost = Number(plantCostOut) || 0;
    const paramsB = Number(plantParamsB) || 70;
    const parentNode = plantParentId ? byId.get(plantParentId) : undefined;
    const blended = Math.round(((3 * (outCost * 0.25) + outCost) / 4) * 100) / 100;

    const newNode: ModelNode = {
      id: `custom-${Date.now()}`,
      name: plantName.trim(),
      family: plantFamily.trim() || 'Custom',
      weightClass: plantWeight,
      generation: parentNode ? parentNode.generation + 1 : 1,
      parentId: parentNode ? parentNode.id : null,
      releaseDate: plantDate,
      knowledgeCutoff: plantDate.slice(0, 7),
      contextWindow: 128000,
      maxOutputTokens: 16384,
      architecture: {
        type: 'Dense',
        totalParamsStr: `${paramsB}B`,
        activeParamsStr: `${paramsB}B Dense`,
        totalParamsB: paramsB,
        activeParamsB: paramsB,
      },
      quantizationFormats: plantWeight === 'open-weight' ? ['FP16', 'FP8', 'Q4_K_M'] : ['API Managed'],
      vramFootprintGB: {
        fp16: Math.round(paramsB * 2.15),
        fp8: Math.round(paramsB * 1.1),
        int4: Math.round(paramsB * 0.62),
        ternary: Math.round(paramsB * 0.25),
      },
      inputCost1M: outCost * 0.25,
      outputCost1M: outCost,
      cachedInputCost1M: outCost * 0.06,
      blendedCost1M: blended,
      costPerTask: Math.max(0.001, blended * 0.01),
      tokensPerSec: 95,
      ttftMs: 280,
      trainingFlops: 1.5e25,
      trainingCostUsd: 25e6,
      energyWhPer1k: 0.9,
      license: plantWeight === 'open-weight' ? 'Apache 2.0 (Custom)' : 'Proprietary',
      tags: ['custom', ...(plantWeight === 'open-weight' ? ['local'] : [])],
      benchmarks: {
        compositeIQ: yVar === 'compositeIQ' ? scoreNum : null,
        livebenchGlobal: yVar === 'livebenchGlobal' ? scoreNum : null,
        livebenchAgentic: yVar === 'livebenchAgentic' ? scoreNum : null,
        livebenchCoding: yVar === 'livebenchCoding' ? scoreNum : null,
        livebenchReasoning: yVar === 'livebenchReasoning' ? scoreNum : null,
        livebenchBrowser: yVar === 'livebenchBrowser' ? scoreNum : null,
        sweBenchVerified: yVar === 'sweBenchVerified' ? scoreNum : null,
        gpqaDiamond: yVar === 'gpqaDiamond' ? scoreNum : null,
        aimeFrontierMath: yVar === 'aimeFrontierMath' ? scoreNum : null,
        mmluPro: yVar === 'mmluPro' ? scoreNum : null,
        humanitysLastExam: yVar === 'humanitysLastExam' ? scoreNum : null,
        lmArenaTextElo: yVar === 'lmArenaTextElo' ? scoreNum : null,
        lmArenaWebDevElo: yVar === 'lmArenaWebDevElo' ? scoreNum : null,
        intelPerDollar: yVar === 'intelPerDollar' ? scoreNum : null,
        intelPerActiveParam: yVar === 'intelPerActiveParam' ? scoreNum : null,
      },
      source: 'custom',
      isCustom: true,
    };

    onPlantModel(newNode);
    onSelectModel(newNode.id);
    setPlantName('');
    setShowPlantModal(false);
  };

  return (
    <section className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5">
      {/* Header & Presets */}
      <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {yMeta.label} vs. {xMeta.label}
          </h2>
          <span className="tabular-mono rounded border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
            {zoom.toFixed(1)}x • {validModels.length} nodes
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[var(--text-muted)]">Presets:</span>
          {(
            [
              ['iq_cost', 'Intelligence vs. Cost'],
              ['speed_iq', 'Speed vs. Intelligence'],
              ['scaling', 'Scaling Law: FLOPs vs. IQ'],
              ['timeline', 'Generational Timeline'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => applyPreset(id)}
              className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 4D Variable Selectors */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5">
          <span className="mb-0.5 block text-[10px] font-medium text-[var(--text-muted)] uppercase">X-Axis Variable</span>
          <CustomSelect
            value={xVar}
            onChange={onChangeX}
            options={PLOT_X_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
          />
        </div>

        <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5">
          <span className="mb-0.5 block text-[10px] font-medium text-[var(--text-muted)] uppercase">Y-Axis Metric</span>
          <CustomSelect
            value={yVar}
            onChange={onChangeY}
            options={PLOT_Y_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
          />
        </div>

        <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5">
          <span className="mb-0.5 block text-[10px] font-medium text-[var(--text-muted)] uppercase">Z-Axis (Radius)</span>
          <CustomSelect
            value={zVar}
            onChange={onChangeZ}
            options={PLOT_Z_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
          />
        </div>

        <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5">
          <span className="mb-0.5 block text-[10px] font-medium text-[var(--text-muted)] uppercase">Color Encoding</span>
          <CustomSelect
            value={colorMode}
            onChange={onChangeColor}
            options={[
              { value: 'family', label: 'Model Family' },
              { value: 'weightClass', label: 'Open vs. Closed Weight' },
              { value: 'architecture', label: 'Architecture (Dense/MoE/RL)' },
              { value: 'license', label: 'License Type' },
              { value: 'pareto', label: 'Pareto Efficiency Tier' },
            ]}
          />
        </div>
      </div>

      {/* Benchmark Methodology Strip */}
      <div className="mb-3 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <Info className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />
            <span className="font-medium text-[var(--text-primary)]">{methodology.name}:</span>
            <span className="text-[var(--text-secondary)] line-clamp-1">{methodology.whatItTests}</span>
          </div>
          <button
            onClick={() => setShowMethodology((v) => !v)}
            className="tabular-mono inline-flex shrink-0 items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Info className="h-3 w-3" />
            <span>{showMethodology ? 'HIDE SPEC' : 'BENCHMARK SPEC & METHODOLOGY'}</span>
          </button>
        </div>

        {showMethodology && (
          <div className="border-t border-[var(--border-hairline)] px-3 py-3 text-xs">
            <p className="text-[var(--text-secondary)]">{methodology.whatItTests}</p>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {methodology.composition.map((c) => (
                <div key={c.name} className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2">
                  <div className="flex items-center justify-between font-medium text-[var(--text-primary)]">
                    <span>{c.name}</span>
                    <span className="tabular-mono text-[11px] text-[var(--text-secondary)]">{c.weight}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{c.detail}</div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex flex-col gap-1 text-[11px] text-[var(--text-secondary)] sm:flex-row sm:gap-6">
              <span><strong className="text-[var(--text-primary)]">Verification:</strong> {methodology.verification}</span>
              <span><strong className="text-[var(--text-primary)]">Caveats:</strong> {methodology.caveats}</span>
            </div>
          </div>
        )}
      </div>

      {/* Overlays, Readability Controls & Zoom Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="tabular-mono flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowLineages((v) => !v)}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 transition-colors ${showLineages ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]' : 'border-[var(--border-hairline)] text-[var(--text-secondary)]'}`}
          >
            <GitBranch className="h-3 w-3" /> LINEAGES
          </button>
          <button
            onClick={() => setShowPareto((v) => !v)}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 transition-colors ${showPareto ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]' : 'border-[var(--border-hairline)] text-[var(--text-secondary)]'}`}
          >
            <Trophy className="h-3 w-3" /> PARETO
          </button>
          <button
            onClick={() => setShowScalingLaws((v) => !v)}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 transition-colors ${showScalingLaws ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]' : 'border-[var(--border-hairline)] text-[var(--text-secondary)]'}`}
          >
            <Sparkles className="h-3 w-3" /> SCALING
          </button>
          <button
            onClick={() => setShowGrid((v) => !v)}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 transition-colors ${showGrid ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]' : 'border-[var(--border-hairline)] text-[var(--text-secondary)]'}`}
          >
            <Grid className="h-3 w-3" /> GRID
          </button>
          <button
            onClick={() => setLabelMode((m) => (m === 'auto' ? 'all' : m === 'all' ? 'tips' : 'auto'))}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Tag className="h-3 w-3" /> LABELS: {labelMode.toUpperCase()}
          </button>
        </div>

        <div className="tabular-mono flex flex-wrap items-center gap-1.5">
          <button onClick={() => zoomCenter(1.4)} className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-1 text-[var(--text-primary)] hover:border-[var(--border-strong)]">
            <ZoomIn className="h-3.5 w-3.5" /> +
          </button>
          <button onClick={() => zoomCenter(1 / 1.4)} className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-1 text-[var(--text-primary)] hover:border-[var(--border-strong)]">
            <ZoomOut className="h-3.5 w-3.5" /> -
          </button>
          <button onClick={() => setBoxZoomMode((v) => !v)} className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${boxZoomMode ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]' : 'border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[var(--text-secondary)]'}`}>
            <Scan className="h-3.5 w-3.5" /> BOX
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setBoxZoomMode(false); }} className="inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <RotateCcw className="h-3.5 w-3.5" /> RESET 1X
          </button>
          <button onClick={() => setShowPlantModal(true)} className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2.5 py-1 font-semibold text-[var(--text-primary)] hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> <FlaskConical className="h-3 w-3" /> PLANT
          </button>
        </div>
      </div>

      {/* Scroll-Locked Interactive SVG Viewport (single clean SVG grid, persistent pinned axes) */}
      <div
        ref={containerRef}
        style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
        className="relative w-full overflow-hidden rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
      >
        <div className="tabular-mono pointer-events-none absolute right-3 top-2.5 z-10 inline-flex items-center gap-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)]/90 px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
          <Lock className="h-2.5 w-2.5" /> SCROLL-LOCKED
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Scatter and lineage plot of ${yMeta.label} versus ${xMeta.label} across ${validModels.length} AI models`}
          className={`h-[460px] w-full select-none ${boxZoomMode ? 'cursor-crosshair' : zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => {
            if (!dragState?.moved && e.target === e.currentTarget) onSelectModel(null);
          }}
        >
          <defs>
            <clipPath id="plot-area-clip">
              <rect x={pad.left} y={pad.top} width={plotW} height={plotH} />
            </clipPath>
          </defs>

          {/* Screen-space single coordinate grid aligned to persistent axes */}
          {showGrid && (
            <g>
              {screenYTicks.map((t, idx) => (
                <line key={`gy-${idx}`} x1={pad.left} y1={t.sy} x2={width - pad.right} y2={t.sy} stroke="var(--border-hairline)" strokeDasharray="3 4" strokeWidth={1} />
              ))}
              {screenXTicks.map((t, idx) => (
                <line key={`gx-${idx}`} x1={t.sx} y1={pad.top} x2={t.sx} y2={height - pad.bottom} stroke="var(--border-hairline)" strokeOpacity={0.55} strokeWidth={1} />
              ))}
            </g>
          )}

          {/* Hover crosshair guides */}
          {hoveredScreenPos &&
            hoveredScreenPos.sx >= pad.left &&
            hoveredScreenPos.sx <= width - pad.right &&
            hoveredScreenPos.sy >= pad.top &&
            hoveredScreenPos.sy <= height - pad.bottom && (
              <g className="pointer-events-none">
                <line x1={hoveredScreenPos.sx} y1={pad.top} x2={hoveredScreenPos.sx} y2={height - pad.bottom} stroke="var(--text-muted)" strokeDasharray="2 3" strokeWidth={1} />
                <line x1={pad.left} y1={hoveredScreenPos.sy} x2={width - pad.right} y2={hoveredScreenPos.sy} stroke="var(--text-muted)" strokeDasharray="2 3" strokeWidth={1} />
              </g>
            )}

          {/* Clipped Data Viewport */}
          <g clipPath="url(#plot-area-clip)">
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {showScalingLaws && (
                <g opacity={0.75}>
                  <path
                    d={`M ${pad.left} ${pad.top + plotH * 0.85} Q ${pad.left + plotW * 0.5} ${pad.top + plotH * 0.55}, ${width - pad.right} ${pad.top + plotH * 0.28}`}
                    fill="none"
                    stroke="#7C3AED"
                    strokeDasharray="6 4"
                    strokeWidth={1.7 / Math.sqrt(zoom)}
                  />
                  <text x={pad.left + plotW * 0.62} y={pad.top + plotH * 0.42} className="tabular-mono fill-[#7C3AED]" style={{ fontSize: `${9.5 / Math.sqrt(zoom)}px` }}>
                    Chinchilla Pre-Training Curve
                  </text>
                  <path
                    d={`M ${pad.left + plotW * 0.35} ${pad.top + plotH * 0.6} Q ${pad.left + plotW * 0.68} ${pad.top + plotH * 0.22}, ${width - pad.right} ${pad.top + plotH * 0.06}`}
                    fill="none"
                    stroke="#0891B2"
                    strokeDasharray="4 3"
                    strokeWidth={1.7 / Math.sqrt(zoom)}
                  />
                  <text x={pad.left + plotW * 0.58} y={pad.top + plotH * 0.14} className="tabular-mono fill-[#0891B2]" style={{ fontSize: `${9.5 / Math.sqrt(zoom)}px` }}>
                    Test-Time RL Reasoning Frontier
                  </text>
                </g>
              )}

              {showPareto && paretoPath && (
                <path d={paretoPath} fill="none" stroke="#059669" strokeDasharray="5 3" strokeWidth={1.8 / Math.sqrt(zoom)} opacity={0.8} />
              )}

              {familySeries.map((series) => {
                const isSeriesHighlighted = !highlightedIds || series.nodes.some((n) => highlightedIds.has(n.id));
                const opacity = isSeriesHighlighted ? 1 : 0.14;
                const points = series.nodes.map((n) => ({
                  node: n,
                  x: toWorldX(n),
                  y: toWorldY(n.benchmarks[yVar] as number),
                }));

                const pathD = points
                  .map((p, i) => {
                    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                    const prev = points[i - 1];
                    const cx = (prev.x + p.x) / 2;
                    return `C ${cx.toFixed(1)} ${prev.y.toFixed(1)}, ${cx.toFixed(1)} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                  })
                  .join(' ');

                return (
                  <g key={series.family} style={{ opacity, transition: 'opacity 180ms ease' }}>
                    {showLineages && points.length > 1 && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={series.color}
                        strokeWidth={(isSeriesHighlighted && highlightedIds ? 2.2 : 1.5) / Math.sqrt(zoom)}
                        strokeLinecap="round"
                      />
                    )}

                    {points.map(({ node, x, y }) => {
                      const isSelected = node.id === selectedModelId;
                      const isHovered = node.id === hoveredId;
                      const nodeColor = getNodeColor(node);
                      const r = getRadius(node, isSelected, isHovered);
                      const lbl = labelPlacement.get(node.id);

                      return (
                        <g
                          key={node.id}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredId(node.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectModel(isSelected ? null : node.id);
                          }}
                        >
                          {(isSelected || (showPareto && paretoIds.has(node.id))) && (
                            <circle
                              cx={x}
                              cy={y}
                              r={r + 2.5 / Math.sqrt(zoom)}
                              fill="none"
                              stroke={isSelected ? 'var(--text-primary)' : '#059669'}
                              strokeOpacity={isSelected ? 0.9 : 0.55}
                              strokeWidth={1.2 / Math.sqrt(zoom)}
                            />
                          )}
                          <circle
                            cx={x}
                            cy={y}
                            r={r}
                            fill={nodeColor}
                            fillOpacity={0.9}
                            stroke="var(--bg-canvas)"
                            strokeWidth={1.1 / Math.sqrt(zoom)}
                          />
                          {lbl && (
                            <text
                              x={x + lbl.dx / Math.sqrt(zoom)}
                              y={y - r - 4 / Math.sqrt(zoom)}
                              textAnchor={lbl.anchor}
                              className="tabular-mono pointer-events-none fill-[var(--text-primary)] font-medium"
                              style={{ fontSize: `${9.5 / Math.sqrt(zoom)}px` }}
                            >
                              {node.name}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </g>

          {/* Persistent Pinned Axes (always visible at any zoom/pan) */}
          <g className="pointer-events-none">
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="var(--border-strong)" strokeWidth={1.2} />
            <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="var(--border-strong)" strokeWidth={1.2} />

            {screenYTicks.map((t, idx) => (
              <g key={`ay-${idx}`}>
                <line x1={pad.left - 4} y1={t.sy} x2={pad.left} y2={t.sy} stroke="var(--border-strong)" strokeWidth={1} />
                <text x={pad.left - 8} y={t.sy + 3} textAnchor="end" className="tabular-mono fill-[var(--text-secondary)] text-[10px]">
                  {t.label}
                </text>
              </g>
            ))}

            {screenXTicks.map((t, idx) => (
              <g key={`ax-${idx}`}>
                <line x1={t.sx} y1={height - pad.bottom} x2={t.sx} y2={height - pad.bottom + 4} stroke="var(--border-strong)" strokeWidth={1} />
                <text x={t.sx} y={height - pad.bottom + 17} textAnchor="middle" className="tabular-mono fill-[var(--text-secondary)] text-[10px]">
                  {t.label}
                </text>
              </g>
            ))}

            {/* Axis Titles */}
            <text
              x={16}
              y={pad.top + plotH / 2}
              transform={`rotate(-90 16 ${pad.top + plotH / 2})`}
              textAnchor="middle"
              className="tabular-mono fill-[var(--text-muted)] text-[10px] uppercase tracking-wider"
            >
              {yMeta.shortLabel} ({yMeta.unit || 'pts'})
            </text>
            <text
              x={pad.left + plotW / 2}
              y={height - 10}
              textAnchor="middle"
              className="tabular-mono fill-[var(--text-muted)] text-[10px] uppercase tracking-wider"
            >
              {xMeta.label}
            </text>
          </g>

          {dragState?.mode === 'box' && dragState.moved && (
            <rect
              x={Math.min(dragState.startX, dragState.curX)}
              y={Math.min(dragState.startY, dragState.curY)}
              width={Math.abs(dragState.curX - dragState.startX)}
              height={Math.abs(dragState.curY - dragState.startY)}
              fill="rgba(107, 114, 128, 0.15)"
              stroke="var(--text-primary)"
              strokeDasharray="4 2"
              strokeWidth={1.2}
            />
          )}
        </svg>

        {zoom > 1.05 && (
          <div className="pointer-events-none absolute bottom-14 right-9 h-20 w-36 overflow-hidden rounded border border-[var(--border-strong)] bg-[var(--bg-surface)]/95 p-1">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
              {validModels.map((n) => (
                <circle key={`mini-${n.id}`} cx={toWorldX(n)} cy={toWorldY(n.benchmarks[yVar] as number)} r={6} fill={getNodeColor(n)} opacity={0.8} />
              ))}
              <rect x={-pan.x / zoom} y={-pan.y / zoom} width={width / zoom} height={height / zoom} fill="rgba(107, 114, 128, 0.12)" stroke="var(--text-primary)" strokeWidth={8} />
            </svg>
          </div>
        )}

        {hoveredModel && (
          <div className="pointer-events-none absolute left-20 top-3 z-10 w-64 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)]/95 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <BrandLogo org={hoveredModel.family} size={15} className="shrink-0 text-[var(--text-secondary)]" />
                <span className="truncate text-xs font-semibold text-[var(--text-primary)]">{hoveredModel.name}</span>
              </div>
              <span className="tabular-mono inline-flex shrink-0 items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                {hoveredModel.weightClass === 'open-weight' ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                {hoveredModel.weightClass === 'open-weight' ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="tabular-mono mt-2 grid grid-cols-2 gap-1 text-[11px] text-[var(--text-secondary)]">
              <div>{yMeta.shortLabel}: <strong className="text-[var(--text-primary)]">{hoveredModel.benchmarks[yVar]}</strong></div>
              <div>Out: <strong className="text-[var(--text-primary)]">${hoveredModel.outputCost1M.toFixed(2)}/1M</strong></div>
              <div>Params: <strong className="text-[var(--text-primary)]">{hoveredModel.architecture.totalParamsStr}</strong></div>
              <div>Active: <strong className="text-[var(--text-primary)]">{hoveredModel.architecture.activeParamsStr}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Model Inspector Bar */}
      {selectedModel && (
        <div className="mt-4 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BrandLogo org={selectedModel.family} size={18} className="text-[var(--text-primary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {selectedModel.family} - {selectedModel.name}
              </span>
              <span className="tabular-mono inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                {selectedModel.weightClass === 'open-weight' ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {selectedModel.weightClass === 'open-weight' ? 'Open-Weight' : 'Proprietary'} • GEN-{selectedModel.generation}
              </span>
            </div>
            <div className="tabular-mono flex items-center gap-1.5 text-[11px]">
              <button onClick={() => onInspectModel(selectedModel.id)} className="rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2.5 py-1 font-medium text-[var(--text-primary)]">
                INSPECT SPECS
              </button>
              {selectedModel.isCustom && (
                <button onClick={() => { onRemoveCustomModel(selectedModel.id); onSelectModel(null); }} className="rounded border border-[var(--border-hairline)] px-2 py-1 text-[#DC2626]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => onSelectModel(null)} className="rounded border border-[var(--border-hairline)] px-2 py-1 text-[var(--text-secondary)]">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="tabular-mono mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[var(--text-muted)]">LINEAGE:</span>
            {ancestryChain.map((node, i) => (
              <React.Fragment key={node.id}>
                {i > 0 && <span className="text-[var(--text-muted)]">→</span>}
                <button
                  onClick={() => onSelectModel(node.id)}
                  className={`rounded px-1.5 py-0.5 ${node.id === selectedModel.id ? 'border border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {node.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="tabular-mono mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-xs">
            <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">{yMeta.shortLabel}</div>
              <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">{selectedModel.benchmarks[yVar] ?? 'N/A'}</div>
              <div className="text-[11px]">
                {scoreDelta !== null ? (
                  <span className={scoreDelta >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}>
                    {scoreDelta >= 0 ? '+' : ''}{scoreDelta.toFixed(1)} vs {selectedParent?.name}
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)]">{selectedParent ? `N/A on ${selectedParent.name}` : 'Genesis'}</span>
                )}
              </div>
            </div>
            <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Blended $/1M</div>
              <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">${selectedModel.blendedCost1M.toFixed(2)}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Task: ${selectedModel.costPerTask.toFixed(3)}</div>
            </div>
            <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Architecture</div>
              <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">{selectedModel.architecture.totalParamsStr}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">{selectedModel.architecture.activeParamsStr}</div>
            </div>
            <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Context &amp; Speed</div>
              <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">{Math.round(selectedModel.contextWindow / 1000)}K ctx</div>
              <div className="text-[11px] text-[var(--text-secondary)]">{selectedModel.tokensPerSec ? `${selectedModel.tokensPerSec} tok/s` : selectedModel.license}</div>
            </div>
          </div>
        </div>
      )}

      {/* Plant Model Modal */}
      {showPlantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowPlantModal(false)}>
          <form onSubmit={handlePlantSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                <FlaskConical className="h-4 w-4" /> Plant Custom Model Node
              </div>
              <button type="button" onClick={() => setShowPlantModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">Model Name *</span>
                <input required value={plantName} onChange={(e) => setPlantName(e.target.value)} placeholder="e.g. Custom-Qwen4-70B-FT" className="tabular-mono mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[var(--text-primary)]" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Family</span>
                  <input value={plantFamily} onChange={(e) => setPlantFamily(e.target.value)} className="tabular-mono mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[var(--text-primary)]" />
                </label>
                <div className="block">
                  <span className="mb-1 block text-[10px] text-[var(--text-muted)] uppercase">Weight Class</span>
                  <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5">
                    <CustomSelect
                      value={plantWeight}
                      onChange={setPlantWeight}
                      options={[
                        { value: 'open-weight', label: 'open-weight' },
                        { value: 'closed-weight', label: 'closed-weight' },
                      ]}
                    />
                  </div>
                </div>
              </div>
              <div className="block">
                <span className="mb-1 block text-[10px] text-[var(--text-muted)] uppercase">Parent Predecessor</span>
                <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5">
                  <CustomSelect
                    value={plantParentId}
                    onChange={setPlantParentId}
                    options={[
                      { value: '', label: 'None (Genesis)' },
                      ...allModels.map((m) => ({ value: m.id, label: `${m.family} - ${m.name}` })),
                    ]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">{yMeta.shortLabel} Score</span>
                  <input type="number" step="0.1" required value={plantScore} onChange={(e) => setPlantScore(e.target.value)} className="tabular-mono mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[var(--text-primary)]" />
                </label>
                <label className="block">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Output $/1M</span>
                  <input type="number" step="0.01" value={plantCostOut} onChange={(e) => setPlantCostOut(e.target.value)} className="tabular-mono mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[var(--text-primary)]" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Params (B)</span>
                  <input type="number" step="1" value={plantParamsB} onChange={(e) => setPlantParamsB(e.target.value)} className="tabular-mono mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[var(--text-primary)]" />
                </label>
                <label className="block">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Release Date</span>
                  <input type="date" value={plantDate} onChange={(e) => setPlantDate(e.target.value)} className="tabular-mono mt-1 w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[var(--text-primary)]" />
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowPlantModal(false)} className="rounded border border-[var(--border-hairline)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">Cancel</button>
              <button type="submit" className="rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)]">Plant on Graph</button>
            </div>
          </form>
        </div>
      )}
      <SourceBadge
        sources={['OpenRouter', 'LiveBench 2.0', 'HF Open LLM', 'LMArena', 'Epoch AI', 'Artificial Analysis']}
        onNavigateSources={onNavigateSources}
        className="mt-3"
      />
    </section>
  );
};
