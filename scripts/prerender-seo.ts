import fs from 'node:fs';
import path from 'node:path';

interface ModelRecord {
  id: string;
  name: string;
  family: string;
  weightClass: string;
  releaseDate: string;
  contextWindow: number;
  blendedCost1M: number;
  license: string;
  benchmarks?: {
    compositeIQ?: number | null;
    livebenchGlobal?: number | null;
    sweBenchVerified?: number | null;
    gpqaDiamond?: number | null;
    lmArenaTextElo?: number | null;
  };
}

interface TickerRecord {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  marketCapB: number;
  aiExposureScore: number;
}

interface DossierRecord {
  id: string;
  name: string;
  type: string;
  hq: string;
  valuationB: number;
  arrRunRateB: number;
  computeCluster: string;
}

interface NewsRecord {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
}

interface ProfitabilityData {
  lastSynced?: string;
  verdictInfra?: string;
  verdictModelLayer?: string;
  annualCapexRunRateB?: number;
  annualRealizedSoftwareRevB?: number;
  infraToSoftwareRatio?: number;
  estBreakevenYear?: string | number;
}

interface ImpactData {
  lastSynced?: string;
  supplyChain?: {
    dramWaferSharePct?: number;
    dramSsdYoySpikePct?: number;
    pcBomInflationPct?: number;
    ltaBookedThrough?: string;
  };
  powerAndWater?: {
    globalPowerTwh2026?: number;
    globalPowerTwh2030Est?: number;
    usAiHubsTwhRange?: string;
    indirectWaterLitersPerKwh?: number;
    directCoolingLitersPerKwhEvap?: number;
  };
}

const ROOT_DIR = path.resolve(process.cwd());
const DIST_HTML = path.join(ROOT_DIR, 'dist', 'index.html');
const DATA_DIR = path.join(ROOT_DIR, 'data');

function readJsonSafe<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\u2014/g, '-');
}

