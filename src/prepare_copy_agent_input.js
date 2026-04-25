// 接在 extract_agent_sections.js 之後
// 整合策略資料 + 高表現域名清單，供 copy agent 使用 MCP 自行查詢 URL content
const items = $input.all();

const strategyItem = items.find(i => i.json.copy_brief) || items[0];
const strategy = strategyItem.json;

const domainItem = items.find(i => i.json.source === 'get_domain_report');
const topDomains = domainItem?.json?.domain_investment_suggestion || [];

// 取 gap_score 前 5 的域名供 agent 查詢
const topDomainsForAgent = topDomains
  .sort((a, b) => b.gap_score - a.gap_score)
  .slice(0, 5)
  .map(d => ({
    domain:         d.domain,
    classification: d.classification,
    gap_score:      d.gap_score,
    citation_rate:  d.citation_rate,
  }));

// project_id 與 date_range 讓 agent 直接呼叫 MCP
const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

return [{
  json: {
    project_id:           $vars.PEEC_PROJECT_ID || '',  // 從 n8n 變數取得
    date_range: {
      start_date: thirtyDaysAgo,
      end_date:   today,
    },
    report_date:          strategy.report_date,
    market_opportunities: strategy.market_opportunities,
    content_strategy:     strategy.content_strategy,
    copy_brief:           strategy.copy_brief,
    action_plan:          strategy.action_plan,
    top_domains:          topDomainsForAgent,
  }
}];
