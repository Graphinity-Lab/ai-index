export type WeightClass = 'open-weight' | 'closed-weight';

export type FilterPill =
  | 'all'
  | 'open-weight'
  | 'closed-weight'
  | 'reasoning'
  | 'coding'
  | 'multimodal'
  | 'local';

export type TerminalView =
  | 'matrix'
  | 'registry'
  | 'dossiers'
  | 'markets'
  | 'profitability'
  | 'impact'
  | 'intel'
  | 'sources';

export type PlotXVar =
  | 'releaseDate'
  | 'inputCost1M'
  | 'outputCost1M'
  | 'blendedCost1M'
  | 'costPerTask'
  | 'tokensPerSec'
  | 'ttftMs'
  | 'totalParamsB'
  | 'activeParamsB'
  | 'contextWindow'
  | 'maxOutputTokens'
  | 'trainingFlops'
  | 'trainingCostUsd'
  | 'energyWhPer1k';

export type PlotYVar =
  | 'compositeIQ'
  | 'livebenchGlobal'
  | 'livebenchAgentic'
  | 'livebenchCoding'
  | 'livebenchReasoning'
  | 'livebenchBrowser'
  | 'sweBenchVerified'
  | 'gpqaDiamond'
  | 'aimeFrontierMath'
  | 'mmluPro'
  | 'humanitysLastExam'
  | 'lmArenaTextElo'
  | 'lmArenaWebDevElo'
  | 'intelPerDollar'
  | 'intelPerActiveParam';

export type PlotZVar =
  | 'uniform'
  | 'totalParamsB'
  | 'activeParamsB'
  | 'contextWindow'
  | 'tokensPerSec'
  | 'costPerTask';

export type PlotColorMode = 'family' | 'weightClass' | 'architecture' | 'license' | 'pareto';

export interface BenchmarkScores {
  compositeIQ: number | null;
  livebenchGlobal: number | null;
  livebenchAgentic: number | null;
  livebenchCoding: number | null;
  livebenchReasoning: number | null;
  livebenchBrowser: number | null;
  sweBenchVerified: number | null;
  gpqaDiamond: number | null;
  aimeFrontierMath: number | null;
  mmluPro: number | null;
  humanitysLastExam: number | null;
  lmArenaTextElo: number | null;
  lmArenaWebDevElo: number | null;
  intelPerDollar: number | null;
  intelPerActiveParam: number | null;
}

export interface ModelArchitecture {
  type: 'Dense' | 'MoE' | 'Hybrid' | 'RL-Reasoning';
  totalParamsStr: string;
  activeParamsStr: string;
  totalParamsB: number;
  activeParamsB: number;
  moeExperts?: string;
}

export interface VramFootprintGB {
  fp16: number;
  fp8: number;
  int4: number;
  ternary: number;
}

export interface ModelNode {
  id: string;
  name: string;
  family: string;
  weightClass: WeightClass;
  generation: number;
  parentId: string | null;
  releaseDate: string; // YYYY-MM-DD
  knowledgeCutoff: string;
  contextWindow: number;
  maxOutputTokens: number;
  architecture: ModelArchitecture;
  quantizationFormats: string[];
  vramFootprintGB: VramFootprintGB;
  inputCost1M: number;
  outputCost1M: number;
  cachedInputCost1M: number;
  blendedCost1M: number;
  costPerTask: number;
  tokensPerSec: number | null;
  ttftMs: number | null;
  trainingFlops: number | null;
  trainingCostUsd: number | null;
  energyWhPer1k: number | null;
  license: string;
  tags: string[];
  openRouterId?: string;
  benchmarks: BenchmarkScores;
  source: 'seed' | 'openrouter+live' | 'openrouter' | 'custom';
  isCustom?: boolean;
}

export interface UpstreamStatus {
  openrouter: string;
  livebench: string;
  hf_leaderboard: string;
  lmsys_arena: string;
  market_feed: string;
  news_rss: string;
}

export interface ModelsDatabase {
  lastSynced: string;
  syncStatus: UpstreamStatus;
  models: ModelNode[];
}

export interface MarketTicker {
  symbol: string;
  name: string;
  sector: 'Silicon' | 'Hyperscaler' | 'AI Platform';
  price: number;
  changePct: number;
  marketCapB: number;
  peRatio: number | null;
  yoyRevGrowthPct: number;
  aiExposureScore: number;
  dataCenterRevSharePct: number | null;
  grossMarginPct: number;
  source: 'live' | 'cached';
}

