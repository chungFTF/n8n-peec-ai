// 接在 get_url_report MCP call 之後
// 解析欄位式 JSON，抽出 citation_rate 最高的前 N 筆 URL，逐筆輸出供 get_url_content 使用
const TOP_N = 5;

const raw = $input.first().json;

// get_url_report 回傳結構：content[0].text = { columns, rows }
const textBlock = raw?.content?.[0]?.text;
if (!textBlock) throw new Error('extract_top_urls: 找不到 content[0].text');

const { columns, rows } = typeof textBlock === 'string'
  ? JSON.parse(textBlock)
  : textBlock;

if (!columns || !rows) throw new Error('extract_top_urls: 欄位或資料列缺失');

const colIdx = Object.fromEntries(columns.map((c, i) => [c, i]));

const parsed = rows
  .map(r => ({
    url:            r[colIdx['url']],
    classification: r[colIdx['classification']],
    title:          r[colIdx['title']] || '',
    citation_rate:  r[colIdx['citation_rate']] ?? 0,
    citation_count: r[colIdx['citation_count']] ?? 0,
  }))
  .filter(r => r.url)
  .sort((a, b) => b.citation_rate - a.citation_rate)
  .slice(0, TOP_N);

return parsed.map(r => ({ json: r }));
