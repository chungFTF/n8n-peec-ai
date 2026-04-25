const items = $input.all();

function parseActionsData(item) {
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
    action_group_type:          findIdx('action_group_type'),
    url_classification:         findIdx('url_classification'),
    domain:                     findIdx('domain'),
    opportunity_score:          findIdx('opportunity_score'),
    relative_opportunity_score: findIdx('relative_opportunity_score'),
    gap_percentage:             findIdx('gap_percentage'),
    coverage_percentage:        findIdx('coverage_percentage'),
    used_ratio:                 findIdx('used_ratio'),
    used_total:                 findIdx('used_total'),
  };

  return rows.map(row => ({
    action_group_type:          row[idx.action_group_type],
    url_classification:         row[idx.url_classification] ?? null,
    domain:                     row[idx.domain] ?? null,
    opportunity_score:          parseFloat(row[idx.opportunity_score]) || 0,
    relative_opportunity_score: parseInt(row[idx.relative_opportunity_score]) || 0,
    gap_percentage:             parseFloat(row[idx.gap_percentage]) || 0,
    coverage_percentage:        parseFloat(row[idx.coverage_percentage]) || 0,
    used_ratio:                 parseFloat(row[idx.used_ratio]) || 0,
    used_total:                 parseInt(row[idx.used_total]) || 0,
  }));
}

const overviewRows = items[0] ? parseActionsData(items[0]) : [];

// Filter relative_opportunity_score >= 2, sort by opportunity_score desc, top 5
const highOpportunity = overviewRows
  .filter(r => r.relative_opportunity_score >= 2)
  .sort((a, b) => b.opportunity_score - a.opportunity_score)
  .slice(0, 5);

// Map each high-opportunity row to drill-down call params
const drilldown_params = highOpportunity.map(r => {
  const type = r.action_group_type;
  const base = {
    opportunity_score:          r.opportunity_score,
    relative_opportunity_score: r.relative_opportunity_score,
    gap_percentage:             r.gap_percentage,
  };

  if (type === 'OWNED')     return { ...base, scope: 'owned',     url_classification: r.url_classification };
  if (type === 'EDITORIAL') return { ...base, scope: 'editorial', url_classification: r.url_classification };
  if (type === 'REFERENCE') return { ...base, scope: 'reference', domain: r.domain };
  if (type === 'UGC')       return { ...base, scope: 'ugc',       domain: r.domain };
  return base;
});

return [{
  json: {
    source:           'get_actions_overview',
    total_rows:       overviewRows.length,
    high_opportunity: highOpportunity,
    drilldown_params: drilldown_params,
    all_actions:      overviewRows.sort((a, b) => b.opportunity_score - a.opportunity_score),
  }
}];
