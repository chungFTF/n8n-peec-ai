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
const strategyItems = allItems.filter(i => i.json.documentId && i.json.content_format);

const d = data;
const date = d.report_date || new Date().toISOString().slice(0, 10);

const lines = [];

// ── Header ────────────────────────────────────────────────────
lines.push(`# Strategic Conquest Dashboard — ${date}`);
lines.push('');

// ══════════════════════════════════════════════════════════════
// PART 1 · Battlefield Alert
// Lead with real-time sentiment & visibility signals (defensive radar)
// ══════════════════════════════════════════════════════════════
lines.push('## PART 1 · Battlefield Alert');
lines.push('*Brand Asset Erosion Warning — real-time signals from the AI battlefield*');
lines.push('');

if ((d.evolution_highlights || []).length > 0) {
  d.evolution_highlights.forEach(e => {
    const arrow = e.trend === 'up' ? '↑' : e.trend === 'down' ? '↓' : '→';
    const fmt = (n) => (n > 0 ? `+${n}` : `${n}`);
    const alertIcon = e.trend === 'down' ? '🔴' : e.trend === 'up' ? '🟢' : '🟡';
    lines.push(`> ${alertIcon} ${arrow} **${e.brand}** (Visibility ${fmt(e.visibility_delta)}) — ${e.insight}`);
  });
  lines.push('');
}

const ob = d.own_brand_summary;
if (ob) {
  lines.push(`### Brand Status — ${ob.brand}`);
  const bi = ob.brand_intel || {};
  const sp = ob.search_presence || {};
  const dp = ob.domain_presence || {};

  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Visibility | ${bi.visibility ?? '—'} |`);
  lines.push(`| Sentiment Score | ${bi.sentiment ?? '—'} |`);
  lines.push(`| Position | ${bi.position ?? '—'} |`);
  lines.push(`| Share of Voice (SoV) | ${bi.share_of_voice ?? '—'} |`);
  lines.push(`| Market Status | ${bi.market_status ?? '—'} |`);
  lines.push(`| Vulnerability Score | ${bi.vulnerability_score ?? '—'} |`);
  lines.push(`| AI Search Mention Ranking | ${sp.brand_mention_ranking ?? '—'} |`);
  lines.push(`| Avg. Citation Rate | ${dp.avg_citation_rate ?? '—'} |`);
  lines.push(`| Avg. Retrieval Rate | ${dp.avg_retrieval_rate ?? '—'} |`);
  lines.push(`| Cited Domains | ${(dp.own_domains_cited || []).join(', ') || '—'} |`);
  lines.push('');
  lines.push('> **Vulnerability Score Explained**');
  lines.push('> Formula: `(100 − Sentiment Score) ÷ Position` — calculated for top-5 ranked brands only');
  lines.push('> Higher score = more visible but poorer reputation = higher attack priority');
  lines.push('> Sentiment tiers: 0–44 Poor  45–65 Fair  66–100 Good');
  lines.push('');

  if ((sp.unique_keywords || []).length > 0) {
    lines.push(`**Related Keywords:** ${sp.unique_keywords.join(', ')}`);
    lines.push('');
  }

  if (ob.raw_summary) {
    lines.push(ob.raw_summary);
    lines.push('');
  }
}

// ══════════════════════════════════════════════════════════════
// PART 2 · Vulnerability Radar
// Competitor weakness scan — ranked by attack priority
// ══════════════════════════════════════════════════════════════
lines.push('## PART 2 · Vulnerability Radar');
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
// PART 3 · Execution Matrix (Live)
// Closed loop: Monitor → Analyze → Direct → Execute
// ══════════════════════════════════════════════════════════════
lines.push('## PART 3 · Execution Matrix (Live)');
lines.push('*Closed loop: Monitor → Analyze → Direct → Execute*');
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

if (strategyItems.length > 0) {
  lines.push('### Content Deployment Briefs');
  strategyItems.forEach((item, idx) => {
    if (idx > 0) lines.push('---');
    const s = item.json;
    const docUrl = `https://docs.google.com/document/d/${s.documentId}`;
    const priorityLabel = (s.priority || '').toUpperCase();
    lines.push(`#### [${priorityLabel}] ${s.platform} — ${s.platform_type}`);
    lines.push(`**Format:** ${s.content_format}`);
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
