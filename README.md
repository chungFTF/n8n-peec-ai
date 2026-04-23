# n8n x Peec AI: Competitive Intelligence Automation

This repository contains an n8n automation workflow that pulls daily AI visibility data from Peec AI, generates structured competitive insights, and outputs report-ready content (Markdown + HTML email) in both English and Chinese.

Its core value is automated, competition-driven UGC copy generation: the pipeline detects where competitors are vulnerable, turns those signals into copy instructions, and produces channel-ready UGC messaging automatically.

> Disclaimer: Brand names used in examples are for educational and research demonstration only. This project is not affiliated with or endorsed by those brands.

## Overview

The workflow is designed to run on a schedule and execute an end-to-end intelligence pipeline:

1. Fetch core datasets from Peec AI (brand performance, shopping queries, AI search behavior, and domain citations).
2. Clean and normalize each dataset into analysis-ready JSON.
3. Compute strategic indicators such as vulnerability score, market saturation, and market status.
4. Generate AI analysis output with a strict schema (top threat, attack targets, opportunities, content strategy, and action plan).
5. Convert the output into Markdown and styled HTML for email delivery.
6. Feed copy/content strategy outputs into downstream execution nodes.
7. Automatically generate competitive UGC copy packages from strategy signals for faster campaign execution.

## Why It Is Competitive

- Automatically identifies today's top threat and attack targets from measurable market signals.
- Converts competitive gaps into actionable copy angles and platform-specific instructions.
- Generates UGC (sometimes written as UCG) copy outputs at scale without manual rewriting.
- Keeps strategy and execution connected from intelligence data to final copy artifacts.

## Repository Structure

```text
docs/
  ALGORITHM.md                      Technical formulas and decision logic
  FOR_PM.md                         Non-technical overview for stakeholders
  WORKFLOW.md                       n8n workflow documentation

src/
  clean_brand_report.js             Cleans brand data, computes vulnerability and evolution deltas
  clean_domain_report.js            Cleans domain citation/retrieval data and gap signals
  clean_search_queries.js           Extracts AI-generated search terms and brand mention signals
  clean_shopping_queries.js         Classifies shopping intent queries
  merge_intel.js                    Merges cleaned branches into one payload
  combine_strategy_with_docs.js     Combines strategy outputs with generated docs
  combine_docs_with_content.js      Merges content artifacts for final delivery
  consolidate_for_agent.js          Consolidates payload for agent input
  extract_agent_sections.js         Extracts structured sections from agent output
  extract_copy_matrix.js            Extracts copy instruction matrix
  extract_top_urls.js               Extracts top URLs for analysis context
  prepare_copy_agent_input.js       Builds copy-agent input from strategy signals
  split_copy_outputs.js             Splits copy outputs into publishable items
  prompt.txt                        Base prompt (legacy/general)

lang/en/
  json_to_markdown_en.js            English JSON -> Markdown renderer
  html_email_en.js                  English Markdown -> HTML email renderer
  src/
    prompt_en.txt                   English analysis prompt and schema rules
    prompt_copy_agent_en.txt        English copy-agent prompt
    prompt_copy_writer_en.txt       English copy-writer prompt

lang/zh/
  json_to_markdown.js               Chinese JSON -> Markdown renderer
  html_email.js                     Chinese Markdown -> HTML email renderer
  src/
    prompt_zh.txt                   Chinese analysis prompt and schema rules
    prompt_copy_agent_zh.txt        Chinese copy-agent prompt
    prompt_copy_writer_zh.txt       Chinese copy-writer prompt
```

## Key Metrics

These metrics are not only for reporting. They directly drive how automated UGC copy priorities are selected.

### Vulnerability Score

Used to identify competitors that are highly visible but weak in sentiment.

```text
vulnerability_score = (100 - sentiment) / position
```

- Applied only when `position` is between 1 and 5.
- If rank is outside top 5, score is treated as `0`.

### Market Saturation

Used to estimate how crowded a visibility segment is.

```text
saturation = (visibility_count / visibility_total) * 100
```

### Market Status

Typical interpretation logic:

- Vulnerable: high exposure but weak sentiment (candidate attack target).
- Blue Ocean: low visibility and low saturation (white-space opportunity).
- Stable: relatively defended position.

In practice, these labels determine where the system should focus attack-oriented or defense-oriented UGC messaging.

## Data Sources (Peec AI MCP)

Primary MCP functions used by the workflow:

- `get_brand_report`: visibility, sentiment, position, share of voice by brand.
- `list_shopping_queries`: user purchase-intent query set.
- `list_search_queries`: AI-generated search terms and mentioned brands.
- `get_domain_report`: domain retrieval/citation behavior and gaps.

Together, these four inputs power a closed loop: competitive intelligence -> strategic recommendation -> automated UGC copy generation.

## Setup

1. Import the workflow JSON into n8n.
2. Configure credentials for:
   - Peec AI MCP
   - LLM provider used in your AI Agent node
   - Email provider (for example Gmail)
3. Set the target `project_id` in relevant MCP nodes.
4. Configure schedule trigger (for example daily run).
5. Run a manual test once and confirm all branches return valid data.

Tip: verify that copy-related nodes (`extract_copy_matrix`, `prepare_copy_agent_input`, `split_copy_outputs`) are active, because they are the core of the competitive UGC automation layer.

## Output

Depending on language path and workflow branch, the system can output:

- Structured JSON strategy report
- Markdown report
- Styled HTML email
- Copy execution artifacts (matrix + split outputs + doc-linked payloads)
- Automated competitive UGC copy packages for downstream publishing workflows

## Notes

- English and Chinese pipelines are maintained separately under `lang/en` and `lang/zh`.
- Top threat selection and competitive comparison logic are prompt-driven and schema-constrained.
- Keep renderer files (`json_to_markdown*`, `html_email*`) aligned with prompt schema changes.
- If you update threat logic or priority criteria, update copy-agent prompts as well to keep UGC output aligned with strategy.
