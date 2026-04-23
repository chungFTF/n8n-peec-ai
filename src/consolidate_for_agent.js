// 放在 Merge 和 AI Agent 之間
// 把所有 items 壓縮成 1 個，讓 AI Agent 只跑一次
const allData = $input.all().map(i => i.json);

const strategy   = allData.find(d => d.copy_brief)    || {};
const urlMetas   = allData.filter(d => d.url && !d.content);
const urlContents = allData
  .filter(d => Array.isArray(d.content))
  .map(d => {
    const text = d.content?.[0]?.text || {};
    return {
      url:              text.url,
      title:            text.title,
      domain:           text.domain,
      classification:   text.classification,
      content:          text.content,
    };
  });

return [{
  json: {
    strategy,
    url_metas:    urlMetas,
    url_contents: urlContents,
  }
}];
