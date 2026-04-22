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
    name:      findIdx('brand_name'),
    visibility: findIdx('visibility'),
    vis_count:  findIdx('visibility_count'),
    vis_total:  findIdx('visibility_total'),
    sov:        findIdx('share_of_voice'),
    sentiment:  findIdx('sentiment'),
    pos:        findIdx('position'),
    is_own:     findIdx('is_own'),
  };

  const brandAnalysis = rows.map(row => {
    const name     = row[idx.name];
    const isOwn    = idx.is_own !== -1 ? (row[idx.is_own] === true || row[idx.is_own] === 'true') : false;
    const vis      = parseFloat(row[idx.visibility]) || 0;
    const sent     = parseFloat(row[idx.sentiment]) || 0;
    const pos      = parseFloat(row[idx.pos]) || 0;
    const sov      = parseFloat(row[idx.sov]) || 0;
    const visCount = parseFloat(row[idx.vis_count]) || 0;
    const visTotal = parseFloat(row[idx.vis_total]) || 1;

    const vulnerabilityIndex = (pos > 0 && pos <= 5) ? ((100 - sent) / pos).toFixed(2) : 0;
    const saturation = ((visCount / visTotal) * 100).toFixed(1);

    let status = 'Stable';
    let tacticalAdvice = 'Maintain authority.';

    if (sent > 0 && sent < 65 && pos <= 5) {
      status = 'Vulnerable (Target for Attack)';
      tacticalAdvice = `HIGH PRIORITY: ${name} is visible but poorly rated.`;
    } else if (vis < 0.3 && parseFloat(saturation) < 20) {
      status = 'Blue Ocean';
      tacticalAdvice = `OPPORTUNITY: Low competition.`;
    }

    return {
      brand: name,
      is_own: isOwn,
      visibility: vis,
      sentiment: sent,
      position: pos,
      sov: sov,
      saturation: parseFloat(saturation),
      market_status: status,
      tactical_advice: tacticalAdvice,
      vulnerability_score: parseFloat(vulnerabilityIndex),
    };
  });

  const opportunities = brandAnalysis.filter(b => b.market_status !== 'Stable');

  results.push({
    json: {
      source: 'get_brand_report',
      detailed_analysis: brandAnalysis,
      opportunity_count: opportunities.length,
      timestamp: new Date().toISOString(),
    }
  });
}

return results;
