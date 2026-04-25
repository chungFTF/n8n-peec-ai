const items = $input.all();
const markdownItem = items.find(i => i.json.markdown);
const dataItem     = items.find(i => i.json.allBrands);

const markdown  = markdownItem?.json?.markdown;
if (!markdown) throw new Error('No markdown found in input');

const allBrands = dataItem?.json?.allBrands || [];
const competitors = allBrands
  .filter(b => !b.is_own)
  .sort((a, b) => (a.position || 99) - (b.position || 99));

// ── Competitor bar chart (pure CSS, email-safe) ───────────────
function buildCompetitorChart(brands) {
  if (!brands.length) return '';

  const maxVis = Math.max(...brands.map(b => b.visibility || 0), 0.01);

  const sentimentColor = (tier) =>
    tier === 'bad' ? '#e74c3c' : tier === 'normal' ? '#f39c12' : '#27ae60';

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase();
    const color = s.includes('vulnerable') ? '#e74c3c'
                : s.includes('blue')       ? '#3498db'
                :                            '#27ae60';
    const label = s.includes('vulnerable') ? 'Vulnerable'
                : s.includes('blue')       ? 'Blue Ocean'
                :                            'Stable';
    return `<span style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;white-space:nowrap">${label}</span>`;
  };

  const bar = (pct, color) =>
    `<div style="background:#f0f0f0;border-radius:3px;height:10px;width:100%;margin:2px 0">
      <div style="background:${color};border-radius:3px;height:10px;width:${Math.min(pct, 100).toFixed(1)}%"></div>
    </div>`;

  const deltaCell = (n) => {
    if (n === undefined || n === null) return '<span style="color:#ccc">—</span>';
    const sign  = n > 0 ? '+' : '';
    const color = n > 0 ? '#27ae60' : n < 0 ? '#e74c3c' : '#888';
    return `<span style="color:${color};font-weight:600;font-size:11px">${sign}${n}</span>`;
  };

  const hasEvolution = brands.some(b => b.evolution);

  const rows = brands.map(b => {
    const visPct  = ((b.visibility || 0) / maxVis * 100).toFixed(1);
    const sentPct = (b.sentiment || 0).toFixed(1);
    const sColor  = sentimentColor(b.sentiment_tier);
    const vuln    = b.vulnerability_score > 0
      ? `<span style="font-size:11px;color:#888">Vulnerability <strong style="color:#e74c3c">${b.vulnerability_score}</strong></span>`
      : '';
    const ev = b.evolution;
    const evolCol = hasEvolution ? `
      <td style="padding:8px 0 8px 6px;vertical-align:middle;text-align:center;white-space:nowrap;min-width:90px">
        ${ev ? `
          <div style="font-size:11px;line-height:1.8">
            <div>Vis ${deltaCell(ev.visibility_delta)}</div>
            <div>Sent ${deltaCell(ev.sentiment_delta)}</div>
            <div>Pos ${deltaCell(ev.position_delta)}</div>
          </div>` : '<span style="color:#ccc;font-size:11px">—</span>'}
      </td>` : '';

    return `<tr>
      <td style="padding:8px 10px 8px 0;vertical-align:middle;width:120px;font-size:13px;font-weight:600;color:#1a1a2e;white-space:nowrap">${b.brand}</td>
      <td style="padding:8px 6px;vertical-align:middle;width:120px">
        <div style="font-size:10px;color:#888;margin-bottom:2px">Visibility <strong>${b.visibility}</strong></div>
        ${bar(visPct, '#3498db')}
      </td>
      <td style="padding:8px 6px;vertical-align:middle;width:120px">
        <div style="font-size:10px;color:#888;margin-bottom:2px">Sentiment <strong>${b.sentiment}</strong></div>
        ${bar(sentPct, sColor)}
      </td>
      <td style="padding:8px 6px;vertical-align:middle;text-align:right;white-space:nowrap">
        ${statusBadge(b.market_status)}<br>
        <span style="display:inline-block;margin-top:4px">${vuln}</span>
      </td>
      ${evolCol}
    </tr>`;
  }).join('');

  const evolHeader = hasEvolution
    ? `<th style="font-size:11px;color:#888;font-weight:600;text-align:center;padding:0 0 6px 6px">Yesterday → Today</th>`
    : '';

  return `<table style="width:100%;border-collapse:collapse;margin:4px 0">
  <thead>
    <tr style="border-bottom:1px solid #f0f0f0">
      <th style="font-size:11px;color:#888;font-weight:600;text-align:left;padding:0 10px 6px 0">Brand</th>
      <th style="font-size:11px;color:#888;font-weight:600;text-align:left;padding:0 6px 6px">Visibility</th>
      <th style="font-size:11px;color:#888;font-weight:600;text-align:left;padding:0 6px 6px">Sentiment Score</th>
      <th style="font-size:11px;color:#888;font-weight:600;text-align:right;padding:0 6px 6px">Status</th>
      ${evolHeader}
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

const competitorChartHtml = buildCompetitorChart(competitors);

// ── D1 DETECT Scorecard ───────────────────────────────────────
function buildDetectScorecard(data) {
  const ob = data?.own_brand_summary;
  if (!ob) return '';

  const bi = ob.brand_intel || {};
  const sp = ob.search_presence || {};
  const dp = ob.domain_presence || {};

  const mStatus = (bi.market_status || '').toLowerCase();
  const statusBg = mStatus.includes('blue') ? '#2980b9' : mStatus.includes('vuln') ? '#e74c3c' : '#27ae60';

  const visTier  = v => v >= 0.5 ? ['▲ STRONG',   '#27ae60'] : v >= 0.2 ? ['◆ MODERATE', '#e67e22'] : ['▼ STEALTH',  '#e74c3c'];
  const sentTier = s => s >= 66  ? ['▲ GOOD',     '#27ae60'] : s >= 45  ? ['◆ FAIR',     '#e67e22'] : ['▼ POOR',     '#e74c3c'];
  const posTier  = p => !p       ? ['—',           '#aaa']   : p <= 3   ? ['▲ TOP 3',    '#27ae60'] : p <= 5 ? ['◆ TOP 5', '#e67e22'] : ['▼ WEAK', '#e74c3c'];
  const sovTier  = s => s == null ? ['—',          '#aaa']   : s >= 0.25 ? ['▲ LEADER',  '#27ae60'] : s >= 0.1 ? ['◆ PLAYER', '#e67e22'] : ['▼ MINOR', '#e74c3c'];

  const card = (label, value, tier, tColor) =>
    `<td style="padding-right:8px;vertical-align:top"><div style="background:#f8f9fb;border:1px solid #e8e8e8;border-radius:6px;padding:12px 8px;text-align:center"><div style="font-size:10px;color:#aaa;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">${label}</div><div style="font-size:20px;font-weight:700;color:#1a1a2e;line-height:1.2">${value ?? '—'}</div><div style="font-size:10px;font-weight:700;color:${tColor};margin-top:6px;letter-spacing:0.5px">${tier}</div></div></td>`;

  const [visL, visC]   = visTier(bi.visibility || 0);
  const [sentL, sentC] = sentTier(bi.sentiment || 0);
  const [posL, posC]   = posTier(bi.position);
  const sov = bi.share_of_voice;
  const [sovL, sovC]   = sovTier(sov);

  const secCards = [];
  if (dp.avg_citation_rate != null) {
    const cr = dp.avg_citation_rate;
    secCards.push(card('Citation Rate', cr, cr >= 0.5 ? '▲ CITED' : '▼ LOW', cr >= 0.5 ? '#27ae60' : '#e74c3c'));
  }
  if (dp.avg_retrieval_rate != null) {
    const rr = dp.avg_retrieval_rate;
    secCards.push(card('Retrieval Rate', rr, rr >= 0.5 ? '▲ HIGH' : '▼ LOW', rr >= 0.5 ? '#27ae60' : '#e74c3c'));
  }
  if (bi.vulnerability_score > 0) {
    secCards.push(card('Vulnerability', bi.vulnerability_score, '⚠ EXPOSED', '#e74c3c'));
  }
  if (sp.brand_mention_ranking) {
    secCards.push(card('Mention Rank', `#${sp.brand_mention_ranking}`, 'AI RANKING', '#2980b9'));
  }
  while (secCards.length < 4) secCards.push('<td style="padding-right:8px"></td>');

  const domainTags = (dp.own_domains_cited || []).map(d =>
    `<span style="display:inline-block;background:#e8f8f5;border:1px solid #a9dfbf;color:#1e8449;font-size:11px;padding:2px 8px;border-radius:3px;margin:2px 4px 2px 0">${d}</span>`
  ).join('');

  const keywords = sp.unique_keywords || [];
  const chips = keywords.length ? `<div style="margin-top:16px"><div style="font-size:10px;color:#aaa;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">◈ AI Search Signals</div><div>${keywords.map(k => `<span style="display:inline-block;background:#eef2ff;border:1px solid #d6dbff;color:#2c3e50;font-size:12px;padding:4px 10px;border-radius:12px;margin:3px 4px 3px 0">${k}</span>`).join('')}</div></div>` : '';

  const summary = ob.raw_summary ? `<div style="margin-top:14px;padding:12px 14px;background:#fffdf5;border-left:3px solid #e67e22;border-radius:0 6px 6px 0"><div style="font-size:10px;color:#e67e22;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">◈ Strategic Intel</div><div style="font-size:13px;color:#555;line-height:1.7">${ob.raw_summary}</div></div>` : '';

  return `<div>
  <div style="margin-bottom:14px">
    <span style="background:${statusBg};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:3px;letter-spacing:1px">${(bi.market_status || '').toUpperCase()}</span>
    <span style="font-size:13px;color:#888;margin-left:8px">${ob.brand || ''} · AI Presence Index</span>
  </div>
  <table style="width:100%;border-collapse:collapse"><tr>
    ${card('Visibility', bi.visibility, visL, visC)}
    ${card('Sentiment', bi.sentiment, sentL, sentC)}
    ${card('Avg. Position', bi.position, posL, posC)}
    ${card('Share of Voice', sov != null ? (sov * 100).toFixed(1) + '%' : null, sovL, sovC)}
  </tr></table>
  <table style="width:100%;border-collapse:collapse;margin-top:8px"><tr>${secCards.join('')}</tr></table>
  ${domainTags ? `<div style="margin-top:10px"><span style="font-size:10px;color:#aaa;letter-spacing:1px;text-transform:uppercase">Cited Domains: </span>${domainTags}</div>` : ''}
  ${chips}
  ${summary}
</div>`;
}

