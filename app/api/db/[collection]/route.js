import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, jsonError } from '@/lib/auth';
import { checkPath } from '@/lib/collections';

export const dynamic = 'force-dynamic';

// List every document in a collection.
export async function GET(req, { params }) {
  const { collection } = await params;
  const bad = checkPath(collection);
  if (bad) return jsonError(400, bad, 'bad_path');
  const { response } = await requireUser('read');
  if (response) return response;
  const s = await db();
  const rows = await s.collection('docs').find({ collection }).sort({ id: 1 }).toArray();
  return NextResponse.json({ items: rows.map((r) => ({ id: r.id, data: r.data })) });
}
