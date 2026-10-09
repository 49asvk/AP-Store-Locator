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

// Field names in the uploaded stores layer (case-sensitive, check the layer's REST page)
export const FIELDS = {
  name: "name",
  products: "products",
  services: "services",
  phone: "phone",
  email: "email",
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