export interface AcceleratorSpec {
  vendor: string;
  chip: string;
  architecture: string;
  processNode: string;
  fp8Tflops: number;
  fp4Tflops: number | null;
  hbmCapacityGB: number;
  hbmBandwidthTBps: number;
  tdpWatts: number;
  interconnect: string;
  grossMarginEstPct: number;
  estStreetPriceUsd: string;
}

export interface IpoTrackerEntry {
  company: string;
  status: 'Private' | 'IPO Filed / Rumored' | 'Public';
  ticker?: string;
  valuationB: number;
  arrRunRateB: number;
  ipoTimeline: string;
  keyBackers: string;
}

export type NewsCategory = 'MODELS' | 'BENCHMARKS' | 'SILICON' | 'MARKETS & IPOS';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: NewsCategory;
  publishedAt: string;
  url: string;
  summary: string;
}

export interface LabDossier {
  id: string;
  name: string;
  type: 'Frontier Lab' | 'Open-Weight Lab' | 'Silicon & Foundry';
  hq: string;
  leadership: string;
  totalFundingB: number;
  valuationB: number;
  arrRunRateB: number;
  ipoStatus: string;
  computeCluster: string;
  acceleratorMix: string;
  focusAreas: string[];
  flagshipFamilies: string[];
}

export interface MarketDatabase {
  lastSynced: string;
  tickers: MarketTicker[];
  accelerators: AcceleratorSpec[];
  ipos: IpoTrackerEntry[];
  dossiers: LabDossier[];
  news: NewsItem[];
}

export interface CapExYearEntry {
  year: string;
  hyperscalerCapexB: number;
  siliconProfitB: number;
  modelAppRevenueB: number;
  frontierBurnB: number;
}

export interface CircularDeal {
  id: string;
  from: string;
  to: string;
  amountB: number;
  mechanism: string;
  description: string;
}

export interface ProfitabilityDatabase {
  lastSynced: string;
  verdictInfra: string;
  verdictModelLayer: string;
  annualCapexRunRateB: number;
  annualRealizedSoftwareRevB: number;
  infraToSoftwareRatio: number;
  estBreakevenYear: string;
  yearlyLedger: CapExYearEntry[];
  circularDeals: CircularDeal[];
}

export interface ComponentInflationQuarter {
  quarter: string;
  ddr5DramIndex: number;
  nandSsdIndex: number;
  gpuSpotIndex: number;
  aiCapexIndex: number;
}

export interface GpuSupplyPricing {
  model: string;
  tier: 'Consumer / Workstation' | 'Data Center';
  vramGB: number;
  msrpUsd: number;
  spotStreetUsd: number;
  cloudHourlyUsd: number | null;
  leadTimeWeeks: string;
}

export interface EfficiencyJevonsPoint {
  year: string;
  whPerMedianPrompt: number;
  reasoningComputeVolumeIndex: number;
}

export interface ImpactDatabase {
  lastSynced: string;
  supplyChain: {
    dramWaferSharePct: number;
    dramSsdYoySpikePct: number;
    pcBomInflationPct: number;
    ltaBookedThrough: string;
    inflationQuarterly: ComponentInflationQuarter[];
    gpuPricing: GpuSupplyPricing[];
  };
  powerAndWater: {
    globalPowerTwh2026: number;
    globalPowerTwh2030Est: number;
    usAiHubsTwhRange: string;
    indirectWaterLitersPerKwh: number;
    directCoolingLitersPerKwhEvap: number;
    directCoolingLitersPerKwhClosed: number;
    monthlyInference25UsdGal: number;
    relatableComparisons: Array<{ label: string; waterGal: string; energyKwh: string }>;
    efficiencyCurve: EfficiencyJevonsPoint[];
  };
}

export interface AxisMeta<T extends string> {
  key: T;
  label: string;
  shortLabel: string;
  unit: string;
  logScale?: boolean;
  lowerIsBetter?: boolean;
}

