# POI Finder

Type an address, geocode it with the ArcGIS World Geocoder, then list and map the points of interest from an ArcGIS Online feature layer within a chosen radius.

Everything runs through ArcGIS Online. No enterprise portal is involved.

Stack: Vite + vanilla JS + ArcGIS Maps SDK for JavaScript (`@arcgis/core`).

## How it avoids credits

- **Geocoding:** single-address search with `forStorage: false`. Esri documents geosearch as non-credit (up to 1M/month). Never switch `forStorage` to true.
- **Buffer:** the feature query uses `distance` + `units`, so the server buffers the point. The circle drawn on the map is computed in the browser.
- **POIs:** a plain feature layer query. Hosted feature layer queries do not consume credits.
- **Basemap:** OSM, so no ArcGIS basemap usage.

## Setup

1. `npm install`
2. Create an API key in ArcGIS Online (Content > New item > Developer credentials). Grant the "Geocoding (not stored)" privilege, and give it access to your POI layer item (or make the layer public).
3. Copy `.env.example` to `.env` and paste the key.
4. Edit `src/config.js`: `POI_LAYER_URL`, `POI_NAME_FIELD`, `POI_CATEGORY_FIELD`, `COUNTRY_CODE`, radii.
5. `npm run dev`

## Deploy (GitHub Pages)

1. Push to GitHub on `main`.
2. Settings > Pages > Source: **GitHub Actions**.
3. Settings > Secrets and variables > Actions: add `VITE_ARCGIS_API_KEY`.
4. In ArcGIS Online, restrict the API key to your Pages URL (referrer). The key is visible in the built JavaScript, so this restriction is what protects it.
