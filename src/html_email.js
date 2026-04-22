const item = $input.all().find(i => i.json.markdown);
const markdown = item?.json?.markdown;
if (!markdown) throw new Error('No markdown found in input');

function mdToHtml(md) {
  const lines = md.split('\n');
  const body = [];
  let inList = false;
  let inTable = false;
  let tableHeaders = [];
  let sectionBuffer = [];
  let currentSection = null;

  const inline = (text) => text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:13px">$1</code>');

  const priorityBadge = (text) => {
    const match = text.match(/^\[(HIGH|MEDIUM|LOW)\]\s*/i);
    if (!match) return inline(text);
    const level = match[1].toUpperCase();
    const colors = { HIGH: '#e74c3c', MEDIUM: '#f39c12', LOW: '#27ae60' };
    const color = colors[level] || '#888';
    const rest = text.slice(match[0].length);
    return `<span style="background:${color};color:#fff;font-size:11px;font-weight:bold;padding:2px 7px;border-radius:3px;margin-right:8px">${level}</span>${inline(rest)}`;
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

    // Table
    if (line.startsWith('|')) {
      if (!inTable) {
        if (inList) { sectionBuffer.push('</ul>'); inList = false; }
        sectionBuffer.push('<table style="border-collapse:collapse;width:100%;margin:10px 0;font-size:13px">');
        inTable = true;
      }
      if (line.match(/^\|[-| :]+\|$/)) continue;
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
      if (tableHeaders.length === 0) {
        tableHeaders = cells;
        sectionBuffer.push('<thead><tr>' + cells.map(c =>
          `<th style="border:1px solid #e0e0e0;padding:8px 10px;background:#f7f7f7;text-align:left;font-weight:600;color:#555">${inline(c)}</th>`
        ).join('') + '</tr></thead><tbody>');
      } else {
        sectionBuffer.push('<tr>' + cells.map((c, ci) =>
          `<td style="border:1px solid #e0e0e0;padding:8px 10px;${ci === 0 ? 'font-weight:500' : ''}">${inline(c)}</td>`
        ).join('') + '</tr>');
      }
      continue;
    } else if (inTable) {
      sectionBuffer.push('</tbody></table>');
      inTable = false;
      tableHeaders = [];
    }

    if (line.trim() === '') {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      continue;
    }

    // H1 — email header (outside cards)
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

    // H2 — new card section
    if (line.startsWith('## ')) {
      flushSection();
      const label = line.slice(3);
      sectionBuffer.push(`<h2 style="color:#1a1a2e;font-size:16px;font-weight:700;margin:0 0 14px;padding-bottom:10px;border-bottom:2px solid #f0f0f0">${inline(label)}</h2>`);
      continue;
    }

    // H3 — subsection inside card
    if (line.startsWith('### ')) {
      if (inList) { sectionBuffer.push('</ul>'); inList = false; }
      const label = line.slice(4);
      const isPriority = /^\[(HIGH|MEDIUM|LOW)\]/.test(label);
      if (isPriority) {
        sectionBuffer.push(`<div style="margin:10px 0 4px;font-size:14px;font-weight:600">${priorityBadge(label)}</div>`);
      } else {
        sectionBuffer.push(`<h3 style="color:#2c3e50;font-size:14px;font-weight:700;margin:14px 0 4px">${inline(label)}</h3>`);
      }
      continue;
    }

    // List item
    if (line.startsWith('- ')) {
      if (!inList) { sectionBuffer.push('<ul style="margin:6px 0;padding-left:18px;color:#444">'); inList = true; }
      sectionBuffer.push(`<li style="margin:5px 0;font-size:14px">${inline(line.slice(2))}</li>`);
      continue;
    }

    // Paragraph
    if (inList) { sectionBuffer.push('</ul>'); inList = false; }
    sectionBuffer.push(`<p style="margin:5px 0 8px;font-size:14px;color:#444">${inline(line)}</p>`);
  }

  if (inList) sectionBuffer.push('</ul>');
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

const emailHtml = mdToHtml(markdown);
return [{ json: { html: emailHtml } }];
