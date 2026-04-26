# Competitive intelligence pipeline — algorithms and data logic

This document describes how Peec MCP data is parsed, scored, merged, and consumed by the n8n workflow (`Armani-n8n-en.json`). It is aligned with the JavaScript under `src/` and the English renderers under `lang/en/`. For node names and end-to-end wiring, see [`WORKFLOW_5D_EN.md`](./WORKFLOW_5D_EN.md).

---

## End-to-end flow

```text
Peec MCP
  ├── get_brand_report (today / yesterday + optional list_brands) → clean_brand_report.js
  ├── list_shopping_queries (or list_prompts in some setups)     → clean_shopping_queries.js
  ├── list_search_queries                                          → clean_search_queries.js
  ├── get_domain_report (today / yesterday)                        → clean_domain_report.js
  └── get_actions_overview (optional)                             → clean_get_actions.js
           ↓
     merge_intel.js  →  Report Agent  →  Strategy Agent  →  Content Generation Agent
           ↓                      ↓                ↓                      ↓
     (structured JSON)    strategy JSON   copy_instruction_matrix   per-platform copy
           ↓
  extract_agent_sections.js · consolidate_for_agent.js · extract_top_urls.js · …
           ↓
  lang/en/json_to_markdown_en.js  →  lang/en/html_email_en.js  →  email / docs assembly
```

**Date windows:** Brand and domain cleaners compare **today vs yesterday** when two MCP items are present. The workflow resolves dates in a **time range** node; this repository does not hard-code a rolling 7-day window in the cleaners.

**Prompts (English path):** `lang/en/src/prompt_en.txt`, `prompt_strategy_agent.txt`, `prompt_generate_content_agent.txt`.

---

## MCP payload shape (all cleaners)

Peec responses often arrive nested inside n8n as:

```text
item.json.content[0].text   →  { columns: string[], rows: any[][] }
```

Depth varies, so each cleaner uses the same fallback pattern:

```js
let content = rawData.content;
if (Array.isArray(content)) content = content[0];
if (content && content.text) content = content.text;
if (!content || !content.columns) content = rawData;
```

Column order is **not** guaranteed. Each script builds a `findIdx(name)` helper and resolves indices at runtime.

---

## `clean_brand_report.js`

**MCP:** `get_brand_report` (typically two report rows: previous day and current day), plus an optional **list_brands** item whose table includes `is_own` for each `brand_id`.

### Sentiment tier

Tiers drive vulnerability semantics and copy-facing labels:

| Tier   | Condition (`sentiment`) | Internal weight |
|--------|-------------------------|-----------------|
| `bad`  | ≤ 44                    | 3               |
| `normal` | 45–65                 | 2               |
| `good` | ≥ 66                    | 1               |

### Vulnerability score

```text
vulnerability_score = (100 - sentiment) / position
```

Computed **only** when `position` is in **1–5**; otherwise the score is **0**. Interpretation: lower sentiment and **better** rank (smaller `position`) increase the score — highly visible brands with weak sentiment score highest.

### Saturation

```text
saturation = (visibility_count / visibility_total) × 100
```

### Market status (`market_status`)

Default: **`Stable`**.

- **`Vulnerable (Target for Attack)`** — `sentiment_tier.label === 'bad'` **and** `position` in **1–5** (this is **not** the old “sentiment below 65” shortcut: “bad” means sentiment at most 44).
- **`Blue Ocean`** — `visibility < 0.3` **and** `saturation < 20`.
- Otherwise remains **`Stable`**.

Blue Ocean rows keep `vulnerability_score === 0` by design: they are expansion opportunities, not “attack score” targets.

### Day-over-day evolution

When yesterday’s row has real data (`visibility`, `sentiment`, or `position` not all zero), the script adds:

- `visibility_delta`, `sentiment_delta`, `position_delta`
- `trend`: `'up' | 'down' | 'stable'` from **visibility** vs previous day

If there is no usable previous day, `evolution` is `null` and `has_evolution` reflects that.

### `is_own`

Resolved from **`list_brands`** rows: map `brand_id → is_own`. If no list item exists for an id, `is_own` defaults to `false`.

### Output highlights

- `detailed_analysis[]`: per-brand fields including `sentiment_tier`, `vulnerability_score`, `saturation`, `market_status`, `evolution`, `is_own`
- `opportunity_count`: count of brands whose `market_status !== 'Stable'`
- `has_evolution`: whether yesterday comparison was applied

---

## `clean_shopping_queries.js`

**MCP:** `list_shopping_queries` (or equivalent prompt list, depending on workflow tool wiring).

### Volume

String `volume` → numeric `volume_score`: `low: 1`, `medium: 2`, `high: 3`.

### Intent (`intent_type`)

Evaluated in order (first match wins):

| `intent_type`           | Rule (regex on lowercased text) |
|-------------------------|----------------------------------|
| `purchase_intent`       | buy, shop, store, where can i, best place |
| `research_intent`       | compare, analyze, analyse, evaluate, market positioning |
| `recommendation_intent` | suggest, recommend |
| `discovery_intent`      | best, top, top-rated, leading **or** find, identify, locate, list, show me |
| `general`               | fallback |

### Sort

Primary: `volume_score` descending. Secondary: intent priority  
`purchase_intent (3) > discovery_intent (2) > recommendation_intent (1) > research_intent (0) ≥ general (0)`.

---

## `clean_search_queries.js`

**MCP:** `list_search_queries`

Builds:

- `model_distribution` — counts by `model_id`
- `brand_mention_ranking` — counts from a fixed `KNOWN_BRANDS` list substring-matched in `query_text`
- `unique_keywords` — deduped `query_text` values
- `by_prompt` — queries grouped by `prompt_id`

