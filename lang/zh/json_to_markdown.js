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
lines.push(`# 戰略征服儀表板 (Strategic Conquest Dashboard) — ${date}`);
lines.push('');

// ══════════════════════════════════════════════════════════════
// 第一部分 · 戰場紅點預警 (Battlefield Alert)
// 優先呈現即時情感與能見度信號（防禦雷達）
// ══════════════════════════════════════════════════════════════
lines.push('## 第一部分 · 戰場紅點預警 (Battlefield Alert)');
lines.push('*品牌資產侵蝕警告 — AI 戰場即時信號*');
lines.push('');

if ((d.evolution_highlights || []).length > 0) {
  d.evolution_highlights.forEach(e => {
    const arrow = e.trend === 'up' ? '↑' : e.trend === 'down' ? '↓' : '→';
    const fmt = (n) => (n > 0 ? `+${n}` : `${n}`);
    const alertIcon = e.trend === 'down' ? '🔴' : e.trend === 'up' ? '🟢' : '🟡';
    lines.push(`> ${alertIcon} ${arrow} **${e.brand}**（能見度 ${fmt(e.visibility_delta)}）— ${e.insight}`);
  });
  lines.push('');
}

const ob = d.own_brand_summary;
if (ob) {
  lines.push(`### 品牌現況 — ${ob.brand}`);
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
  lines.push(`| 被引用網域 | ${(dp.own_domains_cited || []).join('、') || '—'} |`);
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

// ══════════════════════════════════════════════════════════════
// 第二部分 · 對手漏洞掃描 (Vulnerability Radar)
// 競品弱點掃描 — 依攻擊優先度排序
// ══════════════════════════════════════════════════════════════
lines.push('## 第二部分 · 對手漏洞掃描 (Vulnerability Radar)');
lines.push('*競品弱點掃描 — 依攻擊優先度排序*');
lines.push('');

const competitors = allBrands.filter(b => !b.is_own);
if (competitors.length > 0) {
  lines.push('### 競品指標總覽');
  lines.push('<!-- COMPETITORS_CHART -->');
  lines.push('');
}

lines.push('### 競爭態勢總覽');
lines.push('<!-- RADAR_CHART -->');
lines.push('<!-- COMPETITIVE_LANDSCAPE -->');
lines.push('');

const cs = d.competitive_summary || {};


// ══════════════════════════════════════════════════════════════
// 第三部分 · 實時執行矩陣 (Execution Matrix)
// 完整閉環：監測 → 分析 → 指令 → 執行
// ══════════════════════════════════════════════════════════════
lines.push('## 第三部分 · 實時執行矩陣 (Execution Matrix)');
lines.push('*完整閉環：監測 → 分析 → 指令 → 執行*');
lines.push('');

if ((d.action_plan || []).length > 0) {
  lines.push('### 執行指令');
  lines.push('| 優先級 | 時程 | 行動項目 | 執行理由 |');
  lines.push('|--------|------|----------|----------|');
  d.action_plan.forEach(a => {
    const priority = (a.priority || '').toUpperCase();
    lines.push(`| ${priority} | ${a.timeframe} | ${a.action} | ${a.rationale} |`);
  });
  lines.push('');
}

if (strategyItems.length > 0) {
  lines.push('### 內容佈局指派');
  strategyItems.forEach((item, idx) => {
    if (idx > 0) lines.push('---');
    const s = item.json;
    const docUrl = `https://docs.google.com/document/d/${s.documentId}`;
    const priorityLabel = (s.priority || '').toUpperCase();
    lines.push(`#### [${priorityLabel}] ${s.platform} — ${s.platform_type}`);
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

lines.push('---');
lines.push('*本儀表板為動態文件。Peec AI 每 6 小時更新一次競爭信號。*');

const markdown = lines.join('\n');

return [
  { json: { ...data, allBrands } },
  { json: { markdown } },
];
