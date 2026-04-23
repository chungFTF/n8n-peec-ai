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

// Look up copy_instruction_matrix for rationale + timeframe enrichment
const matrixItem = allItems.find(i => i.json.copy_instruction_matrix);
const matrix = matrixItem?.json?.copy_instruction_matrix || [];
const matrixByPlatform = {};
matrix.forEach(m => { matrixByPlatform[m.platform] = m; });

const items = data.copy_outputs || [];

return items.map(item => {
  const mx = matrixByPlatform[item.platform] || {};
  const hooksText = (item.hooks || []).map((h, i) => `Hook ${i + 1}: ${h}`).join('\n');

  const docTitle = `[${item.platform}] ${item.copy_angle} — ${item.headline}`;

  const docContent = [
    `Platform: ${item.platform}`,
    `Priority: ${item.priority}`,
    `Copy Angle: ${item.copy_angle}`,
    mx.timeframe ? `Timeframe: ${mx.timeframe}` : '',
    '',
    `Headline: ${item.headline}`,
    `Subheadline: ${item.subheadline}`,
    '',
    'Body:',
    item.body,
    '',
    'Hooks:',
    hooksText,
    '',
    `CTA: ${item.cta}`,
    mx.reason ? `\nRationale: ${mx.reason}` : '',
  ].filter(line => line !== undefined).join('\n');

  return {
    json: {
      title: docTitle,
      content: docContent,
      platform: item.platform,
      priority: item.priority,
      copy_angle: item.copy_angle,
    },
  };
});
