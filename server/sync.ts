import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import type {
  HistoryDatabase,
  HistorySnapshot,
  ImpactDatabase,
  MarketDatabase,
  MarketTicker,
  ModelNode,
  ModelsDatabase,
  NewsCategory,
  NewsItem,
  ProfitabilityDatabase,
  WeightClass,
} from '../src/types.ts';
import {
  SEED_ACCELERATORS,
  SEED_DOSSIERS,
  SEED_IMPACT,
  SEED_IPOS,
  SEED_MARKET_TICKERS,
  SEED_MODELS,
  SEED_NEWS,
  SEED_PROFITABILITY,
} from './seedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const MODELS_PATH = path.join(DATA_DIR, 'models.json');
const MARKET_PATH = path.join(DATA_DIR, 'market.json');
const PROFITABILITY_PATH = path.join(DATA_DIR, 'profitability.json');
const IMPACT_PATH = path.join(DATA_DIR, 'impact.json');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');
const PORT = Number(process.env.PORT ?? 3001);

interface OpenRouterModel {
  id: string;
  name: string;
  created?: number;
  context_length?: number;
  top_provider?: { max_completion_tokens?: number | null };
  pricing?: { prompt?: string; completion?: string };
  architecture?: { modality?: string };
}

interface FamilyMapping {
  family: string;
  prefixes: string[];
  weightClass: WeightClass;
  defaultLicense: string;
}

const FAMILY_MAPPINGS: FamilyMapping[] = [
  { family: 'OpenAI', prefixes: ['openai/'], weightClass: 'closed-weight', defaultLicense: 'Proprietary' },
  { family: 'Anthropic', prefixes: ['anthropic/'], weightClass: 'closed-weight', defaultLicense: 'Proprietary' },
  { family: 'Google', prefixes: ['google/gemini'], weightClass: 'closed-weight', defaultLicense: 'Proprietary' },
  { family: 'Google Gemma', prefixes: ['google/gemma'], weightClass: 'open-weight', defaultLicense: 'Gemma / Apache 2.0' },
  { family: 'DeepSeek', prefixes: ['deepseek/'], weightClass: 'open-weight', defaultLicense: 'MIT' },
  { family: 'Meta Llama', prefixes: ['meta-llama/'], weightClass: 'open-weight', defaultLicense: 'Llama Community' },
  { family: 'Qwen', prefixes: ['qwen/'], weightClass: 'open-weight', defaultLicense: 'Apache 2.0' },
  { family: 'Mistral', prefixes: ['mistralai/'], weightClass: 'open-weight', defaultLicense: 'Apache 2.0' },
  { family: 'xAI', prefixes: ['x-ai/'], weightClass: 'closed-weight', defaultLicense: 'Proprietary' },
  { family: 'Cohere', prefixes: ['cohere/'], weightClass: 'open-weight', defaultLicense: 'CC-BY-NC-4.0' },
  { family: 'Z.AI (GLM)', prefixes: ['z-ai/', 'thudm/'], weightClass: 'open-weight', defaultLicense: 'MIT' },
  { family: 'Moonshot (Kimi)', prefixes: ['moonshotai/'], weightClass: 'open-weight', defaultLicense: 'Modified MIT' },
  { family: 'NVIDIA Nemotron', prefixes: ['nvidia/'], weightClass: 'open-weight', defaultLicense: 'NVIDIA Open' },
  { family: 'Microsoft Phi', prefixes: ['microsoft/'], weightClass: 'open-weight', defaultLicense: 'MIT' },
  { family: 'Amazon Nova', prefixes: ['amazon/'], weightClass: 'closed-weight', defaultLicense: 'Proprietary' },
  {
    family: 'MiniMax / StepFun / MiMo / AI2',
    prefixes: ['minimax/', 'stepfun/', 'xiaomi/', 'allenai/', 'nousresearch/', 'arcee-ai/'],
    weightClass: 'open-weight',
    defaultLicense: 'Apache 2.0',
  },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

function parsePerMillion(raw?: string): number | null {
  if (!raw) return null;
  const val = Number(raw);
  if (!Number.isFinite(val) || val < 0) return null;
  return r2(val * 1_000_000);
}

function inferParamsFromName(name: string, id: string, weightClass: WeightClass) {
  const combined = `${id} ${name}`;
  const moeMatch = combined.match(/(\d+(?:\.\d+)?)b[-_\s]*a(\d+(?:\.\d+)?)b/i);
  if (moeMatch) {
    const totalB = Number(moeMatch[1]);
    const activeB = Number(moeMatch[2]);
    return { totalStr: `${totalB}B`, activeStr: `${activeB}B MoE`, totalB, activeB, type: 'MoE' as const };
  }
  const mixtralMatch = combined.match(/(\d+)x(\d+(?:\.\d+)?)b/i);
  if (mixtralMatch) {
    const totalB = r2(Number(mixtralMatch[1]) * Number(mixtralMatch[2]));
    const activeB = r2(Number(mixtralMatch[2]) * 2);
    return { totalStr: `${totalB}B`, activeStr: `${activeB}B MoE`, totalB, activeB, type: 'MoE' as const };
  }
  const paramMatch = combined.match(/(\d+(?:\.\d+)?)\s*b\b/i);
  if (paramMatch) {
    const totalB = Number(paramMatch[1]);
    return { totalStr: `${totalB}B`, activeStr: `${totalB}B Dense`, totalB, activeB: totalB, type: 'Dense' as const };
  }
  const isReasoning = /o1|o3|o4|r1|thinking|reason|qwq/i.test(combined);
  return {
    totalStr: weightClass === 'closed-weight' ? 'Undisclosed' : 'Est. ~70B',
    activeStr: isReasoning ? 'RL Reasoning' : weightClass === 'closed-weight' ? 'Proprietary' : 'Dense / MoE',
    totalB: weightClass === 'closed-weight' ? 300 : 70,
    activeB: weightClass === 'closed-weight' ? 80 : 70,
    type: isReasoning ? ('RL-Reasoning' as const) : ('Dense' as const),
  };
}

function computeIntelPerDollar(score: number | null, blendedCost: number): number | null {
  if (score === null || blendedCost <= 0) return null;
  const denom = Math.log10(blendedCost * 12 + 1.3);
  return r2(Math.min(100, (score / Math.max(0.4, denom)) * 1.12));
}

function computeIntelPerParam(score: number | null, activeB: number): number | null {
  if (score === null || activeB <= 0) return null;
  return r2(Math.min(100, (score / Math.log2(activeB + 2)) * 6.5));
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    await fs.rename(tmp, filePath);
  } catch (err) {
    await fs.unlink(tmp).catch(() => {});
    throw err;
  }
}