function formatContext(tokens: number): string {
  if (!tokens || tokens <= 0) return '-';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

function main() {
  if (!fs.existsSync(DIST_HTML)) {
    throw new Error(`dist/index.html not found at ${DIST_HTML}. Run vite build first.`);
  }

  const modelsData = readJsonSafe<{ lastSynced?: string; models?: ModelRecord[] }>(
    path.join(DATA_DIR, 'models.json'),
    { models: [] },
  );
  const marketData = readJsonSafe<{
    lastSynced?: string;
    tickers?: TickerRecord[];
    dossiers?: DossierRecord[];
    news?: NewsRecord[];
  }>(path.join(DATA_DIR, 'market.json'), { tickers: [], dossiers: [], news: [] });
  const companiesOverride = readJsonSafe<{ dossiers?: DossierRecord[] } | DossierRecord[]>(
    path.join(DATA_DIR, 'companies.json'),
    [],
  );
  const profitability = readJsonSafe<ProfitabilityData>(
    path.join(DATA_DIR, 'profitability.json'),
    {},
  );
  const impact = readJsonSafe<ImpactData>(path.join(DATA_DIR, 'impact.json'), {});

  const models = Array.isArray(modelsData.models) ? modelsData.models : [];
  const tickers = Array.isArray(marketData.tickers) ? marketData.tickers : [];
  const dossiers = Array.isArray(companiesOverride)
    ? companiesOverride.length > 0
      ? companiesOverride
      : marketData.dossiers ?? []
    : companiesOverride.dossiers ?? marketData.dossiers ?? [];
  const news = Array.isArray(marketData.news) ? marketData.news : [];

  const lastSynced =
    modelsData.lastSynced ||
    marketData.lastSynced ||
    profitability.lastSynced ||
    impact.lastSynced ||
    new Date().toISOString();

  const topModels = [...models]
    .filter((m) => typeof m.benchmarks?.compositeIQ === 'number')
    .sort((a, b) => (b.benchmarks?.compositeIQ ?? 0) - (a.benchmarks?.compositeIQ ?? 0))
    .slice(0, 15);

  const openWeightCount = models.filter((m) => m.weightClass === 'open-weight').length;
  const closedWeightCount = models.length - openWeightCount;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Graphinity Lab',
        url: 'https://ai.graphinitylab.com',
        email: 'contact@graphinitylab.com',
        sameAs: ['https://github.com/Graphinity-Lab'],
        address: {
          '@type': 'PostalAddress',
          addressRegion: 'ON',
          addressCountry: 'CA',
        },
      },
      {
        '@type': 'WebApplication',
        name: 'Graphinity Lab // AI Index',
        url: 'https://ai.graphinitylab.com/',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        license: 'https://opensource.org/licenses/MIT',
        codeRepository: 'https://github.com/Graphinity-Lab/ai-index',
        dateModified: lastSynced,
        publisher: {
          '@type': 'Organization',
          name: 'Graphinity Lab',
        },
      },
      {
        '@type': 'Dataset',
        name: 'Graphinity Lab Open AI Model & Infrastructure Index',
        description: `Open-source empirical AI telemetry dataset tracking ${models.length} models (${openWeightCount} open-weight, ${closedWeightCount} proprietary), ${tickers.length} semiconductor & AI equity tickers, $${profitability.annualCapexRunRateB ?? 520}B annual CapEx run-rate, and global data center energy/water externalities.`,
        url: 'https://ai.graphinitylab.com/',
        license: 'https://opensource.org/licenses/MIT',
        dateModified: lastSynced,
        creator: {
          '@type': 'Organization',
          name: 'Graphinity Lab',
        },
        variableMeasured: [
          'Composite IQ',
          'LiveBench 2.0 Global',
          'SWE-bench Verified',
          'GPQA Diamond',
          'LMArena Text Elo',
          'Blended API Cost per 1M Tokens',
          'Training Compute FLOPs',
          'Hyperscaler AI CapEx Run-Rate',
          'Data Center Electricity Consumption (TWh)',
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Top Benchmarked AI Models by Composite IQ',
        numberOfItems: topModels.length,
        itemListElement: topModels.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'SoftwareApplication',
            name: `${m.family} ${m.name}`,
            applicationCategory: 'AIModel',
            operatingSystem: m.weightClass === 'open-weight' ? 'Self-Hosted / Cloud' : 'Cloud API',
            datePublished: m.releaseDate,
            license: m.license,
            author: {
              '@type': 'Organization',
              name: m.family,
            },
            additionalProperty: [
              {
                '@type': 'PropertyValue',
                name: 'Composite IQ',
                value: m.benchmarks?.compositeIQ ?? null,
              },
              {
                '@type': 'PropertyValue',
                name: 'Blended Cost per 1M Tokens (USD)',
                value: m.blendedCost1M,
              },
              {
                '@type': 'PropertyValue',
                name: 'Context Window (tokens)',
                value: m.contextWindow,
              },
            ],
          },
        })),
      },
    ],
  };

  const serializedJsonLd = JSON.stringify(jsonLd, null, 2).replace(/<\//g, '<\\/');

  const noscriptHtml = `
    <noscript>
      <main style="max-width:1100px;margin:2rem auto;padding:1.5rem;font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1E1B18;background:#F5F1E8;">
        <header style="border-bottom:1px solid #E2DBD0;padding-bottom:1rem;margin-bottom:1.5rem;">
          <h1>GRAPHINITY LAB // AI INDEX</h1>
          <p><strong>Open-Source Public AI Reference Index</strong> (MIT License) | Last Synced: ${escapeHtml(lastSynced)}</p>
          <p>Tracking ${models.length} models (${openWeightCount} open-weight, ${closedWeightCount} proprietary), ${tickers.length} market tickers, ${dossiers.length} company dossiers, and real-world compute externalities.</p>
          <p><strong>Zero Ownership Claim:</strong> Graphinity Lab does not claim ownership of third-party benchmarks, model weights, company trademarks, or upstream research datasets. This project acts strictly as a transparent, open-source aggregation and visualization layer that credits and links directly to every original source.</p>
        </header>

        <section style="margin-bottom:1.5rem;">
          <h2>Top Flagship Models by Composite IQ</h2>
          <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;border-color:#E2DBD0;">
            <thead>
              <tr>
                <th align="left">Model</th>
                <th align="left">Family</th>
                <th align="left">Weight Class</th>
                <th align="right">Composite IQ</th>
                <th align="right">Blended $/1M</th>
                <th align="right">Context</th>
                <th align="left">Released</th>
              </tr>
            </thead>
            <tbody>
              ${topModels
                .map(
                  (m) => `<tr>
                <td>${escapeHtml(m.name)}</td>
                <td>${escapeHtml(m.family)}</td>
                <td>${escapeHtml(m.weightClass)}</td>
                <td align="right">${escapeHtml(m.benchmarks?.compositeIQ ?? '-')}</td>
                <td align="right">$${escapeHtml(m.blendedCost1M.toFixed(2))}</td>
                <td align="right">${escapeHtml(formatContext(m.contextWindow))}</td>
                <td>${escapeHtml(m.releaseDate)}</td>
              </tr>`,
                )
                .join('\n              ')}
            </tbody>
          </table>
        </section>

        <section style="margin-bottom:1.5rem;">
          <h2>Silicon &amp; AI Market Snapshot</h2>
          <ul>
            ${tickers
              .slice(0, 13)
              .map(
                (t) =>
                  `<li><strong>${escapeHtml(t.symbol)}</strong> (${escapeHtml(t.name)}, ${escapeHtml(t.sector)}): $${escapeHtml(t.price.toFixed(2))} (${t.changePct >= 0 ? '+' : ''}${escapeHtml(t.changePct.toFixed(2))}%), Market Cap $${escapeHtml(t.marketCapB)}B, AI Exposure ${escapeHtml(t.aiExposureScore)}/100</li>`,
              )
              .join('\n            ')}
          </ul>
        </section>

        <section style="margin-bottom:1.5rem;">
          <h2>Company &amp; Lab Dossiers</h2>
          <ul>
            ${dossiers
              .map(
                (d) =>
                  `<li><strong>${escapeHtml(d.name)}</strong> (${escapeHtml(d.type)}, ${escapeHtml(d.hq)}): Valuation $${escapeHtml(d.valuationB)}B, ARR $${escapeHtml(d.arrRunRateB)}B, Cluster: ${escapeHtml(d.computeCluster)}</li>`,
              )
              .join('\n            ')}
          </ul>
        </section>

        <section style="margin-bottom:1.5rem;">
          <h2>Macro CapEx &amp; Profitability Ledger</h2>
          <ul>
            <li>Annual Hyperscaler AI CapEx Run-Rate: $${escapeHtml(profitability.annualCapexRunRateB ?? '-')}B</li>
            <li>Annual Realized AI Software Revenue: $${escapeHtml(profitability.annualRealizedSoftwareRevB ?? '-')}B</li>
            <li>Infra-to-Software Ratio: ${escapeHtml(profitability.infraToSoftwareRatio ?? '-')}x</li>
            <li>Estimated Breakeven Window: ${escapeHtml(profitability.estBreakevenYear ?? '-')}</li>
            <li>Infrastructure Verdict: ${escapeHtml(profitability.verdictInfra ?? '-')}</li>
            <li>Model Layer Verdict: ${escapeHtml(profitability.verdictModelLayer ?? '-')}</li>
          </ul>
        </section>

        <section style="margin-bottom:1.5rem;">
          <h2>Real-World Impact: Memory Inflation, Grid Power &amp; Water</h2>
          <ul>
            <li>AI DRAM/HBM Wafer Share: ${escapeHtml(impact.supplyChain?.dramWaferSharePct ?? '-')}% (Booked through: ${escapeHtml(impact.supplyChain?.ltaBookedThrough ?? '-')})</li>
            <li>DRAM / NAND SSD YoY Price Spike: +${escapeHtml(impact.supplyChain?.dramSsdYoySpikePct ?? '-')}%</li>
            <li>PC / Server BOM Inflation: +${escapeHtml(impact.supplyChain?.pcBomInflationPct ?? '-')}%</li>
            <li>Global Data Center Electricity: ${escapeHtml(impact.powerAndWater?.globalPowerTwh2026 ?? '-')} TWh (2026) to ${escapeHtml(impact.powerAndWater?.globalPowerTwh2030Est ?? '-')} TWh (2030 est.)</li>
            <li>US AI Data Center Hubs: ${escapeHtml(impact.powerAndWater?.usAiHubsTwhRange ?? '-')}</li>
            <li>Water Intensity: ${escapeHtml(impact.powerAndWater?.indirectWaterLitersPerKwh ?? '-')} L/kWh indirect, ${escapeHtml(impact.powerAndWater?.directCoolingLitersPerKwhEvap ?? '-')} L/kWh evaporative cooling</li>
          </ul>
        </section>

        ${
          news.length > 0
            ? `<section style="margin-bottom:1.5rem;">
          <h2>Latest Live Intel Headlines</h2>
          <ul>
            ${news
              .slice(0, 8)
              .map(
                (n) =>
                  `<li><a href="${escapeHtml(n.url)}">${escapeHtml(n.title)}</a> (${escapeHtml(n.source)}, ${escapeHtml(n.publishedAt)})</li>`,
              )
              .join('\n            ')}
          </ul>
        </section>`
            : ''
        }

        <footer style="border-top:1px solid #E2DBD0;padding-top:1rem;font-size:0.875rem;">
          <p><strong>Sources:</strong> OpenRouter API, Hugging Face Open LLM Leaderboard, LiveBench 2.0, LMSYS / LMArena, Artificial Analysis, Epoch AI, IEA &amp; LBNL, TrendForce, Yahoo Finance &amp; SEC Filings.</p>
          <p><strong>Canadian Privacy Notice (PIPEDA / CPPA / Quebec Law 25):</strong> Zero tracking cookies, zero third-party analytics, localStorage-only preferences. Contact: contact@graphinitylab.com</p>
          <p><strong>Accessibility (AODA / WCAG 2.1 AA) &amp; Disclaimer:</strong> Informational telemetry only; not financial, investment, or legal advice. Source: https://github.com/Graphinity-Lab/ai-index</p>
        </footer>
      </main>
    </noscript>`;

  let html = fs.readFileSync(DIST_HTML, 'utf8');

  const jsonLdPattern = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
  if (!jsonLdPattern.test(html)) {
    throw new Error('Could not find <script type="application/ld+json"> placeholder in dist/index.html');
  }
  html = html.replace(
    jsonLdPattern,
    `<script type="application/ld+json">\n${serializedJsonLd}\n    </script>`,
  );

  const rootMarker = '<div id="root"></div>';
  if (!html.includes(rootMarker)) {
    throw new Error('Could not find <div id="root"></div> in dist/index.html');
  }
  html = html.replace(rootMarker, `${rootMarker}\n${noscriptHtml}`);

  fs.writeFileSync(DIST_HTML, html, 'utf8');
  console.log(
    `[prerender-seo] Injected JSON-LD (${topModels.length} top models) and <noscript> telemetry into dist/index.html (${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)} KB).`,
  );
}

main();
