// College Town Home Explorer: map of home sales.
// Reads data/map_sales.json, made by scripts/make_map_data.py.

const money = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat("en-US");

const map = L.map("map").setView([39.5, -88], 5);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const statusEl = document.getElementById("status");
const selectEl = document.getElementById("university");
const summaryEl = document.getElementById("summary");
let clusters = null;
let sales = [];

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
      <li><span class="key">Bedrooms:</span> ${show(s.beds)}</li>
      <li><span class="key">Bathrooms:</span> ${show(s.baths)}</li>
      <li><span class="key">Sale date:</span> ${formatDate(s.sale_date)}</li>
      </ul>
    </div>
  </div>`;
}

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

function showSales(university) {
  if (clusters) map.removeLayer(clusters);
  clusters = L.markerClusterGroup({ chunkedLoading: true, iconCreateFunction: clusterIcon });

  const chosen = university ? sales.filter((s) => s.university === university) : sales;
  const markers = chosen.map((s) =>
    L.circleMarker([s.latitude, s.longitude], {
      radius: 6, weight: 1.5, color: "#ffffff", fillColor: "#2E4066", fillOpacity: 0.95,
    }).bindPopup(() => popupHtml(s))
  );
  clusters.addLayers(markers);
  map.addLayer(clusters);

  // Bounds come from the coordinates, not the cluster group: with chunked
  // loading the group is still empty right after addLayers on large sets.
  if (chosen.length) {
    const bounds = L.latLngBounds(chosen.map((s) => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [20, 20] });
  }
  const where = university || "all universities";
  statusEl.textContent = `Showing ${count.format(chosen.length)} sales for ${where}`;

  // Summary bar above the map: counts for the sales shown right now
  const campuses = new Set(chosen.map((s) => s.university)).size;
  summaryEl.textContent =
    `${count.format(chosen.length)} home sales · ${count.format(campuses)} ` +
    (campuses === 1 ? "campus" : "campuses");
}

function fillDataNotes(data) {
  const campuses = Object.keys(data.universities).length;
  const values = {
    campuses: count.format(campuses),
    min_price: money.format(data.price_rule.min_price),
    max_price: money.format(data.price_rule.max_price),
    ...Object.fromEntries(
      Object.entries(data.counts).map(([k, v]) => [k, count.format(v)])
    ),
  };
  document.querySelectorAll("[data-fill]").forEach((el) => {
    el.textContent = values[el.dataset.fill];
  });
}

fetch("data/map_sales.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    sales = data.rows.map((row) =>
      Object.fromEntries(data.columns.map((col, i) => [col, row[i]]))
    );

    Object.entries(data.universities).forEach(([name, n]) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = `${name} (${count.format(n)})`;
      selectEl.appendChild(option);
    });
    selectEl.addEventListener("change", () => showSales(selectEl.value));

    fillDataNotes(data);
    showSales("");
  })
  .catch((err) => {
    statusEl.textContent = `Could not load the sales data (${err.message}).`;
    summaryEl.textContent = "Sales data unavailable";
  });