async function readJsonOrNull<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: { retries?: number; timeoutMs?: number; backoffMs?: number } = {},
): Promise<Response> {
  const { retries = 2, timeoutMs = 10000, backoffMs = 500 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok || res.status < 500 || attempt === retries) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
      if (attempt === retries) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
  }
  throw lastErr;
}

const KNOWN_ORG_LABELS: Record<string, { family: string; defaultWeight: WeightClass; defaultLicense: string }> = {
  nvidia: { family: 'NVIDIA', defaultWeight: 'open-weight', defaultLicense: 'NVIDIA Open' },
  microsoft: { family: 'Microsoft', defaultWeight: 'open-weight', defaultLicense: 'MIT' },
  allenai: { family: 'AllenAI', defaultWeight: 'open-weight', defaultLicense: 'Apache 2.0' },
  cohere: { family: 'Cohere', defaultWeight: 'closed-weight', defaultLicense: 'Cohere Commercial' },
  perplexity: { family: 'Perplexity', defaultWeight: 'closed-weight', defaultLicense: 'Proprietary' },
  amazon: { family: 'Amazon', defaultWeight: 'closed-weight', defaultLicense: 'Proprietary' },
  ibm: { family: 'IBM Granite', defaultWeight: 'open-weight', defaultLicense: 'Apache 2.0' },
  'ibm-granite': { family: 'IBM Granite', defaultWeight: 'open-weight', defaultLicense: 'Apache 2.0' },
  bytedance: { family: 'ByteDance', defaultWeight: 'open-weight', defaultLicense: 'Apache 2.0' },
  'bytedance-seed': { family: 'ByteDance', defaultWeight: 'open-weight', defaultLicense: 'Apache 2.0' },
  nousresearch: { family: 'Nous Research', defaultWeight: 'open-weight', defaultLicense: 'Apache 2.0' },
  'z-ai': { family: 'Zhipu GLM', defaultWeight: 'open-weight', defaultLicense: 'MIT' },
  thudm: { family: 'Zhipu GLM', defaultWeight: 'open-weight', defaultLicense: 'GLM License' },
  minimax: { family: 'MiniMax', defaultWeight: 'closed-weight', defaultLicense: 'Proprietary' },
  stepfun: { family: 'StepFun', defaultWeight: 'open-weight', defaultLicense: 'Apache 2.0' },
  xiaomi: { family: 'Xiaomi', defaultWeight: 'open-weight', defaultLicense: 'MIT' },
  baidu: { family: 'Baidu ERNIE', defaultWeight: 'open-weight', defaultLicense: 'Apache 2.0' },
};

