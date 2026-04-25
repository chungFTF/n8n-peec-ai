const allItems = $input.all();

// AI Agent output — first item with an `output` field
const agentItem = allItems.find(i => i.json.output !== undefined) || allItems[0];
const raw = agentItem.json;

// Parse JSON from AI Agent output (handles string or object)
function extractJSON(str) {
  const start = str.search(/[{[]/);
  if (start === -1) return str;
  let depth = 0, inString = false, escape = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') { depth--; if (depth === 0) return str.slice(start, i + 1); }
  }
  return str.slice(start);
}

let data;
if (typeof raw.output === 'string') {
  const stripped = raw.output.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  data = JSON.parse(extractJSON(stripped));
} else if (typeof raw.output === 'object' && raw.output !== null) {
  data = raw.output;
} else {
  data = raw;
}

// Brand report from clean_brand_report.js (passed via Merge node)
// Supports both: { source: 'get_brand_report', detailed_analysis: [...] }
// and direct: { allBrands: [...] } from the merged item
const brandReportItem = allItems.find(i => i.json.source === 'get_brand_report');
const allBrands = brandReportItem?.json?.detailed_analysis
  || allItems.find(i => Array.isArray(i.json.allBrands))?.json?.allBrands
  || [];

// Content strategy matrix items from combine_strategy_with_docs.js
const strategyItems = allItems.filter(i => i.json.documentId && i.json.copy_direction);

const d = data;
const date = d.report_date || new Date().toISOString().slice(0, 10);

const lines = [];

// ── Header ────────────────────────────────────────────────────
lines.push(`# Strategic Conquest Dashboard — ${date}`);
lines.push('');

// ══════════════════════════════════════════════════════════════
// 1. DETECT — Brand Status
// Own-brand AI presence metrics
// ══════════════════════════════════════════════════════════════
lines.push('## 1. DETECT — Brand Status');
lines.push('*Own-brand AI presence — real-time signal snapshot*');
lines.push('');

lines.push('<!-- DETECT_SCORECARD -->');
lines.push('');

// ══════════════════════════════════════════════════════════════
// 2. DEFENSE — Battlefield Alert
// Lead with real-time sentiment & visibility signals (defensive radar)
// ══════════════════════════════════════════════════════════════
lines.push('## 2. DEFENSE — Battlefield Alert');
lines.push('*Brand Asset Erosion Warning — real-time signals from the AI battlefield*');
lines.push('');

lines.push('<!-- DEFENSE_ALERTS -->');
lines.push('');

// ══════════════════════════════════════════════════════════════
// 3. DIAGNOSE — Vulnerability Radar
// Competitor weakness scan — ranked by attack priority
// ══════════════════════════════════════════════════════════════
lines.push('## 3. DIAGNOSE — Vulnerability Radar');
lines.push('*Competitor weakness scan — ranked by attack priority*');
lines.push('');

const competitors = allBrands.filter(b => !b.is_own);
if (competitors.length > 0) {
  lines.push('### Competitor Metrics & Daily Evolution');
  lines.push('<!-- COMPETITORS_CHART -->');
  lines.push('');
}

lines.push('### Competitive Landscape Overview');
lines.push('<!-- RADAR_CHART -->');
lines.push('<!-- COMPETITIVE_LANDSCAPE -->');
lines.push('');

const cs = d.competitive_summary || {};

// ══════════════════════════════════════════════════════════════
// 4. DOMINATE — Action Plan
// Strategic moves to capture market territory
// ══════════════════════════════════════════════════════════════
lines.push('## 4. DOMINATE — Action Plan');
lines.push('*Strategic moves to capture market territory*');
lines.push('');

lines.push('<!-- DOMINATE_ACTIONS -->');
lines.push('');

// ══════════════════════════════════════════════════════════════
// 5. DIRECT & DRIVE — Content Deployment
// Closed loop: Monitor → Analyze → Direct → Execute
// ══════════════════════════════════════════════════════════════
lines.push('## 5. DIRECT & DRIVE — Content Deployment');
lines.push('*Closed loop: Monitor → Analyze → Direct → Execute*');
lines.push('');

lines.push('<!-- DIRECT_DRIVE_BRIEFS -->');
lines.push('');

lines.push('---');
lines.push('*This dashboard is a living document. Peec AI refreshes competitive signals every 6 hours.*');

const markdown = lines.join('\n');

return [
  { json: { ...data, allBrands } },
  { json: { markdown } },
  ...strategyItems,
];
