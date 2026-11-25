import type {
  AcceleratorSpec,
  BenchmarkScores,
  ImpactDatabase,
  IpoTrackerEntry,
  LabDossier,
  MarketTicker,
  ModelArchitecture,
  ModelNode,
  NewsItem,
  ProfitabilityDatabase,
  WeightClass,
} from '../src/types.ts';

interface SeedInput {
  id: string;
  name: string;
  family: string;
  weightClass: WeightClass;
  generation: number;
  parentId: string | null;
  releaseDate: string;
  knowledgeCutoff: string;
  contextWindow: number;
  maxOutputTokens: number;
  archType: ModelArchitecture['type'];
  totalB: number;
  activeB: number;
  totalStr?: string;
  activeStr?: string;
  moeExperts?: string;
  quant?: string[];
  inCost: number;
  outCost: number;
  tps: number | null;
  ttft: number | null;
  flops?: number | null;
  trainCost?: number | null;
  energyWh?: number | null;
  license: string;
  tags: string[];
  orId?: string;
  b: Partial<BenchmarkScores>;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function makeModel(s: SeedInput): ModelNode {
  const blended = r2((3 * s.inCost + s.outCost) / 4);
  const costPerTask = r2((s.inCost * 0.015 + s.outCost * 0.004) || 0.001);
  const iq = s.b.compositeIQ ?? s.b.livebenchGlobal ?? null;
  const iqPerDollar =
    iq !== null && blended > 0
      ? r2(Math.min(100, (iq / Math.max(0.4, Math.log10(blended * 12 + 1.3))) * 1.12))
      : null;
  const iqPerParam =
    iq !== null && s.activeB > 0
      ? r2(Math.min(100, (iq / Math.log2(s.activeB + 2)) * 6.5))
      : null;

  return {
    id: s.id,
    name: s.name,
    family: s.family,
    weightClass: s.weightClass,
    generation: s.generation,
    parentId: s.parentId,
    releaseDate: s.releaseDate,
    knowledgeCutoff: s.knowledgeCutoff,
    contextWindow: s.contextWindow,
    maxOutputTokens: s.maxOutputTokens,
    architecture: {
      type: s.archType,
      totalParamsStr: s.totalStr ?? (s.weightClass === 'closed-weight' ? 'Undisclosed' : `${s.totalB}B`),
      activeParamsStr: s.activeStr ?? `${s.activeB}B ${s.archType}`,
      totalParamsB: s.totalB,
      activeParamsB: s.activeB,
      moeExperts: s.moeExperts,
    },
    quantizationFormats:
      s.quant ?? (s.weightClass === 'open-weight' ? ['FP16', 'FP8', 'Q4_K_M'] : ['API Managed']),
    vramFootprintGB: {
      fp16: Math.round(s.totalB * 2.15),
      fp8: Math.round(s.totalB * 1.1),
      int4: Math.round(s.totalB * 0.62),
      ternary: Math.round(s.totalB * 0.25),
    },
    inputCost1M: s.inCost,
    outputCost1M: s.outCost,
    cachedInputCost1M: r2(s.inCost * 0.25),
    blendedCost1M: blended,
    costPerTask,
    tokensPerSec: s.tps,
    ttftMs: s.ttft,
    trainingFlops: s.flops ?? null,
    trainingCostUsd: s.trainCost ?? null,
    energyWhPer1k: s.energyWh ?? r2(Math.max(0.08, s.activeB * 0.014)),
    license: s.license,
    tags: s.tags,
    openRouterId: s.orId,
    benchmarks: {
      compositeIQ: s.b.compositeIQ ?? null,
      livebenchGlobal: s.b.livebenchGlobal ?? null,
      livebenchAgentic: s.b.livebenchAgentic ?? null,
      livebenchCoding: s.b.livebenchCoding ?? null,
      livebenchReasoning: s.b.livebenchReasoning ?? null,
      livebenchBrowser: s.b.livebenchBrowser ?? null,
      sweBenchVerified: s.b.sweBenchVerified ?? null,
      gpqaDiamond: s.b.gpqaDiamond ?? null,
      aimeFrontierMath: s.b.aimeFrontierMath ?? null,
      mmluPro: s.b.mmluPro ?? null,
      humanitysLastExam: s.b.humanitysLastExam ?? null,
      lmArenaTextElo: s.b.lmArenaTextElo ?? null,
      lmArenaWebDevElo: s.b.lmArenaWebDevElo ?? null,
      intelPerDollar: s.b.intelPerDollar ?? iqPerDollar,
      intelPerActiveParam: s.b.intelPerActiveParam ?? iqPerParam,
    },
    source: 'seed',
  };
}

export const SEED_MODELS: ModelNode[] = [
  // ================= GOOGLE DEEPMIND =================
  makeModel({
    id: 'google-palm-2', name: 'PaLM 2', family: 'Google', weightClass: 'closed-weight',
    generation: 1, parentId: null, releaseDate: '2023-05-10', knowledgeCutoff: '2023-03',
    contextWindow: 8192, maxOutputTokens: 2048, archType: 'Dense', totalB: 340, activeB: 340,
    totalStr: '340B', inCost: 0.5, outCost: 1.5, tps: 62, ttft: 620, flops: 2.2e24, trainCost: 18e6,
    license: 'Proprietary', tags: [],
    b: { compositeIQ: 31, livebenchGlobal: 29.8, sweBenchVerified: 3.5, mmluPro: 45.2, gpqaDiamond: 28.0, lmArenaTextElo: 1102 },
  }),
  makeModel({
    id: 'google-gemini-1.0-pro', name: 'Gemini 1.0 Pro', family: 'Google', weightClass: 'closed-weight',
    generation: 2, parentId: 'google-palm-2', releaseDate: '2023-12-06', knowledgeCutoff: '2023-10',
    contextWindow: 32768, maxOutputTokens: 8192, archType: 'Dense', totalB: 150, activeB: 150,
    inCost: 0.5, outCost: 1.5, tps: 85, ttft: 490, flops: 4.5e24, trainCost: 35e6,
    license: 'Proprietary', tags: ['multimodal'],
    b: { compositeIQ: 42, livebenchGlobal: 41.0, sweBenchVerified: 11.2, mmluPro: 57.6, gpqaDiamond: 34.1, lmArenaTextElo: 1138 },
  }),
  makeModel({
    id: 'google-gemini-1.5-pro', name: 'Gemini 1.5 Pro', family: 'Google', weightClass: 'closed-weight',
    generation: 3, parentId: 'google-gemini-1.0-pro', releaseDate: '2024-02-15', knowledgeCutoff: '2023-11',
    contextWindow: 2000000, maxOutputTokens: 8192, archType: 'MoE', totalB: 320, activeB: 75,
    inCost: 1.25, outCost: 5.0, tps: 90, ttft: 680, flops: 1.1e25, trainCost: 65e6,
    license: 'Proprietary', tags: ['coding', 'multimodal'], orId: 'google/gemini-pro-1.5',
    b: { compositeIQ: 58, livebenchGlobal: 57.2, livebenchCoding: 55.4, sweBenchVerified: 28.6, mmluPro: 75.8, gpqaDiamond: 59.1, aimeFrontierMath: 4.5, lmArenaTextElo: 1304 },
  }),
  makeModel({
    id: 'google-gemini-2.0-flash', name: 'Gemini 2.0 Flash', family: 'Google', weightClass: 'closed-weight',
    generation: 4, parentId: 'google-gemini-1.5-pro', releaseDate: '2024-12-11', knowledgeCutoff: '2024-08',
    contextWindow: 1048576, maxOutputTokens: 8192, archType: 'MoE', totalB: 120, activeB: 30,
    inCost: 0.1, outCost: 0.4, tps: 210, ttft: 280, flops: 8e24, trainCost: 40e6,
    license: 'Proprietary', tags: ['coding', 'multimodal'], orId: 'google/gemini-2.0-flash-001',
    b: { compositeIQ: 66, livebenchGlobal: 64.9, livebenchCoding: 64.1, sweBenchVerified: 39.4, mmluPro: 77.6, gpqaDiamond: 62.1, aimeFrontierMath: 8.2, lmArenaTextElo: 1356 },
  }),
  makeModel({
    id: 'google-gemini-2.5-pro', name: 'Gemini 2.5 Pro', family: 'Google', weightClass: 'closed-weight',
    generation: 5, parentId: 'google-gemini-2.0-flash', releaseDate: '2025-03-25', knowledgeCutoff: '2025-01',
    contextWindow: 1048576, maxOutputTokens: 65536, archType: 'RL-Reasoning', totalB: 450, activeB: 110,
    inCost: 1.25, outCost: 10.0, tps: 124, ttftMs: 1150, ttft: 1150, flops: 3.8e25, trainCost: 140e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'], orId: 'google/gemini-2.5-pro',
    b: { compositeIQ: 83, livebenchGlobal: 83.6, livebenchAgentic: 76.2, livebenchCoding: 84.1, livebenchReasoning: 86.0, sweBenchVerified: 63.8, mmluPro: 86.4, gpqaDiamond: 84.0, aimeFrontierMath: 21.4, humanitysLastExam: 18.8, lmArenaTextElo: 1442, lmArenaWebDevElo: 1418 },
  } as SeedInput),
  makeModel({
    id: 'google-gemini-3.0-pro', name: 'Gemini 3.0 Pro', family: 'Google', weightClass: 'closed-weight',
    generation: 6, parentId: 'google-gemini-2.5-pro', releaseDate: '2025-11-18', knowledgeCutoff: '2025-06',
    contextWindow: 2000000, maxOutputTokens: 65536, archType: 'RL-Reasoning', totalB: 650, activeB: 140,
    inCost: 2.0, outCost: 12.0, tps: 135, ttft: 920, flops: 7.5e25, trainCost: 240e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'], orId: 'google/gemini-3-pro-preview',
    b: { compositeIQ: 89, livebenchGlobal: 89.2, livebenchAgentic: 84.5, livebenchCoding: 89.8, livebenchReasoning: 91.2, livebenchBrowser: 72.0, sweBenchVerified: 76.2, mmluPro: 90.1, gpqaDiamond: 91.9, aimeFrontierMath: 34.8, humanitysLastExam: 37.5, lmArenaTextElo: 1478, lmArenaWebDevElo: 1465 },
  }),
  makeModel({
    id: 'google-gemini-3.1-pro', name: 'Gemini 3.1 Pro', family: 'Google', weightClass: 'closed-weight',
    generation: 7, parentId: 'google-gemini-3.0-pro', releaseDate: '2026-02-19', knowledgeCutoff: '2025-11',
    contextWindow: 2000000, maxOutputTokens: 65536, archType: 'RL-Reasoning', totalB: 700, activeB: 150,
    inCost: 2.0, outCost: 12.0, tps: 142, ttft: 860, flops: 9.2e25, trainCost: 280e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'], orId: 'google/gemini-3.1-pro-preview',
    b: { compositeIQ: 91, livebenchGlobal: 90.8, livebenchAgentic: 86.9, livebenchCoding: 91.4, livebenchReasoning: 92.6, livebenchBrowser: 75.8, sweBenchVerified: 80.6, mmluPro: 91.2, gpqaDiamond: 93.1, aimeFrontierMath: 39.2, humanitysLastExam: 42.1, lmArenaTextElo: 1492, lmArenaWebDevElo: 1480 },
  }),
  makeModel({
    id: 'google-gemini-4-argon', name: 'Gemini 4 Argon', family: 'Google', weightClass: 'closed-weight',
    generation: 8, parentId: 'google-gemini-3.1-pro', releaseDate: '2026-06-15', knowledgeCutoff: '2026-03',
    contextWindow: 2000000, maxOutputTokens: 131072, archType: 'Hybrid', totalB: 850, activeB: 160,
    inCost: 1.5, outCost: 9.0, tps: 165, ttft: 540, flops: 1.4e26, trainCost: 390e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 93, livebenchGlobal: 92.4, livebenchAgentic: 89.2, livebenchCoding: 93.1, livebenchReasoning: 93.8, livebenchBrowser: 80.4, sweBenchVerified: 83.4, mmluPro: 92.3, gpqaDiamond: 94.0, aimeFrontierMath: 44.5, humanitysLastExam: 47.2, lmArenaTextElo: 1506, lmArenaWebDevElo: 1498 },
  }),
  makeModel({
    id: 'google-gemini-4-carbon', name: 'Gemini 4 Carbon', family: 'Google', weightClass: 'closed-weight',
    generation: 9, parentId: 'google-gemini-4-argon', releaseDate: '2026-08-20', knowledgeCutoff: '2026-05',
    contextWindow: 2000000, maxOutputTokens: 131072, archType: 'RL-Reasoning', totalB: 1100, activeB: 185,
    inCost: 2.25, outCost: 12.0, tps: 148, ttft: 680, flops: 2.1e26, trainCost: 520e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 95, livebenchGlobal: 94.1, livebenchAgentic: 91.8, livebenchCoding: 94.6, livebenchReasoning: 95.4, livebenchBrowser: 83.9, sweBenchVerified: 86.1, mmluPro: 93.4, gpqaDiamond: 95.1, aimeFrontierMath: 49.0, humanitysLastExam: 51.8, lmArenaTextElo: 1521, lmArenaWebDevElo: 1514 },
  }),
  makeModel({
    id: 'google-gemini-4-hydrogen', name: 'Gemini 4 Hydrogen', family: 'Google', weightClass: 'closed-weight',
    generation: 10, parentId: 'google-gemini-4-carbon', releaseDate: '2026-10-14', knowledgeCutoff: '2026-07',
    contextWindow: 4000000, maxOutputTokens: 131072, archType: 'RL-Reasoning', totalB: 1400, activeB: 210,
    inCost: 2.0, outCost: 10.0, tps: 172, ttft: 510, flops: 3.1e26, trainCost: 680e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 97, livebenchGlobal: 95.8, livebenchAgentic: 93.6, livebenchCoding: 96.0, livebenchReasoning: 96.8, livebenchBrowser: 87.2, sweBenchVerified: 88.9, mmluPro: 94.5, gpqaDiamond: 96.2, aimeFrontierMath: 54.6, humanitysLastExam: 56.4, lmArenaTextElo: 1538, lmArenaWebDevElo: 1530 },
  }),
  makeModel({
    id: 'google-gemini-4-neon', name: 'Gemini 4 Neon', family: 'Google', weightClass: 'closed-weight',
    generation: 11, parentId: 'google-gemini-4-hydrogen', releaseDate: '2026-11-12', knowledgeCutoff: '2026-09',
    contextWindow: 2000000, maxOutputTokens: 131072, archType: 'MoE', totalB: 450, activeB: 64,
    inCost: 0.45, outCost: 1.8, tps: 245, ttft: 240, flops: 1.2e26, trainCost: 310e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 92, livebenchGlobal: 91.5, livebenchAgentic: 88.4, livebenchCoding: 92.2, livebenchReasoning: 92.1, livebenchBrowser: 82.5, sweBenchVerified: 82.0, mmluPro: 91.8, gpqaDiamond: 93.4, aimeFrontierMath: 43.0, humanitysLastExam: 45.1, lmArenaTextElo: 1502, lmArenaWebDevElo: 1495 },
  }),

  // ================= GOOGLE GEMMA (OPEN-WEIGHT) =================
  makeModel({
    id: 'google-gemma-2-27b', name: 'Gemma 2 27B', family: 'Google Gemma', weightClass: 'open-weight',
    generation: 1, parentId: null, releaseDate: '2024-06-27', knowledgeCutoff: '2024-03',
    contextWindow: 8192, maxOutputTokens: 4096, archType: 'Dense', totalB: 27, activeB: 27,
    inCost: 0.1, outCost: 0.2, tps: 118, ttft: 210, flops: 5.2e23, trainCost: 4e6,
    license: 'Gemma Terms', tags: ['local', 'coding'], orId: 'google/gemma-2-27b-it',
    b: { compositeIQ: 48, livebenchGlobal: 46.2, mmluPro: 56.8, gpqaDiamond: 37.2, lmArenaTextElo: 1218 },
  }),
  makeModel({
    id: 'google-gemma-3-27b', name: 'Gemma 3 27B', family: 'Google Gemma', weightClass: 'open-weight',
    generation: 2, parentId: 'google-gemma-2-27b', releaseDate: '2025-03-12', knowledgeCutoff: '2024-11',
    contextWindow: 131072, maxOutputTokens: 16384, archType: 'Dense', totalB: 27, activeB: 27,
    inCost: 0.08, outCost: 0.18, tps: 130, ttft: 190, flops: 1.4e24, trainCost: 9e6,
    license: 'Gemma Terms', tags: ['local', 'multimodal', 'coding'], orId: 'google/gemma-3-27b-it',
    b: { compositeIQ: 62, livebenchGlobal: 61.4, mmluPro: 69.2, gpqaDiamond: 48.5, lmArenaTextElo: 1338 },
  }),
  makeModel({
    id: 'google-gemma-4-26b-a4b', name: 'Gemma 4 26B A4B', family: 'Google Gemma', weightClass: 'open-weight',
    generation: 3, parentId: 'google-gemma-3-27b', releaseDate: '2026-04-02', knowledgeCutoff: '2026-01',
    contextWindow: 262144, maxOutputTokens: 32768, archType: 'MoE', totalB: 26, activeB: 4,
    moeExperts: '64 experts (4B active)', quant: ['FP16', 'FP8', 'NVFP4', 'Q4_K_M'],
    inCost: 0.04, outCost: 0.12, tps: 235, ttft: 140, flops: 2.8e24, trainCost: 14e6,
    license: 'Apache 2.0', tags: ['local', 'coding', 'moe', 'multimodal'], orId: 'google/gemma-4-26b-a4b-it',
    b: { compositeIQ: 73, livebenchGlobal: 72.1, livebenchCoding: 74.0, sweBenchVerified: 48.2, mmluPro: 78.4, gpqaDiamond: 64.2, lmArenaTextElo: 1378 },
  }),
  makeModel({
    id: 'google-gemma-4-31b', name: 'Gemma 4 31B', family: 'Google Gemma', weightClass: 'open-weight',
    generation: 4, parentId: 'google-gemma-4-26b-a4b', releaseDate: '2026-06-10', knowledgeCutoff: '2026-03',
    contextWindow: 262144, maxOutputTokens: 32768, archType: 'Dense', totalB: 31, activeB: 31,
    quant: ['FP16', 'FP8', 'Q4_K_M'],
    inCost: 0.07, outCost: 0.2, tps: 145, ttft: 175, flops: 4.1e24, trainCost: 18e6,
    license: 'Apache 2.0', tags: ['local', 'reasoning', 'coding', 'multimodal'], orId: 'google/gemma-4-31b-it',
    b: { compositeIQ: 76, livebenchGlobal: 75.4, livebenchCoding: 77.1, sweBenchVerified: 53.6, mmluPro: 80.9, gpqaDiamond: 68.7, lmArenaTextElo: 1396 },
  }),

  // ================= OPENAI =================
  makeModel({
    id: 'openai-gpt-3.5-turbo', name: 'GPT-3.5 Turbo', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 1, parentId: null, releaseDate: '2023-03-01', knowledgeCutoff: '2021-09',
    contextWindow: 16385, maxOutputTokens: 4096, archType: 'Dense', totalB: 20, activeB: 20, totalStr: '~20B',
    inCost: 0.5, outCost: 1.5, tps: 92, ttft: 420, flops: 2.5e23, trainCost: 3e6,
    license: 'Proprietary', tags: ['coding'], orId: 'openai/gpt-3.5-turbo',
    b: { compositeIQ: 29, livebenchGlobal: 28.4, sweBenchVerified: 4.2, mmluPro: 41.0, gpqaDiamond: 26.5, aimeFrontierMath: 1.0, lmArenaTextElo: 1106 },
  }),
  makeModel({
    id: 'openai-gpt-4', name: 'GPT-4', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 2, parentId: 'openai-gpt-3.5-turbo', releaseDate: '2023-03-14', knowledgeCutoff: '2023-04',
    contextWindow: 8192, maxOutputTokens: 4096, archType: 'MoE', totalB: 1760, activeB: 220, totalStr: '~1.76T', activeStr: '~220B MoE',
    inCost: 30.0, outCost: 60.0, tps: 38, ttft: 980, flops: 2.1e25, trainCost: 100e6,
    license: 'Proprietary', tags: ['reasoning', 'coding'], orId: 'openai/gpt-4',
    b: { compositeIQ: 44, livebenchGlobal: 42.1, sweBenchVerified: 13.8, mmluPro: 63.7, gpqaDiamond: 35.7, aimeFrontierMath: 2.0, lmArenaTextElo: 1163 },
  }),
  makeModel({
    id: 'openai-gpt-4o', name: 'GPT-4o', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 3, parentId: 'openai-gpt-4', releaseDate: '2024-05-13', knowledgeCutoff: '2023-10',
    contextWindow: 128000, maxOutputTokens: 16384, archType: 'MoE', totalB: 400, activeB: 90,
    inCost: 2.5, outCost: 10.0, tps: 108, ttft: 460, flops: 1.8e25, trainCost: 90e6,
    license: 'Proprietary', tags: ['coding', 'multimodal'], orId: 'openai/gpt-4o',
    b: { compositeIQ: 59, livebenchGlobal: 58.6, livebenchCoding: 57.2, sweBenchVerified: 33.2, mmluPro: 74.6, gpqaDiamond: 53.6, aimeFrontierMath: 5.0, lmArenaTextElo: 1286 },
  }),
  makeModel({
    id: 'openai-o1', name: 'o1', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 4, parentId: 'openai-gpt-4o', releaseDate: '2024-12-05', knowledgeCutoff: '2023-10',
    contextWindow: 200000, maxOutputTokens: 100000, archType: 'RL-Reasoning', totalB: 500, activeB: 120,
    inCost: 15.0, outCost: 60.0, tps: 44, ttft: 4800, flops: 3.5e25, trainCost: 160e6,
    license: 'Proprietary', tags: ['reasoning', 'coding'], orId: 'openai/o1',
    b: { compositeIQ: 74, livebenchGlobal: 73.8, livebenchReasoning: 81.2, sweBenchVerified: 48.9, mmluPro: 83.5, gpqaDiamond: 78.0, aimeFrontierMath: 14.0, lmArenaTextElo: 1352 },
  }),
  makeModel({
    id: 'openai-o3', name: 'o3', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 5, parentId: 'openai-o1', releaseDate: '2025-04-16', knowledgeCutoff: '2024-06',
    contextWindow: 200000, maxOutputTokens: 100000, archType: 'RL-Reasoning', totalB: 600, activeB: 140,
    inCost: 10.0, outCost: 40.0, tps: 56, ttft: 3900, flops: 6.2e25, trainCost: 220e6,
    license: 'Proprietary', tags: ['reasoning', 'coding'], orId: 'openai/o3',
    b: { compositeIQ: 83, livebenchGlobal: 82.4, livebenchAgentic: 78.0, livebenchCoding: 83.1, livebenchReasoning: 89.4, sweBenchVerified: 69.1, mmluPro: 86.2, gpqaDiamond: 83.3, aimeFrontierMath: 25.2, humanitysLastExam: 24.9, lmArenaTextElo: 1412 },
  }),
  makeModel({
    id: 'openai-gpt-5', name: 'GPT-5', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 6, parentId: 'openai-o3', releaseDate: '2025-08-07', knowledgeCutoff: '2024-10',
    contextWindow: 400000, maxOutputTokens: 128000, archType: 'Hybrid', totalB: 900, activeB: 180,
    inCost: 1.25, outCost: 10.0, tps: 98, ttft: 850, flops: 1.1e26, trainCost: 350e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'], orId: 'openai/gpt-5',
    b: { compositeIQ: 88, livebenchGlobal: 87.9, livebenchAgentic: 83.4, livebenchCoding: 88.5, livebenchReasoning: 90.2, sweBenchVerified: 74.9, mmluPro: 89.4, gpqaDiamond: 87.3, aimeFrontierMath: 32.0, humanitysLastExam: 34.8, lmArenaTextElo: 1445, lmArenaWebDevElo: 1440 },
  }),
  makeModel({
    id: 'openai-gpt-5.3-codex', name: 'GPT-5.3 Codex', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 7, parentId: 'openai-gpt-5', releaseDate: '2026-01-22', knowledgeCutoff: '2025-09',
    contextWindow: 400000, maxOutputTokens: 128000, archType: 'RL-Reasoning', totalB: 850, activeB: 165,
    inCost: 1.75, outCost: 12.0, tps: 112, ttft: 720, flops: 1.5e26, trainCost: 420e6,
    license: 'Proprietary', tags: ['reasoning', 'coding'], orId: 'openai/gpt-5.3-codex',
    b: { compositeIQ: 91, livebenchGlobal: 90.2, livebenchAgentic: 88.6, livebenchCoding: 94.1, sweBenchVerified: 82.4, mmluPro: 89.8, gpqaDiamond: 88.9, aimeFrontierMath: 38.5, lmArenaWebDevElo: 1488 },
  }),
  makeModel({
    id: 'openai-gpt-6-astra', name: 'GPT-6 Astra', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 8, parentId: 'openai-gpt-5.3-codex', releaseDate: '2026-06-18', knowledgeCutoff: '2026-03',
    contextWindow: 1000000, maxOutputTokens: 163840, archType: 'Hybrid', totalB: 1300, activeB: 210,
    inCost: 2.0, outCost: 14.0, tps: 118, ttft: 640, flops: 2.8e26, trainCost: 650e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 94, livebenchGlobal: 93.4, livebenchAgentic: 91.2, livebenchCoding: 94.8, livebenchReasoning: 95.1, livebenchBrowser: 84.0, sweBenchVerified: 85.8, mmluPro: 92.8, gpqaDiamond: 94.6, aimeFrontierMath: 48.2, humanitysLastExam: 50.4, lmArenaTextElo: 1518, lmArenaWebDevElo: 1510 },
  }),
  makeModel({
    id: 'openai-gpt-6.1-sol', name: 'GPT-6.1 Sol', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 9, parentId: 'openai-gpt-6-astra', releaseDate: '2026-09-08', knowledgeCutoff: '2026-06',
    contextWindow: 1000000, maxOutputTokens: 163840, archType: 'MoE', totalB: 520, activeB: 72,
    inCost: 0.6, outCost: 2.4, tps: 195, ttft: 290, flops: 1.6e26, trainCost: 410e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 92, livebenchGlobal: 91.8, livebenchAgentic: 89.0, livebenchCoding: 92.6, sweBenchVerified: 82.9, mmluPro: 91.9, gpqaDiamond: 93.2, aimeFrontierMath: 44.0, lmArenaTextElo: 1504 },
  }),
  makeModel({
    id: 'openai-gpt-6.2-astra-pro', name: 'GPT-6.2 Astra Pro', family: 'OpenAI', weightClass: 'closed-weight',
    generation: 10, parentId: 'openai-gpt-6.1-sol', releaseDate: '2026-11-05', knowledgeCutoff: '2026-08',
    contextWindow: 1000000, maxOutputTokens: 200000, archType: 'RL-Reasoning', totalB: 1600, activeB: 240,
    inCost: 3.5, outCost: 20.0, tps: 94, ttft: 980, flops: 4.2e26, trainCost: 890e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 97, livebenchGlobal: 95.6, livebenchAgentic: 93.8, livebenchCoding: 96.2, livebenchReasoning: 97.0, livebenchBrowser: 87.6, sweBenchVerified: 89.4, mmluPro: 94.7, gpqaDiamond: 96.5, aimeFrontierMath: 56.0, humanitysLastExam: 57.1, lmArenaTextElo: 1540, lmArenaWebDevElo: 1532 },
  }),

  // ================= ANTHROPIC =================
  makeModel({
    id: 'anthropic-claude-3-opus', name: 'Claude 3 Opus', family: 'Anthropic', weightClass: 'closed-weight',
    generation: 1, parentId: null, releaseDate: '2024-03-04', knowledgeCutoff: '2023-08',
    contextWindow: 200000, maxOutputTokens: 4096, archType: 'Dense', totalB: 400, activeB: 400,
    inCost: 15.0, outCost: 75.0, tps: 34, ttft: 1100, flops: 1.5e25, trainCost: 80e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'], orId: 'anthropic/claude-3-opus',
    b: { compositeIQ: 54, livebenchGlobal: 53.7, sweBenchVerified: 22.0, mmluPro: 70.1, gpqaDiamond: 50.4, aimeFrontierMath: 3.2, lmArenaTextElo: 1248 },
  }),
  makeModel({
    id: 'anthropic-claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', family: 'Anthropic', weightClass: 'closed-weight',
    generation: 2, parentId: 'anthropic-claude-3-opus', releaseDate: '2024-10-22', knowledgeCutoff: '2024-04',
    contextWindow: 200000, maxOutputTokens: 8192, archType: 'Dense', totalB: 175, activeB: 175,
    inCost: 3.0, outCost: 15.0, tps: 78, ttft: 650, flops: 2.2e25, trainCost: 95e6,
    license: 'Proprietary', tags: ['coding', 'reasoning', 'multimodal'], orId: 'anthropic/claude-3.5-sonnet',
    b: { compositeIQ: 66, livebenchGlobal: 65.4, livebenchCoding: 68.5, sweBenchVerified: 49.0, mmluPro: 78.0, gpqaDiamond: 65.0, aimeFrontierMath: 7.1, lmArenaTextElo: 1283 },
  }),
  makeModel({
    id: 'anthropic-claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', family: 'Anthropic', weightClass: 'closed-weight',
    generation: 3, parentId: 'anthropic-claude-3.5-sonnet', releaseDate: '2025-02-24', knowledgeCutoff: '2024-10',
    contextWindow: 200000, maxOutputTokens: 64000, archType: 'Hybrid', totalB: 220, activeB: 220,
    inCost: 3.0, outCost: 15.0, tps: 74, ttft: 780, flops: 4.0e25, trainCost: 135e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'], orId: 'anthropic/claude-3.7-sonnet',
    b: { compositeIQ: 75, livebenchGlobal: 74.1, livebenchCoding: 78.4, sweBenchVerified: 62.3, mmluPro: 82.7, gpqaDiamond: 78.2, aimeFrontierMath: 13.4, lmArenaTextElo: 1338 },
  }),
  makeModel({
    id: 'anthropic-claude-4-sonnet', name: 'Claude 4 Sonnet', family: 'Anthropic', weightClass: 'closed-weight',
    generation: 4, parentId: 'anthropic-claude-3.7-sonnet', releaseDate: '2025-05-22', knowledgeCutoff: '2025-03',
    contextWindow: 200000, maxOutputTokens: 64000, archType: 'Hybrid', totalB: 260, activeB: 260,
    inCost: 3.0, outCost: 15.0, tps: 82, ttft: 710, flops: 6.5e25, trainCost: 180e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'], orId: 'anthropic/claude-sonnet-4',
    b: { compositeIQ: 82, livebenchGlobal: 80.5, livebenchAgentic: 81.0, livebenchCoding: 86.2, sweBenchVerified: 72.7, mmluPro: 85.4, gpqaDiamond: 81.8, aimeFrontierMath: 19.5, lmArenaTextElo: 1396, lmArenaWebDevElo: 1435 },
  }),
  makeModel({
    id: 'anthropic-claude-4.6-opus', name: 'Claude 4.6 Opus', family: 'Anthropic', weightClass: 'closed-weight',
    generation: 5, parentId: 'anthropic-claude-4-sonnet', releaseDate: '2026-02-04', knowledgeCutoff: '2025-10',
    contextWindow: 200000, maxOutputTokens: 64000, archType: 'Hybrid', totalB: 620, activeB: 320,
    inCost: 15.0, outCost: 75.0, tps: 54, ttft: 1120, flops: 1.4e26, trainCost: 360e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'], orId: 'anthropic/claude-opus-4.6',
    b: { compositeIQ: 90, livebenchGlobal: 88.9, livebenchAgentic: 89.4, livebenchCoding: 92.8, sweBenchVerified: 81.4, mmluPro: 89.9, gpqaDiamond: 89.5, aimeFrontierMath: 33.4, humanitysLastExam: 39.0, lmArenaTextElo: 1474, lmArenaWebDevElo: 1492 },
  }),
  makeModel({
    id: 'anthropic-claude-sonnet-5.5', name: 'Claude Sonnet 5.5', family: 'Anthropic', weightClass: 'closed-weight',
    generation: 6, parentId: 'anthropic-claude-4.6-opus', releaseDate: '2026-07-14', knowledgeCutoff: '2026-04',
    contextWindow: 500000, maxOutputTokens: 128000, archType: 'Hybrid', totalB: 380, activeB: 96,
    inCost: 2.5, outCost: 12.0, tps: 118, ttft: 490, flops: 1.9e26, trainCost: 440e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 94, livebenchGlobal: 93.2, livebenchAgentic: 92.5, livebenchCoding: 95.8, livebenchBrowser: 85.4, sweBenchVerified: 86.5, mmluPro: 92.1, gpqaDiamond: 93.8, aimeFrontierMath: 46.2, humanitysLastExam: 48.0, lmArenaTextElo: 1515, lmArenaWebDevElo: 1528 },
  }),
  makeModel({
    id: 'anthropic-claude-opus-5.5', name: 'Claude Opus 5.5', family: 'Anthropic', weightClass: 'closed-weight',
    generation: 7, parentId: 'anthropic-claude-sonnet-5.5', releaseDate: '2026-10-28', knowledgeCutoff: '2026-07',
    contextWindow: 500000, maxOutputTokens: 128000, archType: 'RL-Reasoning', totalB: 900, activeB: 180,
    inCost: 10.0, outCost: 50.0, tps: 76, ttft: 840, flops: 3.6e26, trainCost: 780e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 97, livebenchGlobal: 95.9, livebenchAgentic: 94.8, livebenchCoding: 97.1, livebenchReasoning: 96.4, livebenchBrowser: 88.9, sweBenchVerified: 90.2, mmluPro: 94.4, gpqaDiamond: 96.1, aimeFrontierMath: 55.4, humanitysLastExam: 56.8, lmArenaTextElo: 1542, lmArenaWebDevElo: 1548 },
  }),
  makeModel({
    id: 'anthropic-claude-fable-5.2', name: 'Claude Fable 5.2', family: 'Anthropic', weightClass: 'closed-weight',
    generation: 8, parentId: 'anthropic-claude-opus-5.5', releaseDate: '2026-11-18', knowledgeCutoff: '2026-08',
    contextWindow: 1000000, maxOutputTokens: 128000, archType: 'Hybrid', totalB: 280, activeB: 48,
    inCost: 1.0, outCost: 5.0, tps: 162, ttft: 320, flops: 1.5e26, trainCost: 340e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 93, livebenchGlobal: 92.1, livebenchAgentic: 90.8, livebenchCoding: 93.4, sweBenchVerified: 84.1, mmluPro: 91.5, gpqaDiamond: 92.6, aimeFrontierMath: 42.8, lmArenaTextElo: 1510, lmArenaWebDevElo: 1512 },
  }),

  // ================= DEEPSEEK (OPEN-WEIGHT) =================
  makeModel({
    id: 'deepseek-v2', name: 'DeepSeek-V2', family: 'DeepSeek', weightClass: 'open-weight',
    generation: 1, parentId: null, releaseDate: '2024-05-07', knowledgeCutoff: '2024-03',
    contextWindow: 128000, maxOutputTokens: 8192, archType: 'MoE', totalB: 236, activeB: 21,
    moeExperts: '160 routed + 2 shared', inCost: 0.14, outCost: 0.28, tps: 95, ttft: 420, flops: 4.8e24, trainCost: 4e6,
    license: 'DeepSeek Model License', tags: ['coding', 'moe'],
    b: { compositeIQ: 47, livebenchGlobal: 46.8, sweBenchVerified: 17.5, mmluPro: 63.1, gpqaDiamond: 38.4, lmArenaTextElo: 1214 },
  }),
  makeModel({
    id: 'deepseek-v3', name: 'DeepSeek-V3', family: 'DeepSeek', weightClass: 'open-weight',
    generation: 2, parentId: 'deepseek-v2', releaseDate: '2024-12-26', knowledgeCutoff: '2024-10',
    contextWindow: 128000, maxOutputTokens: 8192, archType: 'MoE', totalB: 671, activeB: 37,
    moeExperts: '256 routed + 1 shared', quant: ['FP8 (Native)', 'BF16', 'INT4'],
    inCost: 0.27, outCost: 1.1, tps: 88, ttft: 520, flops: 1.4e25, trainCost: 5.6e6,
    license: 'MIT', tags: ['coding', 'moe'], orId: 'deepseek/deepseek-chat',
    b: { compositeIQ: 68, livebenchGlobal: 68.2, livebenchCoding: 70.1, sweBenchVerified: 42.0, mmluPro: 78.9, gpqaDiamond: 59.1, aimeFrontierMath: 11.2, lmArenaTextElo: 1318 },
  }),
  makeModel({
    id: 'deepseek-r1', name: 'DeepSeek-R1', family: 'DeepSeek', weightClass: 'open-weight',
    generation: 3, parentId: 'deepseek-v3', releaseDate: '2025-01-20', knowledgeCutoff: '2024-10',
    contextWindow: 128000, maxOutputTokens: 64000, archType: 'RL-Reasoning', totalB: 671, activeB: 37,
    moeExperts: '256 routed + 1 shared', quant: ['FP8 (Native)', 'BF16', 'Q4_K_M'],
    inCost: 0.55, outCost: 2.19, tps: 74, ttft: 1450, flops: 2.2e25, trainCost: 8e6,
    license: 'MIT', tags: ['reasoning', 'coding', 'moe'], orId: 'deepseek/deepseek-r1',
    b: { compositeIQ: 77, livebenchGlobal: 76.5, livebenchReasoning: 83.0, livebenchCoding: 76.8, sweBenchVerified: 49.2, mmluPro: 84.0, gpqaDiamond: 71.5, aimeFrontierMath: 18.6, lmArenaTextElo: 1363 },
  }),
  makeModel({
    id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', family: 'DeepSeek', weightClass: 'open-weight',
    generation: 4, parentId: 'deepseek-r1', releaseDate: '2026-04-24', knowledgeCutoff: '2026-01',
    contextWindow: 1048576, maxOutputTokens: 64000, archType: 'MoE', totalB: 1000, activeB: 42,
    moeExperts: '512 routed + 2 shared', quant: ['FP8', 'NVFP4', 'Q4_K_M'],
    inCost: 0.35, outCost: 1.4, tps: 98, ttft: 580, flops: 8.5e25, trainCost: 38e6,
    license: 'MIT', tags: ['reasoning', 'coding', 'moe'],
    b: { compositeIQ: 89, livebenchGlobal: 88.6, livebenchAgentic: 84.2, livebenchCoding: 90.4, livebenchReasoning: 91.0, sweBenchVerified: 76.8, mmluPro: 89.5, gpqaDiamond: 87.4, aimeFrontierMath: 36.2, humanitysLastExam: 38.4, lmArenaTextElo: 1472, lmArenaWebDevElo: 1468 },
  }),
  makeModel({
    id: 'deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash (1017)', family: 'DeepSeek', weightClass: 'open-weight',
    generation: 5, parentId: 'deepseek-v4-pro', releaseDate: '2026-10-17', knowledgeCutoff: '2026-07',
    contextWindow: 1048576, maxOutputTokens: 64000, archType: 'MoE', totalB: 685, activeB: 28,
    moeExperts: '384 routed + 2 shared', quant: ['FP8', 'NVFP4', 'Q4_K_M'],
    inCost: 0.09, outCost: 0.18, tps: 185, ttft: 260, flops: 6.8e25, trainCost: 29e6,
    license: 'MIT', tags: ['reasoning', 'coding', 'moe'], orId: 'deepseek/deepseek-v4-flash',
    b: { compositeIQ: 91, livebenchGlobal: 90.4, livebenchAgentic: 86.5, livebenchCoding: 91.8, livebenchReasoning: 92.2, sweBenchVerified: 79.4, mmluPro: 90.6, gpqaDiamond: 89.1, aimeFrontierMath: 41.0, humanitysLastExam: 41.5, lmArenaTextElo: 1486, lmArenaWebDevElo: 1482 },
  }),

  // ================= META LLAMA & MUSE (OPEN-WEIGHT) =================
  makeModel({
    id: 'meta-llama-2-70b', name: 'Llama 2 70B', family: 'Meta Llama', weightClass: 'open-weight',
    generation: 1, parentId: null, releaseDate: '2023-07-18', knowledgeCutoff: '2023-03',
    contextWindow: 4096, maxOutputTokens: 4096, archType: 'Dense', totalB: 70, activeB: 70,
    inCost: 0.7, outCost: 0.9, tps: 68, ttft: 360, flops: 8.4e23, trainCost: 5e6,
    license: 'Llama 2 Community', tags: ['local'], orId: 'meta-llama/llama-2-70b-chat',
    b: { compositeIQ: 26, livebenchGlobal: 25.1, sweBenchVerified: 1.8, mmluPro: 38.4, gpqaDiamond: 24.2, lmArenaTextElo: 1093 },
  }),
  makeModel({
    id: 'meta-llama-3.1-405b', name: 'Llama 3.1 405B', family: 'Meta Llama', weightClass: 'open-weight',
    generation: 2, parentId: 'meta-llama-2-70b', releaseDate: '2024-07-23', knowledgeCutoff: '2023-12',
    contextWindow: 128000, maxOutputTokens: 16384, archType: 'Dense', totalB: 405, activeB: 405,
    inCost: 2.0, outCost: 2.0, tps: 42, ttft: 690, flops: 3.8e25, trainCost: 90e6,
    license: 'Llama 3.1 Community', tags: ['coding', 'reasoning'], orId: 'meta-llama/llama-3.1-405b-instruct',
    b: { compositeIQ: 57, livebenchGlobal: 56.8, sweBenchVerified: 29.5, mmluPro: 73.3, gpqaDiamond: 51.1, lmArenaTextElo: 1269 },
  }),
  makeModel({
    id: 'meta-llama-4-scout', name: 'Llama 4 Scout (10M)', family: 'Meta Llama', weightClass: 'open-weight',
    generation: 3, parentId: 'meta-llama-3.1-405b', releaseDate: '2025-04-05', knowledgeCutoff: '2024-08',
    contextWindow: 10000000, maxOutputTokens: 32768, archType: 'MoE', totalB: 109, activeB: 17,
    moeExperts: '16 experts', quant: ['BF16', 'FP8', 'INT4'],
    inCost: 0.08, outCost: 0.3, tps: 210, ttft: 220, flops: 2.1e25, trainCost: 55e6,
    license: 'Llama 4 Community', tags: ['coding', 'multimodal', 'moe', 'local'], orId: 'meta-llama/llama-4-scout',
    b: { compositeIQ: 66, livebenchGlobal: 65.2, sweBenchVerified: 37.0, mmluPro: 74.3, gpqaDiamond: 57.2, lmArenaTextElo: 1332 },
  }),
  makeModel({
    id: 'meta-llama-4-maverick', name: 'Llama 4 Maverick', family: 'Meta Llama', weightClass: 'open-weight',
    generation: 4, parentId: 'meta-llama-4-scout', releaseDate: '2025-04-05', knowledgeCutoff: '2024-08',
    contextWindow: 1000000, maxOutputTokens: 32768, archType: 'MoE', totalB: 400, activeB: 17,
    moeExperts: '128 experts', inCost: 0.22, outCost: 0.88, tps: 175, ttft: 290, flops: 4.5e25, trainCost: 110e6,
    license: 'Llama 4 Community', tags: ['coding', 'multimodal', 'moe'], orId: 'meta-llama/llama-4-maverick',
    b: { compositeIQ: 71, livebenchGlobal: 70.4, sweBenchVerified: 43.8, mmluPro: 80.5, gpqaDiamond: 69.8, lmArenaTextElo: 1384 },
  }),
  makeModel({
    id: 'meta-muse-spark', name: 'Muse Spark', family: 'Meta Llama', weightClass: 'open-weight',
    generation: 5, parentId: 'meta-llama-4-maverick', releaseDate: '2026-05-12', knowledgeCutoff: '2026-02',
    contextWindow: 1000000, maxOutputTokens: 65536, archType: 'MoE', totalB: 520, activeB: 32,
    moeExperts: '256 experts', inCost: 0.18, outCost: 0.72, tps: 148, ttft: 310, flops: 1.2e26, trainCost: 260e6,
    license: 'Llama 4 Community', tags: ['reasoning', 'coding', 'multimodal', 'moe'],
    b: { compositeIQ: 86, livebenchGlobal: 85.4, livebenchAgentic: 80.2, livebenchCoding: 86.1, sweBenchVerified: 68.4, mmluPro: 87.2, gpqaDiamond: 83.5, aimeFrontierMath: 31.0, lmArenaTextElo: 1456 },
  }),
  makeModel({
    id: 'meta-muse-wonder', name: 'Muse Wonder', family: 'Meta Llama', weightClass: 'open-weight',
    generation: 6, parentId: 'meta-muse-spark', releaseDate: '2026-09-24', knowledgeCutoff: '2026-06',
    contextWindow: 2000000, maxOutputTokens: 65536, archType: 'RL-Reasoning', totalB: 1200, activeB: 58,
    moeExperts: '512 experts', inCost: 0.45, outCost: 1.8, tps: 108, ttft: 440, flops: 2.4e26, trainCost: 480e6,
    license: 'Llama 4 Community', tags: ['reasoning', 'coding', 'multimodal', 'moe'],
    b: { compositeIQ: 92, livebenchGlobal: 91.6, livebenchAgentic: 88.4, livebenchCoding: 92.4, livebenchReasoning: 93.1, sweBenchVerified: 80.2, mmluPro: 91.4, gpqaDiamond: 91.8, aimeFrontierMath: 44.2, humanitysLastExam: 46.0, lmArenaTextElo: 1502 },
  }),

  // ================= QWEN / ALIBABA (OPEN-WEIGHT) =================
  makeModel({
    id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', family: 'Qwen', weightClass: 'open-weight',
    generation: 1, parentId: null, releaseDate: '2024-09-19', knowledgeCutoff: '2024-06',
    contextWindow: 128000, maxOutputTokens: 8192, archType: 'Dense', totalB: 72, activeB: 72,
    inCost: 0.35, outCost: 0.4, tps: 86, ttft: 290, flops: 7.8e24, trainCost: 18e6,
    license: 'Apache 2.0', tags: ['coding', 'local'], orId: 'qwen/qwen-2.5-72b-instruct',
    b: { compositeIQ: 61, livebenchGlobal: 60.4, sweBenchVerified: 34.6, mmluPro: 71.7, gpqaDiamond: 49.0, lmArenaTextElo: 1258 },
  }),
  makeModel({
    id: 'qwen-3-235b', name: 'Qwen 3 235B-A22B', family: 'Qwen', weightClass: 'open-weight',
    generation: 2, parentId: 'qwen-2.5-72b', releaseDate: '2025-04-29', knowledgeCutoff: '2025-01',
    contextWindow: 131072, maxOutputTokens: 32768, archType: 'MoE', totalB: 235, activeB: 22,
    moeExperts: '128 experts', inCost: 0.2, outCost: 0.6, tps: 132, ttft: 390, flops: 3.1e25, trainCost: 42e6,
    license: 'Apache 2.0', tags: ['reasoning', 'coding', 'moe'], orId: 'qwen/qwen3-235b-a22b',
    b: { compositeIQ: 80, livebenchGlobal: 79.8, livebenchCoding: 80.5, sweBenchVerified: 58.6, mmluPro: 84.7, gpqaDiamond: 79.2, aimeFrontierMath: 22.0, lmArenaTextElo: 1394 },
  }),
  makeModel({
    id: 'qwen-3.8-max', name: 'Qwen 3.8 Max', family: 'Qwen', weightClass: 'open-weight',
    generation: 3, parentId: 'qwen-3-235b', releaseDate: '2026-03-18', knowledgeCutoff: '2025-12',
    contextWindow: 262144, maxOutputTokens: 65536, archType: 'MoE', totalB: 480, activeB: 36,
    moeExperts: '256 experts', inCost: 0.25, outCost: 0.95, tps: 124, ttft: 360, flops: 8.2e25, trainCost: 95e6,
    license: 'Apache 2.0', tags: ['reasoning', 'coding', 'moe'],
    b: { compositeIQ: 88, livebenchGlobal: 87.9, livebenchAgentic: 84.0, livebenchCoding: 89.2, sweBenchVerified: 75.4, mmluPro: 88.9, gpqaDiamond: 86.8, aimeFrontierMath: 35.6, lmArenaTextElo: 1468 },
  }),
  makeModel({
    id: 'qwen-4-max', name: 'Qwen4-Max', family: 'Qwen', weightClass: 'open-weight',
    generation: 4, parentId: 'qwen-3.8-max', releaseDate: '2026-09-12', knowledgeCutoff: '2026-06',
    contextWindow: 524288, maxOutputTokens: 65536, archType: 'RL-Reasoning', totalB: 720, activeB: 44,
    moeExperts: '256 experts', inCost: 0.3, outCost: 1.2, tps: 118, ttft: 410, flops: 1.6e26, trainCost: 180e6,
    license: 'Apache 2.0', tags: ['reasoning', 'coding', 'moe', 'multimodal'],
    b: { compositeIQ: 93, livebenchGlobal: 92.6, livebenchAgentic: 89.8, livebenchCoding: 93.8, livebenchReasoning: 94.0, sweBenchVerified: 83.2, mmluPro: 92.1, gpqaDiamond: 92.4, aimeFrontierMath: 47.5, humanitysLastExam: 48.2, lmArenaTextElo: 1512, lmArenaWebDevElo: 1506 },
  }),

  // ================= MOONSHOT, Z.AI, XAI, MISTRAL, NVIDIA, COHERE =================
  makeModel({
    id: 'moonshot-kimi-k2', name: 'Kimi K2', family: 'Moonshot (Kimi)', weightClass: 'open-weight',
    generation: 1, parentId: null, releaseDate: '2025-07-11', knowledgeCutoff: '2025-04',
    contextWindow: 131072, maxOutputTokens: 32768, archType: 'MoE', totalB: 1000, activeB: 32,
    moeExperts: '384 experts', inCost: 0.55, outCost: 2.2, tps: 88, ttft: 560, flops: 4.5e25, trainCost: 48e6,
    license: 'Modified MIT', tags: ['coding', 'reasoning', 'moe'], orId: 'moonshotai/kimi-k2',
    b: { compositeIQ: 81, livebenchGlobal: 80.2, livebenchCoding: 82.0, sweBenchVerified: 65.8, mmluPro: 85.1, gpqaDiamond: 75.9, aimeFrontierMath: 21.0, lmArenaTextElo: 1408 },
  }),
  makeModel({
    id: 'moonshot-kimi-k3.1-pro', name: 'Kimi K3.1 Pro', family: 'Moonshot (Kimi)', weightClass: 'open-weight',
    generation: 2, parentId: 'moonshot-kimi-k2', releaseDate: '2026-09-30', knowledgeCutoff: '2026-07',
    contextWindow: 524288, maxOutputTokens: 65536, archType: 'RL-Reasoning', totalB: 1200, activeB: 48,
    moeExperts: '384 experts', inCost: 0.45, outCost: 1.8, tps: 96, ttft: 490, flops: 1.5e26, trainCost: 145e6,
    license: 'Modified MIT', tags: ['coding', 'reasoning', 'moe'],
    b: { compositeIQ: 92, livebenchGlobal: 91.4, livebenchAgentic: 89.2, livebenchCoding: 92.8, sweBenchVerified: 82.0, mmluPro: 91.2, gpqaDiamond: 91.0, aimeFrontierMath: 45.1, lmArenaTextElo: 1498 },
  }),
  makeModel({
    id: 'zai-glm-4.5', name: 'GLM-4.5', family: 'Z.AI (GLM)', weightClass: 'open-weight',
    generation: 1, parentId: null, releaseDate: '2025-07-28', knowledgeCutoff: '2025-04',
    contextWindow: 128000, maxOutputTokens: 96000, archType: 'MoE', totalB: 355, activeB: 32,
    moeExperts: '128 experts', inCost: 0.35, outCost: 1.4, tps: 94, ttft: 480, flops: 3.2e25, trainCost: 35e6,
    license: 'MIT', tags: ['reasoning', 'coding', 'moe'], orId: 'z-ai/glm-4.5',
    b: { compositeIQ: 77, livebenchGlobal: 76.8, sweBenchVerified: 64.2, mmluPro: 83.1, gpqaDiamond: 77.6, lmArenaTextElo: 1388 },
  }),
  makeModel({
    id: 'zai-glm-5.3-flash', name: 'GLM-5.3 Flash', family: 'Z.AI (GLM)', weightClass: 'open-weight',
    generation: 2, parentId: 'zai-glm-4.5', releaseDate: '2026-10-08', knowledgeCutoff: '2026-07',
    contextWindow: 262144, maxOutputTokens: 96000, archType: 'MoE', totalB: 420, activeB: 26,
    moeExperts: '160 experts', inCost: 0.12, outCost: 0.45, tps: 175, ttft: 260, flops: 8.8e25, trainCost: 80e6,
    license: 'MIT', tags: ['reasoning', 'coding', 'moe'],
    b: { compositeIQ: 89, livebenchGlobal: 88.4, livebenchAgentic: 85.1, livebenchCoding: 89.6, sweBenchVerified: 77.5, mmluPro: 89.0, gpqaDiamond: 87.2, aimeFrontierMath: 36.8, lmArenaTextElo: 1470 },
  }),
  makeModel({
    id: 'xai-grok-3', name: 'Grok-3', family: 'xAI', weightClass: 'closed-weight',
    generation: 1, parentId: null, releaseDate: '2025-02-17', knowledgeCutoff: '2024-11',
    contextWindow: 131072, maxOutputTokens: 32768, archType: 'RL-Reasoning', totalB: 800, activeB: 160,
    inCost: 3.0, outCost: 15.0, tps: 86, ttft: 880, flops: 9.5e25, trainCost: 260e6,
    license: 'Proprietary', tags: ['reasoning', 'coding'], orId: 'x-ai/grok-3-beta',
    b: { compositeIQ: 80, livebenchGlobal: 79.4, sweBenchVerified: 57.2, mmluPro: 84.6, gpqaDiamond: 80.2, aimeFrontierMath: 19.0, lmArenaTextElo: 1402 },
  }),
  makeModel({
    id: 'xai-grok-4.7', name: 'Grok 4.7', family: 'xAI', weightClass: 'closed-weight',
    generation: 2, parentId: 'xai-grok-3', releaseDate: '2026-09-19', knowledgeCutoff: '2026-06',
    contextWindow: 2000000, maxOutputTokens: 128000, archType: 'RL-Reasoning', totalB: 1500, activeB: 220,
    inCost: 1.5, outCost: 6.0, tps: 114, ttft: 610, flops: 3.2e26, trainCost: 640e6,
    license: 'Proprietary', tags: ['reasoning', 'coding', 'multimodal'],
    b: { compositeIQ: 94, livebenchGlobal: 93.5, livebenchAgentic: 90.6, livebenchCoding: 93.9, livebenchReasoning: 94.8, sweBenchVerified: 84.6, mmluPro: 93.0, gpqaDiamond: 94.2, aimeFrontierMath: 49.5, humanitysLastExam: 51.0, lmArenaTextElo: 1524 },
  }),
  makeModel({
    id: 'mistral-large-2', name: 'Mistral Large 2', family: 'Mistral', weightClass: 'open-weight',
    generation: 1, parentId: null, releaseDate: '2024-07-24', knowledgeCutoff: '2024-05',
    contextWindow: 128000, maxOutputTokens: 16384, archType: 'Dense', totalB: 123, activeB: 123,
    inCost: 2.0, outCost: 6.0, tps: 72, ttft: 420, flops: 1.1e25, trainCost: 30e6,
    license: 'Mistral Research', tags: ['coding', 'reasoning'], orId: 'mistralai/mistral-large',
    b: { compositeIQ: 58, livebenchGlobal: 57.9, sweBenchVerified: 31.0, mmluPro: 70.4, gpqaDiamond: 48.9, lmArenaTextElo: 1251 },
  }),
  makeModel({
    id: 'mistral-large-4', name: 'Mistral Large 4 (1029)', family: 'Mistral', weightClass: 'open-weight',
    generation: 2, parentId: 'mistral-large-2', releaseDate: '2026-10-29', knowledgeCutoff: '2026-08',
    contextWindow: 262144, maxOutputTokens: 65536, archType: 'MoE', totalB: 320, activeB: 38,
    moeExperts: '128 experts', inCost: 0.5, outCost: 1.5, tps: 138, ttft: 310, flops: 7.4e25, trainCost: 92e6,
    license: 'Apache 2.0', tags: ['coding', 'reasoning', 'moe'],
    b: { compositeIQ: 88, livebenchGlobal: 87.2, livebenchAgentic: 84.5, livebenchCoding: 89.4, sweBenchVerified: 76.0, mmluPro: 88.1, gpqaDiamond: 85.6, aimeFrontierMath: 34.0, lmArenaTextElo: 1464 },
  }),
  makeModel({
    id: 'nvidia-nemotron-3.5-super-vl', name: 'Nemotron 3.5 Super VL (NVFP4)', family: 'NVIDIA Nemotron', weightClass: 'open-weight',
    generation: 1, parentId: null, releaseDate: '2026-08-14', knowledgeCutoff: '2026-05',
    contextWindow: 262144, maxOutputTokens: 32768, archType: 'Hybrid', totalB: 120, activeB: 34,
    quant: ['FP16', 'FP8', 'NVFP4'], inCost: 0.16, outCost: 0.48, tps: 192, ttft: 230, flops: 4.2e25, trainCost: 65e6,
    license: 'NVIDIA Open', tags: ['reasoning', 'coding', 'multimodal', 'moe'],
    b: { compositeIQ: 84, livebenchGlobal: 83.2, livebenchCoding: 84.8, sweBenchVerified: 66.5, mmluPro: 85.4, gpqaDiamond: 79.8, lmArenaTextElo: 1430 },
  }),
];