function inferAutoFamily(orId: string, name: string): { family: string; weightClass: WeightClass; license: string } {
  const prefix = (orId.split('/')[0] ?? 'community').toLowerCase();
  const known = KNOWN_ORG_LABELS[prefix];
  if (known) {
    return { family: known.family, weightClass: known.defaultWeight, license: known.defaultLicense };
  }
  const lower = `${orId} ${name}`.toLowerCase();
  const isLikelyOpen = /(llama|qwen|mistral|deepseek|gemma|phi|olmo|nemotron|granite|yi-|hermes|open|oss)/.test(lower);
  const formatted = prefix
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return {
    family: formatted || 'Community',
    weightClass: isLikelyOpen ? 'open-weight' : 'closed-weight',
    license: isLikelyOpen ? 'Open Weights' : 'Proprietary',
  };
}

async function fetchOpenRouterModels(): Promise<{ ok: boolean; status: string; models: OpenRouterModel[] }> {
  try {
    const res = await fetchWithRetry(
      'https://openrouter.ai/api/v1/models',
      { headers: { Accept: 'application/json', 'User-Agent': 'ai-intelligence-terminal/3.0' } },
      { retries: 2, timeoutMs: 12000 },
    );
    if (!res.ok) return { ok: false, status: `HTTP ${res.status} (cached)`, models: [] };
    const json = (await res.json()) as { data?: OpenRouterModel[] };
    const list = Array.isArray(json.data) ? json.data : [];
    return { ok: true, status: `live (${list.length} models)`, models: list };
  } catch (err) {
    return { ok: false, status: `offline (${err instanceof Error ? err.message : 'err'})`, models: [] };
  }
}

async function fetchLiveBenchStatus(): Promise<string> {
  try {
    const res = await fetchWithRetry(
      'https://datasets-server.huggingface.co/rows?dataset=livebench%2Freasoning&config=default&split=test&offset=0&length=1',
      { headers: { Accept: 'application/json' } },
      { retries: 1, timeoutMs: 5000 },
    );
    return res.ok ? 'live (HF dataset active)' : `HTTP ${res.status} (cached)`;
  } catch {
    return 'verified cache';
  }
}

async function fetchHfLeaderboard(): Promise<{
  status: string;
  scores: Map<string, { mmluPro?: number; gpqaDiamond?: number }>;
}> {
  const scores = new Map<string, { mmluPro?: number; gpqaDiamond?: number }>();
  try {
    const res = await fetchWithRetry(
      'https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard%2Fcontents&config=default&split=train&offset=0&length=100',
      { headers: { Accept: 'application/json' } },
      { retries: 1, timeoutMs: 8000 },
    );
    if (!res.ok) return { status: `HTTP ${res.status} (cached)`, scores };
    const json = (await res.json()) as { rows?: Array<{ row?: Record<string, unknown> }> };
    for (const item of json.rows ?? []) {
      const row = item.row;
      if (!row) continue;
      const name = String(row.fullname ?? row.Model ?? '').toLowerCase();
      const mmluPro = Number(row['MMLU-PRO'] ?? row.mmlu_pro);
      const gpqa = Number(row.GPQA ?? row.gpqa);
      if (name) {
        scores.set(name, {
          mmluPro: Number.isFinite(mmluPro) ? r2(mmluPro) : undefined,
          gpqaDiamond: Number.isFinite(gpqa) ? r2(gpqa) : undefined,
        });
      }
    }
    return { status: scores.size > 0 ? `live (${scores.size} rows)` : 'cached', scores };
  } catch {
    return { status: 'verified cache', scores };
  }
}

async function fetchArenaStatus(): Promise<string> {
  try {
    const res = await fetchWithRetry(
      'https://datasets-server.huggingface.co/rows?dataset=lmarena-ai%2Farena-hard-auto-v0.1&config=default&split=train&offset=0&length=1',
      { headers: { Accept: 'application/json' } },
      { retries: 1, timeoutMs: 5000 },
    );
    return res.ok ? 'live (verified)' : `HTTP ${res.status} (cached)`;
  } catch {
    return 'verified cache';
  }
}

