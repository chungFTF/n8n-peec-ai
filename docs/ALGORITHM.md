# 競品情報分析系統 — 技術文件

這份文件說明整個 n8n 自動化流程的運作邏輯，從抓資料、清洗、合併、到 AI 分析、輸出 email，每一步都寫清楚為什麼這樣做、資料長什麼樣子、以及要注意哪些陷阱。

---

## 整體流程

```
Peec AI MCP
  ├── get_brand_report      → clean_brand_report.js
  ├── list_shopping_queries → clean_shopping_queries.js
  ├── list_search_queries   → clean_search_queries.js
  └── get_domain_report     → clean_domain_report.js
                                      ↓
                               merge_intel.js
                                      ↓
                               Claude AI Agent
                                      ↓
                            json_to_markdown.js
                              ↙           ↘
                        clean JSON      Markdown
                       (Layer 3)      → html_email.js → Gmail
```

日期範圍：過去 7 天，用 `$now.minus(7, 'days').toFormat('yyyy-MM-dd')` 計算。

---

## 資料解析的共同問題

Peec AI MCP 回傳的資料，會被 n8n 包在這個結構裡：

```
item.json.content[0].text
  ├── columns  →  欄位名稱陣列，例如 ["brand_name", "visibility", ...]
  └── rows     →  每筆資料是一個陣列，欄位順序對應 columns
```

問題是，有時候資料路徑不一樣深——有些情況 `.text` 這層不存在，有些情況 `content` 直接就是資料本身。所以每個 clean node 都做三層 fallback：

```js
let content = rawData.content;
if (Array.isArray(content)) content = content[0];  // 取第一個
if (content && content.text) content = content.text; // 往下一層
if (!content || !content.columns) content = rawData; // 直接用根
```

拿到 `columns` 之後，用 `findIdx()` 動態查欄位位置，不寫死 index，因為 API 不保證欄位順序：

```js
const findIdx = (name) => columns.findIndex(c => c.toLowerCase() === name.toLowerCase());
```

---

## clean_brand_report.js

**來源 MCP：** `get_brand_report`

這個 node 做的事是把原始品牌數據轉成「每個品牌值不值得攻擊」的結論。

### 計算的兩個指標

**Vulnerability Score（脆弱性指數）**

```
vulnerability = (100 - sentiment) / position
```

這個公式的邏輯：sentiment 越低代表口碑越差，position 越大（排名越靠後）代表越容易被追上。兩者相乘就是「這個品牌現在有多脆弱」。

有一個重要限制：只對 `position 1–5` 的品牌計算，超過 5 或 position 為 0 的品牌直接給 0。原因是排名太後面的品牌根本沒有威脅性，攻擊它沒有意義。

```js
const vulnerabilityIndex = (pos > 0 && pos <= 5) ? ((100 - sent) / pos).toFixed(2) : 0;
```

Blue Ocean 品牌的 position 通常是 0，所以它們的 vulnerability score 永遠是 0——這是故意的，因為 Blue Ocean 是「機會」而不是「攻擊目標」，不該混在一起。

**Saturation（市場飽和度）**

```
saturation = (visibility_count / visibility_total) × 100
```

`visibility_count` 是這個品牌出現在幾個 prompt 的回覆裡，`visibility_total` 是我們總共追蹤幾個 prompt。飽和度低代表這個市場還沒有人佔領，有空間切入。

### 市場狀態分類

每個品牌預設 `Stable`，然後看條件是否要覆蓋：

```js
if (sentiment < 65 && position <= 5) {
  status = 'Vulnerable (Target for Attack)';
}
else if (visibility < 0.3 && saturation < 20) {
  status = 'Blue Ocean';
}
```

| 狀態 | 條件 | 意思 |
|------|------|------|
| Vulnerable | sentiment < 65 且 position ≤ 5 | 排名前段但口碑差，現在攻最划算 |
| Blue Ocean | visibility < 0.3 且 saturation < 20% | 低競爭、沒人在佔的空白市場 |
| Stable | 其他 | 市場地位穩固，短期攻擊效益低 |

### is_own 欄位

自家品牌（`is_own: true`）從 API 欄位讀取。如果欄位不存在，預設 false。

```js
const isOwn = idx.is_own !== -1 ? (row[idx.is_own] === true || row[idx.is_own] === 'true') : false;
```

這個欄位很重要——AI Agent 需要知道哪個品牌是「我方」，才不會把自家品牌放進攻擊目標。

### 輸出

```json
{
  "source": "get_brand_report",
  "detailed_analysis": [
    {
      "brand": "lululemon",
      "is_own": true,
      "visibility": 0.64,
      "sentiment": 71,
      "position": 1,
      "sov": 0.18,
      "saturation": 9.0,
      "market_status": "Stable",
      "tactical_advice": "Maintain authority.",
      "vulnerability_score": 29.0
    }
  ],
  "opportunity_count": 3,
  "timestamp": "2026-04-22T11:33:42.437Z"
}
```

