// College Town Home Explorer: map of home sales with filters and summary cards.
// Reads data/map_sales.json, made by scripts/make_map_data.py.

// Change this together with the ?v= numbers in index.html whenever the data
// file's columns change, so browsers never mix new code with an old cached file.
const DATA_URL = "data/map_sales.json?v=4";

const money = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat("en-US");
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const map = L.map("map").setView([39.5, -88], 5);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const $ = (id) => document.getElementById(id);
const formEl = $("filters");
const statusEl = $("status");
const summaryEl = $("summary");
const controls = {
  university: $("university"),
  priceMin: $("price-min"),
  priceMax: $("price-max"),
  beds: $("beds"),
  distance: $("distance"),
  year: $("year"),
};
let clusters = null;
let sales = [];
let totalSales = 0;
let allBounds = null;   // area covering every sale: the map's starting view

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function formatDate(iso) {
  if (!iso) return "Not recorded";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  });
}

// ---------- Popup ----------

// Small line icons in wood tone. aria-hidden: the text next to each says what it is.
const ICON_ATTRS = 'class="popup-icon" viewBox="0 0 24 24" fill="none" stroke="#B08A62" ' +
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
const ICONS = {
  bed: `<svg ${ICON_ATTRS}><path d="M3 18V7"/><path d="M3 14h18v4"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/></svg>`,
  bath: `<svg ${ICON_ATTRS}><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2z"/><path d="M6 12V6a2 2 0 0 1 3.5-1.3"/><path d="M8 19l-1 2"/><path d="M16 19l1 2"/></svg>`,
  calendar: `<svg ${ICON_ATTRS}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>`,
};

function popupHtml(s) {
  const show = (v) => (v === null || v === undefined ? "Not recorded" : v);
  return `<div class="popup">
    <div class="popup-head">
      <span class="popup-label eyebrow">Sold for</span>
      <span class="popup-price">${money.format(s.sale_price)}</span>
    </div>
    <div class="popup-body">
      <p class="popup-city">${escapeHtml(s.city)}, ${escapeHtml(s.state)}</p>
      <ul class="popup-list">
        <li>${ICONS.bed}<span><span class="key">Bedrooms:</span> ${show(s.beds)}</span></li>
        <li>${ICONS.bath}<span><span class="key">Bathrooms:</span> ${show(s.baths)}</span></li>
        <li>${ICONS.calendar}<span><span class="key">Sale date:</span> ${formatDate(s.sale_date)}</span></li>
      </ul>
    </div>
  </div>`;
}

// ---------- Clusters and legend ----------

// Cluster colours by how many sales a cluster holds: beige (few) to navy (many).
// These cut-offs only set the colour; they are not taken from the data.
const CLUSTER_TIERS = [
  { max: 9, label: "2–9", color: "#D9C3A5" },
  { max: 99, label: "10–99", color: "#B08A62" },
  { max: 999, label: "100–999", color: "#5A6F96" },
  { max: Infinity, label: "1,000+", color: "#2E4066" },
];
const CLUSTER_SIZES = [34, 40, 46, 54];

function clusterIcon(cluster) {
  const n = cluster.getChildCount();
  const tier = CLUSTER_TIERS.findIndex((t) => n <= t.max);
  const size = CLUSTER_SIZES[tier];
  return L.divIcon({
    html: `<span>${count.format(n)}</span>`,
    className: `cluster cluster-${tier + 1}`,
    iconSize: L.point(size, size),
  });
}

const legend = L.control({ position: "bottomright" });
legend.onAdd = () => {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = `
    <p class="legend-title eyebrow">Sales per cluster</p>
    <div class="legend-scale">
      ${CLUSTER_TIERS.map((t) => `
        <div class="legend-step">
          <span class="legend-swatch" style="background:${t.color}"></span>
          <span class="legend-range">${t.label}</span>
        </div>`).join("")}
    </div>
    <div class="legend-ends"><span>Few</span><span>Many</span></div>`;
  return div;
};
legend.addTo(map);

// ---------- Filters ----------

