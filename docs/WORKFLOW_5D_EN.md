# Armani-n8n-en Workflow Technical Guide

> Chinese version (中文): [WORKFLOW_5D_CN.md](./WORKFLOW_5D_CN.md)

### 1) Project Scope and 5D Core

This workflow (`Armani-n8n-en`) converts Peec MCP intelligence into deployable content operations through three AI layers:

1. Strategic report generation (Report Agent)
2. 5D strategy matrix generation (Strategy Agent)
3. Multi-platform copy generation (Content Generation Agent)

Outputs are published to Google Docs and summarized in a structured 5D email report.

5D in this implementation:

- **D1 Detect**: Monitor own-brand AI visibility, sentiment, and rank.
- **D2 Defense**: Detect decline and threat sources (especially UGC erosion).
- **D3 Diagnose**: Identify attackable competitors and exploitable weaknesses.
- **D4 Dominate**: Prioritize channel investment using gap/trend/urgency.
- **D5 Direct & Drive**: Turn strategy into deploy-ready copy and distribution artifacts.

---

### 2) Workflow Snapshot (`Armani-n8n-en.json`)

Core metadata:

- Workflow name: `Armani-n8n-en`
- Nodes: `38`
- Connection keys: `37`
- Active: `false`

Node groups:

- **Trigger/Time**: manual trigger, date resolver
- **MCP ingestion**: brand/search/shopping/domain/url reports
- **Cleaning layer**: clean brand/search/shopping/domain + merge
- **AI layer**: Report Agent, Strategy Agent, Content Generation Agent
- **Publishing layer**: Google Docs create/update + markdown/html email render + send

---

### 3) End-to-End Algorithm

#### A. Date window + ingestion

`time range` emits `today` and `yesterday`, feeding all MCP nodes.

#### B. Feature engineering

- Brand deltas + vulnerability scoring
- Query intent and search keyword extraction
- Domain trend and urgency scoring

#### C. Report synthesis

`merge_data` composes normalized intelligence for Report Agent JSON output.

#### D. 5D matrix planning

Strategy payload + URL evidence are consolidated and passed to Strategy Agent, which outputs a 5-entry `copy_instruction_matrix`.

#### E. Copy generation

Content agent generates platform-native copy per matrix row.

#### F. Distribution and reporting

Docs are created/updated, strategy metadata is merged into content, and a 5D HTML report is emailed.

---

### 4) AI Prompt Specs (All Agents)

#### 4.1 Report Agent (`lang/en/src/prompt_en.txt`)

- Focus: intelligence synthesis, competitive positioning, GEO planning.
- Key output blocks: `defense_alert`, `competitive_summary`, `dominate_plan`, `copy_brief`, `action_plan`.
- Strict constraints: no fabricated metrics; own-brand exclusion from threat/attack targets; structured JSON only.

#### 4.2 Strategy Agent (`lang/en/src/prompt_strategy_agent.txt`)

- Focus: convert strategy + URL evidence into 5D execution matrix.
- Required outputs: phase/tactic/geo/persona/timeframe/reference evidence.
- Enforces direction coverage and persona-ELM mapping.

#### 4.3 Content Generation Agent (`lang/en/src/prompt_generate_content_agent.txt`)

- Focus: render matrix into publishable copy packages.
- Enforces style by ELM path and format by platform behavior.
- Produces: `headline`, `subheadline`, `body`, `hooks`, `cta`.

---

### 5) JavaScript Processing Inventory

- `clean_brand_report.js`: brand normalization, own-brand mapping, vulnerability/evolution
- `clean_shopping_queries.js`: shopping intent segmentation
- `clean_search_queries.js`: query intelligence, brand mention ranking
- `clean_domain_report.js`: domain deltas, trend, urgency, investment suggestions
- `clean_get_actions.js`: Peec opportunities and drilldown config
- `merge_intel.js`: canonical report-agent payload assembly
- `extract_agent_sections.js`: extract strategy-relevant report fields
- `consolidate_for_agent.js`: build strategy + URL corpus payload
- `extract_top_urls.js`: URL selection policy with preferred/excluded classes
- `extract_copy_matrix.js`: matrix extraction for copy generation
- `split_copy_outputs.js`: copy splitting + metadata fallback matching
- `combine_docs_with_content.js`: docId/content merge + strategy block injection
- `combine_strategy_with_docs.js`: attach matrix metadata to document IDs
- `json_to_markdown_en.js`: 5D markdown skeleton + placeholders
- `html_email_en.js`: full 5D visual renderer for email

---

### 6) Embedded Code vs Repository Source

Treat repository scripts as source-of-truth and sync them into n8n code nodes at deployment time:

- `merge_data` ↔ `src/merge_intel.js`
- `Code in JavaScript1` ↔ `src/extract_top_urls.js`
- `Code in JavaScript3` ↔ `src/extract_copy_matrix.js`
- `Code in JavaScript4` ↔ `src/split_copy_outputs.js`
- `id_content_combine` ↔ `src/combine_docs_with_content.js`
- `Code in JavaScript5` ↔ `src/combine_strategy_with_docs.js`
- `json to markdown` ↔ `lang/en/json_to_markdown_en.js`
- `json to html email` ↔ `lang/en/html_email_en.js`

---

### 7) Operational Notes

- `list_shopping_queries1` currently points to `list_prompts`; rename/repoint if strict semantic alignment is required.
- Keep workflow embedded code synchronized with `src/` to avoid drift.
- Fallback matching in `split_copy_outputs.js` improves robustness, but upstream platform key consistency is still preferred.
- D5 email cards are currently simplified with platform-first emphasis and no left accent bar.