`opportunity_count` 是 market_status 不是 "Stable" 的品牌數量，也就是 Blue Ocean + Vulnerable 的總和。

---

## clean_shopping_queries.js

**來源 MCP：** `list_shopping_queries`

這個 MCP 追蹤的是人們實際在問 AI 的購物相關問題，例如「哪裡可以買到適合瘦身型體型的瑜伽褲」。我們的工作是把這些問題分類、排序，讓 AI Agent 知道哪些戰場最值得投入。

### Volume 數值化

API 回傳的 volume 是字串（`low` / `medium` / `high`），沒辦法直接排序，所以轉成數字：

```js
const volumeScore = { low: 1, medium: 2, high: 3 };
```

### Intent 分類

用 regex 掃問句文字，判斷這個人現在在購買旅程的哪個階段：

| intent_type | 觸發關鍵字 | 代表什麼 |
|---|---|---|
| `purchase_intent` | buy / shop / store / where can i / best place | 準備下單，最高價值 |
| `discovery_intent` | best / top / find / identify / show me | 在探索選項 |
| `recommendation_intent` | suggest / recommend | 想要別人幫他選 |
| `research_intent` | compare / analyze / evaluate / market positioning | 做功課，還沒決定 |
| `general` | 其他 | 無法判斷 |

### 排序邏輯

先按 volume 高到低，volume 相同的話再按 intent 優先度排：

```
purchase_intent(3) > discovery_intent(2) > recommendation_intent(1) > research_intent(0)
```

排在最前面的問句，是「流量大 + 最接近下單」的組合，是最值得優先佈局的戰場。

### 輸出

```json
{
  "source": "list_shopping_queries",
  "total": 50,
  "intent_summary": {
    "purchase_intent": 7,
    "discovery_intent": 16,
    "recommendation_intent": 9,
    "research_intent": 15,
    "general": 3
  },
  "queries": [
    {
      "id": "pr_148e8b7b...",
      "text": "Find me breathable running gear under $150.",
      "volume": "medium",
      "volume_score": 2,
      "intent_type": "discovery_intent"
    }
  ]
}
```

---

## clean_search_queries.js

**來源 MCP：** `list_search_queries`

這個資料來源跟前面不一樣——它不是人在問的問題，而是 **AI 自己在回答時發出的搜尋詞**。當有人問 ChatGPT「推薦我幾個運動服品牌」，ChatGPT 會在背後發幾個搜尋查詢，這些搜尋詞就是這裡的資料。

換句話說：這份資料告訴你「AI 把哪些品牌當成市場的代表」。

### 資料結構特性

有三個地方需要注意：

1. 同一個 `prompt_id` 會有多筆資料——因為 ChatGPT、Perplexity 各自跑一遍，各自產生搜尋詞
2. 同一個 `chat_id` 有多個 `query_index`——一次對話裡 AI 可能發 3–5 個搜尋
3. `query_text` 跟原始 prompt 措辭不同——AI 自己重新組合的關鍵字

### 品牌萃取

從每筆 query_text 掃描已知品牌名稱：

```js
const KNOWN_BRANDS = ['lululemon', 'nike', 'adidas', 'alo', 'gymshark', ...];
const extractBrands = (text) => KNOWN_BRANDS.filter(b => text.toLowerCase().includes(b));
```

統計每個品牌出現幾次，產生 `brand_mention_ranking`——出現越多次，代表 AI 越把這個品牌跟這個市場連結在一起。

### 輸出

```json
{
  "source": "list_search_queries",
  "total_queries": 100,
  "unique_query_texts": 67,
  "model_distribution": {
    "chatgpt-scraper": 42,
    "perplexity-scraper": 58
  },
  "brand_mention_ranking": [
    { "brand": "nike", "count": 11 },
    { "brand": "lululemon", "count": 8 }
  ],
  "unique_keywords": ["yoga pants", "running gear", "activewear"],
  "by_prompt": {
    "pr_xxx": ["lululemon yoga pants review", "best yoga wear 2024"]
  }
}
```

`by_prompt` 讓你比較不同 AI model 面對同一個問題時，各自會搜什麼——有時候 ChatGPT 和 Perplexity 的關鍵字策略差很多。

---

## clean_domain_report.js

**來源 MCP：** `get_domain_report`

這份資料記錄的是：當 AI 在回覆問題時，它引用了哪些網站？引用頻率多高？

用來回答一個問題：**我的品牌在 AI 的資料來源裡有沒有出現？哪些網站是競品被引用但我缺席的？**

### 三個數值欄位的差異

