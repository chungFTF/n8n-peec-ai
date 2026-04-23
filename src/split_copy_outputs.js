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

const items = data.copy_outputs || [];

return items.map(item => {
  const hooksText = (item.hooks || []).map((h, i) => `Hook ${i + 1}：${h}`).join('\n');

  const docTitle = `[${item.platform}] ${item.copy_angle} ${item.headline}`;

  const docContent = [
    `平台：${item.platform}`,
    `優先級：${item.priority}`,
    `文案角度：${item.copy_angle}`,
    '',
    `標題：${item.headline}`,
    `副標題：${item.subheadline}`,
    '',
    '內文：',
    item.body,
    '',
    'Hooks：',
    hooksText,
    '',
    `CTA：${item.cta}`,
  ].join('\n');

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
