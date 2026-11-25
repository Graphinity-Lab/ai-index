import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Brain,
  Building2,
  Code2,
  DollarSign,
  Eye,
  FileText,
  GitBranch,
  Globe,
  Lock,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  RefreshCw,
  Search,
  Sun,
  TrendingUp,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import { BrandLogo } from './components/BrandLogo.tsx';
import { UniversalPlotter } from './components/UniversalPlotter.tsx';
import { ModelRegistry } from './components/ModelRegistry.tsx';
import { ModelInspectorDrawer } from './components/ModelInspectorDrawer.tsx';
import { LabDossiers } from './components/LabDossiers.tsx';
import { MarketsWarRoom } from './components/MarketsWarRoom.tsx';
import { ProfitabilityLedger } from './components/ProfitabilityLedger.tsx';
import { IntelFeed } from './components/IntelFeed.tsx';
import { ImpactAndTcoView } from './components/ImpactAndTcoView.tsx';
import { SourcesAndLegalView } from './components/SourcesAndLegalView.tsx';
import { SourceBadge } from './components/SourceBadge.tsx';
import {
  PLOT_Y_OPTIONS,
  type FilterPill,
  type ImpactDatabase,
  type MarketDatabase,
  type ModelNode,
  type ModelsDatabase,
  type PlotColorMode,
  type PlotXVar,
  type PlotYVar,
  type PlotZVar,
  type ProfitabilityDatabase,
  type TerminalView,
} from './types.ts';

const CUSTOM_STORAGE_KEY = 'ai-lineage-custom-models-v2';
const THEME_STORAGE_KEY = 'ai-terminal-theme';
const PULSE_STORAGE_KEY = 'ai-index-visitor-pulse';

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return `${tokens}`;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  } catch {
    return iso;
  }
}

const STAT_BAR_METRICS: Array<{ key: PlotYVar; label: string; max: number; unit: string }> = [
  { key: 'compositeIQ', label: 'Composite IQ', max: 100, unit: '' },
  { key: 'livebenchGlobal', label: 'LiveBench 2.0', max: 100, unit: '%' },
  { key: 'sweBenchVerified', label: 'SWE-bench', max: 100, unit: '%' },
  { key: 'gpqaDiamond', label: 'GPQA Diamond', max: 100, unit: '%' },
  { key: 'lmArenaTextElo', label: 'LMArena Elo', max: 1600, unit: '' },
];

