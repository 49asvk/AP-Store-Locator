import "@arcgis/core/assets/esri/themes/light/main.css";
import "./style.css";

import esriId from "@arcgis/core/identity/IdentityManager";
import esriConfig from "@arcgis/core/config";
import ArcGISMap from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import * as geometryEngineAsync from "@arcgis/core/geometry/geometryEngineAsync";
import Search from "@arcgis/core/widgets/Search";

import {
  API_KEY,
  GEOCODER_URL,
  COUNTRY_CODE,
  ENTERPRISE_SERVER,
  ENTERPRISE_KEY,
  POI_LAYER_URL,
  NAME_FIELD,
  DETAIL_FIELDS,
  FILTERS,
  RADII_M,
  DEFAULT_RADIUS_M,
  START_CENTER,
  START_ZOOM,
} from "./config.js";

esriConfig.apiKey = API_KEY;
// Sent only to the enterprise server; esriConfig.apiKey above only covers arcgis.com
esriId.registerToken({ server: ENTERPRISE_SERVER, token: ENTERPRISE_KEY });

const $ = (id) => document.getElementById(id);
const fmtInt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

// ---------- Map ----------
const bufferLayer = new GraphicsLayer({ title: "Search area" });
const poiGraphics = new GraphicsLayer({ title: "POIs" });
const pinLayer = new GraphicsLayer({ title: "Address" });

const view = new MapView({
  container: "viewDiv",
  map: new ArcGISMap({ basemap: "hybrid", layers: [bufferLayer, poiGraphics, pinLayer] }),
  center: START_CENTER,
  zoom: START_ZOOM,
});

// Query-only layer: never added to the map, so only the data we ask for is fetched
const poiLayer = new FeatureLayer({ url: POI_LAYER_URL });

// ---------- UI setup ----------
const radiusSelect = $("radius");
RADII_M.forEach((m) => {
  const o = document.createElement("option");
  o.value = m;
  o.textContent = m >= 1000 ? `${m / 1000} km radius` : `${m} m radius`;
  if (m === DEFAULT_RADIUS_M) o.selected = true;
  radiusSelect.appendChild(o);
});

function setError(msg) {
  const el = $("error");
  el.hidden = !msg;
  el.textContent = msg || "";
}