export const SEED_MARKET_TICKERS: MarketTicker[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Silicon', price: 142.85, changePct: 2.14, marketCapB: 3490, peRatio: 52.4, yoyRevGrowthPct: 94.0, aiExposureScore: 98, dataCenterRevSharePct: 88, grossMarginPct: 74.6, source: 'cached' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Silicon', price: 138.4, changePct: -0.82, marketCapB: 224, peRatio: 44.1, yoyRevGrowthPct: 18.0, aiExposureScore: 76, dataCenterRevSharePct: 52, grossMarginPct: 53.6, source: 'cached' },
  { symbol: 'AVGO', name: 'Broadcom Inc', sector: 'Silicon', price: 178.9, changePct: 1.45, marketCapB: 835, peRatio: 39.2, yoyRevGrowthPct: 47.0, aiExposureScore: 84, dataCenterRevSharePct: 58, grossMarginPct: 76.2, source: 'cached' },
  { symbol: 'TSM', name: 'TSMC', sector: 'Silicon', price: 194.2, changePct: 1.12, marketCapB: 1005, peRatio: 28.6, yoyRevGrowthPct: 36.0, aiExposureScore: 92, dataCenterRevSharePct: 54, grossMarginPct: 57.8, source: 'cached' },
  { symbol: 'ASML', name: 'ASML Holding', sector: 'Silicon', price: 712.5, changePct: 0.64, marketCapB: 282, peRatio: 35.1, yoyRevGrowthPct: 12.0, aiExposureScore: 85, dataCenterRevSharePct: null, grossMarginPct: 51.3, source: 'cached' },
  { symbol: 'MU', name: 'Micron Technology', sector: 'Silicon', price: 104.3, changePct: 1.92, marketCapB: 116, peRatio: 22.8, yoyRevGrowthPct: 84.0, aiExposureScore: 80, dataCenterRevSharePct: 46, grossMarginPct: 39.5, source: 'cached' },
  { symbol: 'ARM', name: 'Arm Holdings', sector: 'Silicon', price: 146.1, changePct: 0.95, marketCapB: 153, peRatio: 82.0, yoyRevGrowthPct: 26.0, aiExposureScore: 78, dataCenterRevSharePct: 32, grossMarginPct: 96.4, source: 'cached' },
  { symbol: 'MSFT', name: 'Microsoft Corp', sector: 'Hyperscaler', price: 428.5, changePct: 0.74, marketCapB: 3185, peRatio: 34.8, yoyRevGrowthPct: 16.0, aiExposureScore: 88, dataCenterRevSharePct: 44, grossMarginPct: 69.4, source: 'cached' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'Hyperscaler', price: 179.4, changePct: 1.28, marketCapB: 2210, peRatio: 23.4, yoyRevGrowthPct: 15.0, aiExposureScore: 86, dataCenterRevSharePct: 18, grossMarginPct: 58.2, source: 'cached' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'Hyperscaler', price: 210.8, changePct: 0.91, marketCapB: 2215, peRatio: 42.1, yoyRevGrowthPct: 11.0, aiExposureScore: 82, dataCenterRevSharePct: 19, grossMarginPct: 48.8, source: 'cached' },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Hyperscaler', price: 592.4, changePct: 1.63, marketCapB: 1495, peRatio: 27.9, yoyRevGrowthPct: 19.0, aiExposureScore: 85, dataCenterRevSharePct: null, grossMarginPct: 81.5, source: 'cached' },
  { symbol: 'ORCL', name: 'Oracle Corp', sector: 'Hyperscaler', price: 186.2, changePct: 2.35, marketCapB: 518, peRatio: 43.6, yoyRevGrowthPct: 9.0, aiExposureScore: 81, dataCenterRevSharePct: 42, grossMarginPct: 71.2, source: 'cached' },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'AI Platform', price: 68.4, changePct: 3.12, marketCapB: 156, peRatio: 198.0, yoyRevGrowthPct: 30.0, aiExposureScore: 95, dataCenterRevSharePct: null, grossMarginPct: 81.1, source: 'cached' },
];

