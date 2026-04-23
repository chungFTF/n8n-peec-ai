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

  const labelOffset = r + 22;
  const anchorOf = i => {
    const c = Math.cos(angle(i));
    return c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
  };
  const labels = dims.map((d, i) => {
    const lx = cx + labelOffset * Math.cos(angle(i));
    const ly = cy + labelOffset * Math.sin(angle(i)) + 4;
    return `<text x="${f(lx)}" y="${f(ly)}" text-anchor="${anchorOf(i)}" font-size="11" font-weight="600" fill="#555" font-family="-apple-system,Arial,sans-serif">${d.label}</text>`;
  }).join('');

  const legend = `
    <rect x="120" y="308" width="10" height="10" fill="rgba(52,152,219,0.25)" stroke="#3498db" stroke-width="1.5" rx="2"/>
    <text x="135" y="317" font-size="11" font-weight="600" fill="#1a1a2e" font-family="-apple-system,Arial,sans-serif">${ownBrand.brand}</text>
    <rect x="240" y="308" width="10" height="10" fill="rgba(231,76,60,0.18)" stroke="#e74c3c" stroke-width="1.5" rx="2"/>
    <text x="255" y="317" font-size="11" font-weight="600" fill="#1a1a2e" font-family="-apple-system,Arial,sans-serif">${topThreat.brand}</text>`;

  return `<div style="text-align:center;margin:8px 0 16px">
  <svg width="400" height="335" viewBox="0 0 400 335" xmlns="http://www.w3.org/2000/svg">
    ${grids}${axes}
    ${poly(topThreat, '#e74c3c', 'rgba(231,76,60,0.15)')}
    ${poly(ownBrand,  '#3498db', 'rgba(52,152,219,0.22)')}
    ${dots(topThreat, '#e74c3c')}
    ${dots(ownBrand,  '#3498db')}
    ${labels}${legend}
  </svg>
</div>`;
}

const ownBrand    = allBrands.find(b => b.is_own);
const topThreatName = dataItem?.json?.competitive_summary?.top_threat?.brand;
const topThreatBrand = allBrands.find(b => b.brand === topThreatName);
const radarChartHtml = buildRadarChart(ownBrand, topThreatBrand);

// ── Markdown → HTML ───────────────────────────────────────────
function mdToHtml(md) {
  const lines = md.split('\n');
  const body  = [];
  let inList        = false;
  let inTable       = false;
  let isFirstDataRow = true;
  let sectionBuffer = [];

  const priorityMeta = { HIGH: '#e74c3c', MEDIUM: '#f39c12', LOW: '#27ae60' };

  const badge = (level) => {
    const color = priorityMeta[level] || '#888';
    return `<span style="background:${color};color:#fff;font-size:11px;font-weight:bold;padding:2px 7px;border-radius:3px">${level}</span>`;
  };

  const inline = (text) => text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:13px">$1</code>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#3498db;text-decoration:none">$1</a>');

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
    body.push(`<div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:20px 24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);text-align:left">`);
    body.push(...sectionBuffer);
    body.push('</div>');
    sectionBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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

    // H1 — email header banner
    if (line.startsWith('# ')) {
      flushSection();
      const title = line.slice(2);
      body.push(`
<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:10px;padding:28px 32px;margin-bottom:24px;text-align:center">
  <div style="color:#a0c4ff;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Strategic War Room · Peec AI</div>
  <div style="color:#fff;font-size:22px;font-weight:700">${inline(title)}</div>
</div>`);
      continue;
    }

    // H2 — new card
    if (line.startsWith('## ')) {
      flushSection();
      sectionBuffer.push(`<h2 style="color:#1a1a2e;font-size:16px;font-weight:700;margin:0 0 14px;padding-bottom:10px;border-bottom:2px solid #f0f0f0">${inline(line.slice(3))}</h2>`);
      continue;
    }

    // H3 — subsection
    if (line.startsWith('### ')) {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      sectionBuffer.push(`<h3 style="color:#2c3e50;font-size:14px;font-weight:700;margin:14px 0 4px">${headingWithBadge(line.slice(4))}</h3>`);
      continue;
    }

    // H4 — sub-subsection (Signal Deep-Dive items, Content Deployment Briefs)
    if (line.startsWith('#### ')) {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      sectionBuffer.push(`<h4 style="color:#34495e;font-size:13px;font-weight:700;margin:12px 0 4px;padding-left:10px;border-left:3px solid #a0c4ff">${headingWithBadge(line.slice(5))}</h4>`);
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
      sectionBuffer.push(`<div style="border-left:3px solid #a0c4ff;padding:8px 14px;margin:10px 0;background:#f0f6ff;border-radius:0 6px 6px 0;font-size:13px;color:#2c3e50;line-height:1.8">${bqLines.join('<br>')}</div>`);
      continue;
    }

    // List item
    if (line.startsWith('- ')) {
      if (!inList) { sectionBuffer.push('<ul style="margin:6px 0;padding-left:18px;color:#444">'); inList = true; }
      const listContent = inline(line.slice(2));
      // Highlight top-threat similarity rationale for faster scanning in email.
      if (listContent.includes('<strong>Similarity Rationale:</strong>')) {
        sectionBuffer.push(
          `<li style="margin:6px 0;font-size:14px;list-style:none;padding:8px 10px;border-left:3px solid #3498db;background:#f4f9ff;border-radius:0 6px 6px 0">${listContent}</li>`
        );
      } else {
        sectionBuffer.push(`<li style="margin:5px 0;font-size:14px">${listContent}</li>`);
      }
      continue;
    }

    // Bold priority line: **[HIGH] label**
    if (inList) { sectionBuffer.push('</ul>'); inList = false; }
    const boldPriority = boldPriorityLine(line.trim());
    if (boldPriority) {
      sectionBuffer.push(boldPriority);
    } else {
      sectionBuffer.push(`<p style="margin:5px 0 8px;font-size:14px;color:#444">${inline(line)}</p>`);
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
