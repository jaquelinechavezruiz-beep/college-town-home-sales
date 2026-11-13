# Agent log

Add a dated entry each time you work with your AI coding agent, with the newest entry at the bottom. Each entry records what you asked the agent, what it produced, and what you checked or changed. Paste your key prompts in exactly as you typed them. Include at least one time the agent got something wrong, and how you caught it.

Copy this outline for each entry:

```markdown
## YYYY-MM-DD: What you worked on

- **Asked:** "Paste your prompt here."
- **Agent produced:** What it made or changed.
- **Checked or changed:** How you checked it, and what you fixed.
```

## 2026-11-13: Project overview and first map page

- **Asked:** First, to read AGENTS.md and docs/data_description_sheet.md, look at data/ and scripts/, change nothing, and summarize the dataset, its data quality and three site ideas, in Spanish. Then: "Elijo la Idea C: “College Town Home Explorer”, porque me gustaría que el sitio tuviera un mapa. Regla de precios: usa la primera opción. Excluye del sitio las ventas de menos de $10,000 y las de más de $5,000,000, y explica esa regla en el sitio, en una sección de “Data notes”." The first step asked for a script that makes a reduced data file, an index.html with a Leaflet cluster map, a popup for each sale, a university filter and a Data notes section, plus this log entry.
- **Agent produced:** A summary of the dataset computed from the CSV, which matched the description sheet's numbers, and three site ideas. Then `scripts/make_map_data.py`, which writes `data/map_sales.json` (35,371 sales kept: 40 under $10,000 and 31 over $5,000,000 left out); a new `index.html` and `js/map.js` with a clustered Leaflet map, popups (city, price, bedrooms, bathrooms, sale date), a university dropdown and Data notes. The Data notes counts are read from the JSON file, not typed in by hand.
- **Checked or changed:** The agent opened the page in a headless browser. Its first version failed with "Bounds are not valid" when showing all universities, because the map tried to zoom to the clusters before they had finished loading. It now zooms to the sales' coordinates instead. One popup (State College, $665,000, 4 bedrooms, 3 bathrooms, Nov 4, 2025) was checked against its row in the original CSV, listing_id 84d040bdec19.