export const PLOT_X_OPTIONS: AxisMeta<PlotXVar>[] = [
  { key: 'releaseDate', label: 'Release Date', shortLabel: 'Date', unit: '' },
  { key: 'blendedCost1M', label: 'Blended $/1M (3:1)', shortLabel: 'Blended $/1M', unit: '$', logScale: true, lowerIsBetter: true },
  { key: 'outputCost1M', label: 'Output $/1M', shortLabel: 'Out $/1M', unit: '$', logScale: true, lowerIsBetter: true },
  { key: 'inputCost1M', label: 'Input $/1M', shortLabel: 'In $/1M', unit: '$', logScale: true, lowerIsBetter: true },
  { key: 'costPerTask', label: 'Cost per Successful Task ($)', shortLabel: 'Cost/Task', unit: '$', logScale: true, lowerIsBetter: true },
  { key: 'tokensPerSec', label: 'Output Speed (Tokens/Sec)', shortLabel: 'Tok/s', unit: 't/s' },
  { key: 'ttftMs', label: 'Time to First Token (ms)', shortLabel: 'TTFT', unit: 'ms', logScale: true, lowerIsBetter: true },
  { key: 'totalParamsB', label: 'Total Params (B)', shortLabel: 'Total Params', unit: 'B', logScale: true },
  { key: 'activeParamsB', label: 'Active Params (B)', shortLabel: 'Active Params', unit: 'B', logScale: true },
  { key: 'contextWindow', label: 'Context Window (Tokens)', shortLabel: 'Context', unit: 'tok', logScale: true },
  { key: 'maxOutputTokens', label: 'Max Output Tokens', shortLabel: 'Max Out', unit: 'tok', logScale: true },
  { key: 'trainingFlops', label: 'Training Compute (Est. FLOPs)', shortLabel: 'FLOPs', unit: 'FLOPs', logScale: true },
  { key: 'trainingCostUsd', label: 'Training Cost ($ USD)', shortLabel: 'Train $', unit: '$', logScale: true },
  { key: 'energyWhPer1k', label: 'Inference Energy (Wh/1k tok)', shortLabel: 'Wh/1k', unit: 'Wh', logScale: true, lowerIsBetter: true },
];

export const PLOT_Y_OPTIONS: AxisMeta<PlotYVar>[] = [
  { key: 'compositeIQ', label: 'Composite Intelligence Index', shortLabel: 'Composite IQ', unit: 'pts' },
  { key: 'livebenchGlobal', label: 'LiveBench 2.0 Global', shortLabel: 'LiveBench 2.0', unit: '%' },
  { key: 'livebenchAgentic', label: 'LiveBench Agentic', shortLabel: 'LB Agentic', unit: '%' },
  { key: 'livebenchCoding', label: 'LiveBench Coding', shortLabel: 'LB Coding', unit: '%' },
  { key: 'livebenchReasoning', label: 'LiveBench Reasoning', shortLabel: 'LB Reasoning', unit: '%' },
  { key: 'livebenchBrowser', label: 'LiveBench Browser Use', shortLabel: 'LB Browser', unit: '%' },
  { key: 'sweBenchVerified', label: 'SWE-bench Verified', shortLabel: 'SWE-bench', unit: '%' },
  { key: 'gpqaDiamond', label: 'GPQA Diamond', shortLabel: 'GPQA', unit: '%' },
  { key: 'aimeFrontierMath', label: 'AIME / FrontierMath', shortLabel: 'AIME/Math', unit: '%' },
  { key: 'mmluPro', label: 'MMLU-Pro', shortLabel: 'MMLU-Pro', unit: '%' },
  { key: 'humanitysLastExam', label: "Humanity's Last Exam", shortLabel: 'HLE', unit: '%' },
  { key: 'lmArenaTextElo', label: 'LMArena Text Elo', shortLabel: 'Text Elo', unit: 'Elo' },
  { key: 'lmArenaWebDevElo', label: 'LMArena WebDev Elo', shortLabel: 'WebDev Elo', unit: 'Elo' },
  { key: 'intelPerDollar', label: 'Intelligence-per-Dollar Score', shortLabel: 'IQ/$', unit: 'idx' },
  { key: 'intelPerActiveParam', label: 'Intelligence-per-Active-Param', shortLabel: 'IQ/Param', unit: 'idx' },
];

export const PLOT_Z_OPTIONS: Array<{ key: PlotZVar; label: string }> = [
  { key: 'uniform', label: 'Uniform Size' },
  { key: 'totalParamsB', label: 'Total Params (B)' },
  { key: 'activeParamsB', label: 'Active Params (B)' },
  { key: 'contextWindow', label: 'Context Window' },
  { key: 'tokensPerSec', label: 'Tokens / Sec' },
  { key: 'costPerTask', label: 'Cost per Task ($)' },
];
