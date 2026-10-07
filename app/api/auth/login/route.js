import { NextResponse } from 'next/server';
import { db, audit } from '@/lib/db';
import { checkPassword, createSessionCookie, jsonError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch (e) { return jsonError(400, 'ખોટી વિનંતી', 'bad_json'); }
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!username || !password) return jsonError(400, 'યુઝરનેમ અને પાસવર્ડ લખો', 'missing');
  const s = await db();
  const u = await s.collection('users').findOne({ username });
  // same message for "no such user" and "wrong password"
  if (!u || !u.active || !(await checkPassword(password, u.password_hash))) {
    await new Promise((r) => setTimeout(r, 600));
    return jsonError(401, 'યુઝરનેમ અથવા પાસવર્ડ ખોટો છે', 'bad_login');
  }
  const res = NextResponse.json({ ok: true });
  await createSessionCookie(res, u);
  await audit(u, 'login');
  return res;
}
