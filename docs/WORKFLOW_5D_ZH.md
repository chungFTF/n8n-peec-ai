# Armani-n8n-en 工作流技術指南

> 英文版：[WORKFLOW_5D_EN.md](./WORKFLOW_5D_EN.md)

### 1) 專案定位與 5D 核心

本 workflow（`Armani-n8n-en`）的目標是把 Peec MCP 的市場資料轉為可執行的內容策略，並透過三層 AI Agent 生成：

1. 策略報告（Report Agent）
2. 5D 策略矩陣（Strategy Agent）
3. 多平台文案（Content Generation Agent）

並將輸出同步到 Google Docs 與 Email。

5D 策略在本專案中的定義：

- **D1 Detect**：監測自有品牌在 AI 搜尋場景的存在感、情緒與排名。
- **D2 Defense**：偵測聲量下滑與負面來源（特別是 UGC）並設置警報。
- **D3 Diagnose**：鎖定可攻擊競品（高能見度、低口碑）與弱點切角。
- **D4 Dominate**：依 domain gap / trend / urgency 排序平台投資優先級。
- **D5 Direct & Drive**：把策略轉為可部署文案，輸出 docs + email。

---

### 2) Workflow 實況（以 `Armani-n8n-en.json` 為準）

關鍵 metadata：

- Workflow name: `Armani-n8n-en`
- Node count: `38`
- Connection keys: `37`
- Active: `false`

主要節點分層：

- **Trigger & Time**
  - `When clicking ‘Execute workflow'`
  - `time range`
- **Data MCP**
  - `get_brand_report_today`
  - `get_brand_report_yesterday`
  - `list_shopping_queries1`（目前實際 tool: `list_prompts`）
  - `list_search_queries`
  - `get_domain_report`
  - `get_url_content`（實際 tool: `get_url_report`）
  - `get_url_content1`（逐 URL 抓全文）
- **Data Cleaning / Merge**
  - `clean_brand_report`
  - `clean_shopping_queries`
  - `clean_search_queries`
  - `clean_domain_reports`
  - `Merge`, `Merge1`, `Merge2`, `Merge3`, `Merge4`, `Merge5`
  - `merge_data`
  - `extract_agent_sections`
  - `consolidate_for_agent`
- **AI Agents**
  - `Report Agent`
  - `Strategy Agent`
  - `Content Generation Agent`
- **Copy / Docs / Email**
  - `Code in JavaScript1`（抽 top URLs）
  - `Code in JavaScript3`（抽 copy_instruction_matrix）
  - `Code in JavaScript4`（拆文案輸出）
  - `Create a document`
  - `id_content_combine`
  - `Update a document`
  - `Code in JavaScript5`
  - `json to markdown`
  - `json to html email`
  - `Send an Email`

---

### 3) 端到端演算法與資料流

#### Step A. 日期與資料擷取

- `time range` 產出 `today` / `yesterday`。
- `get_brand_report_today` + `get_brand_report_yesterday` 提供品牌日對日比較。
- 搜尋/購買/domain/url report 同步擷取，形成多視角市場快照。

#### Step B. 清洗與特徵工程

- `clean_brand_report`：
  - 計算 `sentiment_tier`
  - 計算 `vulnerability_score = (100 - sentiment) / position`（position 1-5 才有效）
  - 計算 `saturation`
  - 計算日增量 `evolution.*_delta`
  - 用 `brand_id` 對應 `is_own`
- `clean_domain_report`：
  - 計算 `citation_rate_delta` / `retrieval_rate_delta`
  - 判斷 `domain_trend`：`widening/closing/stable`
  - 計算 `urgency_score = citation_rate * (1 + |citation_rate_delta|)`
  - 產生 `domain_evolution` + `domain_investment_suggestion`
- `clean_shopping_queries`：
  - volume + intent 分類（purchase/discovery/research/recommendation）
- `clean_search_queries`：
  - 品牌提及統計、關鍵詞池、model distribution

