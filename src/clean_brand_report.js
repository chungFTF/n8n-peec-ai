const items = $input.all();
const results = [];

// Sentiment range → tier
function sentimentTier(sent) {
  if (sent <= 44) return { label: 'bad',    weight: 3 };
  if (sent <= 65) return { label: 'normal', weight: 2 };
  return                  { label: 'good',  weight: 1 };
}

function extractContent(rawData) {
  let content = rawData.content;
  if (Array.isArray(content)) content = content[0];
  if (content && content.text) content = content.text;
  if (!content || !content.columns) content = rawData;
  if (!content || !content.columns) return null;
  return content;
}

function buildIdx(columns) {
  const findIdx = (name) => columns.findIndex(c => c.toLowerCase() === name.toLowerCase());
  return {
    name:      findIdx('brand_name'),
    visibility: findIdx('visibility'),
    vis_count:  findIdx('visibility_count'),
    vis_total:  findIdx('visibility_total'),
    sov:        findIdx('share_of_voice'),
    sentiment:  findIdx('sentiment'),
    pos:        findIdx('position'),
    is_own:     findIdx('is_own'),
  };
}

function parseBrandRow(row, idx) {
  const name     = row[idx.name];
  const isOwn    = idx.is_own !== -1 ? (row[idx.is_own] === true || row[idx.is_own] === 'true') : false;
  const vis      = parseFloat(row[idx.visibility]) || 0;
  const sent     = parseFloat(row[idx.sentiment])  || 0;
  const pos      = parseFloat(row[idx.pos])        || 0;
  const sov      = parseFloat(row[idx.sov])        || 0;
  const visCount = parseFloat(row[idx.vis_count])  || 0;
  const visTotal = parseFloat(row[idx.vis_total])  || 1;

  const tier               = sentimentTier(sent);
  const vulnerabilityScore = pos > 0 && pos <= 5
    ? parseFloat(((100 - sent) / pos).toFixed(2))
    : 0;
  const saturation         = parseFloat(((visCount / visTotal) * 100).toFixed(1));

  let status = 'Stable';
  let tacticalAdvice = 'Maintain authority.';
  if (tier.label === 'bad' && pos > 0 && pos <= 5) {
    status = 'Vulnerable (Target for Attack)';
    tacticalAdvice = `HIGH PRIORITY: ${name} is visible but has poor sentiment (${sent}).`;
  } else if (vis < 0.3 && saturation < 20) {
    status = 'Blue Ocean';
    tacticalAdvice = `OPPORTUNITY: Low visibility and low saturation — untapped market.`;
  }

  return { name, isOwn, vis, sent, sov, pos, visCount, visTotal, tier, vulnerabilityScore, saturation, status, tacticalAdvice };
}

// ── items[0] = yesterday (prev), items[1] = today (curr) ─────
const prevContent = items[1] ? extractContent(items[0]?.json) : null;
const currContent = extractContent(items[items.length - 1]?.json);

if (!currContent) return results;

const currIdx = buildIdx(currContent.columns);
const currBrands = (currContent.rows || []).map(row => parseBrandRow(row, currIdx));

// Index previous day by brand name (if available)
const prevByBrand = {};
if (prevContent) {
  const prevIdx = buildIdx(prevContent.columns);
  for (const row of (prevContent.rows || [])) {
    const b = parseBrandRow(row, prevIdx);
    prevByBrand[b.name] = b;
  }
}

const hasPrev = Object.keys(prevByBrand).length > 0;

const brandAnalysis = currBrands.map(b => {
  const prev = prevByBrand[b.name];

  const evolution = prev ? {
    visibility_delta: parseFloat((b.vis  - prev.vis).toFixed(3)),
    sentiment_delta:  parseFloat((b.sent - prev.sent).toFixed(1)),
    position_delta:   parseFloat((b.pos  - prev.pos).toFixed(1)),
    trend: b.vis > prev.vis ? 'up' : b.vis < prev.vis ? 'down' : 'stable',
  } : null;

  return {
    brand:               b.name,
    is_own:              b.isOwn,
    visibility:          b.vis,
    sentiment:           b.sent,
    sentiment_tier:      b.tier.label,
    position:            b.pos,
    sov:                 b.sov,
    saturation:          b.saturation,
    market_status:       b.status,
    tactical_advice:     b.tacticalAdvice,
    vulnerability_score: b.vulnerabilityScore,
    evolution,
  };
});

const opportunities = brandAnalysis.filter(b => b.market_status !== 'Stable');

results.push({
  json: {
    source:            'get_brand_report',
    detailed_analysis: brandAnalysis,
    opportunity_count: opportunities.length,
    has_evolution:     hasPrev,
    timestamp:         new Date().toISOString(),
  }
});

return results;