// Each band is a test on one value. A sale whose value is missing never passes,
// so it is left out only while that filter is active (an "Any" filter is skipped).
const BEDS = {
  "1": (v) => v === 1, "2": (v) => v === 2, "3": (v) => v === 3, "4": (v) => v === 4,
  "5+": (v) => v >= 5,
};
const DISTANCE = {
  lt1: (v) => v < 1,
  "1to3": (v) => v >= 1 && v < 3,
  "3to5": (v) => v >= 3 && v <= 5,
  gt5: (v) => v > 5,
};
const YEAR = {
  lt1970: (v) => v < 1970,
  "1970to1999": (v) => v >= 1970 && v <= 1999,
  ge2000: (v) => v >= 2000,
};

// Reads a price box as a whole number of dollars. Dollar signs, commas and spaces
// are allowed ("$250,000"). Returns null for an empty box (no limit) and NaN for
// anything else (such as "250k"), which is ignored and explained under the boxes.
function readPrice(input) {
  const text = input.value.replace(/[$,\s]/g, "");
  if (text === "") return null;
  return /^\d+$/.test(text) ? Number(text) : NaN;
}

function priceHint(min, max) {
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return "Enter prices as whole dollars, like 250000 or $250,000.";
  }
  if (min !== null && max !== null && min > max) return "Min price is higher than max price.";
  return "";
}

function readFilters() {
  const min = readPrice(controls.priceMin);
  const max = readPrice(controls.priceMax);
  return {
    university: controls.university.value,
    hint: priceHint(min, max),
    // A box that is not a whole dollar amount sets no limit
    priceMin: Number.isNaN(min) ? null : min,
    priceMax: Number.isNaN(max) ? null : max,
    beds: controls.beds.value,
    distance: controls.distance.value,
    year: controls.year.value,
  };
}

function hasValue(v) { return v !== null && v !== undefined; }

function passes(value, choice, tests) {
  if (!choice) return true;                    // "Any": no test, missing values stay in
  return hasValue(value) && tests[choice](value);
}

function matches(s, f) {
  if (f.university && s.university !== f.university) return false;
  if (f.priceMin !== null && s.sale_price < f.priceMin) return false;
  if (f.priceMax !== null && s.sale_price > f.priceMax) return false;
  return passes(s.beds, f.beds, BEDS) &&
    passes(s.miles_to_campus, f.distance, DISTANCE) &&
    passes(s.year_built, f.year, YEAR);
}

function extraFiltersActive(f) {
  return f.priceMin !== null || f.priceMax !== null || !!(f.beds || f.distance || f.year);
}

// ---------- Summary cards ----------