export const SEED_ACCELERATORS: AcceleratorSpec[] = [
  { vendor: 'NVIDIA', chip: 'Blackwell B200 (SXM)', architecture: 'Blackwell', processNode: 'TSMC 4NP', fp8Tflops: 4500, fp4Tflops: 9000, hbmCapacityGB: 192, hbmBandwidthTBps: 8.0, tdpWatts: 1000, interconnect: 'NVLink 5 (1.8 TB/s)', grossMarginEstPct: 75, estStreetPriceUsd: '$35,000 - $42,000' },
  { vendor: 'NVIDIA', chip: 'Rubin R200', architecture: 'Rubin', processNode: 'TSMC N3P', fp8Tflops: 12500, fp4Tflops: 25000, hbmCapacityGB: 288, hbmBandwidthTBps: 13.0, tdpWatts: 1400, interconnect: 'NVLink 6 (3.6 TB/s)', grossMarginEstPct: 76, estStreetPriceUsd: '$45,000+ (Est.)' },
  { vendor: 'AMD', chip: 'Instinct MI325X', architecture: 'CDNA 3', processNode: 'TSMC 5nm/6nm', fp8Tflops: 2610, fp4Tflops: null, hbmCapacityGB: 256, hbmBandwidthTBps: 6.0, tdpWatts: 1000, interconnect: 'Infinity Fabric (896 GB/s)', grossMarginEstPct: 54, estStreetPriceUsd: '$18,000 - $24,000' },
  { vendor: 'AMD', chip: 'Instinct MI355X', architecture: 'CDNA 4', processNode: 'TSMC N3P', fp8Tflops: 4600, fp4Tflops: 9200, hbmCapacityGB: 288, hbmBandwidthTBps: 8.0, tdpWatts: 1400, interconnect: 'UALink / Infinity Fabric', grossMarginEstPct: 56, estStreetPriceUsd: '$25,000 - $32,000' },
  { vendor: 'Google / Broadcom', chip: 'TPU v6e (Trillium)', architecture: 'TPU Systolic', processNode: 'TSMC 5nm', fp8Tflops: 918, fp4Tflops: null, hbmCapacityGB: 32, hbmBandwidthTBps: 1.6, tdpWatts: 250, interconnect: 'ICI Torus (400 GB/s)', grossMarginEstPct: 72, estStreetPriceUsd: 'Internal Cloud Only' },
  { vendor: 'Broadcom Custom ASIC', chip: 'XPU CoWoS-S (OpenAI/Meta)', architecture: 'Custom Matrix XPU', processNode: 'TSMC N3E', fp8Tflops: 3400, fp4Tflops: 6800, hbmCapacityGB: 192, hbmBandwidthTBps: 7.2, tdpWatts: 850, interconnect: 'Tomahawk 5 / UEC Ethernet', grossMarginEstPct: 68, estStreetPriceUsd: 'Custom Co-Design' },
  { vendor: 'AWS', chip: 'Trainium2', architecture: 'NeuronCore-v3', processNode: 'TSMC 5nm', fp8Tflops: 1300, fp4Tflops: null, hbmCapacityGB: 96, hbmBandwidthTBps: 2.9, tdpWatts: 350, interconnect: 'NeuronLink-v2', grossMarginEstPct: 65, estStreetPriceUsd: 'Internal Cloud Only' },
];

