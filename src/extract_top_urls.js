// 接在 get_url_report MCP call 之後
// 優先取 EDITORIAL / UGC / REFERENCE，排除 COMPETITOR / CORPORATE
const TOP_N = 5;

const PREFERRED  = ['EDITORIAL', 'UGC', 'REFERENCE'];
const EXCLUDED   = ['COMPETITOR', 'CORPORATE'];

const raw = $input.first().json;

// get_url_report 回傳結構：content[0].text = { columns, rows }
const textBlock = raw?.content?.[0]?.text;
if (!textBlock) throw new Error('extract_top_urls: 找不到 content[0].text');

const { columns, rows } = typeof textBlock === 'string'
  ? JSON.parse(textBlock)
  : textBlock;

if (!columns || !rows) throw new Error('extract_top_urls: 欄位或資料列缺失');

const colIdx = Object.fromEntries(columns.map((c, i) => [c, i]));

const allParsed = rows
  .map(r => ({
    url:            r[colIdx['url']],
    classification: r[colIdx['classification']],
    title:          r[colIdx['title']] || '',
    citation_rate:  r[colIdx['citation_rate']] ?? 0,
    citation_count: r[colIdx['citation_count']] ?? 0,
  }))
  .filter(r => r.url)
  .sort((a, b) => b.citation_rate - a.citation_rate);

// 1st pass: preferred types only
const preferred = allParsed.filter(r => PREFERRED.includes(r.classification));

// 2nd pass: fill remaining slots from non-excluded types
const usedUrls = new Set(preferred.map(r => r.url));
const fallback = allParsed.filter(r =>
  !EXCLUDED.includes(r.classification) && !usedUrls.has(r.url)
);

const selected = [
  ...preferred.slice(0, TOP_N),
  ...fallback.slice(0, TOP_N - Math.min(preferred.length, TOP_N)),
].slice(0, TOP_N);

return selected.map(r => ({ json: r }));
