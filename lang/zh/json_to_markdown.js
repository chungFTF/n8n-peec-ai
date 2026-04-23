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
  lines.push(`## 自有品牌現況 — ${ob.brand}`);
  const bi = ob.brand_intel || {};
  const sp = ob.search_presence || {};
  const dp = ob.domain_presence || {};

  lines.push('| 指標 | 數值 |');
  lines.push('|------|------|');
  lines.push(`| 能見度 | ${bi.visibility ?? '—'} |`);
  lines.push(`| 情感分數 | ${bi.sentiment ?? '—'} |`);
  lines.push(`| 排名 | ${bi.position ?? '—'} |`);
  lines.push(`| 聲量佔比 (SoV) | ${bi.share_of_voice ?? '—'} |`);
  lines.push(`| 市場狀態 | ${bi.market_status ?? '—'} |`);
  lines.push(`| 脆弱度評分 | ${bi.vulnerability_score ?? '—'} |`);
  lines.push(`| AI 搜尋提及排名 | ${sp.brand_mention_ranking ?? '—'} |`);
  lines.push(`| 平均引用率 | ${dp.avg_citation_rate ?? '—'} |`);
  lines.push(`| 平均檢索率 | ${dp.avg_retrieval_rate ?? '—'} |`);
  lines.push(`| 被引用網域 | ${(dp.own_domains_cited || []).join(', ') || '—'} |`);
  lines.push('');
  lines.push('> **脆弱度評分說明**');
  lines.push('> 公式：`(100 − 情感分數) ÷ 排名`，僅計算排名前 5 的品牌');
  lines.push('> 分數越高 → 該品牌越顯眼但口碑越差 → 越值得攻擊');
  lines.push('> 情感分級：0–44 差　45–65 普通　66–100 良好');
  lines.push('');

  if ((sp.unique_keywords || []).length > 0) {
    lines.push(`**相關關鍵字：** ${sp.unique_keywords.join('、')}`);
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
  lines.push('## 競品指標總覽');
  lines.push('<!-- COMPETITORS_CHART -->');
  lines.push('');
}

// ── Key Insights ──────────────────────────────────────────────
lines.push('## 重點洞察');
(d.key_insights || []).forEach(i => lines.push(`- ${i}`));
lines.push('');

// ── Insight Analysis ──────────────────────────────────────────
if ((d.insight_analysis || []).length > 0) {
  lines.push('## 洞察深度分析');
  d.insight_analysis.forEach((item, idx) => {
    lines.push(`### ${idx + 1}. ${item.insight}`);
    lines.push(item.explanation);
    lines.push('');
  });
}

// ── Competitive Summary ───────────────────────────────────────
lines.push('## 競爭態勢總覽');
const cs = d.competitive_summary || {};

if (cs.top_threat) {
  const t = cs.top_threat;
  lines.push(`### 首要威脅：${t.brand}`);
  lines.push(`- **能見度：** ${t.visibility}`);
  lines.push(`- **情感分數：** ${t.sentiment}`);
  lines.push(`- **排名：** ${t.position}`);
  lines.push(`- ${t.reason}`);
  lines.push('');
}

if ((cs.attack_targets || []).length > 0) {
  lines.push('### 攻擊目標');
  cs.attack_targets.forEach(a => {
    lines.push(`**${a.brand}**（脆弱度：${a.vulnerability_score}）`);
    lines.push(`- 弱點：${a.weakness}`);
    lines.push(`- 攻擊角度：${a.attack_angle}`);
  });
  lines.push('');
}

if ((cs.blue_ocean_brands || []).length > 0) {
  lines.push('### 藍海機會');
  cs.blue_ocean_brands.forEach(b => {
    lines.push(`**${b.brand}** — 能見度：${b.visibility}`);
    lines.push(`- ${b.reason}`);
  });
  lines.push('');
}

// ── Market Opportunities ──────────────────────────────────────
lines.push('## 市場機會');
(d.market_opportunities || []).forEach(o => {
  const priority = (o.priority || '').toUpperCase();
  lines.push(`### [${priority}] ${o.opportunity}`);
  lines.push(`- **來源：** ${o.data_source}`);
  lines.push(`- **行動：** ${o.action}`);
});
lines.push('');

