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
    <div class="popup-city">${escapeHtml(s.city)}, ${escapeHtml(s.state)}</div>
    <div class="popup-price">${money.format(s.sale_price)}</div>
    <dl>
      <dt>Bedrooms</dt><dd>${show(s.beds)}</dd>
      <dt>Bathrooms</dt><dd>${show(s.baths)}</dd>
      <dt>Sale date</dt><dd>${formatDate(s.sale_date)}</dd>
    </dl>
  </div>`;
}

function showSales(university) {
  if (clusters) map.removeLayer(clusters);
  clusters = L.markerClusterGroup({ chunkedLoading: true });

  const chosen = university ? sales.filter((s) => s.university === university) : sales;
  const markers = chosen.map((s) =>
    L.circleMarker([s.latitude, s.longitude], {
      radius: 6, weight: 1, color: "#ffffff", fillColor: "#2a6fdb", fillOpacity: 0.9,
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
}

function fillDataNotes(data) {
  const values = {
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
  });
