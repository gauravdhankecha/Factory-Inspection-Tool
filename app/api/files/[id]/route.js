import { db } from '@/lib/db';
import { requireUser, jsonError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Open an uploaded reply PDF (also reachable as /_blob/<id>, see next.config.mjs).
export async function GET(req, { params }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return jsonError(400, 'ખોટી id', 'bad_id');
  const { response } = await requireUser('read');
  if (response) return response;
  const s = await db();
  const f = await s.collection('files').findOne({ id });
  if (!f) return jsonError(404, 'ફાઇલ મળી નહીં', 'not_found');
  const rawData = f.data?.buffer ? Buffer.from(f.data.buffer) : f.data;
  return new Response(rawData, {
    headers: {
      'Content-Type': f.content_type || 'application/pdf',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(f.name || 'reply.pdf')}`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
