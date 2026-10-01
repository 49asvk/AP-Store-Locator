// ---- Settings: edit these ----

// AGOL API key (or any valid AGOL access token). Keep it in .env as VITE_ARCGIS_API_KEY.
// Needed privileges: "Geocoding (not stored)" and access to the POI layer item.
export const API_KEY = import.meta.env.VITE_ARCGIS_API_KEY || "PASTE_API_KEY_HERE";

// World Geocoder. Used for single address search only, never for storage.
export const GEOCODER_URL =
  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
export const COUNTRY_CODE = "IN"; // narrows matches; set "" to search worldwide

// The POI feature layer (use the layer URL including /FeatureServer/<n>)
export const POI_LAYER_URL =
  "https://services7.arcgis.com/8phUg7DrlXpKgLyA/arcgis/rest/services/Store_Points_Synthetic/FeatureServer/0";

// Field names in the uploaded stores layer (case-sensitive, check the layer's REST page)
export const FIELDS = {
  name: "Name",
  products: "Products",
  services: "Services",
  phone: "Phone",
  email: "Email",
};

// Filter checkbox values (must match the values in the data exactly)
export const PRODUCT_OPTIONS = ["Paints", "Stencils", "Wall Textures", "Waterproofing", "Wood Finishes"];
export const SERVICE_OPTIONS = [
  "4 pics service",
  "Color visualization",
  "Digital visualization",
  "Machine tinting",
  "Safe painting service",
];

// Search radii in metres
export const RADII_M = [500, 1000, 2000, 5000];
export const DEFAULT_RADIUS_M = 1000;

// Map start
export const START_CENTER = [78.9629, 20.5937]; // India
export const START_ZOOM = 5;
