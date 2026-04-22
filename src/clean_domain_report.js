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
    domain:               findIdx('domain'),
    classification:       findIdx('classification'),
    retrieved_percentage: findIdx('retrieved_percentage'),
    retrieval_rate:       findIdx('retrieval_rate'),
    citation_rate:        findIdx('citation_rate'),
    mentioned_brand_ids:  findIdx('mentioned_brand_ids'),
  };

  const domains = rows.map(row => ({
    domain:               row[idx.domain],
    classification:       row[idx.classification],
    retrieved_pct:        parseFloat(row[idx.retrieved_percentage]) || 0,  // 0–1，顯示時 ×100
    retrieval_rate:       parseFloat(row[idx.retrieval_rate]) || 0,         // 平均值，直接顯示
    citation_rate:        parseFloat(row[idx.citation_rate]) || 0,          // 平均值，可超過 1.0，直接顯示
    mentioned_brand_ids:  row[idx.mentioned_brand_ids] || [],
  }));

  // 依 classification 分組
  const byClassification = domains.reduce((acc, d) => {
    if (!acc[d.classification]) acc[d.classification] = [];
    acc[d.classification].push(d);
    return acc;
  }, {});

  // 自家域名
  const ownDomains = byClassification['OWN'] || [];

  // 競品域名，依 citation_rate 降冪
  const competitorDomains = (byClassification['COMPETITOR'] || [])
    .sort((a, b) => b.citation_rate - a.citation_rate);

  // 內容缺口：EDITORIAL + REFERENCE，citation_rate 高代表 AI 引用頻繁
  // 這些是值得投入內容的平台
  const contentGapTargets = [
    ...(byClassification['EDITORIAL'] || []),
    ...(byClassification['REFERENCE'] || []),
  ]
    .sort((a, b) => b.citation_rate - a.citation_rate)
    .slice(0, 10);

  // UGC 平台，依 citation_rate 排序（社群聲量來源）
  const ugcDomains = (byClassification['UGC'] || [])
    .sort((a, b) => b.citation_rate - a.citation_rate);

  // 高價值域名：citation_rate > 1.0（AI 每次引用時平均超過一次提及）
  const highCitationDomains = domains
    .filter(d => d.citation_rate > 1.0)
    .sort((a, b) => b.citation_rate - a.citation_rate);

  results.push({
    json: {
      source:                 'get_domain_report',
      total_domains:          domains.length,
      own_domains:            ownDomains,
      competitor_domains:     competitorDomains,
      content_gap_targets:    contentGapTargets,
      ugc_domains:            ugcDomains,
      high_citation_domains:  highCitationDomains,
      by_classification:      byClassification,
    }
  });
}

return results;