// ── 5D Strategic Dashboard ────────────────────────────────────
function build5DDashboard(data) {
  if (!data) return '';

  const da     = data.defense_alert       || {};
  const cs     = data.competitive_summary || {};
  const dp     = (data.dominate_plan      || [])[0];
  const matrix = data.copy_instruction_matrix || [];
  const ob     = data.own_brand_summary?.brand_intel || {};

  const bdg = (text, bg) =>
    `<span style="background:${bg};color:#fff;font-size:10px;font-weight:700;padding:2px 9px;border-radius:3px;letter-spacing:0.5px;white-space:nowrap">${text}</span>`;

  // D1 DETECT — radar scan
  const mStatus  = (ob.market_status || '').toLowerCase();
  const d1Bg     = mStatus.includes('blue') ? '#2980b9' : mStatus.includes('vuln') ? '#e74c3c' : '#27ae60';
  const d1Imply  = mStatus.includes('blue')
    ? 'Brand is below AI radar, but your sentiment score is a loaded weapon. Now is the time to surface.'
    : mStatus.includes('vuln') ? 'Brand is exposed — high visibility with eroding sentiment. Activate defense immediately.'
    : 'Brand signal is stable. Maintain monitoring posture.';

  // D2 DEFENSE — threat monitor
  const severity = (da.severity || 'normal').toLowerCase();
  const d2Bg     = severity === 'critical' ? '#e74c3c' : severity === 'warning' ? '#e67e22' : '#27ae60';
  const d2Label  = severity === 'critical' ? '🚨 CRITICAL' : severity === 'warning' ? '⚠ WARNING' : '✓ NORMAL';
  const negSrc   = (da.negative_sources || [])[0];
  const d2Imply  = severity === 'critical'
    ? 'Immediate counter-narrative required — AI is indexing negative signals about your brand.'
    : severity === 'warning' ? 'Sentiment erosion detected. Deploy repair content before it spreads.'
    : `No active erosion detected.${negSrc ? ` Continue monitoring ${negSrc.domain}.` : ''}`;

  // D3 DIAGNOSE — competitor strike intel
  const topAttack = (cs.attack_targets || [])[0];
  const d3Vuln    = topAttack?.vulnerability_score;
  const d3Bg      = d3Vuln >= 10 ? '#e74c3c' : '#e67e22';
  const d3Imply   = topAttack
    ? `<strong>${topAttack.brand}</strong> is your #1 attack target — high AI visibility but sentiment is their weak point. Strike now.`
    : 'No competitor vulnerability data available.';

  // D4 DOMINATE — territory map
  const trend    = dp?.domain_trend || 'stable';
  const d4Bg     = trend === 'widening' ? '#e74c3c' : trend === 'closing' ? '#27ae60' : '#888';
  const d4Label  = trend === 'widening' ? 'URGENT ↑' : trend === 'closing' ? 'CLOSING ↓' : 'STABLE →';
  const d4Imply  = dp
    ? trend === 'widening'
      ? `The <strong>${dp.domain}</strong> gap is widening. Competitors are claiming this territory. Move immediately.`
      : trend === 'closing'
      ? `The <strong>${dp.domain}</strong> gap is closing — competitor is fighting back. Accelerate content push.`
      : `<strong>${dp.domain}</strong> is a stable opportunity. Plan systematic infiltration this cycle.`
    : 'No territory data available.';

  // D5 DIRECT & DRIVE — strike command
  const cCount   = matrix.filter(e => e.elm_path === 'central').length;
  const pCount   = matrix.filter(e => e.elm_path === 'peripheral').length;
  const d5Imply  = matrix.length
    ? `${cCount} cognitive persuasion brief${cCount !== 1 ? 's' : ''} (rational appeal) + ${pCount} emotional trigger brief${pCount !== 1 ? 's' : ''} armed and ready for deployment.`
    : 'Content briefs pending generation.';

  const row = (dLabel, role, badgeHtml, implication, color) => `
    <tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:12px 10px 12px 0;vertical-align:top;width:75px">
        <div style="font-size:14px;font-weight:700;color:${color}">${dLabel}</div>
        <div style="font-size:9px;color:#bbb;letter-spacing:1px;text-transform:uppercase;margin-top:2px">${role}</div>
      </td>
      <td style="padding:12px 12px;vertical-align:top;white-space:nowrap">${badgeHtml}</td>
      <td style="padding:12px 0;font-size:13px;color:#555;line-height:1.55;vertical-align:top">${implication}</td>
    </tr>`;

  return `
<div style="background:#fff;border:1px solid #e8e8e8;border-left:4px solid #1a1a2e;border-radius:8px;padding:18px 22px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
  <div style="color:#1a1a2e;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">◈ 5D WAR ROOM — Mission Overview</div>
  <div style="color:#aaa;font-size:11px;margin-bottom:14px">What is happening · How bad is it · What to do next</div>
  <table style="border-collapse:collapse;width:100%">
    ${row('D1', 'RADAR SCAN',   bdg(ob.market_status || '—', d1Bg),           d1Imply, '#2c3e50')}
    ${row('D2', 'THREAT WATCH', bdg(d2Label, d2Bg),                            d2Imply, '#e74c3c')}
    ${row('D3', 'STRIKE INTEL', topAttack ? bdg(`VULN ${d3Vuln}`, d3Bg) : bdg('NO DATA', '#aaa'), d3Imply, '#e67e22')}
    ${row('D4', 'TERRITORY',    dp ? bdg(d4Label, d4Bg) : bdg('NO DATA', '#aaa'), d4Imply, '#2980b9')}
    ${row('D5', 'STRIKE CMD',   bdg(matrix.length ? `${matrix.length} BRIEFS READY` : 'PENDING', matrix.length ? '#8e44ad' : '#aaa'), d5Imply, '#8e44ad')}
  </table>
</div>`;
}

