const allItems = $input.all();

// Separate items by type
const docItems    = allItems.filter(i => i.json.kind === 'drive#file' && i.json.id);
const copyItems   = allItems.filter(i => i.json.content !== undefined && i.json.title !== undefined);
const rawMatrixItems = allItems.filter(i =>
  i.json.copy_instruction_matrix !== undefined || i.json.output !== undefined
);

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
    if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return str.slice(start);
}

function parseMatrixItem(item) {
  const j = item?.json || {};
  if (Array.isArray(j.copy_instruction_matrix)) return j.copy_instruction_matrix;

  if (typeof j.output === 'string') {
    try {
      const stripped = j.output.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(extractJSON(stripped));
      if (Array.isArray(parsed?.copy_instruction_matrix)) return parsed.copy_instruction_matrix;
    } catch (_) {
      return [];
    }
  }
  return [];
}

const matrix = rawMatrixItems.flatMap(parseMatrixItem);
const matrixByPlatform = {};
matrix.forEach(m => {
  if (m?.platform) matrixByPlatform[m.platform] = m;
});

function buildStrategyBlock(mx) {
  const lines = [];
  if (mx.platform_type) lines.push(`**Platform Type:** ${mx.platform_type}`);
  if (mx.strategy_phase) lines.push(`**Strategy Phase:** ${mx.strategy_phase}`);
  if (mx.psychological_tactic) lines.push(`**Psychological Tactic:** ${mx.psychological_tactic}`);
  if (mx.elm_path) lines.push(`**ELM Path:** ${mx.elm_path}`);
  if (mx.audience) lines.push(`**Audience:** ${mx.audience}`);
  if (mx.timeframe) lines.push(`**Timeframe:** ${mx.timeframe}`);
  if (mx.reference_insight) lines.push(`**Brief Context:**\n${mx.reference_insight}`);
  if (mx.reason) lines.push(`**Reason:** ${mx.reason}`);
  return lines.join('\n');
}

function injectStrategyIntoContent(content, mx) {
  const baseContent = String(content || '');
  const strategyBlock = buildStrategyBlock(mx);
  if (!strategyBlock) return baseContent;

  const headlineMarker = '\n\nHeadline:';
  const markerIdx = baseContent.indexOf(headlineMarker);

  if (markerIdx !== -1) {
    return `${baseContent.slice(0, markerIdx)}\n\n${strategyBlock}${baseContent.slice(markerIdx)}`;
  }

  return `${baseContent}\n\n${strategyBlock}`;
}

// Pair by position: copy item N → doc item N
return copyItems.map((copyItem, idx) => {
  const doc = docItems[idx];
  if (!doc) throw new Error(`No Google Doc found for copy item ${idx} (${copyItem.json.platform})`);
  const mx = matrixByPlatform[copyItem.json.platform] || {};
  const mergedContent = injectStrategyIntoContent(copyItem.json.content, mx);

  return {
    json: {
      documentId: doc.json.id,
      title:      copyItem.json.title,
      content:    mergedContent,
      platform:   copyItem.json.platform,
      priority:   copyItem.json.priority,
      copy_direction: copyItem.json.copy_direction,
      platform_type: mx.platform_type,
      strategy_phase: mx.strategy_phase,
      psychological_tactic: mx.psychological_tactic,
      elm_path: mx.elm_path,
      audience: mx.audience,
      reference_insight: mx.reference_insight,
      reason: mx.reason,
      timeframe: mx.timeframe,
    },
  };
});