這三個很容易搞混：

| 欄位 | 意思 | 注意 |
|---|---|---|
| `retrieved_percentage` | 在幾 % 的 prompt 裡，這個域名有被 AI 抓取 | 0–1 的比例，顯示時 ×100 |
| `retrieval_rate` | 平均每次 prompt，這個域名被抓幾次 | 直接顯示，不乘 100 |
| `citation_rate` | 平均每次被抓取，有幾個地方被引用進回覆 | 可以超過 1.0，直接顯示 |

`citation_rate > 1.0` 的意思是：AI 每次找到這個網站，平均會把裡面超過一個段落引用進回覆。代表這個網站的權威性極高。

### Classification 分類

| 類型 | 說明 |
|---|---|
| OWN | 自家域名 |
| COMPETITOR | 競品域名 |
| EDITORIAL | 媒體、雜誌（vogue.com、runnersworld.com 等） |
| UGC | 用戶生成內容（reddit、youtube、instagram） |
| REFERENCE | 參考資料、百科（wikipedia.org 等） |
| CORPORATE | 品牌官網 |
| INSTITUTIONAL | 機構網站（nih.gov、nasm.org 等） |
| OTHER | 其他 |

### 分組邏輯

**content_gap_targets**：把 EDITORIAL 和 REFERENCE 合在一起，按 citation_rate 降冪取前 10。這些是「AI 最常引用、但我們還沒有在上面的媒體」，是內容行銷的優先目標。

```js
const contentGapTargets = [...editorial, ...reference]
  .sort((a, b) => b.citation_rate - a.citation_rate)
  .slice(0, 10);
```

**high_citation_domains**：citation_rate 超過 1.0 的域名，不論 classification。AI 把這些當最可信的來源。

### 輸出

```json
{
  "source": "get_domain_report",
  "total_domains": 120,
  "own_domains": [...],
  "competitor_domains": [...],
  "content_gap_targets": [...],
  "ugc_domains": [...],
  "high_citation_domains": [...],
  "by_classification": { "EDITORIAL": [...], "UGC": [...] }
}
```

---

## merge_intel.js

四個 clean node 跑完之後，各自有一筆 output。這個 node 把它們合成一個 JSON 傳給 AI Agent。

不需要 n8n 的 Merge Node——直接用 `$('節點名稱').all()` 從指定節點拉資料：

```js
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
```

**注意：** 這個 Code Node 要設成 `Run Once for All Items`，`$('節點名稱')` 裡的名稱要跟 n8n 裡實際節點名稱完全一致（大小寫和空格都要對）。

---

## AI Agent（prompt.txt）

收到合併後的 JSON，輸出一份競品分析報告。Prompt 裡有幾條硬規則：

**attack_targets 的選法**
只選 `market_status = "Stable"` 且 `vulnerability_score` 最高的競品。Blue Ocean 品牌不能放進去——它們代表的是機會，不是攻擊目標。vulnerability_score 為 0 的品牌（含所有 Blue Ocean）不應該出現在 attack_targets。

**is_own 的處理**
`is_own: true` 的品牌是自家品牌。不能出現在 `top_threat`、`attack_targets`、`copy_brief.attack_copy`。所有分析的視角是「以自家品牌為主體，看外面的競爭環境」。

**search_queries 的用法**
`brand_mention_ranking` 告訴你 AI 引擎心中的市場品牌排序。`unique_keywords` 是 AI 主動搜尋的詞彙，可以直接拿來做內容主題。

**輸出格式**
純 JSON，不得有 markdown、code block 或任何多餘文字。`json_to_markdown.js` 會自動處理意外帶入的 ` ```json ` wrapper，但最好不要出現。

---

## json_to_markdown.js

AI Agent 的輸出是 JSON，這個 node 把它轉成兩種格式：

```js
return [
  { json: { ...data } },         // item[0]：clean JSON，給後續 Layer 3 用
  { json: { markdown } },        // item[1]：Markdown 字串，給 html_email.js 用
];
```

---

## html_email.js

接收 `markdown` 字串，轉成 HTML email。幾個設計決策：

- 每個 `##` section 是一張白色卡片，有輕微陰影
- `### [HIGH] / [MEDIUM] / [LOW]` 自動轉成顏色 badge（紅 / 橙 / 綠）
- Header 是深色漸層 banner，顯示報告標題和日期
- 所有內容區塊明確設 `text-align:left`，避免 Gmail 繼承到外層的置中設定

接收輸入的方式：

```js
const item = $input.all().find(i => i.json.markdown);
```

用 `.find()` 而不是 `.first()`，因為 `json_to_markdown.js` 回傳兩個 item，markdown 在 item[1]，直接用 `.first()` 會拿到 item[0]（沒有 markdown 欄位）。
