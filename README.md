# College Town Home Explorer

## Start here (delete this section before you submit)

This repository is your starting point for the Home Sales case. It already holds the dataset, its description sheet, project instructions for your AI coding agent, and outlines of the README and agent log that the case asks for.

1. **Turn on GitHub Pages.** In this repository, open **Settings**, then **Pages**. Under "Build and deployment," set **Source** to **GitHub Actions**. GitHub may suggest workflows to add. Skip them: this repository already has one, `.github/workflows/pages.yml`.
2. **Publish for the first time.** Open the **Actions** tab, choose **Publish site to GitHub Pages** in the sidebar, click **Run workflow**, then click **Run workflow** again to confirm. If the tab already shows a failed run from when you created the repository, that's expected: Pages wasn't turned on yet. When the new run shows a green check, your site is at `https://your-username.github.io/your-repo-name/`. It shows a placeholder page until you replace `index.html`.

    From then on, every push to the main branch publishes the site within a few minutes. If the live site doesn't show a change, open the **Actions** tab. A red X means the publish failed, and the run's log says why.
3. **Open the repository in your AI coding agent.** Its project instructions are in `AGENTS.md`. If your agent reads its instructions from a file with a different name, check its documentation and copy `AGENTS.md` to that name. Add to the instructions as you learn what your agent needs.
4. **Read `docs/data_description_sheet.md`** before you ask the agent for any analysis.
5. **Build in small steps,** as the setup guide describes. Add an entry to `AGENT_LOG.md` each time you work with the agent.
6. **Fill in every section below** before you submit.

| Path | What it is |
|---|---|
| `index.html` | A placeholder page. Replace it with your site. |
| `data/college_town_home_sales.csv` | The dataset, version 1.0: 35,442 rows. Your site reads this file. |
| `data/college_town_home_sales.xlsx`, `.sqlite`, `.duckdb`, `.parquet` | The same data in Excel, SQLite, DuckDB and Parquet formats, with identical values |
| `docs/data_description_sheet.md` | What every column means, and five problems in the data |
| `AGENTS.md` | Project instructions for your AI coding agent |
| `AGENT_LOG.md` | Your agent log |
| `scripts/` | Scripts that make smaller data files for the site |
| `.github/workflows/pages.yml` | Publishes the site to GitHub Pages each time you push to main. It publishes your files as they are. If you switch to a framework that needs a build step, have your agent update it. |

Don't edit any of the five dataset files. Your site needs only the CSV file. The other formats make it easier to check numbers a second way, for example with a pivot table in Excel or a SQL query on the SQLite file. In SQLite and DuckDB, the table is named `home_sales`.

## What this site is for

College Town Home Explorer is an interactive map of home sales around 11 university campuses in the United States. It is for students, families and anyone curious about housing near a campus, and it helps answer questions such as:

- What do homes near a given university sell for?
- How do prices change with the number of bedrooms, the distance to campus or the age of the home?
- How do the college towns compare with each other?

**How to use it**

- **Map.** Each point is one completed sale. Nearby sales are grouped into clusters that show how many sales they hold; zoom in to split them apart, and click a sale to see its city, price, bedrooms, bathrooms and sale date. A cluster's colour (beige for a few sales, navy for many) shows how many sales it groups, not their prices.
- **Filters.** In the left panel, choose a **University**, type a **Price range** (minimum and maximum, in whole dollars), and pick **Bedrooms** (1 to 5+), **Distance to campus** (under 1 mile, 1–3, 3–5 or over 5 miles) and **Year built** (before 1970, 1970–1999, 2000 or later). All filters combine, and the map, the bar above it and the cards update together.
- **Reset filters.** The button sets every filter back to "Any" and all universities.
- **Summary cards.** The four cards above the map describe the sales that match the filters: **Sales shown**, **Median price**, **Price range** (lowest to highest sale) and **Median size** (bedrooms and bathrooms). If nothing matches, they say "No sales match these filters" and the map goes back to its starting view.

The "Data notes" section at the bottom of the page explains how every figure is defined.

## Live site

https://jaquelinechavezruiz-beep.github.io/college-town-home-sales/

## Data notes

All numbers below come from `data/college_town_home_sales.csv` or from `data/map_sales.json`, which is made from it. The site reads its own counts from `data/map_sales.json` instead of typing them in by hand.

