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
    id:         findIdx('brand_id'),
    name:       findIdx('brand_name'),
    visibility: findIdx('visibility'),
    vis_count:  findIdx('visibility_count'),
    vis_total:  findIdx('visibility_total'),
    sov:        findIdx('share_of_voice'),
    sentiment:  findIdx('sentiment'),
    pos:        findIdx('position'),
  };
}

function parseBrandRow(row, idx) {
  const name     = row[idx.name];
  const brandId  = idx.id !== -1 ? row[idx.id] : null;
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

  return { brandId, name, vis, sent, sov, pos, visCount, visTotal, tier, vulnerabilityScore, saturation, status, tacticalAdvice };
}

// ── items[0] = yesterday (prev), items[1] = today (curr), items[2] = list_brands (optional) ─────
// Detect list_brands item: it has 'is_own' in its columns
function isListBrandsItem(item) {
  const c = extractContent(item?.json);
  return c && Array.isArray(c.columns) && c.columns.some(col => col.toLowerCase() === 'is_own');
}

const listBrandsItem = items.find(item => isListBrandsItem(item));
const reportItems    = items.filter(item => !isListBrandsItem(item));

// Build brand_id → is_own map from list_brands
const isOwnById = {};
if (listBrandsItem) {
  const lb = extractContent(listBrandsItem.json);
  const idIdx  = lb.columns.findIndex(c => c.toLowerCase() === 'id');
  const ownIdx = lb.columns.findIndex(c => c.toLowerCase() === 'is_own');
  for (const row of (lb.rows || [])) {
    isOwnById[row[idIdx]] = row[ownIdx] === true || row[ownIdx] === 1;
  }
}

const prevContent = reportItems[1] ? extractContent(reportItems[0]?.json) : null;
const currContent = extractContent(reportItems[reportItems.length - 1]?.json);

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

  // Only compute delta when previous day has actual data (not all-zero placeholder)
  const prevHasData = prev && (prev.vis > 0 || prev.sent > 0 || prev.pos > 0);
  const evolution = prevHasData ? {
    visibility_delta: parseFloat((b.vis  - prev.vis).toFixed(3)),
    sentiment_delta:  parseFloat((b.sent - prev.sent).toFixed(1)),
    position_delta:   parseFloat((b.pos  - prev.pos).toFixed(1)),
    trend: b.vis > prev.vis ? 'up' : b.vis < prev.vis ? 'down' : 'stable',
  } : null;

  const isOwn = isOwnById[b.brandId] !== undefined ? isOwnById[b.brandId] : false;

  return {
    brand:               b.name,
    is_own:              isOwn,
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
