const raw = $input.first().json;

// Parse JSON from AI Agent output (handles string or object)
let data;
if (typeof raw.output === 'string') {
  const cleaned = raw.output.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  data = JSON.parse(cleaned);
} else if (typeof raw.output === 'object') {
  data = raw.output;
} else {
  data = raw;
}

const d = data;
const date = d.report_date || new Date().toISOString().slice(0, 10);

const lines = [];

lines.push(`# Competitive Intelligence Report — ${date}`);
lines.push('');

// ── Key Insights ──────────────────────────────────────────────
lines.push('## Key Insights');
(d.key_insights || []).forEach(i => lines.push(`- ${i}`));
lines.push('');

// ── Competitive Summary ───────────────────────────────────────
lines.push('## Competitive Summary');

const cs = d.competitive_summary || {};

if (cs.top_threat) {
  const t = cs.top_threat;
  lines.push(`### Top Threat: ${t.brand}`);
  lines.push(`- **Visibility:** ${t.visibility}`);
  lines.push(`- **Sentiment:** ${t.sentiment}`);
  lines.push(`- **Position:** ${t.position}`);
  lines.push(`- ${t.reason}`);
  lines.push('');
}

if ((cs.attack_targets || []).length > 0) {
  lines.push('### Attack Targets');
  cs.attack_targets.forEach(a => {
    lines.push(`**${a.brand}** (Vulnerability Score: ${a.vulnerability_score})`);
    lines.push(`- Weakness: ${a.weakness}`);
    lines.push(`- Angle: ${a.attack_angle}`);
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
  lines.push('### Top Platforms to Target');
  lines.push('| Domain | Type | Citation Rate | Why |');
  lines.push('|--------|------|--------------|-----|');
  ct.top_platforms.forEach(p => {
    lines.push(`| ${p.domain} | ${p.classification} | ${p.citation_rate} | ${p.why} |`);
  });
  lines.push('');
}

if (ct.content_gaps) {
  lines.push(`### Content Gaps`);
  lines.push(ct.content_gaps);
  lines.push('');
}

if ((ct.recommended_topics || []).length > 0) {
  lines.push('### Recommended Topics');
  ct.recommended_topics.forEach(t => lines.push(`- ${t}`));
  lines.push('');
}

if ((ct.ugc_opportunities || []).length > 0) {
  lines.push('### UGC Opportunities');
  ct.ugc_opportunities.forEach(u => lines.push(`- ${u}`));
  lines.push('');
}

// ── Copy Brief ────────────────────────────────────────────────
lines.push('## Copy Brief');
const cb = d.copy_brief || {};

if (cb.attack_copy) {
  lines.push(`### Attack Copy — Target: ${cb.attack_copy.target_brand}`);
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

const markdown = lines.join('\n');

return [
  { json: { ...data } },              // pass-through clean JSON
  { json: { markdown } },             // Markdown string
];
