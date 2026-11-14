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

## 2026-11-14: Real estate listing look

- **Asked:** To restyle the site like a modern real estate listing, with formatting changes only (no changes to the map logic, the data or the filter): navy (#34446A), blue-grey (#6E7A99) and light grey (#E8E8E8) with white text and cards; tall condensed uppercase titles, small spaced uppercase labels and a clean body font from Google Fonts; a blue-grey side panel with the title "COLLEGE TOWN / HOME EXPLORER", the description and the university filter; a navy bar above the map with counts read from the data; a navy price tag and bulleted details in each popup; navy points and clusters; Data notes kept below in the same style; one column on phones.
- **Agent produced:** A new `index.html` layout and styles (Oswald for titles, Inter for body text), and formatting-only edits in `js/map.js`: the popup markup, the point colour, and the bar text "35,371 home sales · 11 campuses", built from the counts in `data/map_sales.json`. The "11" in the description is now also read from the data instead of typed by hand. The data loading, cluster setup and filter code are unchanged.
- **Checked or changed:** White text on #6E7A99 has a contrast ratio of 4.28, below the 4.5 recommended for body text, so the panel uses #68759A, which is very close and reaches 4.57. Screenshots at desktop size and at iPhone 13 size showed no horizontal scrolling on the phone. On the first screenshot, five-digit cluster counts (such as 20,245) spilled out of their circles, so large clusters now use smaller text.

## 2026-11-14: Fix the "Loading…" bar, and a new navy, beige and wood design

- **Asked:** To fix the bar above the map, which stayed on "LOADING…" on the live site although the map loaded, and make it show sales and campus counts that follow the university filter. Then a new design without changing the data logic or the price rule: navy #2E4066, dark navy #1F2D4A, beige #D9C3A5, wood #B08A62, #F4F4F2 and white, with good contrast; Anton and Open Sans; a two-line title with a white rule under it; beige labels; a pill-shaped menu; an original SVG illustration (house, building, keys) with a "FIND YOUR PLACE NEAR CAMPUS" card; a white line-drawn SVG logo with an aria-label; clusters coloured by size with a Few-to-Many legend; a "SOLD FOR" popup; the panel above the map on phones.
- **Agent produced:** For the bug: the code on main was correct, and the agent reproduced the bug by pairing the new `index.html` with the old `js/map.js`. The two deploys were 19 minutes apart, so the browser most likely reused its cached copy of the old `js/map.js`, which had no code for the bar. The script and stylesheet links now end in `?v=3`, so a new page always loads matching files. The bar is now updated together with the filter, for example "1,909 home sales · 1 campus". For the design: a new `css/style.css`, a new `index.html` layout with the two SVGs, and display-only changes in `js/map.js` (cluster icons, legend, popup markup).
- **Checked or changed:** Contrast was computed for every text colour. Wood is 3.15:1 on white, too low for small text, so wood is used only for accents, and a darker wood (#8A6640, 5.2:1) is used for the small label on the white Data notes card. The dark text on wood clusters is #121B30. Screenshots caught two problems that were then fixed: the title wrapped to three lines, and Leaflet's default paragraph margin left a gap above the city in the popup. The title was measured to fit on two lines at 1366, 900, 390 and 320 px widths, with no horizontal scrolling. The filter test (Iowa: 1,909 sales, 1 campus, and back to 35,371 · 11) passed with no console errors.
