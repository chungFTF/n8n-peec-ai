# Armani 5D Daily Intelligence (Non-Technical + Strategy Logic)

> Chinese version (中文): [WORKFLOW_5D_NONTECH_CN.md](./WORKFLOW_5D_NONTECH_CN.md)

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
