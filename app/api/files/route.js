import { NextResponse } from 'next/server';
import { db, audit } from '@/lib/db';
import { requireUser, jsonError } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const MAX = 4 * 1024 * 1024; // Vercel accepts about 4.5 MB per request

// Upload a reply PDF; returns { id } that the page keeps as replyPdfAssetId.
export async function POST(req) {
  const { user, response } = await requireUser('write');
  if (response) return response;
  let form;
  try { form = await req.formData(); } catch (e) { return jsonError(400, 'ફાઇલ મળી નહીં', 'bad_form'); }
  const file = form.get('file');
  if (!file || typeof file === 'string') return jsonError(400, 'ફાઇલ મળી નહીં', 'no_file');
  if (file.size > MAX) return jsonError(413, 'ફાઇલ ૪ MB થી મોટી છે', 'too_large');
  const type = file.type || String(form.get('type') || 'application/octet-stream');
  if (type !== 'application/pdf') return jsonError(400, 'ફક્ત PDF ફાઇલ અપલોડ થઈ શકે', 'bad_type');
  const buf = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomUUID().replace(/-/g, '');
  const s = await db();
  await s.collection('files').insertOne({
    _id: id,
    id,
    name: file.name || 'reply.pdf',
    content_type: type,
    size: buf.length,
    data: buf,
    created_at: new Date(),
    created_by: user.username,
  });
  await audit(user, 'upload', 'files', id, file.name || null);
  return NextResponse.json({ id });
}