// ── Content Strategy ──────────────────────────────────────────
lines.push('## 內容策略');
const ct = d.content_strategy || {};

if ((ct.top_platforms || []).length > 0) {
  lines.push('### 優先佈局平台');
  lines.push('| 網域 | 類型 | 引用率 | 重要原因 |');
  lines.push('|------|------|--------|----------|');
  ct.top_platforms.forEach(p => {
    lines.push(`| ${p.domain} | ${p.classification} | ${p.citation_rate} | ${p.why} |`);
  });
  lines.push('');
}

if ((ct.own_brand_gaps_by_type || []).length > 0) {
  lines.push('### 內容平台缺口分析');
  ct.own_brand_gaps_by_type.forEach(g => {
    const severity = (g.gap_severity || '').toUpperCase();
    lines.push(`**[${severity}] ${g.type}**`);
    lines.push(`- 平台：${(g.platforms || []).join('、')}`);
    lines.push(`- 原因：${g.reason}`);
  });
  lines.push('');
}

if (ct.content_gaps) {
  lines.push('### 整體缺口現況');
  lines.push(ct.content_gaps);
  lines.push('');
}

if ((ct.recommended_topics || []).length > 0) {
  lines.push('### 建議內容主題');
  ct.recommended_topics.forEach(t => lines.push(`- ${t}`));
  lines.push('');
}

if ((ct.ugc_opportunities || []).length > 0) {
  lines.push('### UGC 機會平台');
  ct.ugc_opportunities.forEach(u => lines.push(`- ${u}`));
  lines.push('');
}

// ── Copy Brief ────────────────────────────────────────────────
lines.push('## 文案方向');
const cb = d.copy_brief || {};

if (cb.attack_copy) {
  lines.push(`### 攻擊文案 — 目標品牌：${cb.attack_copy.target_brand}`);
  lines.push(cb.attack_copy.angle);
  lines.push('');
}

if (cb.awareness) {
  lines.push('### 認知期');
  lines.push(cb.awareness);
  lines.push('');
}

if (cb.consideration) {
  lines.push('### 考慮期');
  lines.push(cb.consideration);
  lines.push('');
}

if (cb.purchase) {
  lines.push('### 購買期');
  lines.push(cb.purchase);
  lines.push('');
}

// ── Action Plan ───────────────────────────────────────────────
if ((d.action_plan || []).length > 0) {
  lines.push('## 行動計畫');
  lines.push('| 優先級 | 時程 | 行動項目 | 執行理由 |');
  lines.push('|--------|------|----------|----------|');
  d.action_plan.forEach(a => {
    const priority = (a.priority || '').toUpperCase();
    lines.push(`| ${priority} | ${a.timeframe} | ${a.action} | ${a.rationale} |`);
  });
  lines.push('');
}

// ── Content Strategy Matrix ───────────────────────────────────
if (strategyItems.length > 0) {
  lines.push('## 內容策略執行矩陣');
  strategyItems.forEach(item => {
    const s = item.json;
    const docUrl = `https://docs.google.com/document/d/${s.documentId}`;
    const priorityLabel = (s.priority || '').toUpperCase();
    lines.push(`### [${priorityLabel}] ${s.platform} — ${s.platform_type}`);
    lines.push(`**格式：** ${s.content_format}`);
    lines.push(`**受眾：** ${s.audience}`);
    lines.push(`**內容簡報：** ${s.content_brief}`);
    lines.push(`**文案角度：** ${s.copy_angle}`);
    if (s.reference_insight) lines.push(`**參考洞察：** ${s.reference_insight}`);
    lines.push(`**執行依據：** ${s.reason}`);
    lines.push(`**時程：** ${s.timeframe}`);
    lines.push(`**文件：** [開啟 Google Doc](${docUrl})`);
    lines.push('');
  });
}

const markdown = lines.join('\n');

return [
  { json: { ...data, allBrands } },
  { json: { markdown } },
];