export const SEED_IPOS: IpoTrackerEntry[] = [
  { company: 'OpenAI', status: 'IPO Filed / Rumored', valuationB: 300.0, arrRunRateB: 11.6, ipoTimeline: 'Late 2026 / 2027 (Post-PBC)', keyBackers: 'Microsoft, SoftBank, Thrive, NVIDIA' },
  { company: 'Anthropic', status: 'Private', valuationB: 183.0, arrRunRateB: 5.5, ipoTimeline: '2027+ Est.', keyBackers: 'Amazon ($8B), Google ($3B), Lightspeed' },
  { company: 'xAI', status: 'Private', valuationB: 113.0, arrRunRateB: 1.8, ipoTimeline: 'Private (Colossus)', keyBackers: 'Valor, Sequoia, Fidelity, a16z' },
  { company: 'Databricks', status: 'IPO Filed / Rumored', valuationB: 62.0, arrRunRateB: 3.2, ipoTimeline: '2026 IPO Candidate', keyBackers: 'Thrive, a16z, NVIDIA, T. Rowe' },
  { company: 'Mistral AI', status: 'Private', valuationB: 12.0, arrRunRateB: 0.35, ipoTimeline: '2027+ (EU Sovereign AI)', keyBackers: 'General Catalyst, Lightspeed, Microsoft' },
  { company: 'Cohere', status: 'Private', valuationB: 5.5, arrRunRateB: 0.22, ipoTimeline: '2026/2027 Enterprise AI', keyBackers: 'PSP Investments, NVIDIA, Oracle' },
  { company: 'Perplexity', status: 'Private', valuationB: 18.0, arrRunRateB: 0.28, ipoTimeline: 'Private (Series D/E)', keyBackers: 'IVP, SoftBank, NVIDIA, Jeff Bezos' },
];

