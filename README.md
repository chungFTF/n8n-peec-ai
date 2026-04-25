# n8n x Peec AI: 5D Competitive Intelligence Workflow

An open workflow that transforms Peec AI signals into daily strategy and deployable copy.

This project follows a 5D operating model:

- **D1 Detect**: monitor visibility and sentiment
- **D2 Defense**: detect erosion and risk
- **D3 Diagnose**: identify attackable competitors
- **D4 Dominate**: rank channels by urgency
- **D5 Direct & Drive**: generate and publish execution-ready content

> Disclaimer: Brand names used in examples are for demonstration and research only. This project is not affiliated with those brands.

## Why This Exists

- Turn raw intelligence into concrete daily priorities
- Keep strategy and execution in one pipeline
- Reduce manual handoff between analysts and content teams
- Produce copy artifacts ready for deployment

## What the Workflow Does

1. Ingests MCP data (`brand`, `search`, `shopping`, `domain`, `url`)
2. Normalizes data and computes strategic indicators
3. Runs three AI agents in sequence:
  - Report Agent
  - Strategy Agent
  - Content Generation Agent
4. Publishes output to Google Docs and HTML email

Main workflow file: `Armani-n8n-en.json`

## Key Strategy Formulas

```text
vulnerability_score = (100 - sentiment) / position
```

```text
saturation = (visibility_count / visibility_total) * 100
```

```text
urgency_score = citation_rate * (1 + |citation_rate_delta|)
```

Trend labels:

- `widening`
- `closing`
- `stable`

## Quick Start

1. Import `Armani-n8n-en.json` into n8n
2. Configure credentials:
  - Peec MCP OAuth
  - LLM provider(s) for agent nodes
  - Email provider
3. Set `project_id` in MCP nodes
4. Run one manual execution and validate all branches

## Repository Layout

```text
Armani-n8n-en.json         Main n8n workflow
src/                       Code-node scripts (cleaning, merge, docs assembly)
lang/en/                   English prompts and renderers
lang/zh/                   Chinese prompts and renderers
docs/                      Technical and non-technical documentation
```

## Recommended Documentation

- `docs/WORKFLOW_5D_CN_EN.md` - full technical guide (ZH/EN)
- `docs/WORKFLOW_5D_NONTECH_CN_EN.md` - non-technical guide (ZH/EN)
- `docs/ALGORITHM.md` - formula and decision logic notes
- `docs/WORKFLOW.md` - workflow design and node-level context

## Outputs

- Structured strategy JSON
- Markdown report
- Styled 5D HTML email
- Google Docs copy packages with strategy context

## Maintenance Notes

- Keep n8n embedded code aligned with `src/` and `lang/en/`
- If prompt schemas change, update renderers accordingly
- Keep key identifiers (for example `platform`) consistent across branches

