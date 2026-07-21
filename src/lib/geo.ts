/**
 * Haversine formula — calculates distance in meters between two lat/lng points.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if cleaner is within the geofence radius of the job location.
 */
export function isWithinGeofence(
  cleanerLat: number,
  cleanerLon: number,
  jobLat: number,
  jobLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(cleanerLat, cleanerLon, jobLat, jobLon);
  return distance <= radiusMeters;
}
