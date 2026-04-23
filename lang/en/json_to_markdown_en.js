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

lines.push(`# Competitive Intelligence Report — ${date}`);
lines.push('');

// ── Own Brand Summary ─────────────────────────────────────────
const ob = d.own_brand_summary;
if (ob) {
  lines.push(`## Own Brand Overview — ${ob.brand}`);
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

// ── Competitors Chart (rendered directly in html_email.js) ───────
const competitors = allBrands.filter(b => !b.is_own);
if (competitors.length > 0) {
  lines.push('## Competitor Metrics Overview');
  lines.push('<!-- COMPETITORS_CHART -->');
  lines.push('');
}

// ── Key Insights ──────────────────────────────────────────────
lines.push('## Key Insights');
(d.key_insights || []).forEach(i => lines.push(`- ${i}`));
lines.push('');

// ── Insight Analysis ──────────────────────────────────────────
if ((d.insight_analysis || []).length > 0) {
  lines.push('## Insight Deep Dive');
  d.insight_analysis.forEach((item, idx) => {
    lines.push(`### ${idx + 1}. ${item.insight}`);
    lines.push(item.explanation);
    lines.push('');
  });
}

// ── Competitive Summary ───────────────────────────────────────
lines.push('## Competitive Landscape Overview');
const cs = d.competitive_summary || {};

if (cs.top_threat) {
  const t = cs.top_threat;
  lines.push(`### Top Threat: ${t.brand}`);
  lines.push(`- **Visibility:** ${t.visibility}`);
  lines.push(`- **Sentiment Score:** ${t.sentiment}`);
  lines.push(`- **Position:** ${t.position}`);
  lines.push(`- ${t.reason}`);
  lines.push('');
}

if ((cs.attack_targets || []).length > 0) {
  lines.push('### Attack Targets');
  cs.attack_targets.forEach(a => {
    lines.push(`**${a.brand}** (Vulnerability: ${a.vulnerability_score})`);
    lines.push(`- Weakness: ${a.weakness}`);
    lines.push(`- Attack Angle: ${a.attack_angle}`);
  });
  lines.push('');
}

if ((cs.blue_ocean_brands || []).length > 0) {
  lines.push('### Blue Ocean Opportunities');
  cs.blue_ocean_brands.forEach(b => {
    lines.push(`**${b.brand}** — Visibility: ${b.visibility}`);
    lines.push(`- ${b.reason}`);
  });
  lines.push('');
}

// ── Market Opportunities ──────────────────────────────────────
lines.push('## Market Opportunities');
(d.market_opportunities || []).forEach(o => {
  const priority = (o.priority || '').toUpperCase();
  lines.push(`### [${priority}] ${o.opportunity}`);
  lines.push(`- **Source:** ${o.data_source}`);
  lines.push(`- **Action:** ${o.action}`);
});
lines.push('');

// ── Content Strategy ──────────────────────────────────────────
lines.push('## Content Strategy');
const ct = d.content_strategy || {};

if ((ct.top_platforms || []).length > 0) {
  lines.push('### Priority Platforms');
  lines.push('| Domain | Type | Citation Rate | Why It Matters |');
  lines.push('|--------|------|---------------|----------------|');
  ct.top_platforms.forEach(p => {
    lines.push(`| ${p.domain} | ${p.classification} | ${p.citation_rate} | ${p.why} |`);
  });
  lines.push('');
}

if ((ct.own_brand_gaps_by_type || []).length > 0) {
  lines.push('### Content Platform Gap Analysis');
  ct.own_brand_gaps_by_type.forEach(g => {
    const severity = (g.gap_severity || '').toUpperCase();
    lines.push(`**[${severity}] ${g.type}**`);
    lines.push(`- Platforms: ${(g.platforms || []).join(', ')}`);
    lines.push(`- Reason: ${g.reason}`);
  });
  lines.push('');
}

if (ct.content_gaps) {
  lines.push('### Overall Gap Status');
  lines.push(ct.content_gaps);
  lines.push('');
}

if ((ct.recommended_topics || []).length > 0) {
  lines.push('### Recommended Topics');
  ct.recommended_topics.forEach(t => lines.push(`- ${t}`));
  lines.push('');
}

if ((ct.ugc_opportunities || []).length > 0) {
  lines.push('### UGC Opportunity Platforms');
  ct.ugc_opportunities.forEach(u => lines.push(`- ${u}`));
  lines.push('');
}

// ── Copy Brief ────────────────────────────────────────────────
lines.push('## Copy Direction');
const cb = d.copy_brief || {};

if (cb.attack_copy) {
  lines.push(`### Attack Copy — Target Brand: ${cb.attack_copy.target_brand}`);
  lines.push(cb.attack_copy.angle);
  lines.push('');
}

if (cb.awareness) {
  lines.push('### Awareness');
  lines.push(cb.awareness);
  lines.push('');
}

if (cb.consideration) {
  lines.push('### Consideration');
  lines.push(cb.consideration);
  lines.push('');
}

if (cb.purchase) {
  lines.push('### Purchase');
  lines.push(cb.purchase);
  lines.push('');
}

// ── Action Plan ───────────────────────────────────────────────
if ((d.action_plan || []).length > 0) {
  lines.push('## Action Plan');
  lines.push('| Priority | Timeframe | Action Item | Rationale |');
  lines.push('|----------|-----------|-------------|-----------|');
  d.action_plan.forEach(a => {
    const priority = (a.priority || '').toUpperCase();
    lines.push(`| ${priority} | ${a.timeframe} | ${a.action} | ${a.rationale} |`);
  });
  lines.push('');
}

// ── Content Strategy Matrix ───────────────────────────────────
if (strategyItems.length > 0) {
  lines.push('## Content Strategy Execution Matrix');
  strategyItems.forEach((item, idx) => {
    if (idx > 0) lines.push('---');
    const s = item.json;
    const docUrl = `https://docs.google.com/document/d/${s.documentId}`;
    const priorityLabel = (s.priority || '').toUpperCase();
    lines.push(`### [${priorityLabel}] ${s.platform} — ${s.platform_type}`);
    lines.push(`**Format:** ${s.content_format}`);
    lines.push(`**Audience:** ${s.audience}`);
    lines.push(`**Content Brief:** ${s.content_brief}`);
    lines.push(`**Copy Angle:** ${s.copy_angle}`);
    if (s.reference_insight) lines.push(`**Reference Insight:** ${s.reference_insight}`);
    lines.push(`**Rationale:** ${s.reason}`);
    lines.push(`**Timeframe:** ${s.timeframe}`);
    lines.push(`**Document:** [Open Google Doc](${docUrl})`);
    lines.push('');
  });
}

const markdown = lines.join('\n');

return [
  { json: { ...data, allBrands } },
  { json: { markdown } },
];
