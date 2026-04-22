# n8n × Peec AI — Daily Competitive Intelligence Automation

An n8n workflow that runs daily, pulls brand visibility data from Peec AI, and delivers a structured competitive intelligence report to your inbox.

> **Disclaimer:** All brand names used in this project (lululemon, Nike, Alo Yoga, Vuori, Gymshark, etc.) are referenced solely for educational and research purposes. This project is not affiliated with, endorsed by, or intended for commercial use against any of these brands.

---

## What It Does

Every morning, the workflow:

1. Fetches 7 days of data from Peec AI via MCP — brand visibility, shopping queries, AI-generated search terms, and domain citations
2. Cleans each dataset and calculates competitive metrics (vulnerability score, market saturation, intent classification)
3. Merges all data and passes it to a Claude AI Agent for analysis
4. Generates a structured report covering top threats, attack targets, content gaps, and copy direction
5. Converts the report to a styled HTML email and sends it via Gmail

---

## Folder Structure

```
src/
  clean_brand_report.js     Calculates vulnerability score, saturation, market status per brand
  clean_shopping_queries.js Classifies purchase intent, sorts queries by priority
  clean_search_queries.js   Extracts brand mentions from AI-generated search terms
  clean_domain_report.js    Groups domains by type, surfaces content gap targets
  merge_intel.js            Combines all 4 outputs into one JSON for the AI Agent
  prompt.txt                Claude AI Agent prompt — rules, output schema, analysis logic
  json_to_markdown.js       Parses AI output into clean JSON + Markdown
  html_email.js             Converts Markdown to styled HTML email

docs/
  ALGORITHM.md              Technical reference — formulas, data flow, edge cases
  FOR_PM.md                 Non-technical overview — how to read the report, what the numbers mean
  WORKFLOW.md               Full n8n workflow documentation
```

---

## Core Metrics

### Vulnerability Score
Measures how attackable a competitor is based on their AI visibility vs. reputation.

```
vulnerability_score = (100 − sentiment) / position
```

Only calculated for brands with `position ≤ 5`. Brands ranked lower have no meaningful threat value. Blue Ocean brands always score 0 and are never treated as attack targets.

### Market Saturation
Measures how contested a market segment is.

```
saturation = (visibility_count / visibility_total) × 100%
```

### Market Status Classification

| Status | Condition | Strategic Meaning |
|--------|-----------|-------------------|
| Vulnerable | sentiment < 65 and position ≤ 5 | High exposure but poor reputation — prime attack target |
| Blue Ocean | visibility < 0.3 and saturation < 20% | Low competition — opportunity to establish presence |
| Stable | Everything else | Entrenched position, low short-term attack value |

---

## Data Sources

All data is pulled from [Peec AI](https://app.peec.ai), which tracks how brands appear across AI engines (ChatGPT, Perplexity, Gemini, etc.) daily.

| MCP Function | What It Tracks |
|---|---|
| `get_brand_report` | Visibility, sentiment, position, share of voice per brand |
| `list_shopping_queries` | Purchase-intent queries users ask AI engines |
| `list_search_queries` | Search terms AI engines generate internally when answering prompts |
| `get_domain_report` | Which domains AI engines retrieve and cite, and how often |

---

## Setup

1. Import the n8n workflow JSON into your n8n instance
2. Connect your **Peec AI MCP** credentials
3. Connect your **Claude API** credentials (for the AI Agent node)
4. Connect your **Gmail** credentials
5. Set your `project_id` in the Peec AI MCP nodes
6. Configure the Schedule Trigger — recommended: daily at 7am
7. Run once manually to verify all 4 data branches are returning data before enabling the schedule

---

## Disclaimer

The brand names referenced throughout this project — including but not limited to lululemon, Nike, Alo Yoga, Vuori, Gymshark, Beyond Yoga, Athleta, and Sweaty Betty — are used exclusively for **educational and research purposes** to demonstrate GEO (Generative Engine Optimization) analysis techniques.

This project is not affiliated with, sponsored by, or commercially directed at any of these brands. It should not be used for commercial competitive intelligence operations targeting real brands without appropriate authorization.
