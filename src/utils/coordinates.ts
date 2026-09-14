import proj4 from 'proj4';

export const KONAK_CENTER = { lat: 38.4192, lng: 27.1287 };

const METERS_PER_LAT = 111320;
const METERS_PER_LNG = 111320 * Math.cos(KONAK_CENTER.lat * (Math.PI / 180));

export function convertGpsToVector(lat: number, lng: number): [number, number, number] {
  const x = (lng - KONAK_CENTER.lng) * METERS_PER_LNG;
  const z = -(lat - KONAK_CENTER.lat) * METERS_PER_LAT;
  return [x, getSimulatedElevation(lat, lng) + 15, z];
}

export function convertVectorToGps(x: number, z: number): [number, number] {
  const lat = (-z / METERS_PER_LAT) + KONAK_CENTER.lat;
  const lng = (x / METERS_PER_LNG) + KONAK_CENTER.lng;
  return [lat, lng];
}

const WGS84 = 'EPSG:4326';
const UTM35N = '+proj=utm +zone=35 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';

export function convertGpsToUtm(lat: number, lng: number): [number, number] {
  return proj4(WGS84, UTM35N, [lng, lat]);
}

export function convertUtmToGps(utmX: number, utmY: number): [number, number] {
  const [lng, lat] = proj4(UTM35N, WGS84, [utmX, utmY]);
  return [lat, lng];
}

// Izmir Dogu ve Guney sirtlari (Buca/Bornova vb.) icin sahte rakim algoritmasi
export function getSimulatedElevation(lat: number, lng: number): number {
    return 0; // Matrix hatasi duzeltildi, sehir tekrar duz :)
}