export const SEED_DOSSIERS: LabDossier[] = [
  {
    id: 'dossier-google', name: 'Google DeepMind', type: 'Frontier Lab', hq: 'London / Mountain View',
    leadership: 'Demis Hassabis (CEO), Jeff Dean (Chief Scientist)', totalFundingB: 0, valuationB: 2210, arrRunRateB: 14.5,
    ipoStatus: 'Public (GOOGL)', computeCluster: '1.5M+ TPU v5p / Trillium v6e / Ironwood Pods',
    acceleratorMix: '90% Custom TPU + 10% NVIDIA B200', focusAreas: ['Gemini 4 Series', 'Gemma Open-Weight', 'AlphaFold / Science'],
    flagshipFamilies: ['Google', 'Google Gemma'],
  },
  {
    id: 'dossier-openai', name: 'OpenAI', type: 'Frontier Lab', hq: 'San Francisco, CA',
    leadership: 'Sam Altman (CEO), Mark Chen (CRO)', totalFundingB: 58.0, valuationB: 300.0, arrRunRateB: 11.6,
    ipoStatus: 'IPO Candidate (2026/27)', computeCluster: '1.2M+ H100/B200 Eq. (Azure + Stargate)',
    acceleratorMix: 'NVIDIA H100/B200 + Broadcom Custom XPU', focusAreas: ['GPT-6 Series', 'RL Reasoning (o-series)', 'Codex / Agents'],
    flagshipFamilies: ['OpenAI'],
  },
  {
    id: 'dossier-anthropic', name: 'Anthropic', type: 'Frontier Lab', hq: 'San Francisco, CA',
    leadership: 'Dario Amodei (CEO), Daniela Amodei (Pres.)', totalFundingB: 27.3, valuationB: 183.0, arrRunRateB: 5.5,
    ipoStatus: 'Private (PBC)', computeCluster: '850K+ Trainium2 / TPU v6e / H100 Eq.',
    acceleratorMix: 'AWS Trainium2 + Google TPU + NVIDIA', focusAreas: ['Claude 5.5 / Fable', 'Agentic Coding', 'Constitutional AI'],
    flagshipFamilies: ['Anthropic'],
  },
  {
    id: 'dossier-deepseek', name: 'DeepSeek', type: 'Open-Weight Lab', hq: 'Hangzhou, China',
    leadership: 'Liang Wenfeng (Founder & CEO)', totalFundingB: 0.5, valuationB: 25.0, arrRunRateB: 0.4,
    ipoStatus: 'Private (High-Flyer Backed)', computeCluster: '65K+ H800 / Ascend 910C Eq.',
    acceleratorMix: 'FP8 Sparse MoE Optimization', focusAreas: ['Ultra-Low-Cost MoE', 'Open-Weight RL', 'DeepSeek V4'],
    flagshipFamilies: ['DeepSeek'],
  },
  {
    id: 'dossier-meta', name: 'Meta Superintelligence / FAIR', type: 'Open-Weight Lab', hq: 'Menlo Park, CA',
    leadership: 'Mark Zuckerberg (CEO), Yann LeCun (Chief AI)', totalFundingB: 0, valuationB: 1495, arrRunRateB: 8.2,
    ipoStatus: 'Public (META)', computeCluster: '900K+ H100 / B200 Eq. (Grand Teton)',
    acceleratorMix: 'NVIDIA H100/B200 + Meta MTIA', focusAreas: ['Llama 4 / Muse', '10M Long Context', 'Open Weights'],
    flagshipFamilies: ['Meta Llama'],
  },
  {
    id: 'dossier-qwen', name: 'Alibaba Qwen Team', type: 'Open-Weight Lab', hq: 'Hangzhou / Singapore',
    leadership: 'Lin Junyang (Tech Lead)', totalFundingB: 0, valuationB: 210, arrRunRateB: 3.1,
    ipoStatus: 'Public (BABA)', computeCluster: '300K+ H800 / Custom Pai-Lingjun',
    acceleratorMix: 'NVIDIA + Alibaba Cloud Clusters', focusAreas: ['Qwen4-Max', 'Open-Weight Coding', 'Multimodal'],
    flagshipFamilies: ['Qwen'],
  },
  {
    id: 'dossier-xai', name: 'xAI', type: 'Frontier Lab', hq: 'Memphis, TN / Palo Alto',
    leadership: 'Elon Musk (Founder)', totalFundingB: 18.0, valuationB: 113.0, arrRunRateB: 1.8,
    ipoStatus: 'Private', computeCluster: '500K+ H100/B200 (Colossus Supercluster)',
    acceleratorMix: '100% NVIDIA InfiniBand / Spectrum-X', focusAreas: ['Grok 4.7', 'Real-Time X Data', 'Robotics / FSD'],
    flagshipFamilies: ['xAI'],
  },
  {
    id: 'dossier-nvidia', name: 'NVIDIA Corp', type: 'Silicon & Foundry', hq: 'Santa Clara, CA',
    leadership: 'Jensen Huang (CEO)', totalFundingB: 0, valuationB: 3490, arrRunRateB: 148.0,
    ipoStatus: 'Public (NVDA)', computeCluster: 'Eos / Selene SuperPODs',
    acceleratorMix: 'Blackwell B200 / Rubin R200 / NVLink', focusAreas: ['CUDA / NVFP4', 'Nemotron 3.5', 'Full-Stack AI'],
    flagshipFamilies: ['NVIDIA Nemotron'],
  },
];