// ── D2 Defense Alert Cards ────────────────────────────────────
function buildDefenseAlerts(data) {
  const highlights = data?.evolution_highlights || [];
  if (!highlights.length) {
    return `<div style="padding:12px 16px;background:#f0fff4;border-left:4px solid #27ae60;border-radius:0 6px 6px 0;font-size:13px;color:#555">✓ No significant signal changes detected — AI battlefield is currently stable.</div>`;
  }
  const fmt = n => n == null ? null : (n > 0 ? `+${n}` : `${n}`);
  return highlights.map(e => {
    const isDown = e.trend === 'down';
    const isUp   = e.trend === 'up';
    const color  = isDown ? '#e74c3c' : isUp ? '#27ae60' : '#888';
    const bg     = isDown ? '#fff5f5' : isUp ? '#f0fff4' : '#f9f9f9';
    const label  = isDown ? '▼ SIGNAL DEGRADING' : isUp ? '▲ SIGNAL RISING' : '→ STABLE';
    const metrics = [
      e.visibility_delta != null ? `Vis <strong style="color:${color}">${fmt(e.visibility_delta)}</strong>` : null,
      e.sentiment_delta  != null ? `Sent <strong style="color:${color}">${fmt(e.sentiment_delta)}</strong>`  : null,
      e.position_delta   != null ? `Pos <strong style="color:${color}">${fmt(e.position_delta)}</strong>`    : null,
    ].filter(Boolean).join('<span style="color:#ddd;margin:0 6px">|</span>');
    return `<div style="border:1px solid ${color}30;border-left:4px solid ${color};border-radius:0 6px 6px 0;background:${bg};padding:12px 16px;margin-bottom:10px">
  <table style="width:100%;border-collapse:collapse"><tr>
    <td style="vertical-align:middle;padding:0">
      <span style="font-size:10px;font-weight:700;color:${color};letter-spacing:1px">${label}</span>
      <span style="font-size:13px;font-weight:700;color:#1a1a2e;margin-left:10px">${e.brand}</span>
    </td>
    <td style="text-align:right;vertical-align:middle;padding:0;font-size:12px;white-space:nowrap">${metrics || '—'}</td>
  </tr></table>
  ${e.insight ? `<div style="font-size:13px;color:#555;margin-top:8px;line-height:1.5;padding-left:2px">→ ${e.insight}</div>` : ''}
</div>`;
  }).join('');
}

