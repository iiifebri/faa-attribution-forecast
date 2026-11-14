// Entry for polymarket-faa-attribution-02 (Node 22, standard library only): level-scaled persistence.
//
//   q_tau(h) = clamp(x + z_tau * 0.005 * scale(x) * sqrt(h), 0, 1), rounded to 6 decimals
//   scale(x) = 0.3 + 2 * min(x, 1 - x)
//
// for the minute h = 1..horizon_minutes after the checkpoint, x the last price in the case. The median stays at the
// last price (persistence); the spread widens like a random walk but is narrower for prices near 0 or 1. Sigma 0.005
// and the scale were checked on three separate windows of the dev series against the 0.0025 persistence baseline.
// Starts from the kit's starter/main.ts. Reads every <id>.in from the input dir, writes <id>.out to the output dir.
// Outside the grader: MAKEFUN_INPUT_DIR and MAKEFUN_OUTPUT_DIR stand in for /input and /output.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The quantile levels the contest scores, in the order each row lists them. */
const QUANTILES = [0.05, 0.25, 0.5, 0.75, 0.95];
/** The standard normal's quantile at each level, to 6 decimals. */
const Z = [-1.644854, -0.67449, 0, 0.67449, 1.644854];
/** The spread of a minute's price move, in price units per square-root minute. */
const SIGMA = 0.005;

interface CaseMarket {
  id: string;
  prices: number[];
}

interface Case {
  horizon_minutes: number;
  quantiles: number[];
  markets: CaseMarket[];
}

/** x clamped to [0,1] and rounded to 6 decimals (0, never -0). */
const price6 = (x: number): number => Math.round(Math.min(1, Math.max(0, x)) * 1e6) / 1e6 + 0;

/** The persistence forecast of one market: horizon rows of the five quantiles around its last price. */
function forecast(m: CaseMarket, horizon: number): number[][] {
  if (m.prices.length === 0) throw new Error(`market ${m.id} has no prices`);
  const x = m.prices[m.prices.length - 1] as number;
  const rows: number[][] = [];
  // spread scales with level: smaller near 0 or 1, where prices move less
  const scale = 0.3 + Math.min(x, 1 - x) * 2;
  for (let h = 1; h <= horizon; h++) rows.push(Z.map((z) => price6(x + z * SIGMA * scale * Math.sqrt(h))));
  return rows;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
// Every case file, in name order, so two runs write the same bytes.
const inputs = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputs) {
  const id = file.slice(0, -'.in'.length);
  const c = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as Case;
  if (c.quantiles.length !== QUANTILES.length || c.quantiles.some((t, j) => t !== QUANTILES[j])) throw new Error(`${file} asks for quantiles ${JSON.stringify(c.quantiles)}, not ${JSON.stringify(QUANTILES)}`);
  const forecasts = c.markets.map((m) => ({ id: m.id, q: forecast(m, c.horizon_minutes) }));
  writeFileSync(join(OUTPUT_DIR, `${id}.out`), `${JSON.stringify({ forecasts })}\n`);
}