export const SEED_NEWS: NewsItem[] = [
  { id: 'seed-news-1', title: 'Hyperscaler AI CapEx Run-Rate Crosses $520B Annualized as Rubin & MI355X Ramps Begin', source: 'Semiconductor Engineering', category: 'SILICON', publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), url: 'https://semiengineering.com', summary: 'Combined data center capital expenditure across Microsoft, Alphabet, Amazon, Meta, and Oracle accelerates on liquid-cooled HBM4 clusters.' },
  { id: 'seed-news-2', title: 'Frontier Reasoning Models Cross 88% on SWE-bench Verified & 55% on FrontierMath', source: 'Hugging Face Blog', category: 'BENCHMARKS', publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), url: 'https://huggingface.co/blog', summary: 'Test-time compute scaling and hybrid MoE architectures push coding and competition math scores to new highs.' },
  { id: 'seed-news-3', title: 'Open-Weight DeepSeek V4.1 & Qwen4-Max Slash Frontier Inference Cost Below $0.20/1M', source: 'Ars Technica AI', category: 'MODELS', publishedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), url: 'https://arstechnica.com', summary: 'Ultra-sparse MoE routing with 28B-44B active parameters delivers frontier intelligence at commodity API pricing.' },
  { id: 'seed-news-4', title: 'Frontier Labs Prepare 2026/2027 IPO Roadshows Amid Scrutiny on Compute Amortization', source: 'Reuters Tech', category: 'MARKETS & IPOS', publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), url: 'https://www.reuters.com/technology/', summary: 'Public market investors weigh $10B+ ARR growth against multi-billion dollar GPU lease obligations.' },
];

