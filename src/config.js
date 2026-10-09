// ---- Settings: edit these ----

// AGOL API key (or any valid AGOL access token). Keep it in .env as VITE_ARCGIS_API_KEY.
// Needed privileges: "Geocoding (not stored)" and access to the POI layer item.
export const API_KEY = import.meta.env.VITE_ARCGIS_API_KEY || "PASTE_API_KEY_HERE";

// World Geocoder (ArcGIS Online): address search and suggestions only
export const GEOCODER_URL = "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
export const COUNTRY_CODE = "IN"; // narrows matches; set "" to search worldwide

// The enterprise key is only sent to URLs under this address
export const ENTERPRISE_SERVER = "https://apesriserver.asianpaints.com/server/rest/services";
export const ENTERPRISE_KEY = import.meta.env.VITE_ENTERPRISE_API_KEY || "PASTE_ENTERPRISE_KEY_HERE";

// The POI feature layer (use the layer URL including /FeatureServer/<n>)
export const POI_LAYER_URL =
  "https://apesriserver.asianpaints.com/server/rest/services/Hosted/Store_Location_India/FeatureServer/0";

// Store title in the sidebar and popup
export const NAME_FIELD = "pcc_name";

// Shown in the sidebar and map popup, in this order: [label, field]
export const DETAIL_FIELDS = [
  ["Division", "division"],
  ["Region", "region"],
  ["State", "name"],
  ["Retail format", "retailformat"],
  ["PCC", "pcc"],
  ["CC", "cc"],
  ["Tier PCC", "tier_pcc"],
  ["Tier CC", "tier_cc"],
  ["TY", "ty"],
];

// Filter groups. The checkbox values are read from the layer itself.
export const FILTERS = [
  { label: "Division", field: "division" },
  { label: "Region", field: "region" },
  { label: "State", field: "name" },
  { label: "Retail format", field: "retailformat" },
  { label: "Tier PCC", field: "tier_pcc" },
  { label: "Tier CC", field: "tier_cc" },
];

// Search radii in metres
export const RADII_M = [500, 1000, 2000, 5000];
export const DEFAULT_RADIUS_M = 1000;

// Map start
export const START_CENTER = [78.9629, 20.5937]; // India
export const START_ZOOM = 5;
