import type { PlotYVar } from '../types.ts';

export interface BenchmarkMethodology {
  key: PlotYVar;
  name: string;
  whatItTests: string;
  composition: Array<{ name: string; weight: string; detail: string }>;
  verification: string;
  caveats: string;
}

export const BENCHMARK_METHODOLOGIES: Record<PlotYVar, BenchmarkMethodology> = {
  compositeIQ: {
    key: 'compositeIQ',
    name: 'Composite Intelligence Index',
    whatItTests:
      'Macro-level general intelligence synthesizing reasoning, software engineering, scientific knowledge, competition math, and instruction following.',
    composition: [
      { name: 'LiveBench 2.0 Global', weight: '30%', detail: 'Contamination-free monthly reasoning & coding' },
      { name: 'SWE-bench Verified', weight: '25%', detail: 'Autonomous multi-file repository patching' },
      { name: 'GPQA Diamond', weight: '20%', detail: 'PhD-level physics, chemistry, biology' },
      { name: 'MMLU-Pro + AIME', weight: '25%', detail: '10-choice graduate knowledge & olympiad math' },
    ],
    verification: 'Weighted normalized aggregate across deterministic unit-test & exact-match evaluations.',
    caveats: 'Models missing sub-evaluations fall back to verified LiveBench/MMLU-Pro baselines; custom weights may shift rankings.',
  },
  livebenchGlobal: {
    key: 'livebenchGlobal',
    name: 'LiveBench 2.0 Global',
    whatItTests:
      'Contamination-free general problem solving across freshly generated monthly tasks where answers are strictly objective and auto-gradable.',
    composition: [
      { name: 'Reasoning', weight: '14.3%', detail: 'Spatial, navigation, and multi-hop logic puzzles' },
      { name: 'Coding', weight: '14.3%', detail: 'Code generation, completion, and bug repair' },
      { name: 'Mathematics', weight: '14.3%', detail: 'Olympiad & AMPS problems with numeric answers' },
      { name: 'Data Analysis', weight: '14.3%', detail: 'Table joins, JSON/CSV transforms, schema inference' },
      { name: 'Language', weight: '14.3%', detail: 'Connections, typos, plot unscrambling' },
      { name: 'Instruction Following', weight: '14.3%', detail: 'IFEval-style strict formatting constraints' },
      { name: 'Agentic / Browser', weight: '14.2%', detail: 'Multi-step tool & web state transitions' },
    ],
    verification: '100% programmatic ground-truth verification (zero LLM-as-a-judge bias).',
    caveats: 'Questions rotate monthly to prevent pre-training data leakage.',
  },
  livebenchAgentic: {
    key: 'livebenchAgentic',
    name: 'LiveBench Agentic',
    whatItTests:
      'Multi-turn tool invocation, state tracking, error recovery, and structured API execution in sandboxed environments.',
    composition: [
      { name: 'Tool Calling & Recovery', weight: '50%', detail: 'Recovering from malformed schema / 4xx responses' },
      { name: 'Multi-Step Planning', weight: '50%', detail: 'Long-horizon state mutation across 5-15 turns' },
    ],
    verification: 'Deterministic final environment state assertions.',
    caveats: 'Sensitive to system-prompt scaffolding and tool-schema formatting.',
  },
  livebenchCoding: {
    key: 'livebenchCoding',
    name: 'LiveBench Coding',
    whatItTests:
      'Algorithmic synthesis, edge-case handling, and code repair on fresh LeetCode/AtCoder-style problems released after model cutoffs.',
    composition: [
      { name: 'Python / TS Synthesis', weight: '60%', detail: 'Time/memory-bounded algorithmic implementations' },
      { name: 'Code Completion & Repair', weight: '40%', detail: 'Patching subtle off-by-one and concurrency bugs' },
    ],
    verification: 'Hidden unit-test suite execution inside isolated Docker sandboxes.',
    caveats: 'Measures single-file algorithmic coding rather than large multi-repo architecture.',
  },
  livebenchReasoning: {
    key: 'livebenchReasoning',
    name: 'LiveBench Reasoning',
    whatItTests:
      'Deductive logic, constraint satisfaction, spatial grid navigation, and Zebra-style elimination puzzles.',
    composition: [
      { name: 'Zebra & Logic Grids', weight: '50%', detail: 'Multi-variable constraint satisfaction' },
      { name: 'Spatial / Web Navigation', weight: '50%', detail: 'State-space traversal without visual shortcuts' },
    ],
    verification: 'Exact-match canonical answer parser.',
    caveats: 'Heavy test-time RL models gain significant advantage at higher token budgets.',
  },
  livebenchBrowser: {
    key: 'livebenchBrowser',
    name: 'LiveBench Browser Use',
    whatItTests:
      'DOM/accessibility-tree navigation, form completion, multi-tab filtering, and visual-semantic web grounding.',
    composition: [
      { name: 'DOM & Action Grounding', weight: '60%', detail: 'Selecting exact interactive elements under dynamic layouts' },
      { name: 'Multi-Page Extraction', weight: '40%', detail: 'Cross-referencing tables and pagination state' },
    ],
    verification: 'End-state DOM & URL assertion checks.',
    caveats: 'Latency and screenshot resolution strongly impact real-world browser agent throughput.',
  },
  sweBenchVerified: {
    key: 'sweBenchVerified',
    name: 'SWE-bench Verified',
    whatItTests:
      'Autonomous software engineering: reading real GitHub issues, navigating multi-file Python codebases, writing patches, and passing regression tests.',
    composition: [
      { name: '500 Human-Audited Issues', weight: '100%', detail: '12 open-source Python repos (Django, Scikit-learn, SymPy, etc.)' },
    ],
    verification: 'Repository fail-to-pass + pass-to-pass pytest execution in Docker.',
    caveats: 'Harness/scaffold choice (e.g., bash tool vs. custom AST editor) can swing scores by 4-8%.',
  },
  gpqaDiamond: {
    key: 'gpqaDiamond',
    name: 'GPQA Diamond',
    whatItTests:
      'Graduate-level scientific reasoning in physics, organic chemistry, and molecular biology designed to be "Google-proof."',
    composition: [
      { name: 'Physics', weight: '43%', detail: 'Quantum mechanics, electromagnetism, astrophysics' },
      { name: 'Chemistry', weight: '40%', detail: 'Organic synthesis, physical chemistry, spectroscopy' },
      { name: 'Biology', weight: '17%', detail: 'Molecular genetics, structural biochemistry' },
    ],
    verification: '4-choice multiple choice on 198 expert-validated questions (PhD accuracy ~65%).',
    caveats: 'Approaching saturation (>93%) on 2026 frontier reasoning models.',
  },
  aimeFrontierMath: {
    key: 'aimeFrontierMath',
    name: 'AIME / FrontierMath',
    whatItTests:
      'Research-grade and olympiad mathematical proof synthesis, number theory, combinatorics, and algebraic geometry.',
    composition: [
      { name: 'FrontierMath Tier 1-3', weight: '70%', detail: 'Unpublished research-level math problems' },
      { name: 'AIME 2025/2026', weight: '30%', detail: 'High-school olympiad integer-answer problems' },
    ],
    verification: 'Symbolic / exact numeric equivalence checking via SymPy & Lean/Python verifiers.',
    caveats: 'Scores depend heavily on allowed test-time compute (pass@1 vs. high-reasoning effort).',
  },
  mmluPro: {
    key: 'mmluPro',
    name: 'MMLU-Pro',
    whatItTests:
      'Broad undergraduate and professional domain knowledge across 14 disciplines with 10 distractor choices to eliminate random-guess inflation.',
    composition: [
      { name: 'STEM (Math, Physics, CS, Chem)', weight: '48%', detail: '12,032 curated 10-option questions' },
      { name: 'Law, Economics, Medicine, Humanities', weight: '52%', detail: 'Reasoning-heavy professional exam items' },
    ],
    verification: 'Zero-shot / 5-shot CoT exact-match grading across 10 options (10% random baseline).',
    caveats: 'Static dataset; primarily measures breadth of parametric knowledge + basic reasoning.',
  },
  humanitysLastExam: {
    key: 'humanitysLastExam',
    name: "Humanity's Last Exam",
    whatItTests:
      'Ultra-hard frontier academic problems across 100+ subjects crafted by domain professors specifically to stump frontier models.',
    composition: [
      { name: 'Exact-Match / Short Answer', weight: '76%', detail: 'Unambiguous mathematical & scientific derivations' },
      { name: 'Multiple Choice', weight: '24%', detail: 'Deeply specialized conceptual traps' },
    ],
    verification: 'Exact-match + calibrated automated grader on 2,500+ vetted questions.',
    caveats: 'Designed to resist saturation; scores above 50% indicate strong PhD-level generalization.',
  },
  lmArenaTextElo: {
    key: 'lmArenaTextElo',
    name: 'LMArena Text Elo',
    whatItTests:
      'Real-world human preference in blind pairwise A/B chats across open-ended writing, coding, advice, and reasoning prompts.',
    composition: [
      { name: 'Crowdsourced Blind Battles', weight: '100%', detail: 'Bradley-Terry Elo rating from >2M human votes' },
    ],
    verification: 'Statistical Bradley-Terry / Elo ranking with style-control de-biasing.',
    caveats: 'Sensitive to verbosity, markdown formatting, and tone even with style-control.',
  },
  lmArenaWebDevElo: {
    key: 'lmArenaWebDevElo',
    name: 'LMArena WebDev Elo',
    whatItTests:
      'End-to-end interactive frontend/UI generation, React/HTML/CSS aesthetics, and functional bug-free rendering.',
    composition: [
      { name: 'Live Rendered App Battles', weight: '100%', detail: 'Blind human votes on live-executed web artifacts' },
    ],
    verification: 'Pairwise Bradley-Terry Elo on rendered browser previews.',
    caveats: 'Reflects single-turn artifact generation quality rather than large-codebase maintenance.',
  },
  intelPerDollar: {
    key: 'intelPerDollar',
    name: 'Intelligence-per-Dollar Score',
    whatItTests:
      'Cost-efficiency index measuring how much Composite Intelligence is delivered per log-scaled blended API dollar ($/1M tokens).',
    composition: [
      { name: 'Composite IQ / log10(Blended Cost)', weight: '100%', detail: '3:1 input-to-output blended pricing normalization' },
    ],
    verification: 'Derived dynamically from verified benchmark scores and live OpenRouter API pricing.',
    caveats: 'Does not account for self-hosted hardware amortization on open-weight models.',
  },
  intelPerActiveParam: {
    key: 'intelPerActiveParam',
    name: 'Intelligence-per-Active-Param',
    whatItTests:
      'Architectural efficiency: how much intelligence a model extracts per active parameter executed during each forward pass.',
    composition: [
      { name: 'Composite IQ / log2(Active Params B)', weight: '100%', detail: 'Rewards sparse MoE & high-efficiency dense models' },
    ],
    verification: 'Derived from Composite IQ and disclosed/estimated active parameter counts.',
    caveats: 'Closed-weight active parameter counts are industry estimates when undisclosed.',
  },
};