// Middle value of a list of numbers; with an even count, the average of the two middle values.
function median(values) {
  if (!values.length) return null;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function updateCards(chosen) {
  const empty = chosen.length === 0;
  $("card-row").hidden = empty;
  $("cards-empty").hidden = !empty;
  if (empty) return;

  $("card-count").textContent = count.format(chosen.length);
  $("card-count-sub").textContent = `of ${count.format(totalSales)} after the price rule`;

  const prices = chosen.map((s) => s.sale_price);
  $("card-median").textContent = money.format(median(prices));

  let lo = Infinity;
  let hi = -Infinity;
  for (const p of prices) { if (p < lo) lo = p; if (p > hi) hi = p; }
  $("card-range").innerHTML =
    `<span class="amount">${money.format(lo)}</span> <span class="to">to</span> ` +
    `<span class="amount">${money.format(hi)}</span>`;

  const beds = median(chosen.map((s) => s.beds).filter(hasValue));
  const baths = median(chosen.map((s) => s.baths).filter(hasValue));
  const fmt = (v) => (v === null ? "–" : decimal.format(v));
  $("card-size").textContent = `${fmt(beds)} bd · ${fmt(baths)} ba`;
}

// ---------- Map drawing ----------

// Large sets are added to the map in chunks, and the cluster library cannot stop
// a load once it has started. Removing a group mid-load makes it fail when it
// finishes, so while one load runs, only the newest request waits for its turn.
let mapBusy = false;
let nextDraw = null;

function drawMap(chosen, fit) {
  if (mapBusy) {
    nextDraw = { chosen, fit: fit || (nextDraw !== null && nextDraw.fit) };
    return;
  }
  mapBusy = true;

  if (clusters) map.removeLayer(clusters);
  let finished = false;
  clusters = L.markerClusterGroup({
    chunkedLoading: true,
    iconCreateFunction: clusterIcon,
    // Also called with 0 of 0 when the empty group is first put on the map, so
    // only the report for this load's full set of sales counts as the end.
    chunkProgress: (done, total) => {
      if (finished || total !== chosen.length || done < total) return;
      finished = true;
      // Let the library finish this load before starting the next one
      setTimeout(() => {
        mapBusy = false;
        if (nextDraw) {
          const next = nextDraw;
          nextDraw = null;
          drawMap(next.chosen, next.fit);
        }
      }, 0);
    },
  });
  map.addLayer(clusters);
  clusters.addLayers(chosen.map((s) =>
    L.circleMarker([s.latitude, s.longitude], {
      radius: 6, weight: 1.5, color: "#ffffff", fillColor: "#2E4066", fillOpacity: 0.95,
    }).bindPopup(() => popupHtml(s))
  ));

  // No matches: go back to the starting view of every sale, instead of staying
  // on whatever area was shown before.
  if (chosen.length === 0) {
    map.fitBounds(allBounds, { padding: [20, 20] });
    return;
  }
  // Zoom to the sales only when the university changes or filters are reset, so
  // the map does not jump while someone types a price. Bounds come from the
  // coordinates: with chunked loading the cluster group is still empty here.
  if (fit) {
    const bounds = L.latLngBounds(chosen.map((s) => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [20, 20] });
  }
}

// ---------- Update everything ----------

function update({ fit = false } = {}) {
  const f = readFilters();

  $("price-hint").textContent = f.hint;

  const chosen = sales.filter((s) => matches(s, f));
  drawMap(chosen, fit);

  const where = f.university || "all universities";
  statusEl.textContent = `Showing ${count.format(chosen.length)} sales for ${where}` +
    (extraFiltersActive(f) ? " that match your filters" : "");

  const campuses = new Set(chosen.map((s) => s.university)).size;
  summaryEl.textContent =
    `${count.format(chosen.length)} home sales · ${count.format(campuses)} ` +
    (campuses === 1 ? "campus" : "campuses");

  updateCards(chosen);
}

// ---------- Data notes ----------

function fillDataNotes(data) {
  const campuses = Object.keys(data.universities).length;
  const missing = (field) => sales.filter((s) => !hasValue(s[field])).length;
  const salesWord = (n) => `${count.format(n)} ${n === 1 ? "sale" : "sales"}`;
  const values = {
    campuses: count.format(campuses),
    min_price: money.format(data.price_rule.min_price),
    max_price: money.format(data.price_rule.max_price),
    missing_year: salesWord(missing("year_built")),
    missing_baths: salesWord(missing("baths")),
    ...Object.fromEntries(
      Object.entries(data.counts).map(([k, v]) => [k, count.format(v)])
    ),
  };
  document.querySelectorAll("[data-fill]").forEach((el) => {
    el.textContent = values[el.dataset.fill];
  });
}

// ---------- Start ----------

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    sales = data.rows.map((row) =>
      Object.fromEntries(data.columns.map((col, i) => [col, row[i]]))
    );
    totalSales = data.counts.rows_kept;
    allBounds = L.latLngBounds(sales.map((s) => [s.latitude, s.longitude]));

    Object.entries(data.universities).forEach(([name, n]) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = `${name} (${count.format(n)})`;
      controls.university.appendChild(option);
    });

    controls.university.addEventListener("change", () => update({ fit: true }));
    [controls.beds, controls.distance, controls.year].forEach((el) =>
      el.addEventListener("change", () => update())
    );
    // Prices: wait until typing pauses, so the map is not rebuilt on every key
    let timer = null;
    [controls.priceMin, controls.priceMax].forEach((el) => {
      el.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => update(), 400);
      });
    });
    formEl.addEventListener("submit", (e) => { e.preventDefault(); clearTimeout(timer); update(); });
    // The browser clears the form itself; update once it has finished.
    formEl.addEventListener("reset", () => {
      clearTimeout(timer);
      setTimeout(() => update({ fit: true }), 0);
    });
    $("empty-reset").addEventListener("click", () => formEl.reset());

    fillDataNotes(data);
    update({ fit: true });
  })
  .catch((err) => {
    statusEl.textContent = `Could not load the sales data (${err.message}).`;
    summaryEl.textContent = "Sales data unavailable";
    $("card-row").hidden = true;
  });
