import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Latest activity: who changed what, and when.
export async function GET() {
  const { response } = await requireUser('manage');
  if (response) return response;
  const s = await db();
  const rows = await s.collection('audit_log').find().sort({ at: -1, _id: -1 }).limit(200).toArray();
  const entries = rows.map((r) => ({
    id: r._id.toString(),
    at: r.at,
    username: r.username,
    action: r.action,
    collection: r.collection,
    doc_id: r.doc_id,
    summary: r.summary,
  }));
  return NextResponse.json({ entries });
}
