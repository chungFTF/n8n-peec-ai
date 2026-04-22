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
    prompt_id:        findIdx('prompt_id'),
    chat_id:          findIdx('chat_id'),
    model_id:         findIdx('model_id'),
    model_channel_id: findIdx('model_channel_id'),
    date:             findIdx('date'),
    query_index:      findIdx('query_index'),
    query_text:       findIdx('query_text'),
  };

  // 從 query_text 萃取出現的品牌名稱（可依實際品牌清單調整）
  const KNOWN_BRANDS = [
    'lululemon', 'nike', 'adidas', 'alo', 'gymshark', 'vuori',
    'athleta', 'under armour', 'puma', 'rhone', 'beyond yoga',
    'sweaty betty', 'skims', 'fabletics'
  ];

  const extractBrands = (text) => {
    const t = text.toLowerCase();
    return KNOWN_BRANDS.filter(b => t.includes(b));
  };

  // 整理每一筆 query
  const allQueries = rows.map(row => ({
    prompt_id:        row[idx.prompt_id],
    chat_id:          row[idx.chat_id],
    model_id:         row[idx.model_id],
    model_channel_id: row[idx.model_channel_id],
    date:             row[idx.date],
    query_index:      row[idx.query_index],
    query_text:       row[idx.query_text] || '',
    brands_mentioned: extractBrands(row[idx.query_text] || ''),
  }));

  // 依 prompt_id 分組，了解每個 prompt 在各 model 產生了哪些搜尋詞
  const byPrompt = {};
  for (const q of allQueries) {
    if (!byPrompt[q.prompt_id]) byPrompt[q.prompt_id] = [];
    byPrompt[q.prompt_id].push(q);
  }

  // 依 model_id 統計查詢數量分佈
  const modelDistribution = allQueries.reduce((acc, q) => {
    acc[q.model_id] = (acc[q.model_id] || 0) + 1;
    return acc;
  }, {});

  // 所有 query_text 去重後的關鍵字池（了解 AI 用哪些詞搜尋這個市場）
  const uniqueQueryTexts = [...new Set(allQueries.map(q => q.query_text))];

  // 在 query_text 中出現的品牌統計（AI 主動帶入品牌名稱的頻率）
  const brandMentionCount = {};
  for (const q of allQueries) {
    for (const brand of q.brands_mentioned) {
      brandMentionCount[brand] = (brandMentionCount[brand] || 0) + 1;
    }
  }

  // 按提及次數排序
  const brandMentionRanking = Object.entries(brandMentionCount)
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => ({ brand, count }));

  results.push({
    json: {
      source:                'list_search_queries',
      total_queries:         allQueries.length,
      unique_query_texts:    uniqueQueryTexts.length,
      model_distribution:    modelDistribution,
      brand_mention_ranking: brandMentionRanking,
      unique_keywords:       uniqueQueryTexts,
      by_prompt:             byPrompt,
    }
  });
}

return results;
