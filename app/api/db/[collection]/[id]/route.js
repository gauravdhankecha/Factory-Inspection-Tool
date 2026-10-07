import { NextResponse } from 'next/server';
import { db, audit } from '@/lib/db';
import { requireUser, jsonError } from '@/lib/auth';
import { checkPath, describe } from '@/lib/collections';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { collection, id } = await params;
  const bad = checkPath(collection, id);
  if (bad) return jsonError(400, bad, 'bad_path');
  const { response } = await requireUser('read');
  if (response) return response;
  const s = await db();
  const row = await s.collection('docs').findOne({ collection, id });
  if (!row) return jsonError(404, 'મળ્યું નહીં', 'not_found');
  return NextResponse.json({ item: row.data });
}

// Create or replace a document.
export async function PUT(req, { params }) {
  const { collection, id } = await params;
  const bad = checkPath(collection, id);
  if (bad) return jsonError(400, bad, 'bad_path');
  const { user, response } = await requireUser('write');
  if (response) return response;
  let data;
  try { data = await req.json(); } catch (e) { return jsonError(400, 'ખોટો ડેટા', 'bad_json'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return jsonError(400, 'ખોટો ડેટા', 'bad_json');
  const s = await db();
  const docsCol = s.collection('docs');
  const prev = await docsCol.findOne({ collection, id }, { projection: { _id: 1 } });
  await docsCol.updateOne(
    { collection, id },
    {
      $set: {
        collection,
        id,
        data,
        updated_at: new Date(),
        updated_by: user.username,
      },
    },
    { upsert: true }
  );
  await audit(user, prev ? 'update' : 'create', collection, id, describe(collection, data));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { collection, id } = await params;
  const bad = checkPath(collection, id);
  if (bad) return jsonError(400, bad, 'bad_path');
  const { user, response } = await requireUser('delete');
  if (response) return response;
  const s = await db();
  const docsCol = s.collection('docs');
  const row = await docsCol.findOneAndDelete({ collection, id });
  const deletedData = row?.data || row?.value?.data;
  if (deletedData) await audit(user, 'delete', collection, id, describe(collection, deletedData));
  return NextResponse.json({ ok: true });
}
