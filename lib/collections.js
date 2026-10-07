// Only these collections exist in the tool; anything else is refused.
export const COLLECTIONS = ['inspections', 'diary', 'settings'];
const ID_RE = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;

export function checkPath(collection, id) {
  if (!COLLECTIONS.includes(collection)) return 'અજાણ્યું collection';
  if (id !== undefined && !ID_RE.test(id)) return 'ખોટી id';
  return null;
}

// A short human description of a record for the activity log.
export function describe(collection, data) {
  if (!data || typeof data !== 'object') return null;
  if (collection === 'inspections') return [data.factory, data.noticeNo, data.status].filter(Boolean).join(' · ').slice(0, 200);
  if (collection === 'diary') return [data.date, data.work].filter(Boolean).join(' · ').slice(0, 200);
  return null;
}