export const SEED_PROFITABILITY: ProfitabilityDatabase = {
  lastSynced: new Date().toISOString(),
  verdictInfra: 'SILICON LAYER: RECORD PROFITS ($184B+)',
  verdictModelLayer: 'MODEL & HYPERSCALER LAYER: CAPEX DEFICIT',
  annualCapexRunRateB: 520,
  annualRealizedSoftwareRevB: 98,
  infraToSoftwareRatio: 5.31,
  estBreakevenYear: '2028-2029 (Est.)',
  yearlyLedger: [
    { year: '2023', hyperscalerCapexB: 158, siliconProfitB: 42, modelAppRevenueB: 12, frontierBurnB: 14 },
    { year: '2024', hyperscalerCapexB: 254, siliconProfitB: 89, modelAppRevenueB: 31, frontierBurnB: 28 },
    { year: '2025', hyperscalerCapexB: 392, siliconProfitB: 138, modelAppRevenueB: 62, frontierBurnB: 44 },
    { year: '2026 (Run-Rate)', hyperscalerCapexB: 520, siliconProfitB: 184, modelAppRevenueB: 98, frontierBurnB: 58 },
  ],
  circularDeals: [
    { id: 'deal-msft-oai', from: 'Microsoft (Azure)', to: 'OpenAI', amountB: 13.75, mechanism: 'Equity + Azure Compute Credits', description: 'Capital invested flows back to Azure GPU cluster rentals & API hosting.' },
    { id: 'deal-amzn-anth', from: 'Amazon (AWS)', to: 'Anthropic', amountB: 8.0, mechanism: 'Convertible Note + Trainium Commitments', description: 'Anthropic commits primary training & Bedrock inference workloads to AWS silicon.' },
    { id: 'deal-nvda-coreweave', from: 'NVIDIA', to: 'CoreWeave / NeoClouds', amountB: 2.3, mechanism: 'Equity Stake + Priority B200 Allocation', description: 'GPU-backed debt facilities accelerate hyperscale cluster purchases from NVIDIA.' },
    { id: 'deal-goog-anth', from: 'Google (GCP)', to: 'Anthropic', amountB: 3.0, mechanism: 'Equity + TPU Cloud Commitments', description: 'Multi-year Google Cloud TPU v5p/v6e reservation tied to strategic equity.' },
    { id: 'deal-orcl-xai', from: 'Oracle / Stargate', to: 'OpenAI & xAI', amountB: 40.0, mechanism: 'Dedicated Mega-Cluster Leases', description: 'Long-term GPU cluster leases financed via hyperscaler debt & CapEx.' },
  ],
};

