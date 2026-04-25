# n8n x Peec AI: 5D Competitive Intelligence and Content Automation

This repository contains a production-oriented n8n workflow that turns daily Peec AI intelligence signals into strategy and deployable copy.

At a high level, the system:

1. Ingests market and citation data from Peec MCP
2. Computes strategic indicators (vulnerability, trend, urgency)
3. Uses a 3-agent chain to generate strategy and copy
4. Publishes results to Google Docs and HTML email

The workflow follows a strict 5D framework:

- **D1 Detect**
- **D2 Defense**
- **D3 Diagnose**
- **D4 Dominate**
- **D5 Direct & Drive**

> Disclaimer: Brand names in examples are for demonstration and research purposes only. This project is not affiliated with or endorsed by those brands.

## Core Value

- Converts raw AI visibility signals into actionable daily priorities
- Identifies attack opportunities and expansion channels using measurable logic
- Connects strategy and execution in one loop (report -> matrix -> copy -> delivery)
- Reduces manual effort across intelligence, planning, and content production

## Workflow Snapshot

- Main workflow file: `Armani-n8n-en.json`
- Workflow name: `Armani-n8n-en`
- Node count: `38`
- Architecture: MCP ingestion + code normalization + multi-agent orchestration + report rendering + distribution

## End-to-End Flow

1. **Data Ingestion**
  - Fetch brand, query, domain, and URL intelligence from Peec MCP
2. **Normalization and Feature Engineering**
  - Clean all branches into schema-aligned JSON
  - Compute deltas, status labels, and urgency scores
3. **Strategic Synthesis (Report Agent)**
  - Produce structured intelligence report JSON
4. **5D Matrix Planning (Strategy Agent)**
  - Convert report + URL evidence into execution matrix
5. **Copy Generation (Content Generation Agent)**
  - Produce platform-specific copy packages
6. **Publishing**
  - Update Google Docs
  - Render Markdown + HTML email and send

## Strategic Calculations

These metrics drive decision priority, not just reporting.

### Vulnerability Score

Used to identify high-visibility competitors with weak sentiment.

```text
vulnerability_score = (100 - sentiment) / position
```

- Applied only when `position` is between `1` and `5`
- Treated as `0` outside top-5 ranking range

### Market Saturation

Used to estimate visibility crowding.

```text
saturation = (visibility_count / visibility_total) * 100
```

### Domain Urgency Score

Used to prioritize content investment platforms.

```text
urgency_score = citation_rate * (1 + |citation_rate_delta|)
```

Higher urgency means both strong citation relevance and meaningful trend movement.

### Domain Trend Labels

- `widening`: gap is worsening
- `closing`: gap is improving
- `stable`: no material movement

## Data Sources (Peec MCP)

Primary MCP functions used in this workflow:

- `get_brand_report`
- `list_search_queries`
- `list_prompts` (currently used in node `list_shopping_queries1`)
- `get_domain_report`
- `get_url_report`
- `get_url_content`

## AI Agent Stack

Three agents are orchestrated in sequence:

1. **Report Agent**
  - Produces structured competitive intelligence output
2. **Strategy Agent**
  - Produces a 5-entry `copy_instruction_matrix` with phase/tactic/persona/channel logic
3. **Content Generation Agent**
  - Produces final copy outputs (`headline`, `subheadline`, `body`, `hooks`, `cta`)

All prompts are schema-constrained and data-grounded to reduce hallucinations.

## Repository Structure

```text
Armani-n8n-en.json

docs/
  ALGORITHM.md
  WORKFLOW.md
  WORKFLOW_5D_CN_EN.md
  WORKFLOW_5D_NONTECH_CN_EN.md
  EXPLAIN-zh.md

src/
  clean_brand_report.js
  clean_domain_report.js
  clean_get_actions.js
  clean_search_queries.js
  clean_shopping_queries.js
  merge_intel.js
  extract_top_urls.js
  extract_agent_sections.js
  consolidate_for_agent.js
  extract_copy_matrix.js
  split_copy_outputs.js
  combine_docs_with_content.js
  combine_strategy_with_docs.js
  prepare_copy_agent_input.js

lang/en/
  json_to_markdown_en.js
  html_email_en.js
  src/
    prompt_en.txt
    prompt_strategy_agent.txt
    prompt_generate_content_agent.txt

lang/zh/
  json_to_markdown.js
  html_email.js
  src/
    prompt_zh.txt
    prompt_copy_agent_zh.txt
    prompt_copy_writer_zh.txt
```

## Setup

1. Import `Armani-n8n-en.json` into n8n
2. Configure credentials:
  - Peec MCP OAuth credential
  - LLM credential(s) used by AI agent nodes
  - Email provider credential
3. Set `project_id` in MCP nodes
4. Validate date window logic (`today` / `yesterday`)
5. Run a manual test and verify:
  - all data branches return valid payloads
  - all three AI agents return schema-valid JSON
  - docs and email rendering succeed

## Outputs

The workflow can produce:

- Structured strategy report JSON
- Markdown report
- Styled 5D HTML email
- Google Docs content artifacts with strategy context
- Matrix-linked copy payloads for downstream publishing

## Operational Notes

- Keep n8n code-node scripts synchronized with files under `src/` and `lang/en/`
- If schema changes in prompts, update renderers accordingly
- If priority logic changes, update both strategy and content prompts
- Ensure channel keys (such as `platform`) remain consistent across strategy and content branches