const inferElmPath = (dir) =>
  ['ATTACK', 'CONSIDERATION'].includes((dir || '').toUpperCase()) ? 'central' : 'peripheral';

const matrixFromItems = items
  .filter(i => i.json.documentId && i.json.copy_direction)
  .map(i => ({ ...i.json, elm_path: inferElmPath(i.json.copy_direction) }));

const dashboard5DData = {
  ...dataItem?.json,
  copy_instruction_matrix:
    items.find(i => i.json.copy_instruction_matrix)?.json?.copy_instruction_matrix
    || matrixFromItems,
};
const dashboard5DHtml    = build5DDashboard(dashboard5DData);
const detectScorecardHtml = buildDetectScorecard(dataItem?.json);
const defenseAlertsHtml   = buildDefenseAlerts(dataItem?.json);

// ── Competitive Landscape (Top Threat / Attack Targets / Blue Ocean) ──
function buildCompetitiveLandscape(cs) {
  if (!cs) return '';
  const parts = [];

  // Blue Ocean
  const blues = cs.blue_ocean_brands || [];
  if (blues.length > 0) {
    const blueRows = blues.map(b => `
<tr style="border-bottom:1px solid #f5f5f5">
  <td style="padding:10px 12px 10px 0;font-size:13px;font-weight:600;color:#1a1a2e;white-space:nowrap;vertical-align:top">${b.brand}</td>
  <td style="padding:10px 12px;font-size:12px;color:#888;vertical-align:top;text-align:center">${b.visibility}</td>
  <td style="padding:10px 0 10px 12px;font-size:12px;color:#555;vertical-align:top">${b.reason}</td>
</tr>`).join('');

    parts.push(`
<div>
  <div style="font-size:11px;font-weight:700;color:#3498db;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Blue Ocean Opportunities</div>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="border-bottom:2px solid #f0f0f0">
        <th style="font-size:11px;color:#888;font-weight:600;text-align:left;padding:0 12px 6px 0">Brand</th>
        <th style="font-size:11px;color:#888;font-weight:600;text-align:center;padding:0 12px 6px">Visibility</th>
        <th style="font-size:11px;color:#888;font-weight:600;text-align:left;padding:0 0 6px 12px">Opportunity</th>
      </tr>
    </thead>
    <tbody>${blueRows}</tbody>
  </table>
</div>`);
  }

  return parts.join('');
}