const NAV_ITEMS = [
  {
    id: 'matrix' as const,
    code: '01',
    label: 'Multi-Variable Matrix',
    Icon: BarChart3,
    guidingQuestion: 'Where does capability justify the compute price, and where is the diminishing return?',
  },
  {
    id: 'registry' as const,
    code: '02',
    label: 'Models & Inspector',
    Icon: GitBranch,
    guidingQuestion: 'How do open-weight architectures compare to proprietary flagships on cost, latency, and local VRAM?',
  },
  {
    id: 'dossiers' as const,
    code: '03',
    label: 'Company & Lab Dossiers',
    Icon: Building2,
    guidingQuestion: 'Which labs are compounding compute advantages, and which are constrained by capital or silicon?',
  },
  {
    id: 'markets' as const,
    code: '04',
    label: 'Silicon, Stocks & IPOs',
    Icon: TrendingUp,
    guidingQuestion: 'Who captures the margin: chipmakers selling picks and shovels, or labs training models?',
  },
  {
    id: 'profitability' as const,
    code: '05',
    label: 'Is AI Profitable Yet?',
    Icon: DollarSign,
    guidingQuestion: 'With ~$500B+ flowing into data centers, where does hardware profit end and cash burn begin?',
  },
  {
    id: 'impact' as const,
    code: '06',
    label: 'Real-World Impact & TCO',
    Icon: Globe,
    guidingQuestion: 'What do frontier AI workloads actually cost in DRAM inflation, grid power, cooling water, and local TCO?',
  },
  {
    id: 'intel' as const,
    code: '07',
    label: 'Live Intel Feed',
    Icon: Radio,
    guidingQuestion: 'Which model releases, hardware shifts, and regulatory filings are moving the baseline right now?',
  },
  {
    id: 'sources' as const,
    code: '08',
    label: 'Sources, Charter & Legal',
    Icon: FileText,
    guidingQuestion: 'Where does every number come from, and how does this open-source index protect user privacy?',
  },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [view, setView] = useState<TerminalView>('matrix');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [db, setDb] = useState<ModelsDatabase | null>(null);
  const [market, setMarket] = useState<MarketDatabase | null>(null);
  const [profitability, setProfitability] = useState<ProfitabilityDatabase | null>(null);
  const [impact, setImpact] = useState<ImpactDatabase | null>(null);

  const [customModels, setCustomModels] = useState<ModelNode[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ModelNode[]) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterPill, setFilterPill] = useState<FilterPill>('all');

  const [xVar, setXVar] = useState<PlotXVar>('releaseDate');
  const [yVar, setYVar] = useState<PlotYVar>('compositeIQ');
  const [zVar, setZVar] = useState<PlotZVar>('activeParamsB');
  const [colorMode, setColorMode] = useState<PlotColorMode>('family');

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [inspectedModelId, setInspectedModelId] = useState<string | null>(null);
  const [visitorPulse, setVisitorPulse] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PULSE_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Cmd/Ctrl + K focuses global search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customModels));
    } catch {
      // ignore
    }
  }, [customModels]);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [mRes, mkRes, pRes, iRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/market'),
        fetch('/api/profitability'),
        fetch('/api/impact'),
      ]);
      if (!mRes.ok) throw new Error(`Models API HTTP ${mRes.status}`);
      setDb((await mRes.json()) as ModelsDatabase);
      if (mkRes.ok) setMarket((await mkRes.json()) as MarketDatabase);
      if (pRes.ok) setProfitability((await pRes.json()) as ProfitabilityDatabase);
      if (iRes.ok) setImpact((await iRes.json()) as ImpactDatabase);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load telemetry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleManualSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (!res.ok) throw new Error(`Sync failed: HTTP ${res.status}`);
      const payload = (await res.json()) as {
        modelsDb: ModelsDatabase;
        marketDb: MarketDatabase;
        profitabilityDb: ProfitabilityDatabase;
        impactDb: ImpactDatabase;
      };
      setDb(payload.modelsDb);
      setMarket(payload.marketDb);
      setProfitability(payload.profitabilityDb);
      setImpact(payload.impactDb);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync request failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearLocalData = () => {
    setCustomModels([]);
    setVisitorPulse(null);
    setTheme('dark');
    try {
      localStorage.removeItem(CUSTOM_STORAGE_KEY);
      localStorage.removeItem(THEME_STORAGE_KEY);
      localStorage.removeItem(PULSE_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSelectPulse = (stance: string) => {
    setVisitorPulse(stance);
    try {
      localStorage.setItem(PULSE_STORAGE_KEY, stance);
    } catch {
      // ignore
    }
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === view) ?? NAV_ITEMS[0];

  const allModels = useMemo(() => [...(db?.models ?? []), ...customModels], [db?.models, customModels]);

  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allModels.filter((m) => {
      if (filterPill === 'open-weight' && m.weightClass !== 'open-weight') return false;
      if (filterPill === 'closed-weight' && m.weightClass !== 'closed-weight') return false;
      if (filterPill === 'reasoning' && !m.tags.includes('reasoning')) return false;
      if (filterPill === 'coding' && !m.tags.includes('coding')) return false;
      if (filterPill === 'multimodal' && !m.tags.includes('multimodal')) return false;
      if (filterPill === 'local' && !m.tags.includes('local')) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q) ||
        m.license.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allModels, filterPill, search]);

  const activeYMeta = useMemo(
    () => PLOT_Y_OPTIONS.find((o) => o.key === yVar) ?? PLOT_Y_OPTIONS[0],
    [yVar],
  );

  const familyCards = useMemo(() => {
    const groups = new Map<string, ModelNode[]>();
    for (const m of filteredModels) {
      const arr = groups.get(m.family) ?? [];
      arr.push(m);
      groups.set(m.family, arr);
    }
    const byId = new Map<string, ModelNode>();
    for (const m of allModels) byId.set(m.id, m);

    return Array.from(groups.entries())
      .map(([family, list]) => {
        const sorted = [...list].sort((a, b) => a.generation - b.generation);
        const scored = sorted.filter((m) => m.benchmarks[yVar] !== null);
        const flagship = scored[scored.length - 1] ?? sorted[sorted.length - 1];
        const predecessor =
          (flagship.parentId ? byId.get(flagship.parentId) : undefined) ??
          (sorted.length > 1 ? sorted[sorted.length - 2] : null);
        return { family, flagship, predecessor, chainLength: sorted.length };
      })
      .sort((a, b) => (b.flagship.benchmarks[yVar] ?? 0) - (a.flagship.benchmarks[yVar] ?? 0));
  }, [filteredModels, allModels, yVar]);

  const headerTickers = useMemo(() => {
    const syms = ['NVDA', 'AMD', 'AVGO', 'TSM', 'MSFT', 'GOOGL'];
    return (market?.tickers ?? []).filter((t) => syms.includes(t.symbol));
  }, [market?.tickers]);

  const topHeaderModels = useMemo(() => {
    return [...allModels]
      .filter((m) => m.benchmarks.compositeIQ !== null)
      .sort((a, b) => (b.benchmarks.compositeIQ ?? 0) - (a.benchmarks.compositeIQ ?? 0))
      .slice(0, 3);
  }, [allModels]);

  const counts = useMemo(() => {
    const open = allModels.filter((m) => m.weightClass === 'open-weight').length;
    const closed = allModels.filter((m) => m.weightClass === 'closed-weight').length;
    return { total: allModels.length, open, closed };
  }, [allModels]);

  const inspectedModel = useMemo(
    () => (inspectedModelId ? allModels.find((m) => m.id === inspectedModelId) ?? null : null),
    [inspectedModelId, allModels],
  );

  const navigateToSources = () => setView('sources');

  return (
    <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* WCAG 2.1 AA Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:border focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)] focus:px-3 focus:py-1.5 focus:text-xs focus:font-semibold focus:text-[var(--text-primary)]"
      >
        Skip to main content
      </a>

      {/* Persistent Fixed-Height Left Sidebar (Desktop) */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col justify-between overflow-y-auto border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] transition-[width] duration-150 md:flex ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="border-b border-[var(--border-hairline)] px-3.5 py-3">
            {!sidebarCollapsed ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <img
                    src="/banner-trans.png"
                    alt="Graphinity Lab"
                    className={`h-6 w-auto max-w-[165px] object-contain transition-[filter] duration-150 ${theme === 'light' ? 'brightness-0' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((v) => !v)}
                    aria-label="Collapse sidebar"
                    className="shrink-0 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="tabular-mono text-xs font-bold tracking-widest text-[var(--text-primary)]">
                    AI INDEX
                  </span>
                  <div className="tabular-mono flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                    <span>{counts.total}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-0.5"><Unlock className="h-2.5 w-2.5" />{counts.open}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" />{counts.closed}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/favicon.png"
                  alt="AI Index"
                  className={`h-6 w-6 rounded object-contain transition-[filter] duration-150 ${theme === 'light' ? 'brightness-0' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  aria-label="Expand sidebar"
                  className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <nav aria-label="Primary Sidebar" className="space-y-1 p-2.5">
            {NAV_ITEMS.map(({ id, code, label, Icon }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  aria-current={active ? 'page' : undefined}
                  title={sidebarCollapsed ? `${code} ${label}` : undefined}
                  className={`flex w-full items-center gap-2.5 rounded border px-2.5 py-2 text-left text-xs transition-colors ${
                    active
                      ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="truncate">{label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {!sidebarCollapsed && (
          <div className="tabular-mono border-t border-[var(--border-hairline)] p-3 text-[10px] text-[var(--text-muted)]">
            <div className="font-semibold text-[var(--text-secondary)]">OPEN SOURCE // MIT LICENSE</div>
            <div className="mt-1 flex items-center justify-between">
              <span>CONTINUOUSLY UPDATED</span>
              <a
                href="https://github.com/Graphinity-Lab/ai-index"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[var(--text-primary)]"
              >
                GitHub
              </a>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="flex h-full w-64 flex-col justify-between border-r border-[var(--border-strong)] bg-[var(--bg-surface)] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <img
                    src="/banner-trans.png"
                    alt="Graphinity Lab"
                    className={`h-5 w-auto object-contain transition-[filter] duration-150 ${theme === 'light' ? 'brightness-0' : ''}`}
                  />
                  <span className="tabular-mono text-xs font-bold text-[var(--text-primary)]">AI INDEX</span>
                </div>
                <button type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)} className="text-[var(--text-secondary)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav aria-label="Mobile Sidebar" className="space-y-1">
                {NAV_ITEMS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setView(id);
                      setMobileMenuOpen(false);
                    }}
                    aria-current={view === id ? 'page' : undefined}
                    className={`flex w-full items-center gap-2.5 rounded border px-2.5 py-2 text-left text-xs ${
                      view === id
                        ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                        : 'border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="tabular-mono border-t border-[var(--border-hairline)] pt-3 text-[10px] text-[var(--text-muted)]">
              OPEN SOURCE // MIT LICENSE • CONTINUOUSLY UPDATED
            </div>
          </aside>
        </div>
      )}

      {/* Right Scrollable Column: Ticker + Controls Header + Main + Footer */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Persistent Ticker Strip */}
        <div className="tabular-mono border-b border-[var(--border-hairline)] bg-[var(--bg-sub)] px-4 py-1 text-[10px] sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold text-[var(--text-muted)]">TOP IQ:</span>
              {topHeaderModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setInspectedModelId(m.id)}
                  className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <BrandLogo org={m.family} size={12} />
                  <span>{m.name}</span>
                  <span className="font-semibold text-[#059669]">[{m.benchmarks.compositeIQ}]</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold text-[var(--text-muted)]">SILICON:</span>
              {headerTickers.map((t) => (
                <span key={t.symbol} className="inline-flex items-center gap-1">
                  <BrandLogo org={t.name} size={12} className="text-[var(--text-secondary)]" />
                  <strong className="text-[var(--text-primary)]">{t.symbol}</strong>
                  <span className="text-[var(--text-secondary)]">${t.price.toFixed(2)}</span>
                  <span className={t.changePct >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}>
                    {t.changePct >= 0 ? '+' : ''}
                    {t.changePct.toFixed(2)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ultra-Minimal Top Controls Bar */}
        <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/95 px-4 py-2 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 md:hidden">
              <button
                type="button"
                aria-label="Open navigation menu"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-1.5 text-[var(--text-primary)]"
              >
                <Menu className="h-4 w-4" />
              </button>
              <img
                src="/banner-trans.png"
                alt="Graphinity Lab"
                className={`h-6 w-auto object-contain transition-[filter] duration-150 ${theme === 'light' ? 'brightness-0' : ''}`}
              />
              <span className="tabular-mono text-xs font-bold text-[var(--text-primary)]">AI INDEX</span>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {activeNav.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  aria-label="Search models, families, or licenses"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search models... (Ctrl+K)"
                  className="w-44 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none sm:w-60"
                />
              </div>

              <div className="tabular-mono hidden items-center rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[10px] text-[var(--text-secondary)] lg:flex">
                SYNCED: {db ? formatTimestamp(db.lastSynced) : 'LOADING...'}
              </div>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                aria-label="Sync upstream data feeds"
                className="tabular-mono inline-flex items-center gap-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-primary)] hover:opacity-85 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'SYNCING' : 'SYNC'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="tabular-mono inline-flex items-center gap-1.5 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="min-w-0 flex-1 space-y-5 px-4 py-5 sm:px-6">
          {/* Curiosity-First Visitor Inquiry Strip */}
          <section aria-label="Editorial Inquiry Banner" className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3.5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                  Are frontier AI gains outrunning their real-world costs, or are we still early in the curve?
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  We aggregate live telemetry across models, compute, silicon markets, and physical infrastructure, without hype or bias, so you can explore the evidence and decide for yourself.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setView('matrix');
                    setXVar('costPerTask');
                    setYVar('livebenchReasoning');
                    setZVar('activeParamsB');
                  }}
                  className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-left text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  Does 10x cost/token buy 10x reasoning?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('matrix');
                    setXVar('releaseDate');
                    setYVar('intelPerDollar');
                    setZVar('uniform');
                  }}
                  className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-left text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  How fast is intelligence/$ dropping?
                </button>
                <button
                  type="button"
                  onClick={() => setView('impact')}
                  className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-left text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  What does AI cost in RAM, power &amp; water?
                </button>
              </div>
            </div>
          </section>

          {/* Section-Level Guiding Question */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="tabular-mono rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                {activeNav.code}
              </span>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                {activeNav.guidingQuestion}
              </p>
            </div>
          </div>
          {(view === 'matrix' || view === 'registry') && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {(
                  [
                    { id: 'all', label: 'All', Icon: null },
                    { id: 'open-weight', label: 'Open-Weight', Icon: Unlock },
                    { id: 'closed-weight', label: 'Proprietary', Icon: Lock },
                    { id: 'reasoning', label: 'Reasoning', Icon: Brain },
                    { id: 'coding', label: 'Coding', Icon: Code2 },
                    { id: 'multimodal', label: 'Multimodal', Icon: Eye },
                    { id: 'local', label: 'Local', Icon: Zap },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setFilterPill(id)}
                    className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 font-medium transition-colors ${
                      filterPill === id
                        ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              {db && (
                <div className="tabular-mono text-[10px] text-[var(--text-muted)]">
                  OpenRouter: {db.syncStatus.openrouter} • HF: {db.syncStatus.hf_leaderboard}
                </div>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="rounded border border-[#DC2626]/40 bg-[#DC2626]/10 px-4 py-3 text-xs text-[#DC2626]">
              ERROR: {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)]">
              Loading AI Index Telemetry...
            </div>
          ) : view === 'matrix' ? (
            <>
              <UniversalPlotter
                models={filteredModels}
                allModels={allModels}
                xVar={xVar}
                yVar={yVar}
                zVar={zVar}
                colorMode={colorMode}
                onChangeX={setXVar}
                onChangeY={setYVar}
                onChangeZ={setZVar}
                onChangeColor={setColorMode}
                selectedModelId={selectedModelId}
                onSelectModel={setSelectedModelId}
                onInspectModel={setInspectedModelId}
                onPlantModel={(node) => setCustomModels((prev) => [...prev, node])}
                onRemoveCustomModel={(id) => setCustomModels((prev) => prev.filter((m) => m.id !== id))}
                onNavigateSources={navigateToSources}
              />

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                    <GitBranch className="h-4 w-4" /> Generational Delta Matrix ({familyCards.length} Families)
                  </h2>
                  <span className="text-xs text-[var(--text-secondary)]">Flagship vs. Immediate Predecessor</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {familyCards.map(({ family, flagship, predecessor, chainLength }) => {
                    const isOpen = flagship.weightClass === 'open-weight';
                    const activeScore = flagship.benchmarks[yVar];
                    const prevScore = predecessor?.benchmarks[yVar] ?? null;
                    const activeDelta = activeScore !== null && prevScore !== null ? activeScore - prevScore : null;

                    return (
                      <article key={family} className="flex flex-col justify-between rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="tabular-mono flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                                <span className="inline-flex items-center gap-1">
                                  {isOpen ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                                  {isOpen ? 'OPEN-WEIGHT' : 'PROPRIETARY'}
                                </span>
                                <span>•</span>
                                <span>{chainLength} MODELS</span>
                              </div>
                              <div className="mt-1.5 flex items-center gap-2">
                                <BrandLogo org={family} size={17} className="text-[var(--text-primary)]" />
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">{family}</h3>
                              </div>
                            </div>

                            <div className="tabular-mono text-right">
                              <div className="text-[10px] text-[var(--text-muted)] uppercase">{activeYMeta.shortLabel}</div>
                              <div className="text-lg font-bold text-[var(--text-primary)]">{activeScore ?? 'N/A'}</div>
                              {activeDelta !== null ? (
                                <div className={`text-[11px] font-semibold ${activeDelta >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                                  {activeDelta >= 0 ? '+' : ''}{activeDelta.toFixed(1)} vs prev
                                </div>
                              ) : (
                                <div className="text-[10px] text-[var(--text-muted)]">Delta: N/A</div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] p-2.5 text-[11px]">
                            <button onClick={() => setInspectedModelId(flagship.id)} className="text-left hover:underline">
                              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] uppercase">Flagship <ArrowUpRight className="h-3 w-3" /></div>
                              <div className="truncate font-semibold text-[var(--text-primary)]">{flagship.name}</div>
                              <div className="tabular-mono text-[10px] text-[var(--text-secondary)]">{flagship.releaseDate}</div>
                            </button>
                            <button onClick={() => predecessor && setInspectedModelId(predecessor.id)} disabled={!predecessor} className="border-l border-[var(--border-hairline)] pl-2.5 text-left hover:underline disabled:cursor-default disabled:no-underline">
                              <div className="text-[10px] text-[var(--text-muted)] uppercase">Predecessor</div>
                              <div className="truncate font-medium text-[var(--text-secondary)]">{predecessor ? predecessor.name : 'Genesis'}</div>
                              <div className="tabular-mono text-[10px] text-[var(--text-muted)]">{predecessor ? predecessor.releaseDate : '-'}</div>
                            </button>
                          </div>

                          <div className="tabular-mono mt-3 grid grid-cols-3 gap-2 text-[11px]">
                            <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-1.5">
                              <div className="text-[10px] text-[var(--text-muted)]">CONTEXT</div>
                              <div className="font-semibold text-[var(--text-primary)]">{formatContext(flagship.contextWindow)}</div>
                            </div>
                            <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-1.5">
                              <div className="text-[10px] text-[var(--text-muted)]">PARAMS</div>
                              <div className="truncate font-semibold text-[var(--text-primary)]">
                                {flagship.architecture.totalParamsStr === 'Undisclosed' ? flagship.architecture.activeParamsStr : flagship.architecture.totalParamsStr}
                              </div>
                            </div>
                            <div className="rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-2 py-1.5">
                              <div className="text-[10px] text-[var(--text-muted)]">BLENDED $/1M</div>
                              <div className="font-semibold text-[var(--text-primary)]">${flagship.blendedCost1M.toFixed(2)}</div>
                            </div>
                          </div>

                          <div className="tabular-mono mt-3.5 space-y-2">
                            {STAT_BAR_METRICS.map((metric) => {
                              const cur = flagship.benchmarks[metric.key];
                              const prev = predecessor?.benchmarks[metric.key] ?? null;
                              const curPct = cur !== null ? Math.min(100, (cur / metric.max) * 100) : 0;
                              const prevPct = prev !== null ? Math.min(100, (prev / metric.max) * 100) : 0;
                              const diff = cur !== null && prev !== null ? cur - prev : null;

                              return (
                                <div key={metric.key} className="text-[10px]">
                                  <div className="mb-0.5 flex items-center justify-between text-[var(--text-secondary)]">
                                    <span>{metric.label}</span>
                                    <span>
                                      <strong className="text-[var(--text-primary)]">{cur !== null ? `${cur}${metric.unit}` : 'N/A'}</strong>
                                      {diff !== null && (
                                        <span className={`ml-1.5 ${diff >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                                          ({diff >= 0 ? '+' : ''}{metric.key === 'lmArenaTextElo' ? Math.round(diff) : diff.toFixed(1)})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="relative h-1.5 w-full overflow-hidden rounded-sm bg-[var(--bg-elevated)]">
                                    {prev !== null && <div className="absolute inset-y-0 left-0 bg-[var(--text-muted)] opacity-35" style={{ width: `${prevPct}%` }} />}
                                    <div className={`relative h-full ${isOpen ? 'bg-[#0891B2]' : 'bg-[#D97706]'}`} style={{ width: `${curPct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="tabular-mono mt-3.5 flex items-center justify-between border-t border-[var(--border-hairline)] pt-2.5 text-[10px] text-[var(--text-muted)]">
                          <span className="truncate">{flagship.architecture.activeParamsStr}</span>
                          <span className="shrink-0 rounded border border-[var(--border-hairline)] bg-[var(--bg-sub)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                            {flagship.license}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <SourceBadge sources={['OpenRouter', 'LiveBench 2.0', 'HF Open LLM', 'LMArena']} onNavigateSources={navigateToSources} className="mt-3" />
              </section>
            </>
          ) : view === 'registry' ? (
            <ModelRegistry models={filteredModels} activeBenchmarkKey={yVar} onInspectModel={setInspectedModelId} onNavigateSources={navigateToSources} />
          ) : view === 'dossiers' ? (
            <LabDossiers dossiers={market?.dossiers ?? []} models={allModels} onInspectModel={setInspectedModelId} onNavigateSources={navigateToSources} />
          ) : view === 'markets' ? (
            <MarketsWarRoom market={market} onNavigateSources={navigateToSources} />
          ) : view === 'profitability' ? (
            <ProfitabilityLedger data={profitability} onNavigateSources={navigateToSources} />
          ) : view === 'impact' ? (
            <ImpactAndTcoView data={impact} onNavigateSources={navigateToSources} />
          ) : view === 'intel' ? (
            <IntelFeed news={market?.news ?? []} onNavigateSources={navigateToSources} />
          ) : (
            <SourcesAndLegalView onClearLocalData={handleClearLocalData} />
          )}

          {/* Zero-Tracking Visitor Pulse Widget (localStorage only) */}
          <section aria-label="Visitor Reflection" className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Where Do You Stand?
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Based on the telemetry above, how do you weigh the current AI curve? (Saved strictly in localStorage; zero tracking or cookies.)
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  'Productivity & Deflationary Gains',
                  'Infra Outpacing Software ROI',
                  'Too Early / Mixed Evidence',
                ].map((stance) => (
                  <button
                    key={stance}
                    type="button"
                    onClick={() => handleSelectPulse(stance)}
                    className={`rounded border px-2.5 py-1 font-medium transition-colors ${
                      visitorPulse === stance
                        ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-sub)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {stance}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6">
          <div className="tabular-mono flex flex-col gap-2 text-[11px] text-[var(--text-secondary)] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-[var(--text-primary)]">AI INDEX</span>
              <span>•</span>
              <span>MIT License</span>
              <span>•</span>
              <button type="button" onClick={navigateToSources} className="underline hover:text-[var(--text-primary)]">
                Sources, Privacy (PIPEDA) &amp; Accessibility (AODA / WCAG 2.1 AA)
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Zero ownership claimed on third-party benchmarks, weights, or trademarks. Informational telemetry only; not financial advice. Cookie-free.
            </p>
          </div>
        </footer>
      </div>

      <ModelInspectorDrawer
        model={inspectedModel}
        allModels={allModels}
        onClose={() => setInspectedModelId(null)}
        onSelectModel={setInspectedModelId}
      />
    </div>
  );
}
