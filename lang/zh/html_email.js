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
    const label = s.includes('vulnerable') ? '易受攻擊'
                : s.includes('blue')       ? '藍海'
                :                            '穩定';
    return `<span style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;white-space:nowrap">${label}</span>`;
  };

  const bar = (pct, color) =>
    `<div style="background:#f0f0f0;border-radius:3px;height:10px;width:100%;margin:2px 0">
      <div style="background:${color};border-radius:3px;height:10px;width:${Math.min(pct, 100).toFixed(1)}%"></div>
    </div>`;

  const rows = brands.map(b => {
    const visPct  = ((b.visibility || 0) / maxVis * 100).toFixed(1);
    const sentPct = (b.sentiment || 0).toFixed(1);
    const sColor  = sentimentColor(b.sentiment_tier);
    const vuln    = b.vulnerability_score > 0
      ? `<span style="font-size:11px;color:#888">脆弱度 <strong style="color:#e74c3c">${b.vulnerability_score}</strong></span>`
      : '';

    return `<tr>
      <td style="padding:8px 10px 8px 0;vertical-align:middle;width:130px;font-size:13px;font-weight:600;color:#1a1a2e;white-space:nowrap">${b.brand}</td>
      <td style="padding:8px 6px;vertical-align:middle;width:130px">
        <div style="font-size:10px;color:#888;margin-bottom:2px">能見度 <strong>${b.visibility}</strong></div>
        ${bar(visPct, '#3498db')}
      </td>
      <td style="padding:8px 6px;vertical-align:middle;width:130px">
        <div style="font-size:10px;color:#888;margin-bottom:2px">情感 <strong>${b.sentiment}</strong></div>
        ${bar(sentPct, sColor)}
      </td>
      <td style="padding:8px 0 8px 6px;vertical-align:middle;text-align:right;white-space:nowrap">
        ${statusBadge(b.market_status)}<br>
        <span style="display:inline-block;margin-top:4px">${vuln}</span>
      </td>
    </tr>`;
  }).join('');

  return `<table style="width:100%;border-collapse:collapse;margin:4px 0">
  <thead>
    <tr style="border-bottom:1px solid #f0f0f0">
      <th style="font-size:11px;color:#888;font-weight:600;text-align:left;padding:0 10px 6px 0">品牌</th>
      <th style="font-size:11px;color:#888;font-weight:600;text-align:left;padding:0 6px 6px">能見度</th>
      <th style="font-size:11px;color:#888;font-weight:600;text-align:left;padding:0 6px 6px">情感分數</th>
      <th style="font-size:11px;color:#888;font-weight:600;text-align:right;padding:0 0 6px 6px">狀態</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

const competitorChartHtml = buildCompetitorChart(competitors);

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
    const m = text.match(/^(HIGH|MEDIUM|LOW)$/i);
    return m ? badge(m[1].toUpperCase()) : inline(text);
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
  <div style="color:#a0c4ff;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Peec AI Intelligence</div>
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
      sectionBuffer.push(`<li style="margin:5px 0;font-size:14px">${inline(line.slice(2))}</li>`);
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
