# Armani 5D Daily Intelligence (Non-Technical + Strategy Logic, ZH/EN)

## 中文版（非技術，但含策略運算）

### 1) 這份系統在做什麼？

這是一套「每天自動產出競品戰情報告 + AI 文案」的流程。  
你可以把它想成：每天固定開一次戰情會，系統先讀市場數據、再做策略判斷、最後把可發布內容準備好。

---

### 2) 5D 策略框架（管理層版本）

- **D1 Detect（偵測）**：今天品牌在 AI 場景裡是強、弱，還是隱形？
- **D2 Defense（防禦）**：有沒有聲量/口碑惡化？哪些來源在拖累？
- **D3 Diagnose（診斷）**：哪個競品最值得攻擊？切入點是什麼？
- **D4 Dominate（主導）**：哪些平台是最該優先投資的領土？
- **D5 Direct & Drive（執行）**：把策略轉成文案任務，直接部署。

一句話：  
**5D = 看清局勢 -> 排優先順序 -> 快速執行。**

---

### 3) 你的核心運算（重點）

下面是這套系統真正用來做決策的計算，不是抽象描述。

#### 3.1 競品可攻擊性（Vulnerability Score）

用來回答：**這個競品值不值得打？**

`vulnerability_score = (100 - sentiment) / position`

解讀方式：

- sentiment 越低（口碑越差）-> 分數越高
- position 越前（曝光越高）-> 分數越高
- **高分 = 曝光高但口碑不穩 = 最佳攻擊目標**

業務意義：不是打最弱，而是打「大家看得到但有負評空隙」的品牌。

#### 3.2 品牌狀態分類（Stable / Blue Ocean / Vulnerable）

系統會把品牌分層：

- **Vulnerable**：高曝光但口碑差（可攻）
- **Blue Ocean**：曝光低、飽和低（可佔位）
- **Stable**：位置穩定（需正面硬碰或精準側攻）

業務意義：  
你會同時得到「要打誰」與「要去哪裡擴張」兩條路線。

#### 3.3 日對日趨勢（Evolution Delta）

用來回答：**今天比昨天是變好還是變差？**

- visibility_delta
- sentiment_delta
- position_delta
- trend（up / down / stable）

業務意義：  
不是只看靜態排名，而是看勢能（momentum）。

#### 3.4 平台領土緊急度（Domain Urgency）

用來回答：**哪個平台要先投資？**

`urgency_score = citation_rate * (1 + |citation_rate_delta|)`

解讀方式：

- citation_rate 高：AI 本來就常引用這個平台
- delta 大：這個平台正在快速變化（戰況變動）
- **高 urgency = 值得先投資**

同時系統會判斷 domain_trend：

- `widening`：差距擴大（更緊急）
- `closing`：差距縮小（正在追上）
- `stable`：變化小（持續佈局）

#### 3.5 任務優先級（High / Medium / Low）

最終行動優先級由多來源共同決定：

- Peec 機會分數（relative_opportunity_score）
- 品牌趨勢與防禦警訊
- 平台 urgency / citation 指標

業務意義：  
你的「High priority」不是主觀判斷，是多個指標綜合後的結果。

---

### 4) 三層 AI Agent 怎麼分工（非技術版）

#### Agent 1：Report Agent（戰略腦）

輸入：品牌、搜尋、平台、行動機會資料  
輸出：完整競品戰報（含 top threat、attack targets、dominate plan、action plan）

#### Agent 2：Strategy Agent（作戰規劃）

輸入：戰報 + URL 內容證據  
輸出：5 筆可執行策略矩陣（每筆有平台、心理策略、目標受眾、時間窗）

#### Agent 3：Content Generation Agent（內容生產）

輸入：策略矩陣  
輸出：每平台文案（headline / body / hooks / CTA）

---

### 5) 每天你會收到什麼？

- **5D Email 戰情報告**（管理用）
  - D1-D5 摘要
  - 優先任務排序
  - 每個任務的平台與目標

- **Google Docs 文案包**（執行用）
  - 每篇文案都附策略脈絡
  - 包含方向、受眾、內容、CTA
  - 可直接交給內容團隊編修與發布

---

### 6) 決策怎麼用（建議節奏）

#### 每日 10 分鐘（營運）

1. 看 D2（風險）與 D4（平台優先）
2. 先做 High priority 任務
3. 打開 Doc 做最後品牌語氣修正後上線

#### 每週 30 分鐘（主管）

