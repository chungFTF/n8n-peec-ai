const items = $input.all();
const results = [];

for (const item of items) {
  const rawData = item.json;

  let content = rawData.content;
  if (Array.isArray(content)) content = content[0];
  if (content && content.text) content = content.text;
  if (!content || !content.columns) content = rawData;
  if (!content || !content.columns) continue;

  const columns = content.columns;
  const rows = content.rows || [];

  const findIdx = (name) => columns.findIndex(c => c.toLowerCase() === name.toLowerCase());

  const idx = {
    id:       findIdx('id'),
    text:     findIdx('text'),
    tag_ids:  findIdx('tag_ids'),
    topic_id: findIdx('topic_id'),
    volume:   findIdx('volume'),
  };

  const volumeScore = { low: 1, medium: 2, high: 3 };

  const classifyIntent = (text) => {
    const t = text.toLowerCase();
    if (/\b(buy|shop|store|where can i|best place)\b/.test(t)) return 'purchase_intent';
    if (/\b(compare|analyze|analyse|evaluate|market positioning)\b/.test(t)) return 'research_intent';
    if (/\b(suggest|recommend)\b/.test(t)) return 'recommendation_intent';
    if (/\b(best|top|top-rated|leading)\b/.test(t)) return 'discovery_intent';
    if (/\b(find|identify|locate|list|show me)\b/.test(t)) return 'discovery_intent';
    return 'general';
  };

  const queries = rows.map(row => {
    const text = row[idx.text] || '';
    return {
      id:           row[idx.id],
      text:         text,
      tag_ids:      row[idx.tag_ids] || [],
      topic_id:     row[idx.topic_id],
      volume:       row[idx.volume] || 'low',
      volume_score: volumeScore[row[idx.volume]] || 1,
      intent_type:  classifyIntent(text),
    };
  });

  queries.sort((a, b) => {
    if (b.volume_score !== a.volume_score) return b.volume_score - a.volume_score;
    const intentPriority = { purchase_intent: 3, discovery_intent: 2, recommendation_intent: 1, research_intent: 0, general: 0 };
    return (intentPriority[b.intent_type] || 0) - (intentPriority[a.intent_type] || 0);
  });

  const intent_summary = queries.reduce((acc, q) => {
    acc[q.intent_type] = (acc[q.intent_type] || 0) + 1;
    return acc;
  }, {});

  results.push({
    json: {
      source: 'list_shopping_queries',
      total: queries.length,
      intent_summary,
      queries,
    }
  });
}

return results;