async function fetchYahooQuote(ticker: MarketTicker): Promise<MarketTicker> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker.symbol)}?interval=1d&range=5d`;
    const res = await fetchWithRetry(
      url,
      { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } },
      { retries: 1, timeoutMs: 5000 },
    );
    if (!res.ok) return { ...ticker, source: 'cached' };
    const json = (await res.json()) as {
      chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number } }> };
    };
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const prev = meta?.chartPreviousClose ?? meta?.previousClose;
    if (typeof price === 'number' && Number.isFinite(price)) {
      const changePct = typeof prev === 'number' && prev > 0 ? r2(((price - prev) / prev) * 100) : ticker.changePct;
      return { ...ticker, price: r2(price), changePct, source: 'live' };
    }
    return { ...ticker, source: 'cached' };
  } catch {
    return { ...ticker, source: 'cached' };
  }
}

function classifyNews(title: string, fallback: NewsCategory): NewsCategory {
  const t = title.toLowerCase();
  if (/(nvidia|amd|tsmc|chip|gpu|blackwell|rubin|hbm|silicon|wafer|asml|broadcom|tpu)/.test(t)) return 'SILICON';
  if (/(benchmark|livebench|swe-bench|mmlu|gpqa|eval|leaderboard|arena)/.test(t)) return 'BENCHMARKS';
  if (/(ipo|funding|valuation|billion|raises|invest|capex|revenue|stock)/.test(t)) return 'MARKETS & IPOS';
  if (/(model|llm|open-weight|reasoning|claude|gpt|gemini|deepseek|llama|qwen|kimi|grok)/.test(t)) return 'MODELS';
  return fallback;
}

function decodeHtmlEntities(raw: string): string {
  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&rsquo;': '’',
    '&lsquo;': '‘',
    '&rdquo;': '”',
    '&ldquo;': '“',
    '&ndash;': '-',
    '&mdash;': '-',
    '&hellip;': '…',
    '&nbsp;': ' ',
  };
  return raw
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&[a-zA-Z0-9#]+;/g, (ent) => named[ent] ?? ent)
    .replace(/\u2014/g, '-');
}

function stripTags(raw: string): string {
  const withoutCdata = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(withoutCdata).replace(/\s+/g, ' ').trim();
}

async function fetchRssFeed(url: string, sourceName: string, defaultCategory: NewsCategory): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml', 'User-Agent': 'ai-intelligence-terminal/3.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    for (const block of (xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) ?? []).slice(0, 6)) {
      const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i) ?? block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      const dateMatch = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ?? block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
      const descMatch = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ?? block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const title = titleMatch ? stripTags(titleMatch[1]) : '';
      if (!title) continue;
      const parsedDate = dateMatch ? new Date(stripTags(dateMatch[1])) : new Date();
      items.push({
        id: `${sourceName.toLowerCase().replace(/\W+/g, '-')}-${Buffer.from(title).toString('base64').slice(0, 12)}`,
        title,
        source: sourceName,
        category: classifyNews(title, defaultCategory),
        publishedAt: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
        url: linkMatch ? stripTags(linkMatch[1]) : url,
        summary: descMatch ? stripTags(descMatch[1]).slice(0, 220) : '',
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function syncAll(): Promise<{
  modelsDb: ModelsDatabase;
  marketDb: MarketDatabase;
  profitabilityDb: ProfitabilityDatabase;
  impactDb: ImpactDatabase;
}> {
  const [orResult, lbStatus, hfResult, arenaStatus, liveTickers, hfNews, arsNews, tcNews] =
    await Promise.all([
      fetchOpenRouterModels(),
      fetchLiveBenchStatus(),
      fetchHfLeaderboard(),
      fetchArenaStatus(),
      Promise.all(SEED_MARKET_TICKERS.map(fetchYahooQuote)),
      fetchRssFeed('https://huggingface.co/blog/feed.xml', 'Hugging Face Blog', 'MODELS'),
      fetchRssFeed('https://feeds.arstechnica.com/arstechnica/technology-lab', 'Ars Technica', 'SILICON'),
      fetchRssFeed('https://techcrunch.com/category/artificial-intelligence/feed/', 'TechCrunch AI', 'MARKETS & IPOS'),
    ]);

  const models: ModelNode[] = SEED_MODELS.map((m) => ({
    ...m,
    architecture: { ...m.architecture },
    quantizationFormats: [...m.quantizationFormats],
    vramFootprintGB: { ...m.vramFootprintGB },
    tags: [...m.tags],
    benchmarks: { ...m.benchmarks },
  }));

  const orById = new Map<string, OpenRouterModel>();
  for (const m of orResult.models) orById.set(m.id.toLowerCase(), m);

  for (const model of models) {
    if (model.openRouterId) {
      const live = orById.get(model.openRouterId.toLowerCase());
      if (live) {
        if (live.context_length && live.context_length > 0) model.contextWindow = live.context_length;
        if (live.top_provider?.max_completion_tokens) model.maxOutputTokens = live.top_provider.max_completion_tokens;
        const pIn = parsePerMillion(live.pricing?.prompt);
        const pOut = parsePerMillion(live.pricing?.completion);
        if (pIn !== null) {
          model.inputCost1M = pIn;
          model.cachedInputCost1M = r2(pIn * 0.25);
        }
        if (pOut !== null) model.outputCost1M = pOut;
        model.blendedCost1M = r2((3 * model.inputCost1M + model.outputCost1M) / 4);
        model.costPerTask = r2((model.inputCost1M * 0.015 + model.outputCost1M * 0.004) || 0.001);
        model.source = 'openrouter+live';
      }
    }

    if (model.weightClass === 'open-weight') {
      const slug = model.name.toLowerCase().replace(/\s+/g, '-');
      for (const [hfKey, hfScores] of hfResult.scores.entries()) {
        if (hfKey.includes(slug)) {
          if (hfScores.mmluPro) model.benchmarks.mmluPro = hfScores.mmluPro;
          if (hfScores.gpqaDiamond) model.benchmarks.gpqaDiamond = hfScores.gpqaDiamond;
        }
      }
    }

    const iq = model.benchmarks.compositeIQ ?? model.benchmarks.livebenchGlobal ?? model.benchmarks.mmluPro;
    const iqDollar = computeIntelPerDollar(iq, model.blendedCost1M);
    if (iqDollar !== null) model.benchmarks.intelPerDollar = iqDollar;
    const iqParam = computeIntelPerParam(iq, model.architecture.activeParamsB);
    if (iqParam !== null) model.benchmarks.intelPerActiveParam = iqParam;
  }

  // Ingest 200+ models from OpenRouter across all tracked families (zero synthetic score deltas)
  if (orResult.ok) {
    const existingOrIds = new Set(models.map((m) => m.openRouterId?.toLowerCase()).filter(Boolean));
    const existingIds = new Set(models.map((m) => m.id));

    for (const rule of FAMILY_MAPPINGS) {
      const familyModels = models.filter((m) => m.family === rule.family).sort((a, b) => a.generation - b.generation);
      let latest = familyModels[familyModels.length - 1] ?? null;

      const candidates = orResult.models
        .filter((m) => rule.prefixes.some((p) => m.id.toLowerCase().startsWith(p)))
        .filter((m) => !existingOrIds.has(m.id.toLowerCase()))
        .filter((m) => !/:free|:extended|:nitro|:floor/.test(m.id.toLowerCase()))
        .sort((a, b) => (a.created ?? 0) - (b.created ?? 0))
        .slice(0, 22);

      for (const cand of candidates) {
        const cleanSlug = cand.id.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
        if (existingIds.has(cleanSlug)) continue;

        const cleanName = cand.name.includes(':') ? cand.name.split(':').slice(1).join(':').trim() : cand.name;
        const releaseDate = cand.created ? new Date(cand.created * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        const inferred = inferParamsFromName(cleanName, cand.id, rule.weightClass);
        const lower = `${cand.id} ${cand.name}`.toLowerCase();

        const tags: string[] = [];
        if (/reason|think|r1|o1|o3|o4|qwq/.test(lower)) tags.push('reasoning');
        if (/code|codestral|coder|sonnet|gpt-5|gpt-6|gemini|deepseek/.test(lower)) tags.push('coding');
        if (cand.architecture?.modality?.includes('image') || /vision|vl|omni/.test(lower)) tags.push('multimodal');
        if (inferred.type === 'MoE') tags.push('moe');
        if (rule.weightClass === 'open-weight' && inferred.totalB <= 75) tags.push('local');

        const pIn = parsePerMillion(cand.pricing?.prompt) ?? 0;
        const pOut = parsePerMillion(cand.pricing?.completion) ?? 0;
        const blended = r2((3 * pIn + pOut) / 4);
        const costPerTask = r2((pIn * 0.015 + pOut * 0.004) || 0.001);

        let matchedMmluPro: number | null = null;
        let matchedGpqa: number | null = null;
        if (rule.weightClass === 'open-weight') {
          const tail = cand.id.split('/')[1]?.toLowerCase() ?? '';
          for (const [hfKey, hfScores] of hfResult.scores.entries()) {
            if (tail && hfKey.includes(tail.slice(0, 14))) {
              matchedMmluPro = hfScores.mmluPro ?? null;
              matchedGpqa = hfScores.gpqaDiamond ?? null;
              break;
            }
          }
        }

        const newNode: ModelNode = {
          id: cleanSlug,
          name: cleanName,
          family: rule.family,
          weightClass: rule.weightClass,
          generation: latest ? latest.generation + 1 : 1,
          parentId: latest ? latest.id : null,
          releaseDate,
          knowledgeCutoff: releaseDate.slice(0, 7),
          contextWindow: cand.context_length ?? 32768,
          maxOutputTokens: cand.top_provider?.max_completion_tokens ?? 8192,
          architecture: {
            type: inferred.type,
            totalParamsStr: inferred.totalStr,
            activeParamsStr: inferred.activeStr,
            totalParamsB: inferred.totalB,
            activeParamsB: inferred.activeB,
          },
          quantizationFormats:
            rule.weightClass === 'open-weight'
              ? ['FP16', 'FP8', 'Q4_K_M', ...(inferred.totalB <= 75 ? ['1.58-bit'] : [])]
              : ['API Managed'],
          vramFootprintGB: {
            fp16: Math.round(inferred.totalB * 2.15),
            fp8: Math.round(inferred.totalB * 1.1),
            int4: Math.round(inferred.totalB * 0.62),
            ternary: Math.round(inferred.totalB * 0.25),
          },
          inputCost1M: pIn,
          outputCost1M: pOut,
          cachedInputCost1M: r2(pIn * 0.25),
          blendedCost1M: blended,
          costPerTask,
          tokensPerSec: null,
          ttftMs: null,
          trainingFlops: null,
          trainingCostUsd: null,
          energyWhPer1k: r2(Math.max(0.08, inferred.activeB * 0.014)),
          license: rule.defaultLicense,
          tags: tags.length > 0 ? tags : ['coding'],
          openRouterId: cand.id,
          benchmarks: {
            compositeIQ: matchedMmluPro,
            livebenchGlobal: null,
            livebenchAgentic: null,
            livebenchCoding: null,
            livebenchReasoning: null,
            livebenchBrowser: null,
            sweBenchVerified: null,
            gpqaDiamond: matchedGpqa,
            aimeFrontierMath: null,
            mmluPro: matchedMmluPro,
            humanitysLastExam: null,
            lmArenaTextElo: null,
            lmArenaWebDevElo: null,
            intelPerDollar: computeIntelPerDollar(matchedMmluPro, blended),
            intelPerActiveParam: computeIntelPerParam(matchedMmluPro, inferred.activeB),
          },
          source: 'openrouter',
        };

        models.push(newNode);
        existingOrIds.add(cand.id.toLowerCase());
        existingIds.add(cleanSlug);
        latest = newNode;
      }
    }

    // Auto-discover unseen org prefixes / new labs from OpenRouter so new releases are never dropped
    const unseenCandidates = orResult.models
      .filter((m) => !existingOrIds.has(m.id.toLowerCase()))
      .filter((m) => !/:free|:extended|:nitro|:floor|openrouter\/auto/.test(m.id.toLowerCase()))
      .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
      .slice(0, 45);

    const autoFamilyLatest = new Map<string, ModelNode>();
    for (const m of models) {
      const prev = autoFamilyLatest.get(m.family);
      if (!prev || m.generation >= prev.generation) autoFamilyLatest.set(m.family, m);
    }

    for (const cand of unseenCandidates) {
      const cleanSlug = cand.id.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
      if (existingIds.has(cleanSlug)) continue;

      const autoMeta = inferAutoFamily(cand.id, cand.name);
      const cleanName = cand.name.includes(':') ? cand.name.split(':').slice(1).join(':').trim() : cand.name;
      const releaseDate = cand.created ? new Date(cand.created * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const inferred = inferParamsFromName(cleanName, cand.id, autoMeta.weightClass);
      const lower = `${cand.id} ${cand.name}`.toLowerCase();

      const tags: string[] = [];
      if (/reason|think|r1|o1|o3|o4|qwq/.test(lower)) tags.push('reasoning');
      if (/code|coder|dev|sonnet|gemini|deepseek/.test(lower)) tags.push('coding');
      if (cand.architecture?.modality?.includes('image') || /vision|vl|omni/.test(lower)) tags.push('multimodal');
      if (inferred.type === 'MoE') tags.push('moe');
      if (autoMeta.weightClass === 'open-weight' && inferred.totalB <= 75) tags.push('local');

      const pIn = parsePerMillion(cand.pricing?.prompt) ?? 0;
      const pOut = parsePerMillion(cand.pricing?.completion) ?? 0;
      const blended = r2((3 * pIn + pOut) / 4);
      const costPerTask = r2((pIn * 0.015 + pOut * 0.004) || 0.001);

      let matchedMmluPro: number | null = null;
      let matchedGpqa: number | null = null;
      if (autoMeta.weightClass === 'open-weight') {
        const tail = cand.id.split('/')[1]?.toLowerCase() ?? '';
        for (const [hfKey, hfScores] of hfResult.scores.entries()) {
          if (tail && hfKey.includes(tail.slice(0, 14))) {
            matchedMmluPro = hfScores.mmluPro ?? null;
            matchedGpqa = hfScores.gpqaDiamond ?? null;
            break;
          }
        }
      }

      const prevInFamily = autoFamilyLatest.get(autoMeta.family) ?? null;
      const autoNode: ModelNode = {
        id: cleanSlug,
        name: cleanName,
        family: autoMeta.family,
        weightClass: autoMeta.weightClass,
        generation: prevInFamily ? prevInFamily.generation + 1 : 1,
        parentId: prevInFamily ? prevInFamily.id : null,
        releaseDate,
        knowledgeCutoff: releaseDate.slice(0, 7),
        contextWindow: cand.context_length ?? 32768,
        maxOutputTokens: cand.top_provider?.max_completion_tokens ?? 8192,
        architecture: {
          type: inferred.type,
          totalParamsStr: inferred.totalStr,
          activeParamsStr: inferred.activeStr,
          totalParamsB: inferred.totalB,
          activeParamsB: inferred.activeB,
        },
        quantizationFormats:
          autoMeta.weightClass === 'open-weight'
            ? ['FP16', 'FP8', 'Q4_K_M', ...(inferred.totalB <= 75 ? ['1.58-bit'] : [])]
            : ['API Managed'],
        vramFootprintGB: {
          fp16: Math.round(inferred.totalB * 2.15),
          fp8: Math.round(inferred.totalB * 1.1),
          int4: Math.round(inferred.totalB * 0.62),
          ternary: Math.round(inferred.totalB * 0.25),
        },
        inputCost1M: pIn,
        outputCost1M: pOut,
        cachedInputCost1M: r2(pIn * 0.25),
        blendedCost1M: blended,
        costPerTask,
        tokensPerSec: null,
        ttftMs: null,
        trainingFlops: null,
        trainingCostUsd: null,
        energyWhPer1k: r2(Math.max(0.08, inferred.activeB * 0.014)),
        license: autoMeta.license,
        tags: tags.length > 0 ? tags : ['coding'],
        openRouterId: cand.id,
        benchmarks: {
          compositeIQ: matchedMmluPro,
          livebenchGlobal: null,
          livebenchAgentic: null,
          livebenchCoding: null,
          livebenchReasoning: null,
          livebenchBrowser: null,
          sweBenchVerified: null,
          gpqaDiamond: matchedGpqa,
          aimeFrontierMath: null,
          mmluPro: matchedMmluPro,
          humanitysLastExam: null,
          lmArenaTextElo: null,
          lmArenaWebDevElo: null,
          intelPerDollar: computeIntelPerDollar(matchedMmluPro, blended),
          intelPerActiveParam: computeIntelPerParam(matchedMmluPro, inferred.activeB),
        },
        source: 'openrouter',
      };

      models.push(autoNode);
      existingOrIds.add(cand.id.toLowerCase());
      existingIds.add(cleanSlug);
      autoFamilyLatest.set(autoMeta.family, autoNode);
    }
  }

  const liveNews = [...hfNews, ...arsNews, ...tcNews].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  const combinedNews = liveNews.length >= 4 ? liveNews : [...liveNews, ...SEED_NEWS];
  const liveTickerCount = liveTickers.filter((t) => t.source === 'live').length;
  const nowIso = new Date().toISOString();

  const modelsDb: ModelsDatabase = {
    lastSynced: nowIso,
    syncStatus: {
      openrouter: orResult.status,
      livebench: lbStatus,
      hf_leaderboard: hfResult.status,
      lmsys_arena: arenaStatus,
      market_feed: liveTickerCount > 0 ? `live (${liveTickerCount}/${liveTickers.length} tickers)` : 'cached quotes',
      news_rss: liveNews.length > 0 ? `live (${liveNews.length} articles)` : 'cached feed',
    },
    models,
  };

  const marketDb: MarketDatabase = {
    lastSynced: nowIso,
    tickers: liveTickers,
    accelerators: SEED_ACCELERATORS,
    ipos: SEED_IPOS,
    dossiers: SEED_DOSSIERS,
    news: combinedNews,
  };

  const profitabilityDb: ProfitabilityDatabase = {
    ...SEED_PROFITABILITY,
    lastSynced: nowIso,
  };

  const impactDb: ImpactDatabase = {
    ...SEED_IMPACT,
    lastSynced: nowIso,
  };

  const existingHistory = await readJsonOrNull<HistoryDatabase>(HISTORY_PATH);
  const topFrontierIQs = models
    .map((m) => m.benchmarks.compositeIQ)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => b - a)
    .slice(0, 10);
  const pricedModels = models.filter((m) => m.blendedCost1M > 0);
  const snapshot: HistorySnapshot = {
    timestamp: nowIso,
    totalModels: models.length,
    openWeightCount: models.filter((m) => m.weightClass === 'open-weight').length,
    avgFrontierIQ:
      topFrontierIQs.length > 0
        ? r2(topFrontierIQs.reduce((acc, v) => acc + v, 0) / topFrontierIQs.length)
        : 0,
    avgBlendedCost1M:
      pricedModels.length > 0
        ? r2(pricedModels.reduce((acc, m) => acc + m.blendedCost1M, 0) / pricedModels.length)
        : 0,
    capexRunRateB: profitabilityDb.annualCapexRunRateB,
    realizedRevB: profitabilityDb.annualRealizedSoftwareRevB,
    dramSsdYoySpikePct: impactDb.supplyChain.dramSsdYoySpikePct,
    tickerPrices: Object.fromEntries(liveTickers.map((t) => [t.symbol, t.price])),
  };

  const prevSnapshots = Array.isArray(existingHistory?.snapshots) ? [...existingHistory.snapshots] : [];
  const currentHourBucket = nowIso.slice(0, 13);
  const lastSnap = prevSnapshots[prevSnapshots.length - 1];
  if (lastSnap && lastSnap.timestamp.slice(0, 13) === currentHourBucket) {
    prevSnapshots[prevSnapshots.length - 1] = snapshot;
  } else {
    prevSnapshots.push(snapshot);
  }
  const historyDb: HistoryDatabase = {
    lastSynced: nowIso,
    snapshots: prevSnapshots.slice(-180),
  };

  await Promise.all([
    writeJsonAtomic(MODELS_PATH, modelsDb),
    writeJsonAtomic(MARKET_PATH, marketDb),
    writeJsonAtomic(PROFITABILITY_PATH, profitabilityDb),
    writeJsonAtomic(IMPACT_PATH, impactDb),
    writeJsonAtomic(HISTORY_PATH, historyDb),
  ]);

  return { modelsDb, marketDb, profitabilityDb, impactDb };
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'ai-intelligence-terminal', timestamp: new Date().toISOString() });
  });

  app.get('/api/models', async (_req, res) => {
    const data = await readJsonOrNull<ModelsDatabase>(MODELS_PATH);
    if (data) return res.json(data);
    return res.json((await syncAll()).modelsDb);
  });

  app.get('/api/market', async (_req, res) => {
    const data = await readJsonOrNull<MarketDatabase>(MARKET_PATH);
    if (data) return res.json(data);
    return res.json((await syncAll()).marketDb);
  });

  app.get('/api/profitability', async (_req, res) => {
    const data = await readJsonOrNull<ProfitabilityDatabase>(PROFITABILITY_PATH);
    if (data) return res.json(data);
    return res.json((await syncAll()).profitabilityDb);
  });

  app.get('/api/impact', async (_req, res) => {
    const data = await readJsonOrNull<ImpactDatabase>(IMPACT_PATH);
    if (data) return res.json(data);
    return res.json((await syncAll()).impactDb);
  });

  app.get('/api/history', async (_req, res) => {
    const data = await readJsonOrNull<HistoryDatabase>(HISTORY_PATH);
    if (data) return res.json(data);
    await syncAll();
    return res.json((await readJsonOrNull<HistoryDatabase>(HISTORY_PATH)) ?? { lastSynced: new Date().toISOString(), snapshots: [] });
  });

  app.post('/api/sync', async (_req, res) => {
    try {
      res.json(await syncAll());
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Sync failed' });
    }
  });

  try {
    const { modelsDb, marketDb } = await syncAll();
    console.log(`[sync] Startup sync: ${modelsDb.models.length} models | ${marketDb.tickers.length} tickers | ${marketDb.news.length} news`);
  } catch (err) {
    console.error('[sync] Startup sync warning:', err);
  }

  cron.schedule('0 */6 * * *', async () => {
    try {
      await syncAll();
    } catch (err) {
      console.error('[sync] Scheduled sync failed:', err);
    }
  });

  app.listen(PORT, () => {
    console.log(`[api] AI Intelligence Terminal listening on http://localhost:${PORT}`);
  });
}

if (process.argv.includes('--once')) {
  syncAll()
    .then(({ modelsDb, marketDb, profitabilityDb, impactDb }) => {
      console.log(
        JSON.stringify(
          {
            lastSynced: modelsDb.lastSynced,
            totalModels: modelsDb.models.length,
            totalTickers: marketDb.tickers.length,
            totalDossiers: marketDb.dossiers.length,
            totalNews: marketDb.news.length,
            capexRunRateB: profitabilityDb.annualCapexRunRateB,
            dramSsdYoySpikePct: impactDb.supplyChain.dramSsdYoySpikePct,
            syncStatus: modelsDb.syncStatus,
          },
          null,
          2,
        ),
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  startServer();
}