- **Price rule.** Some prices in the dataset are impossible, including a sale at $0 and one over $80 million. The site leaves out every sale under $10,000 (40 sales) and every sale over $5,000,000 (31 sales), so it shows 35,371 of the 35,442 sales in the dataset. Every figure on the site uses only those 35,371 sales.
- **Missing values.** Among the sales shown, 6 have no sale date, 14 have no number of bathrooms and 1 has no year built. A blank is never treated as zero. In a popup, a missing value says "Not recorded". A sale with a missing value is left out only while a filter on that field is active; for example, the sale with no year built drops out when you choose a year range and stays in when Year built is "Any". The median bathrooms on the cards leave out the sales with no bathroom count.
- **Nearest campus.** Each sale belongs to the campus nearest to the home's own coordinates, measured in a straight line (the dataset's `university` and `miles_to_campus` columns). The city name plays no part. Distance bands use straight-line miles: under 1 is less than 1.0; 1–3 is 1.0 up to but not including 3.0; 3–5 is 3.0 to 5.0; over 5 is more than 5.0.
- **Incomplete years.** Sale dates run from 2023-03-27 to 2026-03-25, because the data was collected in March 2026. So 2023 and 2026 are only partial years: the map holds 9,583 sales in 2023 (from late March) and 1,872 in 2026 (January to March), against 11,632 in 2024 and 12,278 in 2025. Sales counts by calendar year should not be compared across those years.
- **Shared addresses.** Some different homes, mostly condo units in State College, share one street address. No rows are removed as duplicates; every sale is kept and identified by its `listing_id`, so points at the same spot can be separate homes.
- **Summary cards.** A median is the middle value; with an even number of sales it is the average of the two middle values, so it can fall between two real values (such as 2.25 bathrooms). Prices are shown rounded to the nearest dollar. Price limits typed in the filter include the amounts typed.
- **Columns not used.** The site does not use `home_type`, days on market, living area, lot size or tax columns, which the data description sheet warns contain errors or need extra care.

## How the map data is made

The map reads `data/map_sales.json`, which `scripts/make_map_data.py` makes from `data/college_town_home_sales.csv`. It keeps only the columns the site needs (listing ID, location, city, state, university, price, bedrooms, bathrooms, sale date, miles to campus and year built) and leaves out sales under $10,000 or over $5,000,000. It also stores the counts the site shows in Data notes (rows in the dataset, rows left out, rows kept). It reads the CSV without changing it, and every column is read as text first, so `zipcode`, `county_fips` and `parcel_number` keep their leading zeros. To make the file again, run this from the repository root (it needs only Python 3):

```
python3 scripts/make_map_data.py
```

It prints `Read 35442 rows, excluded 40 under $10,000 and 31 over $5,000,000, wrote 35371 to map_sales.json`. Commit the new `data/map_sales.json` together with any change to the script.

## Tools we used

**How the site is built**

- Plain HTML, CSS and JavaScript, with no build step: `index.html`, `css/style.css` and `js/map.js`.
- [Leaflet](https://leafletjs.com/) 1.9.4 for the map and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) 1.5.3 for the clusters, both loaded from cdnjs with a script tag. Map tiles come from OpenStreetMap.
- Google Fonts: Anton for titles and Open Sans for text. The logo, illustration and popup icons are original inline SVG.
- `scripts/make_map_data.py` (Python 3, standard library only) makes `data/map_sales.json`, the small data file the site reads.
- GitHub Pages publishes the repository as it is, through `.github/workflows/pages.yml`.

**AI use**

- The site was built with **Claude Code**, an AI coding agent connected to this repository. It wrote the code, checked the numbers against the CSV, tested the page in a headless browser and opened a pull request for each change.
- I used **Claude** (chat) to plan the steps, write and improve my prompts before sending them to Claude Code, make a design mockup, and walk me through pull requests and merges.
- I reviewed every pull request and tested each change on the live site. The prompts, what the agent produced, what I checked and the mistakes we caught are recorded in [`AGENT_LOG.md`](AGENT_LOG.md).

## Citation

College-town home sales dataset, version 1.0 (2026). University of Illinois-Deloitte Foundation Center for Business Emerging Technologies. Data collected March 2026.

## Who did what

_For teams: replace this line with each member's name and what they did. If you worked alone, delete this section._