Same column-resolution pattern as other cleaners.

---

## `clean_domain_report.js`

**MCP:** `get_domain_report` — **item[0] = today**, **item[1] = yesterday** (per script convention).

### Per-domain fields

Parses `domain`, `classification`, `retrieved_percentage`, `retrieval_rate`, `citation_rate`, `mentioned_brand_ids`.

### Deltas and trend

When yesterday exists and `citation_rate > 0` for that domain:

- `citation_rate_delta`, `retrieval_rate_delta` (four decimal places)

`domain_trend` (from `citation_rate_delta`, threshold **0.05**):

- **`widening`** — `citation_rate_delta` is less than **-0.05** (citation share moving against you / gap widening)
- **`closing`** — `citation_rate_delta` is greater than **+0.05**
- **`stable`** — otherwise

### Urgency score

```text
urgency_score = citation_rate × (1 + |citation_rate_delta|)
```

If there is no valid delta, `urgency_score` falls back to `citation_rate`.

**Bands:** `urgency` is `'high' | 'medium' | 'low'` using thresholds **≥ 1.0**, **≥ 0.4**, else low.

### Aggregates (unchanged core)

- **`content_gap_targets`** — `EDITORIAL` + `REFERENCE`, sorted by `citation_rate`, top **10**
- **`high_citation_domains`** — all classifications with `citation_rate > 1.0`
- **`ugc_domains`**, **`competitor_domains`**, **`own_domains`**, **`by_classification`**

### Newer outputs

- **`domain_evolution`** — domains with non-null delta, sorted by `|citation_rate_delta|` descending
- **`domain_investment_suggestion`** — `EDITORIAL`, `REFERENCE`, `UGC` only, sorted by `urgency_score` descending, with `urgency` and trend fields

---

## `clean_get_actions.js`

**MCP:** `get_actions_overview` (first item parsed as tabular rows).

- **`high_opportunity`** — rows with `relative_opportunity_score >= 2`, sorted by `opportunity_score`, top **5**
- **`drilldown_params`** — maps each high-opportunity row to `scope` (`owned` / `editorial` / `reference` / `ugc`) and fields needed for follow-up MCP calls
- **`all_actions`** — full list sorted by `opportunity_score` descending

---

## `merge_intel.js`

Builds the **Report Agent** input object in one item:

```js
{
  brand_intel:      $('clean_brand_report').all()[0]?.json,
  shopping_queries: $('clean_shopping_queries').all()[0]?.json,
  search_queries:   $('clean_search_queries').all()[0]?.json,
  domain_report:    $('clean_domain_reports').all()[0]?.json,
}
```

**Important:** The `$('…')` names must match **exact n8n node names** (including plural `clean_domain_reports` if that is how the node is labeled). Set the Code node to **run once for all items** when using this pattern.

If the workflow merges **Peec actions** (`clean_get_actions` output) into the same payload for the Report Agent, that happens in n8n **outside** this file — keep workflow JSON and `merge_intel.js` in sync.

---

## AI agents — rules grounded in data

### Report Agent (`lang/en/src/prompt_en.txt`)

Consumes merged intelligence JSON. Key constraints (see prompt for full schema):

- **`top_threat`**: competitor only (`is_own === false`), **`market_status === 'Stable'`**, not Blue Ocean; closest visibility/position competitor to own brand.
- **`attack_targets`**: competitors, **`Stable`**, highest **`vulnerability_score`**; Blue Ocean brands belong in **`blue_ocean_brands`**, not attack lists.
- **`is_own`**: never appear in `top_threat`, `attack_targets`, or attack-oriented copy blocks.
- Output must be **strict JSON** without markdown wrappers (downstream still strips accidental `` ```json `` fences).

### Strategy Agent (`prompt_strategy_agent.txt`)

Consumes extracted report sections plus URL metadata and body text; emits **`copy_instruction_matrix`** (five rows) with phase, tactic, GEO notes, persona, and evidence tied to real URLs.

### Content Generation Agent (`prompt_generate_content_agent.txt`)

Consumes **`copy_instruction_matrix`**; emits platform copy (`headline`, `subheadline`, `body`, `hooks`, `cta`) with ELM and platform-behavior constraints.

---

## Downstream scripts (summary)

| Script | Role |
|--------|------|
| `extract_agent_sections.js` | Pull strategy-relevant fields from Report Agent JSON |
| `extract_top_urls.js` | Select top URLs for fetching (editorial / UGC / reference bias) |
| `consolidate_for_agent.js` | Merge strategy payload with URL bodies |
| `extract_copy_matrix.js` | Isolate `copy_instruction_matrix` for the copy agent |
| `split_copy_outputs.js` | Split copy JSON into per-document structures |
| `combine_docs_with_content.js` | Join Google Doc IDs with copy + strategy metadata |
| `combine_strategy_with_docs.js` | Attach strategy metadata to document IDs for reporting |

---

## Reporting renderers (`lang/en/`)

### `json_to_markdown_en.js`

Parses agent JSON (including wrapped `output` strings), merges brand context from merged items, and emits a **5D-oriented markdown** skeleton for the email pipeline.

### `html_email_en.js`

Renders the structured 5D HTML email (detect / defense / diagnose / dominate / direct sections). When consuming dual-item output from upstream nodes, use **`$input.all()`** and select the item that contains `markdown` (not always `[0]`).

---

## Maintenance

- Treat **`src/`** and **`lang/en/`** as source-of-truth; copy into n8n Code nodes when deploying.
- If MCP tool names change (e.g. shopping node still bound to `list_prompts`), update the workflow **and** this document’s assumptions together.
- Keep **`KNOWN_BRANDS`** in `clean_search_queries.js` aligned with the brands you actually track.
