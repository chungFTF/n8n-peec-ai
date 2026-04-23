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
  const rows    = content.rows || [];

  const findIdx = (name) => columns.findIndex(c => c.toLowerCase() === name.toLowerCase());

  const idx = {
    domain:              findIdx('domain'),
    classification:      findIdx('classification'),
    retrieved_pct:       findIdx('retrieved_percentage'),
    retrieval_rate:      findIdx('retrieval_rate'),
    citation_rate:       findIdx('citation_rate'),
    mentioned_brand_ids: findIdx('mentioned_brand_ids'),
  };

  const domains = rows.map(row => ({
    domain:              row[idx.domain],
    classification:      row[idx.classification],
    retrieved_pct:       parseFloat(row[idx.retrieved_pct])       || 0,  // 0–1，顯示時 ×100
    retrieval_rate:      parseFloat(row[idx.retrieval_rate])      || 0,  // 直接顯示
    citation_rate:       parseFloat(row[idx.citation_rate])       || 0,  // 可超過 1.0，直接顯示
    mentioned_brand_ids: row[idx.mentioned_brand_ids]             || [],
  }));

  // 依 classification 分組
  const byClass = domains.reduce((acc, d) => {
    if (!acc[d.classification]) acc[d.classification] = [];
    acc[d.classification].push(d);
    return acc;
  }, {});

  const ownDomains        = byClass['OWN']        || [];
  const competitorDomains = (byClass['COMPETITOR'] || []).sort((a, b) => b.citation_rate - a.citation_rate);
  const ugcDomains        = (byClass['UGC']        || []).sort((a, b) => b.citation_rate - a.citation_rate);

  // Gap score: 衡量此域名對市場的影響力，但自有品牌尚未在此建立存在感
  // gap_score = citation_rate × retrieval_rate
  // citation_rate 高 → AI 頻繁引用此域名
  // retrieval_rate 高 → AI 頻繁檢索此域名作為資料來源
  // 兩者都高 → 此域名對 AI 推薦影響極大，是優先投資標的
  const GAP_TYPES = ['EDITORIAL', 'REFERENCE', 'UGC'];

  const investmentCandidates = domains
    .filter(d => GAP_TYPES.includes(d.classification))
    .map(d => ({
      ...d,
      gap_score: parseFloat((d.citation_rate * d.retrieval_rate).toFixed(4)),
    }))
    .sort((a, b) => b.gap_score - a.gap_score);

  // 分類後的投資建議（各類型前 5，再合併去重後取前 10）
  const topByType = {};
  for (const type of GAP_TYPES) {
    topByType[type] = investmentCandidates
      .filter(d => d.classification === type)
      .slice(0, 5);
  }

  const seen = new Set();
  const domain_investment_suggestion = investmentCandidates
    .filter(d => {
      if (seen.has(d.domain)) return false;
      seen.add(d.domain);
      return true;
    })
    .slice(0, 10)
    .map(d => ({
      domain:          d.domain,
      classification:  d.classification,
      citation_rate:   d.citation_rate,
      retrieval_rate:  d.retrieval_rate,
      gap_score:       d.gap_score,
      why: d.classification === 'EDITORIAL'
        ? '高權威媒體，AI 頻繁引用，適合投稿或品牌合作'
        : d.classification === 'REFERENCE'
        ? '參考型來源（如維基百科），AI 信任度最高，優先建立品牌條目'
        : 'UGC 平台，真實用戶評論驅動 AI 搜尋推薦',
    }));

  // 高引用域名（citation_rate > 1.0），排除已是自有域名者
  const ownSet = new Set(ownDomains.map(d => d.domain));
  const highCitationDomains = domains
    .filter(d => d.citation_rate > 1.0 && !ownSet.has(d.domain))
    .sort((a, b) => b.citation_rate - a.citation_rate);

  results.push({
    json: {
      source:                      'get_domain_report',
      total_domains:               domains.length,
      own_domains:                 ownDomains,
      competitor_domains:          competitorDomains,
      ugc_domains:                 ugcDomains,
      high_citation_domains:       highCitationDomains,
      domain_investment_suggestion,
      investment_by_type:          topByType,
      by_classification:           byClass,
    }
  });
}

return results;