1. 看 vulnerability 目標是否改變
2. 看 urgency 最高平台是否改變
3. 依 D4+D5 調整下週資源（預算/人力/檔期）

---

### 7) 這套系統的商業價值

- **更快**：分析到內容一次完成
- **更準**：有公式、有排序，不靠主觀
- **更穩**：每天用同一套 5D 決策標準
- **更能執行**：直接給文案，不只有洞察

---

### 8) 你需要知道的限制

- 這是 AI 搜尋/引用視角，不是完整市場份額
- 文案可直接用，但仍建議人工審稿
- 檔期活動、突發事件建議人工覆核

---

## English Version (Non-Technical, with Strategy Calculations)

### 1) What this system does

This workflow automatically produces a daily competitive intelligence brief and AI-generated copy.  
Think of it as a daily strategy loop: read the market, rank priorities, generate deployable content.

---

### 2) The 5D framework (business view)

- **D1 Detect**: Are we visible, weak, or invisible in AI responses?
- **D2 Defense**: Are we losing sentiment/visibility? Where is the erosion?
- **D3 Diagnose**: Which competitor is most attackable, and with what angle?
- **D4 Dominate**: Which channels should we invest in first?
- **D5 Direct & Drive**: Turn strategy into execution-ready copy assets.

In one line:  
**5D = Understand battlefield -> prioritize -> execute fast.**

---

### 3) Your core calculations (actual logic)

#### 3.1 Competitor attackability (Vulnerability Score)

Used to decide: **which competitor is worth attacking now**.

`vulnerability_score = (100 - sentiment) / position`

Meaning:

- Lower sentiment -> higher vulnerability
- Better rank (smaller position number) -> higher vulnerability
- **High score = highly visible but reputationally weak**

Business value: target visible competitors with weak trust signals.

#### 3.2 Brand state classification

Each brand is classified as:

- **Vulnerable** (attack opportunity)
- **Blue Ocean** (expansion opportunity)
- **Stable** (defensive/competitive baseline)

Business value: separates attack targets from expansion targets.

#### 3.3 Day-over-day momentum (Evolution Delta)

Used to track movement, not just static rank:

- visibility_delta
- sentiment_delta
- position_delta
- trend (up/down/stable)

Business value: catch momentum shifts early.

#### 3.4 Channel urgency scoring (Domain Urgency)

Used to rank channel investment priority:

`urgency_score = citation_rate * (1 + |citation_rate_delta|)`

Interpretation:

- High citation_rate = AI already trusts this source
- High delta magnitude = battlefield is moving quickly
- **High urgency = invest first**

Trend states:

- `widening`: gap is getting worse (urgent)
- `closing`: gap is shrinking (momentum)
- `stable`: maintain positioning

#### 3.5 Priority ranking (High/Medium/Low)

Priority is determined from combined signals:

- Peec opportunity scores
- defense risk signals
- domain urgency and citation strength

Business value: priority is data-backed, not subjective.

---

### 4) Three-agent operating model

#### Agent 1: Report Agent (strategy synthesis)

Input: market intelligence datasets  
Output: structured strategy report (threats, targets, action plan)

#### Agent 2: Strategy Agent (5D planner)

Input: report + URL evidence  
Output: 5 actionable strategy rows (platform, tactic, persona, timeframe)

#### Agent 3: Content Generation Agent (copy production)

Input: strategy matrix  
Output: publish-ready copy packages (headline/body/hooks/CTA)

---

### 5) Daily outputs

- **5D Email Brief** (management view)
  - D1-D5 summary
  - ranked priorities
  - channel + audience mapping

- **Google Docs Copy Pack** (execution view)
  - one document per task/channel
  - strategy context + generated copy + CTA

---

### 6) Recommended operating rhythm

#### Daily 10-minute rhythm

1. Review D2 risk and D4 channel priority
2. Execute high-priority tasks first
3. Apply final brand edits and publish

#### Weekly 30-minute rhythm

1. Recheck top vulnerability targets
2. Recheck highest urgency channels
3. Reallocate budget/resources based on D4 + D5

---

### 7) Business impact

- **Faster cycle**: strategy-to-content automation
- **Better signal quality**: formula-based prioritization
- **Consistent governance**: same 5D logic every day
- **Higher execution readiness**: not only insights, but deployable assets

---

### 8) Practical boundaries

- This is AI-visibility intelligence, not full market-share analytics
- Generated copy still requires final brand review
- Campaign spikes or anomalies should be manually validated
