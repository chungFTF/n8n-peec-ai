const brandItems    = $('clean_brand_report').all();
const shoppingItems = $('clean_shopping_queries').all();
const searchItems   = $('clean_search_queries').all();
const domainItems   = $('clean_domain_reports').all();

return [{
  json: {
    brand_intel:      brandItems[0]?.json   || null,
    shopping_queries: shoppingItems[0]?.json || null,
    search_queries:   searchItems[0]?.json   || null,
    domain_report:    domainItems[0]?.json   || null,
  }
}];