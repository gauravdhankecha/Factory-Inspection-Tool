import { NextResponse } from 'next/server';
import { db, audit } from '@/lib/db';
import { requireUser, jsonError } from '@/lib/auth';
import { COLLECTIONS } from '@/lib/collections';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Download all data as one JSON file: { inspections: [...], diary: [...], settings: { officer: {...} } }
export async function GET() {
  const { user, response } = await requireUser('manage');
  if (response) return response;
  const s = await db();
  const rows = await s.collection('docs').find().sort({ collection: 1, id: 1 }).toArray();
  const out = { exportedAt: new Date().toISOString(), inspections: [], diary: [], settings: {} };
  for (const r of rows) {
    if (r.collection === 'settings') out.settings[r.id] = r.data;
    else if (out[r.collection]) out[r.collection].push({ ...r.data, id: r.data.id || r.id });
  }
  await audit(user, 'backup_download');
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(out, null, 1), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="inspection-backup-${day}.json"`,
    },
  });
}

// Load a backup file (the same shape as above). Records with the same id are replaced; others are kept.
export async function POST(req) {
  const { user, response } = await requireUser('manage');
  if (response) return response;
  let data;
  try { data = await req.json(); } catch (e) { return jsonError(400, 'JSON ફાઇલ વાંચી શકાઈ નહીં', 'bad_json'); }
  const docs = [];
  for (const c of ['inspections', 'diary']) {
    for (const d of Array.isArray(data[c]) ? data[c] : []) {
      if (d && typeof d === 'object' && typeof d.id === 'string' && d.id) docs.push([c, d.id, d]);
    }
  }
  if (data.settings && typeof data.settings === 'object') {
    for (const [id, v] of Object.entries(data.settings)) if (v && typeof v === 'object') docs.push(['settings', id, v]);
  }
  if (!docs.length) return jsonError(400, 'ફાઇલમાં કોઈ રેકોર્ડ નથી', 'empty');
  const s = await db();
  const docsCol = s.collection('docs');
  const bulkOps = docs
    .filter(([c]) => COLLECTIONS.includes(c))
    .map(([c, id, d]) => ({
      updateOne: {
        filter: { collection: c, id },
        update: {
          $set: {
            collection: c,
            id,
            data: d,
            updated_at: new Date(),
            updated_by: user.username,
          },
        },
        upsert: true,
      },
    }));
  if (bulkOps.length) {
    await docsCol.bulkWrite(bulkOps);
  }
  const counts = docs.reduce((m, [c]) => ((m[c] = (m[c] || 0) + 1), m), {});
  await audit(user, 'backup_import', null, null, JSON.stringify(counts));
  return NextResponse.json({ ok: true, counts });
}