// ---------- Helpers ----------
function haversineM(lon1, lat1, lon2, lat2) {
  const R = 6371008.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`);

// ---------- Step 1: address search with suggestions (search only, results are not stored) ----------
// While typing, the widget calls the World Geocoder "suggest"; picking a suggestion looks up
// that one address. Both are search requests, never storage (forStorage stays at its default, false).
const search = new Search({
  container: "searchBox",
  includeDefaultSources: false,
  locationEnabled: false, // hide "use current location"
  popupEnabled: false,
  resultGraphicEnabled: false, // we draw our own pin and search area
  suggestionDelay: 300, // ms to wait after typing stops before asking for suggestions
  sources: [
    {
      url: GEOCODER_URL,
      name: "World Geocoder",
      placeholder: "Enter an address or place",
      ...(COUNTRY_CODE ? { countryCode: COUNTRY_CODE } : {}),
      suggestionsEnabled: true,
      minSuggestCharacters: 3,
      maxSuggestions: 6,
      maxResults: 1,
      outFields: ["Match_addr"],
    },
  ],
});

search.on("select-result", (e) => {
  const g = e.result?.feature?.geometry;
  if (!g) return;
  const point = new Point({ longitude: g.longitude ?? g.x, latitude: g.latitude ?? g.y });
  lastSearch = { point, label: e.result.name, radiusM: Number($("radius").value) };
  run(() => showResults(true));
});

// ---------- Filters ----------
// selected: field -> Set of checked values. Within a group any checked value matches (OR);
// across groups every group with a selection must match (AND).
const selected = Object.fromEntries(FILTERS.map((f) => [f.field, new Set()]));

// Reads the distinct values of each filter field from the layer and builds the checkboxes
async function buildFilters() {
  const lists = await Promise.all(
    FILTERS.map(async ({ field }) => {
      const q = poiLayer.createQuery();
      q.where = "1=1";
      q.outFields = [field];
      q.returnDistinctValues = true;
      q.returnGeometry = false;
      q.orderByFields = [field];
      const { features } = await poiLayer.queryFeatures(q);
      return features.map((f) => f.attributes[field]).filter((v) => v !== null && v !== "");
    })
  );

  const container = $("filterGroups");
  FILTERS.forEach(({ label, field }, i) => {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = label;
    const box = document.createElement("div");
    box.className = "check-list";
    lists[i].forEach((value) => {
      const row = document.createElement("label");
      row.className = "check";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.onchange = () => (cb.checked ? selected[field].add(value) : selected[field].delete(value));
      row.append(cb, document.createTextNode(" " + value));
      box.appendChild(row);
    });
    fieldset.append(legend, box);
    container.appendChild(fieldset);
  });
}
buildFilters().catch((err) => {
  console.error(err);
  setError("Could not load the filter options from the layer.");
});

function buildWhere() {
  const lit = (v) => (typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
  const clauses = FILTERS.filter(({ field }) => selected[field].size).map(
    ({ field }) => `${field} IN (${[...selected[field]].map(lit).join(", ")})`
  );
  return clauses.length ? clauses.join(" AND ") : "1=1";
}

function updateFilterButton() {
  const n = FILTERS.reduce((sum, { field }) => sum + selected[field].size, 0);
  $("filterToggle").textContent = n ? `Filters (${n})` : "Filters";
}

$("filterToggle").onclick = () => {
  $("filterPanel").hidden = !$("filterPanel").hidden;
};

// ---------- Step 2 + 3: buffer on the server, fetch matching POIs inside it ----------
async function fetchPois(point, radiusM) {
  const q = poiLayer.createQuery();
  q.geometry = point;
  q.distance = radiusM; // the server buffers the point, no separate geometry service call
  q.units = "meters";
  q.spatialRelationship = "intersects";
  q.where = buildWhere();
  q.outFields = ["*"];
  q.returnGeometry = true;
  q.outSpatialReference = { wkid: 4326 };

  const { features } = await poiLayer.queryFeatures(q);
  return features;
}

// ---------- Rendering ----------
let lastSearch = null; // { point, label, radiusM }

const directionsUrl = (from, to) =>
  `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}` +
  `&destination=${to.latitude},${to.longitude}&travelmode=driving`;

// Contact details + Get Directions, used in both the sidebar and the map popup
function buildDetails(p) {
  const wrap = document.createElement("div");
  wrap.className = "details";

  DETAIL_FIELDS.forEach(([key, field]) => {
    const value = p.attrs[field];
    const row = document.createElement("div");
    row.className = "detail-row";
    const k = document.createElement("span");
    k.className = "detail-key";
    k.textContent = key;
    const v = document.createElement("span");
    v.textContent = value === null || value === undefined || value === "" ? "—" : value;
    row.append(k, v);
    wrap.appendChild(row);
  });

  const a = document.createElement("a");
  a.className = "btn";
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = "Get Directions";
  a.href = directionsUrl(lastSearch.point, p.geometry);
  wrap.appendChild(a);
  return wrap;
}

async function drawSearchArea(point, radiusM) {
  bufferLayer.removeAll();
  pinLayer.removeAll();

  const ring = await geometryEngineAsync.geodesicBuffer(point, radiusM, "meters"); // runs in the browser
  bufferLayer.add(
    new Graphic({
      geometry: ring,
      symbol: {
        type: "simple-fill",
        color: [0, 122, 194, 0.1],
        outline: { color: [0, 122, 194, 0.9], width: 1.5 },
      },
    })
  );

  pinLayer.add(
    new Graphic({
      geometry: point,
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [217, 48, 37, 1],
        size: 11,
        outline: { color: "white", width: 2 },
      },
    })
  );
  return ring;
}

function drawPois(pois) {
  poiGraphics.removeAll();
  pois.forEach((p) => {
    poiGraphics.add(
      new Graphic({
        geometry: p.geometry,
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: [0, 122, 194, 1],
          size: 8,
          outline: { color: "white", width: 1.5 },
        },
        popupTemplate: { title: p.name || "Store", content: () => buildDetails(p) },
      })
    );
  });
}

function renderKpis(pois) {
  const kpis = $("kpis");
  kpis.innerHTML = "";
  [
    ["Stores found", fmtInt.format(pois.length)],
    ["Nearest", pois[0] ? fmtDist(pois[0].dist) : "—"],
  ].forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "card";
    const h = document.createElement("h3");
    h.textContent = label;
    const v = document.createElement("div");
    v.className = "value";
    v.textContent = value;
    card.append(h, v);
    kpis.appendChild(card);
  });
}

function renderList(pois) {
  const list = $("list");
  list.innerHTML = "";

  if (!pois.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No stores match the current search and filters.";
    list.appendChild(li);
    return;
  }

  let openBody = null;
  pois.slice(0, 100).forEach((p) => {
    const li = document.createElement("li");

    const head = document.createElement("div");
    head.className = "poi-head";
    const name = document.createElement("div");
    name.className = "poi-name";
    name.textContent = p.name || "Store";
    const dist = document.createElement("div");
    dist.className = "poi-dist";
    dist.textContent = fmtDist(p.dist);
    head.append(name, dist);

    const body = buildDetails(p);
    body.hidden = true;
    li.append(head, body);

    head.onclick = () => {
      if (openBody && openBody !== body) openBody.hidden = true;
      body.hidden = !body.hidden;
      openBody = body.hidden ? null : body;
      if (!body.hidden) {
        view.goTo({ target: p.geometry, zoom: 17 }, { duration: 500 }).catch(() => { });
      }
    };
    list.appendChild(li);
  });
}

// Fetch with the current filters and redraw. zoom=true re-frames the map on the search area.
async function showResults(zoom) {
  const { point, label, radiusM } = lastSearch;
  const features = await fetchPois(point, radiusM);

  const pois = features
    .map((f) => {
      return {
        geometry: f.geometry,
        attrs: f.attributes,
        name: f.attributes[NAME_FIELD],
        dist: haversineM(point.longitude, point.latitude, f.geometry.longitude, f.geometry.latitude),
      };
    })
    .sort((a, b) => a.dist - b.dist);

  const ring = await drawSearchArea(point, radiusM);
  drawPois(pois);

  $("hint").hidden = true;
  $("matched").textContent = label;
  $("results").hidden = false;
  renderKpis(pois);
  renderList(pois);

  if (zoom) await view.goTo(ring.extent.expand(1.3), { duration: 600 }).catch(() => { });
}

// Wraps a search/filter action with the status text, error box and disabled buttons
async function run(action) {
  const buttons = document.querySelectorAll("#searchForm button");
  setError("");
  buttons.forEach((b) => (b.disabled = true));
  $("status").textContent = "Searching…";
  try {
    await action();
  } catch (err) {
    console.error(err);
    setError(err.message || "Search failed");
  } finally {
    buttons.forEach((b) => (b.disabled = false));
    $("status").textContent = "Ready";
  }
}

// ---------- Events ----------
$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  search.search(); // runs the typed text, select-result above does the rest
});

// changing the radius re-runs the current search
radiusSelect.addEventListener("change", () => {
  if (!lastSearch) return;
  lastSearch.radiusM = Number(radiusSelect.value);
  run(() => showResults(true));
});

$("applyFilters").onclick = () => {
  updateFilterButton();
  if (lastSearch) {
    lastSearch.radiusM = Number($("radius").value); // pick up a changed radius too
    run(() => showResults(false));
  } // otherwise the filters apply to the next search
};

$("clearFilters").onclick = () => {
  Object.values(selected).forEach((set) => set.clear());
  document.querySelectorAll("#filterPanel input[type=checkbox]").forEach((cb) => (cb.checked = false));
  updateFilterButton();
  if (lastSearch) run(() => showResults(false));
};