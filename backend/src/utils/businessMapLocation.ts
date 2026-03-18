/** Structured map data on Business — URLs, coords, optional Places id; mapGeo for MongoDB geo queries. */

export type BusinessMapLocationApi = {
  googleMapsUrl?: string;
  googleReviewsUrl?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
};

export type MapGeoPoint = { type: 'Point'; coordinates: [number, number] };

function toPlainMap(existing: unknown): Record<string, unknown> {
  if (!existing || typeof existing !== 'object') return {};
  const o = existing as { toObject?: () => Record<string, unknown> };
  if (typeof o.toObject === 'function') return { ...o.toObject() };
  return { ...(existing as Record<string, unknown>) };
}

function buildGeo(lat: number, lng: number): MapGeoPoint {
  return { type: 'Point', coordinates: [lng, lat] };
}

export function mapLocationFromCreateBody(ml: unknown): {
  mapLocation?: Record<string, unknown>;
  mapGeo?: MapGeoPoint | undefined;
} {
  if (!ml || typeof ml !== 'object' || Array.isArray(ml)) {
    return {};
  }
  const o = ml as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of ['googleMapsUrl', 'googleReviewsUrl', 'placeId']) {
    if (typeof o[k] === 'string') {
      const t = o[k].trim();
      if (t) out[k] = t;
    }
  }
  let lat: number | undefined;
  let lng: number | undefined;
  if (o.latitude !== undefined && o.latitude !== null && String(o.latitude).trim() !== '') {
    const n = Number(o.latitude);
    if (!Number.isNaN(n) && n >= -90 && n <= 90) lat = n;
  }
  if (o.longitude !== undefined && o.longitude !== null && String(o.longitude).trim() !== '') {
    const n = Number(o.longitude);
    if (!Number.isNaN(n) && n >= -180 && n <= 180) lng = n;
  }
  if (lat !== undefined) out.latitude = lat;
  if (lng !== undefined) out.longitude = lng;
  if (Object.keys(out).length === 0) return {};
  const mapGeo =
    lat !== undefined && lng !== undefined ? buildGeo(lat, lng) : undefined;
  return { mapLocation: out, mapGeo };
}

export function mergeMapLocationPatch(
  existing: unknown,
  ml: Record<string, unknown>,
): { mapLocation: Record<string, unknown> | undefined; mapGeo: MapGeoPoint | undefined } {
  const base = toPlainMap(existing);
  for (const k of ['googleMapsUrl', 'googleReviewsUrl', 'placeId']) {
    if (k in ml) {
      const v = ml[k];
      if (v === null || v === '') delete base[k];
      else if (typeof v === 'string') {
        const t = v.trim();
        if (t) base[k] = t;
        else delete base[k];
      }
    }
  }
  if ('latitude' in ml) {
    const v = ml.latitude;
    if (v === null || v === '') delete base.latitude;
    else {
      const n = Number(v);
      if (!Number.isNaN(n) && n >= -90 && n <= 90) base.latitude = n;
      else delete base.latitude;
    }
  }
  if ('longitude' in ml) {
    const v = ml.longitude;
    if (v === null || v === '') delete base.longitude;
    else {
      const n = Number(v);
      if (!Number.isNaN(n) && n >= -180 && n <= 180) base.longitude = n;
      else delete base.longitude;
    }
  }
  const lat = base.latitude;
  const lng = base.longitude;
  const mapGeo =
    typeof lat === 'number' && typeof lng === 'number' ? buildGeo(lat, lng) : undefined;
  const keys = Object.keys(base).filter((k) => base[k] !== undefined && base[k] !== '');
  if (keys.length === 0) {
    return { mapLocation: undefined, mapGeo: undefined };
  }
  const mapLocation: Record<string, unknown> = {};
  for (const k of keys) {
    mapLocation[k] = base[k];
  }
  return { mapLocation, mapGeo };
}

export function mapLocationToApi(doc: { mapLocation?: unknown }): BusinessMapLocationApi | undefined {
  const m = doc.mapLocation;
  if (!m || typeof m !== 'object') return undefined;
  const raw = toPlainMap(m);
  const out: BusinessMapLocationApi = {};
  for (const k of ['googleMapsUrl', 'googleReviewsUrl', 'placeId'] as const) {
    if (typeof raw[k] === 'string' && raw[k]) out[k] = raw[k];
  }
  if (typeof raw.latitude === 'number' && !Number.isNaN(raw.latitude)) {
    out.latitude = raw.latitude;
  }
  if (typeof raw.longitude === 'number' && !Number.isNaN(raw.longitude)) {
    out.longitude = raw.longitude;
  }
  if (Object.keys(out).length === 0) return undefined;
  return out;
}
