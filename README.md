# Graphinity Lab // AI Index (`ai.graphinitylab.com`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An open-source (MIT License), continuously updated public reference index mapping 250+ frontier AI model lineages, live benchmarks, compute scaling laws, semiconductor supply chains, CapEx profitability, and local vs. cloud TCO.

- **Live Index:** https://ai.graphinitylab.com
- **GitHub Organization:** https://github.com/Graphinity-Lab
- **Repository:** https://github.com/Graphinity-Lab/ai-index

## Architecture
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS (`src/`)
- **Sync Engine**: Express + `node-cron` 6-hour aggregator (`server/sync.ts`) writing normalized JSON datasets to `data/`

## Local Development
```bash
git clone https://github.com/Graphinity-Lab/ai-index.git
cd ai-index
npm install
npm run sync   # Run one-shot live data sync
npm run dev    # Start Express API (3001) + Vite dev server (5173)
```

## License & Attribution
Released under the [MIT License](LICENSE). See [NOTICE.md](NOTICE.md) for upstream data provider and open-source dependency attributions. **Graphinity Lab does not claim ownership of third-party benchmarks, model weights, company trademarks, or upstream datasets.**
