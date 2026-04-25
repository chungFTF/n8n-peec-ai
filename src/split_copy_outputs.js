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
const matrixByDirPriority = {};

function normalize(v) {
  return String(v || '').trim().toLowerCase();
}

function dirPriorityKey(obj) {
  const direction = normalize(obj?.copy_direction);
  const priority = normalize(obj?.priority);
  if (!direction || !priority) return null;
  return `${direction}::${priority}`;
}

function hasStrategyMeta(obj) {
  return Boolean(obj?.reference_insight || obj?.reason || obj?.timeframe);
}

matrix.forEach(m => {
  if (!m) return;
  if (m.platform) matrixByPlatform[m.platform] = m;

  const key = dirPriorityKey(m);
  if (!key) return;
  if (!matrixByDirPriority[key]) matrixByDirPriority[key] = [];
  matrixByDirPriority[key].push(m);
});

// Fallback metadata source:
// Some workflows do not pass copy_instruction_matrix into this node.
// In that case, reuse any incoming items that already carry strategy metadata.
const fallbackByPlatform = {};
const fallbackByDirPriority = {};
allItems.forEach(i => {
  const j = i.json || {};
  if (!j.platform) return;
  if (!hasStrategyMeta(j)) return;
  fallbackByPlatform[j.platform] = j;

  const key = dirPriorityKey(j);
  if (!key) return;
  if (!fallbackByDirPriority[key]) fallbackByDirPriority[key] = [];
  fallbackByDirPriority[key].push(j);
});

const items = data.copy_outputs || [];

return items.map(item => {
  let mx = matrixByPlatform[item.platform] || {};

  if (!hasStrategyMeta(mx)) {
    const key = dirPriorityKey(item);
    const matrixCandidates = key ? (matrixByDirPriority[key] || []) : [];
    if (matrixCandidates.length > 0) {
      mx = matrixCandidates.shift();
    }
  }

  if (!hasStrategyMeta(mx)) {
    mx = fallbackByPlatform[item.platform] || {};
  }

  if (!hasStrategyMeta(mx)) {
    const key = dirPriorityKey(item);
    const fallbackCandidates = key ? (fallbackByDirPriority[key] || []) : [];
    if (fallbackCandidates.length > 0) {
      mx = fallbackCandidates.shift();
    }
  }

  const hooksText = (item.hooks || []).map((h, i) => `Hook ${i + 1}: ${h}`).join('\n');

  const docTitle = `[${item.platform}] ${item.copy_direction} — ${item.headline}`;

  const docContent = [
    `Platform: ${item.platform}`,
    `Priority: ${item.priority}`,
    `Copy Direction: ${item.copy_direction}`,
    mx.timeframe ? `Timeframe: ${mx.timeframe}` : '',
    '',
    mx.reference_insight ? `Brief Context:\n${mx.reference_insight}` : '',
    mx.reason ? `Rationale: ${mx.reason}` : '',
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
  ].filter(line => line !== undefined).join('\n');

  return {
    json: {
      title: docTitle,
      content: docContent,
      platform: item.platform,
      priority: item.priority,
      copy_direction: item.copy_direction,
    },
  };
});
