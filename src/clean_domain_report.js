const items = $input.all();

// Helper: parse raw MCP response into domain array
function parseDomainData(item) {
  const rawData = item.json;
  let content = rawData.content;
  if (Array.isArray(content)) content = content[0];
  if (content && content.text) content = content.text;
  if (!content || !content.columns) content = rawData;
  if (!content || !content.columns) return [];

  const columns = content.columns;
  const rows = content.rows || [];
  const findIdx = (name) => columns.findIndex(c => c.toLowerCase() === name.toLowerCase());

  const idx = {
    domain:              findIdx('domain'),
    classification:      findIdx('classification'),
    retrieved_pct:       findIdx('retrieved_percentage'),
    retrieval_rate:      findIdx('retrieval_rate'),
    citation_rate:       findIdx('citation_rate'),
    mentioned_brand_ids: findIdx('mentioned_brand_ids'),
  };

  return rows.map(row => ({
    domain:              row[idx.domain],
    classification:      row[idx.classification],
    retrieved_pct:       parseFloat(row[idx.retrieved_percentage]) || 0,
    retrieval_rate:      parseFloat(row[idx.retrieval_rate]) || 0,
    citation_rate:       parseFloat(row[idx.citation_rate]) || 0,
    mentioned_brand_ids: row[idx.mentioned_brand_ids] || [],
  }));
}

// items[0] = today, items[1] = yesterday
const todayDomains     = items[0] ? parseDomainData(items[0]) : [];
const yesterdayDomains = items[1] ? parseDomainData(items[1]) : [];

// 若昨天資料解析失敗（API 回傳錯誤訊息），輸出警告但繼續執行
const hasYesterdayData = yesterdayDomains.length > 0;
if (items[1] && !hasYesterdayData) {
  console.warn('[clean_domain_report] yesterday data missing or error — delta will be null. Check get_domain_report_yesterday node.');
}

// Build yesterday lookup map
const yesterdayMap = {};
for (const d of yesterdayDomains) {
  yesterdayMap[d.domain] = d;
}

// Calculate delta for each today domain
const TREND_THRESHOLD = 0.05;

const domainsWithDelta = todayDomains.map(d => {
  const prev = yesterdayMap[d.domain];
  const citation_rate_delta  = prev != null ? +(d.citation_rate  - prev.citation_rate).toFixed(4)  : null;
  const retrieval_rate_delta = prev != null ? +(d.retrieval_rate - prev.retrieval_rate).toFixed(4) : null;

  let domain_trend = 'stable';
  if (citation_rate_delta !== null) {
    if (citation_rate_delta < -TREND_THRESHOLD) domain_trend = 'widening'; // gap 擴大，我方落後
    else if (citation_rate_delta > TREND_THRESHOLD) domain_trend = 'closing'; // gap 縮小，我方追上
  }

  // 高 citation + 惡化幅度大 → urgency 高
  const urgency_score = citation_rate_delta !== null
    ? +(d.citation_rate * (1 + Math.abs(citation_rate_delta))).toFixed(4)
    : d.citation_rate;

  const urgency = urgency_score >= 1.0 ? 'high' : urgency_score >= 0.4 ? 'medium' : 'low';

  return { ...d, citation_rate_delta, retrieval_rate_delta, domain_trend, urgency_score, urgency };
});

// Group by classification
const byClassification = domainsWithDelta.reduce((acc, d) => {
  if (!acc[d.classification]) acc[d.classification] = [];
  acc[d.classification].push(d);
  return acc;
}, {});

// ── 既有輸出（邏輯不變）──────────────────────────────────────────
const ownDomains = byClassification['OWN'] || [];

const competitorDomains = (byClassification['COMPETITOR'] || [])
  .sort((a, b) => b.citation_rate - a.citation_rate);

const contentGapTargets = [
  ...(byClassification['EDITORIAL'] || []),
  ...(byClassification['REFERENCE'] || []),
].sort((a, b) => b.citation_rate - a.citation_rate).slice(0, 10);

const ugcDomains = (byClassification['UGC'] || [])
  .sort((a, b) => b.citation_rate - a.citation_rate);

const highCitationDomains = domainsWithDelta
  .filter(d => d.citation_rate > 1.0)
  .sort((a, b) => b.citation_rate - a.citation_rate);

// ── 新增輸出：今昨 delta ─────────────────────────────────────────

// 所有 domain 的今昨變化，按 |delta| 降冪（變化最大的優先）
const domainEvolution = domainsWithDelta
  .filter(d => d.citation_rate_delta !== null)
  .sort((a, b) => Math.abs(b.citation_rate_delta) - Math.abs(a.citation_rate_delta))
  .map(d => ({
    domain:                    d.domain,
    classification:            d.classification,
    citation_rate_today:       d.citation_rate,
    citation_rate_yesterday:   yesterdayMap[d.domain]?.citation_rate ?? null,
    citation_rate_delta:       d.citation_rate_delta,
    domain_trend:              d.domain_trend,
  }));

// 投資建議清單：EDITORIAL / REFERENCE / UGC，依 urgency_score 降冪
const INVESTABLE_TYPES = ['EDITORIAL', 'REFERENCE', 'UGC'];

const domainInvestmentSuggestion = domainsWithDelta
  .filter(d => INVESTABLE_TYPES.includes(d.classification))
  .sort((a, b) => b.urgency_score - a.urgency_score)
  .map(d => ({
    domain:              d.domain,
    classification:      d.classification,
    citation_rate:       d.citation_rate,
    citation_rate_delta: d.citation_rate_delta,
    domain_trend:        d.domain_trend,
    urgency_score:       d.urgency_score,
    urgency:             d.urgency,
  }));

return [{
  json: {
    source:                       'get_domain_report',
    total_domains:                domainsWithDelta.length,
    own_domains:                  ownDomains,
    competitor_domains:           competitorDomains,
    content_gap_targets:          contentGapTargets,
    ugc_domains:                  ugcDomains,
    high_citation_domains:        highCitationDomains,
    by_classification:            byClassification,
    domain_evolution:             domainEvolution,
    domain_investment_suggestion: domainInvestmentSuggestion,
  }
}];
