# Armani 5D 每日戰情（非技術 + 策略運算）

> 英文版：[WORKFLOW_5D_NONTECH_EN.md](./WORKFLOW_5D_NONTECH_EN.md)

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