#### Step C. Report Agent（戰略報告）

- `merge_data` 組成 `brand_intel + shopping + search + domain`。
- `Report Agent` 輸出結構化 JSON（包含 `defense_alert`, `competitive_summary`, `dominate_plan`, `copy_brief`, `action_plan` 等）。

#### Step D. Strategy Agent（5D 策略矩陣）

- `extract_agent_sections` 提取 report 關鍵欄位。
- `Code in JavaScript1` + `get_url_content1` 提供來源內容語料。
- `consolidate_for_agent` 合併 `strategy + url_metas + url_contents`。
- `Strategy Agent` 產生 `copy_instruction_matrix`（5筆，含心理策略、GEO note、persona、timeframe）。

#### Step E. Content Generation Agent（文案生成）

- `Code in JavaScript3` 提取 matrix。
- `Content Generation Agent` 依 matrix 逐平台產生 `headline/subheadline/body/hooks/cta`。
- `Code in JavaScript4` 轉為 docs-ready 結構。

#### Step F. Google Docs + Email 封裝

- `Create a document` 建立 docs。
- `id_content_combine`（對應 `combine_docs_with_content.js`）把 documentId 與文案合併，並插入策略欄位（如 audience / reason / reference_insight）。
- `Update a document` 回寫完整內容。
- `Code in JavaScript5`（對應 `combine_strategy_with_docs.js`）合併策略與 doc ID。
- `json to markdown` 產生 5D 報告 markdown。
- `json to html email` 渲染 rich HTML（D1~D5 模組 + card）。
- `Send an Email` 發送最終報告。

---

### 4) 三個 AI Agent Prompt（完整規格摘要）

> Workflow 內 `Report Agent / Strategy Agent / Content Generation Agent` 都使用 `promptType: define`，文字長度約：8503 / 3901 / 2535。

#### 4.1 Report Agent（`lang/en/src/prompt_en.txt`）

角色：競品情報策略師（brand visibility / GEO / AI search dominance）。

輸入重點：

- `brand_intel`
- `shopping_queries`
- `search_queries`
- `domain_report`
- `peec_actions`

硬規則重點：

- `top_threat` 只能從 `is_own=false` 且 `market_status=Stable` 選。
- `attack_targets` 選 vulnerability 高者，Blue Ocean 不可列入。
- `defense_alert` 依 sentiment_delta / trend 算 severity。
- `dominate_plan` 由 domain_investment_suggestion 選前 5（EDITORIAL/REFERENCE/UGC）。
- `action_plan` 需整合 `peec / ai / peec+ai` source。
- 輸出必須是 JSON，禁止幻覺數據。

#### 4.2 Strategy Agent（`lang/en/src/prompt_strategy_agent.txt`）

角色：5D 策略矩陣設計師 + GEO 專家。

輸入重點：

- `strategy.*`（含 defense/competitive/dominate/copy_brief）
- `url_metas`
- `url_contents`

硬規則重點：

- 必須輸出 5 筆 `copy_instruction_matrix`（高到低）。
- 每筆都要標註 `strategy_phase`、`psychological_tactic`、`geo_note`。
- 4 個 copy direction（ATTACK/AWARENESS/CONSIDERATION/PURCHASE）至少各出現 1 次。
- 必須引用真實 `url_contents` 做 `reference_insight`（含 URL）。
- persona + ELM 規則嚴格綁定 copy direction。

#### 4.3 Content Generation Agent（`lang/en/src/prompt_generate_content_agent.txt`）

角色：高端美妝文案寫手。

輸入重點：

- `copy_instruction_matrix[]`

硬規則重點：

- 根據 `platform_type + persona_platform_behavior` 控制字數與體裁。
- 根據 `elm_path` 控制語氣（理性 central / 感性 peripheral）。
- 必須輸出 `headline/subheadline/body/hooks/cta`。
- ATTACK 禁止用純分數比較當主論點，必須是消費者可感知痛點。

---

### 5) JS 處理層（每支腳本做什麼）