const competitiveLandscapeHtml = buildCompetitiveLandscape(
  dataItem?.json?.competitive_summary
);

// ── Radar Chart: Own Brand vs Top Threat ─────────────────────
function buildRadarChart(ownBrand, topThreat) {
  if (!ownBrand || !topThreat) return '';

  const cx = 200, cy = 175, r = 110;
  const dims = [
    { label: 'Visibility', val: b => (b.visibility || 0) * 100 },
    { label: 'Sentiment',  val: b => b.sentiment || 0 },
    { label: 'SoV',        val: b => (b.sov || 0) * 100 },
    { label: 'Presence',   val: b => b.saturation || 0 },
    { label: 'Authority',  val: b => Math.max(0, (6 - (b.position || 6)) / 5 * 100) },
  ];
  const n = dims.length;

  const angle = i => (i * 2 * Math.PI / n) - Math.PI / 2;
  const ax    = i => cx + r * Math.cos(angle(i));
  const ay    = i => cy + r * Math.sin(angle(i));
  const px    = (i, v) => cx + r * (Math.min(v, 100) / 100) * Math.cos(angle(i));
  const py    = (i, v) => cy + r * (Math.min(v, 100) / 100) * Math.sin(angle(i));
  const f     = n => n.toFixed(1);

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const grids = gridLevels.map((lv, gi) => {
    const pts = dims.map((_, i) =>
      `${f(cx + r * lv * Math.cos(angle(i)))},${f(cy + r * lv * Math.sin(angle(i)))}`
    ).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="${gi === 3 ? '#ddd' : '#f0f0f0'}" stroke-width="1"/>`;
  }).join('');

  const axes = dims.map((_, i) =>
    `<line x1="${cx}" y1="${cy}" x2="${f(ax(i))}" y2="${f(ay(i))}" stroke="#e0e0e0" stroke-width="1"/>`
  ).join('');

  const poly = (brand, color, fill) => {
    const pts = dims.map((d, i) => `${f(px(i, d.val(brand)))},${f(py(i, d.val(brand)))}`).join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
  };

  const dots = (brand, color) => dims.map((d, i) =>
    `<circle cx="${f(px(i, d.val(brand)))}" cy="${f(py(i, d.val(brand)))}" r="3.5" fill="${color}"/>`
  ).join('');

  // SVG legend rects only — NO <text> to prevent email-client text leakage
  const legendRects = `
    <rect x="150" y="315" width="10" height="10" fill="rgba(52,152,219,0.25)" stroke="#3498db" stroke-width="1.5" rx="2"/>
    <rect x="230" y="315" width="10" height="10" fill="rgba(231,76,60,0.18)" stroke="#e74c3c" stroke-width="1.5" rx="2"/>`;

  // 5-axis interpretation table (shows actual values for both brands)
  const axisRows = dims.map(d => {
    const ownVal    = Math.min(d.val(ownBrand), 100);
    const threatVal = Math.min(d.val(topThreat), 100);
    const diff      = ownVal - threatVal;
    const leading   = diff >= 0;
    const color     = leading ? '#27ae60' : '#e74c3c';
    const icon      = leading ? '▲' : '▼';
    return `<td style="width:20%;text-align:center;padding:10px 6px;vertical-align:top;border-right:1px solid #f0f0f0">
  <div style="font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">${d.label}</div>
  <div style="font-size:12px;font-weight:700;color:${color};margin-bottom:4px">${icon} Gap: ${Math.abs(diff).toFixed(0)}</div>
  <div style="font-size:11px;color:#3498db">${ownVal.toFixed(0)}</div>
  <div style="font-size:10px;color:#aaa;margin:1px 0">vs</div>
  <div style="font-size:11px;color:#e74c3c">${threatVal.toFixed(0)}</div>
</td>`;
  }).join('');

  return `<div style="margin:8px 0 16px">
  <div style="text-align:center;margin-bottom:8px">
    <div style="font-size:10px;color:#aaa;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">5-Axis Battlefield Map — Who wins where?</div>
    <div style="font-size:13px;font-weight:600;color:#1a1a2e">
      <span style="color:#3498db">■ ${ownBrand.brand}</span>
      <span style="color:#bbb;margin:0 8px">vs</span>
      <span style="color:#e74c3c">■ ${topThreat.brand}</span>
    </div>
  </div>
  <div style="text-align:center">
  <svg width="400" height="330" viewBox="0 0 400 330" xmlns="http://www.w3.org/2000/svg">
    ${grids}${axes}
    ${poly(topThreat, '#e74c3c', 'rgba(231,76,60,0.15)')}
    ${poly(ownBrand,  '#3498db', 'rgba(52,152,219,0.22)')}
    ${dots(topThreat, '#e74c3c')}
    ${dots(ownBrand,  '#3498db')}
    ${legendRects}
  </svg>
  </div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:6px;margin-top:8px">
    <thead><tr style="background:#f8f9fb;border-bottom:2px solid #eee">
      <th colspan="5" style="padding:6px 8px;text-align:left;font-size:10px;color:#aaa;font-weight:600;letter-spacing:1px">
        <span style="color:#3498db">■</span> ${ownBrand.brand} score &nbsp;|&nbsp; <span style="color:#e74c3c">■</span> ${topThreat.brand} score &nbsp;·&nbsp; Scale 0–100 (Visibility & SoV ×100, Sentiment 0–100, Presence = saturation%, Authority from position rank)
      </th>
    </tr></thead>
    <tbody><tr>${axisRows}</tr></tbody>
  </table>
</div>`;
}

const ownBrand    = allBrands.find(b => b.is_own);
const topThreatName = dataItem?.json?.competitive_summary?.top_threat?.brand;
const topThreatBrand = allBrands.find(b => b.brand === topThreatName);
const radarChartHtml = buildRadarChart(ownBrand, topThreatBrand);

const get5DColor = (tag) => {
  if (tag.includes('DEFENSE'))                         return '#e74c3c';
  if (tag.includes('DIAGNOSE'))                        return '#e67e22';
  if (tag.includes('DOMINATE'))                        return '#2980b9';
  if (tag.includes('DIRECT') || tag.includes('DRIVE')) return '#8e44ad';
  return '#2c3e50'; // DETECT + default
};

// ── Markdown → HTML ───────────────────────────────────────────
function mdToHtml(md) {
  const lines = md.split('\n');
  const body  = [];
  let inList        = false;
  let inTable       = false;
  let isFirstDataRow = true;
  let sectionBuffer = [];
  let currentSectionColor = null;

  const priorityMeta = { HIGH: '#e74c3c', MEDIUM: '#f39c12', LOW: '#27ae60' };

  const badge = (level) => {
    const color = priorityMeta[level] || '#888';
    return `<span style="background:${color};color:#fff;font-size:11px;font-weight:bold;padding:2px 7px;border-radius:3px">${level}</span>`;
  };

  const inline = (text) => text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f0f0f0;color:#c0392b;padding:1px 4px;border-radius:3px;font-size:13px">$1</code>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#2980b9;text-decoration:none">$1</a>');

  const headingWithBadge = (text) => {
    const m = text.match(/^\[(HIGH|MEDIUM|LOW)\]\s*/i);
    if (!m) return inline(text);
    return `${badge(m[1].toUpperCase())} ${inline(text.slice(m[0].length))}`;
  };

  const boldPriorityLine = (text) => {
    const m = text.match(/^\*\*\[(HIGH|MEDIUM|LOW)\]\s*(.+?)\*\*$/i);
    if (!m) return null;
    const color = priorityMeta[m[1].toUpperCase()] || '#888';
    return `<div style="border-left:3px solid ${color};padding:6px 12px;margin:12px 0 4px;background:#fafafa;border-radius:0 6px 6px 0;font-size:13px;font-weight:700;color:${color}">${badge(m[1].toUpperCase())} ${m[2]}</div>`;
  };

  const cellContent = (text) => {
    const priorityMatch = text.match(/^(HIGH|MEDIUM|LOW)$/i);
    if (priorityMatch) return badge(priorityMatch[1].toUpperCase());
    const deltaMatch = text.match(/^([+\-]\d+\.?\d*)$/);
    if (deltaMatch) {
      const val = parseFloat(deltaMatch[1]);
      const color = val > 0 ? '#27ae60' : val < 0 ? '#e74c3c' : '#888';
      return `<span style="color:${color};font-weight:600">${text}</span>`;
    }
    const trendMatch = text.match(/^[↑↓→]$/);
    if (trendMatch) {
      const color = text === '↑' ? '#27ae60' : text === '↓' ? '#e74c3c' : '#888';
      return `<span style="color:${color};font-size:16px">${text}</span>`;
    }
    return inline(text);
  };

  const flushSection = () => {
    if (sectionBuffer.length === 0) return;
    const borderLeft = currentSectionColor ? `;border-left:4px solid ${currentSectionColor}` : '';
    body.push(`<div style="background:#fff;border:1px solid #e8e8e8${borderLeft};border-radius:8px;padding:20px 24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);text-align:left">`);
    body.push(...sectionBuffer);
    body.push('</div>');
    sectionBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // DETECT scorecard placeholder
    if (line.trim() === '<!-- DETECT_SCORECARD -->') {
      sectionBuffer.push(detectScorecardHtml);
      continue;
    }

    // DEFENSE alerts placeholder
    if (line.trim() === '<!-- DEFENSE_ALERTS -->') {
      sectionBuffer.push(defenseAlertsHtml);
      continue;
    }

    // Competitor chart placeholder
    if (line.trim() === '<!-- COMPETITORS_CHART -->') {
      sectionBuffer.push(competitorChartHtml);
      continue;
    }

    // Radar chart placeholder
    if (line.trim() === '<!-- RADAR_CHART -->') {
      sectionBuffer.push(radarChartHtml);
      continue;
    }

    // Competitive landscape placeholder
    if (line.trim() === '<!-- COMPETITIVE_LANDSCAPE -->') {
      sectionBuffer.push(competitiveLandscapeHtml);
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      if (!inTable) {
        if (inList) { sectionBuffer.push('</ul>'); inList = false; }
        sectionBuffer.push('<table style="border-collapse:collapse;width:100%;margin:10px 0;font-size:13px">');
        inTable = true;
        isFirstDataRow = true;
      }
      if (line.match(/^\|[-| :]+\|$/)) continue;
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
      if (isFirstDataRow) {
        isFirstDataRow = false;
        sectionBuffer.push('<thead><tr>' + cells.map(c =>
          `<th style="border:1px solid #e0e0e0;padding:8px 10px;background:#f7f7f7;text-align:left;font-weight:600;color:#555">${inline(c)}</th>`
        ).join('') + '</tr></thead><tbody>');
      } else {
        sectionBuffer.push('<tr>' + cells.map((c, ci) =>
          `<td style="border:1px solid #e0e0e0;padding:8px 10px;${ci === 0 ? 'font-weight:500' : ''}">${cellContent(c)}</td>`
        ).join('') + '</tr>');
      }
      continue;
    } else if (inTable) {
      sectionBuffer.push('</tbody></table>');
      inTable = false;
    }

    if (line.trim() === '') {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      continue;
    }

    // Horizontal rule — divider between matrix entries
    if (line.trim() === '---') {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      sectionBuffer.push('<hr style="border:none;border-top:1px solid #e8e8e8;margin:20px 0">');
      continue;
    }

    // H1 — war brief banner
    if (line.startsWith('# ')) {
      flushSection();
      const title = line.slice(2);
      body.push(`
<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:8px;padding:28px 32px;margin-bottom:24px;text-align:center">
  <div style="color:#888;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">Peec AI · GEO Intelligence Command</div>
  <div style="color:#d4af37;font-size:22px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${inline(title)}</div>
  <div style="color:#555;font-size:11px;margin-top:8px;letter-spacing:1px">CLASSIFICATION: STRATEGIC WAR BRIEF · ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</div>
</div>`);
      body.push(dashboard5DHtml);
      continue;
    }

    // H2 — new card (5D D-label header)
    if (line.startsWith('## ')) {
      flushSection();
      const h2text = line.slice(3);
      currentSectionColor = get5DColor(h2text.toUpperCase());
      // Parse "N. KEYWORD — Subtitle" → D-label style
      const dMatch = h2text.match(/^(\d+)\.\s+([A-Z][A-Z &]+?)\s*[—\-]\s*(.+)$/i);
      let h2html;
      if (dMatch) {
        const [, num, keyword, subtitle] = dMatch;
        h2html = `<div style="border-bottom:2px solid ${currentSectionColor};padding-bottom:8px;margin-bottom:16px;letter-spacing:1px">
  <span style="font-size:20px;font-weight:700;color:${currentSectionColor}">D${num}</span><span style="color:#444;margin:0 8px">/</span><span style="font-size:13px;font-weight:700;color:${currentSectionColor};letter-spacing:2px;text-transform:uppercase">${keyword.trim()}</span><span style="font-size:12px;color:#555;margin-left:10px">· ${subtitle.trim()}</span>
</div>`;
      } else {
        h2html = `<div style="border-bottom:2px solid ${currentSectionColor};padding-bottom:8px;margin-bottom:16px">
  <span style="font-size:14px;font-weight:700;color:${currentSectionColor};letter-spacing:2px;text-transform:uppercase">${inline(h2text)}</span>
</div>`;
      }
      sectionBuffer.push(h2html);
      continue;
    }

    // H3 — subsection
    if (line.startsWith('### ')) {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      sectionBuffer.push(`<h3 style="color:#555;font-size:12px;font-weight:700;margin:16px 0 6px;letter-spacing:2px;text-transform:uppercase">${headingWithBadge(line.slice(4))}</h3>`);
      continue;
    }

    // H4 — sub-subsection (Content Deployment Briefs)
    if (line.startsWith('#### ')) {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      const h4color = currentSectionColor || '#a0c4ff';
      sectionBuffer.push(`<h4 style="color:#34495e;font-size:13px;font-weight:700;margin:14px 0 4px;padding-left:10px;border-left:3px solid ${h4color}">${headingWithBadge(line.slice(5))}</h4>`);
      continue;
    }

    // Blockquote — merge consecutive > lines into one callout box
    if (line.startsWith('> ')) {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      const bqLines = [inline(line.slice(2))];
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        i++;
        bqLines.push(inline(lines[i].slice(2)));
      }
      const bqColor = currentSectionColor || '#a0c4ff';
      sectionBuffer.push(`<div style="border-left:3px solid ${bqColor};padding:8px 14px;margin:10px 0;background:#f8f9fb;border-radius:0 6px 6px 0;font-size:13px;color:#2c3e50;line-height:1.8">${bqLines.join('<br>')}</div>`);
      continue;
    }

    // List item
    if (line.startsWith('- ')) {
      if (!inList) { sectionBuffer.push('<ul style="margin:6px 0;padding-left:0;list-style:none;color:#444">'); inList = true; }
      const listContent = inline(line.slice(2));
      if (listContent.includes('<strong>Similarity Rationale:</strong>')) {
        sectionBuffer.push(
          `<li style="margin:6px 0;font-size:13px;padding:8px 10px;border-left:3px solid ${currentSectionColor || '#3498db'};background:#f4f9ff;border-radius:0 6px 6px 0">${listContent}</li>`
        );
      } else {
        sectionBuffer.push(`<li style="margin:0;font-size:14px;padding:6px 0;border-bottom:1px solid #f0f0f0"><span style="color:${currentSectionColor || '#3498db'};margin-right:8px;font-size:10px">▶</span>${listContent}</li>`);
      }
      continue;
    }

    // Bold priority line: **[HIGH] label**
    if (inList) { sectionBuffer.push('</ul>'); inList = false; }
    const boldPriority = boldPriorityLine(line.trim());
    if (boldPriority) {
      sectionBuffer.push(boldPriority);
    } else {
      sectionBuffer.push(`<p style="margin:5px 0 8px;font-size:14px;color:#444;line-height:1.7">${inline(line)}</p>`);
    }
  }

  if (inList)  sectionBuffer.push('</ul>');
  if (inTable) sectionBuffer.push('</tbody></table>');
  flushSection();

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f9">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px 16px;color:#333;line-height:1.6;text-align:left">
${body.join('\n')}
<div style="text-align:center;color:#aaa;font-size:12px;margin-top:24px;padding-top:16px;border-top:1px solid #e8e8e8">
  Generated by Peec AI · ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
</div>
</div></body></html>`;
}

return [{ json: { html: mdToHtml(markdown) } }];
