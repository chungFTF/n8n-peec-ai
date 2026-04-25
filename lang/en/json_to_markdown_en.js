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
const brandReportItem = allItems.find(i => i.json.source === 'get_brand_report');
const allBrands = brandReportItem?.json?.detailed_analysis || [];

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

if ((d.action_plan || []).length > 0) {
  lines.push('### Action Commands');
  lines.push('| Priority | Timeframe | Action Item | Rationale |');
  lines.push('|----------|-----------|-------------|-----------|');
  d.action_plan.forEach(a => {
    const priority = (a.priority || '').toUpperCase();
    lines.push(`| ${priority} | ${a.timeframe} | ${a.action} | ${a.rationale} |`);
  });
  lines.push('');
}

// ══════════════════════════════════════════════════════════════
// 5. DIRECT & DRIVE — Content Deployment
// Closed loop: Monitor → Analyze → Direct → Execute
// ══════════════════════════════════════════════════════════════
lines.push('## 5. DIRECT & DRIVE — Content Deployment');
lines.push('*Closed loop: Monitor → Analyze → Direct → Execute*');
lines.push('');

if (strategyItems.length > 0) {
  lines.push('### Content Deployment Briefs');
  strategyItems.forEach((item, idx) => {
    if (idx > 0) lines.push('---');
    const s = item.json;
    const docUrl = `https://docs.google.com/document/d/${s.documentId}`;
    const priorityLabel = (s.priority || '').toUpperCase();
    lines.push(`#### [${priorityLabel}] ${s.platform} — ${s.platform_type}`);
    if (s.five_d) lines.push(`**[5D: ${s.five_d}]**`);
    if (s.psychology || s.elm_path) lines.push(`**[PSYCHOLOGY: ${s.psychology || s.elm_path}]**`);
    lines.push(`**Copy Direction:** ${s.copy_direction}`);
    lines.push(`**Audience:** ${s.audience}`);
    lines.push(`**Content Brief:** ${s.content_brief}`);
    if (s.reference_insight) lines.push(`**Reference Insight:** ${s.reference_insight}`);
    lines.push(`**Document:** [Open Google Doc](${docUrl})`);
    lines.push('');
  });
}

lines.push('---');
lines.push('*This dashboard is a living document. Peec AI refreshes competitive signals every 6 hours.*');

const markdown = lines.join('\n');

return [
  { json: { ...data, allBrands } },
  { json: { markdown } },
];