#### 5.1 Data cleaning / feature engineering

- `src/clean_brand_report.js`
  - 解析 brand report、對齊 own brand、計算 vulnerability / saturation / evolution。
- `src/clean_shopping_queries.js`
  - 購買問句 intent 分類與排序。
- `src/clean_search_queries.js`
  - query keyword pool、brand mention ranking、model distribution。
- `src/clean_domain_report.js`
  - domain delta、trend、urgency 與投資建議列表。
- `src/clean_get_actions.js`
  - Peec actions 清洗、high_opportunity 與 drilldown 參數。

#### 5.2 Agent I/O shaping

- `src/merge_intel.js`（對應 workflow `merge_data`）
  - 合併 clean_* 節點為單一 agent 輸入。
- `src/extract_agent_sections.js`
  - 從 report agent 輸出抽取 strategy agent 所需欄位。
- `src/consolidate_for_agent.js`
  - 合併 strategy + url_metas + url_contents。
- `src/extract_top_urls.js`（對應 `Code in JavaScript1`）
  - 從 url report 挑 top N URL（偏好 EDITORIAL/UGC/REFERENCE，排除 COMPETITOR/CORPORATE）。
- `src/extract_copy_matrix.js`（對應 `Code in JavaScript3`）
  - 取出 `copy_instruction_matrix` 給 content agent。
- `src/prepare_copy_agent_input.js`
  - 舊路徑腳本（目前主要流程未直接串用），可視為備援組裝。

#### 5.3 Docs / content assembly

- `src/split_copy_outputs.js`（對應 `Code in JavaScript4`）
  - 將 content agent JSON 拆成每篇 doc 內容。
  - 支援 `platform` 與 `copy_direction+priority` fallback 對位補 metadata（`reference_insight/reason/timeframe`）。
- `src/combine_docs_with_content.js`（對應 workflow `id_content_combine`）
  - 合併 Google doc id + copy content + strategy metadata。
  - 會把策略欄位注入 `content`（如 `Platform Type / Strategy Phase / Psychological Tactic / Reason`）。
- `src/combine_strategy_with_docs.js`（對應 workflow `Code in JavaScript5`）
  - 合併 strategy matrix 與 doc IDs，供報告與 email 使用。

#### 5.4 Reporting renderers

- `lang/en/json_to_markdown_en.js`
  - 生出 D1~D5 markdown 框架與 placeholders。
- `lang/en/html_email_en.js`
  - 將 markdown + dataset 渲染成 5D 視覺化 email：
    - Detect scorecard
    - Defense alerts
    - Diagnose charts
    - Dominate action cards
    - Direct & Drive content cards

---

### 6) Workflow 內嵌程式 vs `src/` 檔案對照

建議以 `src/` 作為單一真實來源（SSOT），部署 n8n 時同步貼入對應 Code Node：

- `merge_data` ↔ `src/merge_intel.js`
- `Code in JavaScript1` ↔ `src/extract_top_urls.js`
- `Code in JavaScript3` ↔ `src/extract_copy_matrix.js`
- `Code in JavaScript4` ↔ `src/split_copy_outputs.js`
- `id_content_combine` ↔ `src/combine_docs_with_content.js`
- `Code in JavaScript5` ↔ `src/combine_strategy_with_docs.js`
- `json to markdown` ↔ `lang/en/json_to_markdown_en.js`
- `json to html email` ↔ `lang/en/html_email_en.js`

---

### 7) 關鍵注意事項（維運）

- `list_shopping_queries1` 節點目前 tool 為 `list_prompts`；若要嚴格對齊名稱，需改為 `list_shopping_queries`。
- 請固定檢查 workflow 內嵌 code 與 repo `src/` 是否漂移。
- 當平台名稱不一致時，`split_copy_outputs.js` 已有 fallback 對位，但最佳實務仍是上游 platform key 一致。
- Email UI 已採簡化版本，D5 卡片平台名放大、左色條已移除。