export const SEED_IMPACT: ImpactDatabase = {
  lastSynced: new Date().toISOString(),
  supplyChain: {
    dramWaferSharePct: 70,
    dramSsdYoySpikePct: 130,
    pcBomInflationPct: 17,
    ltaBookedThrough: '2027–2029 (Samsung / SK Hynix LTAs)',
    inflationQuarterly: [
      { quarter: '2024 Q1', ddr5DramIndex: 100, nandSsdIndex: 100, gpuSpotIndex: 100, aiCapexIndex: 100 },
      { quarter: '2024 Q3', ddr5DramIndex: 118, nandSsdIndex: 124, gpuSpotIndex: 112, aiCapexIndex: 138 },
      { quarter: '2025 Q1', ddr5DramIndex: 142, nandSsdIndex: 151, gpuSpotIndex: 128, aiCapexIndex: 186 },
      { quarter: '2025 Q3', ddr5DramIndex: 179, nandSsdIndex: 184, gpuSpotIndex: 146, aiCapexIndex: 235 },
      { quarter: '2026 Q1', ddr5DramIndex: 214, nandSsdIndex: 219, gpuSpotIndex: 164, aiCapexIndex: 292 },
      { quarter: '2026 Q3', ddr5DramIndex: 230, nandSsdIndex: 232, gpuSpotIndex: 172, aiCapexIndex: 329 },
    ],
    gpuPricing: [
      { model: 'RTX 3070 Ti (8GB)', tier: 'Consumer / Workstation', vramGB: 8, msrpUsd: 599, spotStreetUsd: 420, cloudHourlyUsd: 0.22, leadTimeWeeks: 'In Stock (Used)' },
      { model: 'RX 7900 XTX (24GB)', tier: 'Consumer / Workstation', vramGB: 24, msrpUsd: 999, spotStreetUsd: 1049, cloudHourlyUsd: 0.45, leadTimeWeeks: '1–2 wks' },
      { model: 'RTX 4090 (24GB)', tier: 'Consumer / Workstation', vramGB: 24, msrpUsd: 1599, spotStreetUsd: 2150, cloudHourlyUsd: 0.69, leadTimeWeeks: '2–4 wks' },
      { model: 'RTX 5090 (32GB)', tier: 'Consumer / Workstation', vramGB: 32, msrpUsd: 1999, spotStreetUsd: 2890, cloudHourlyUsd: 1.05, leadTimeWeeks: '6–10 wks' },
      { model: 'NVIDIA H100 (80GB SXM)', tier: 'Data Center', vramGB: 80, msrpUsd: 30000, spotStreetUsd: 31500, cloudHourlyUsd: 2.35, leadTimeWeeks: '8–14 wks' },
      { model: 'NVIDIA H200 (141GB HBM3e)', tier: 'Data Center', vramGB: 141, msrpUsd: 36000, spotStreetUsd: 39500, cloudHourlyUsd: 3.40, leadTimeWeeks: '12–18 wks' },
      { model: 'NVIDIA B200 (192GB HBM3e)', tier: 'Data Center', vramGB: 192, msrpUsd: 40000, spotStreetUsd: 45000, cloudHourlyUsd: 4.95, leadTimeWeeks: '18–28 wks' },
      { model: 'AMD Instinct MI325X (256GB)', tier: 'Data Center', vramGB: 256, msrpUsd: 22000, spotStreetUsd: 23500, cloudHourlyUsd: 2.85, leadTimeWeeks: '10–16 wks' },
    ],
  },
  powerAndWater: {
    globalPowerTwh2026: 485,
    globalPowerTwh2030Est: 950,
    usAiHubsTwhRange: '68–99 TWh (N. Virginia, Texas, Ohio, Oregon)',
    indirectWaterLitersPerKwh: 4.5,
    directCoolingLitersPerKwhEvap: 1.8,
    directCoolingLitersPerKwhClosed: 0.15,
    monthlyInference25UsdGal: 1.9,
    relatableComparisons: [
      { label: '$25/mo LLM Inference (approx. 3,000 prompts)', waterGal: '1.9 gal', energyKwh: '1.4 kWh' },
      { label: '10-Minute Residential Shower', waterGal: '20.0 gal', energyKwh: '2.1 kWh' },
      { label: '1x 1080p Streaming Movie (2 hrs)', waterGal: '0.3 gal', energyKwh: '0.2 kWh' },
      { label: '1x Household Dishwasher Cycle', waterGal: '4.0 gal', energyKwh: '1.5 kWh' },
    ],
    efficiencyCurve: [
      { year: '2023', whPerMedianPrompt: 4.6, reasoningComputeVolumeIndex: 100 },
      { year: '2024', whPerMedianPrompt: 1.2, reasoningComputeVolumeIndex: 280 },
      { year: '2025', whPerMedianPrompt: 0.34, reasoningComputeVolumeIndex: 740 },
      { year: '2026', whPerMedianPrompt: 0.14, reasoningComputeVolumeIndex: 1620 },
    ],
  },
};
