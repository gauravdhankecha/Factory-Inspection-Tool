import { NextResponse } from 'next/server';
import { db, audit } from '@/lib/db';
import { hashPassword, createSessionCookie, userCount, jsonError } from '@/lib/auth';
import { validUsername } from '@/lib/users';

export const dynamic = 'force-dynamic';

// First run only: creates the officer's (admin) account while no user exists yet.
export async function POST(req) {
  if ((await userCount()) > 0) return jsonError(403, 'સેટઅપ પહેલેથી થઈ ગયું છે — લૉગિન કરો', 'already_setup');
  let body;
  try { body = await req.json(); } catch (e) { return jsonError(400, 'ખોટી વિનંતી', 'bad_json'); }
  const username = String(body.username || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  if (!validUsername(username)) return jsonError(400, 'યુઝરનેમ: ૩–૩૦ અંગ્રેજી અક્ષર/આંકડા (a-z, 0-9, . _ -)', 'bad_username');
  if (!name) return jsonError(400, 'નામ લખો', 'bad_name');
  if (password.length < 8) return jsonError(400, 'પાસવર્ડ ઓછામાં ઓછો ૮ અક્ષરનો રાખો', 'weak_password');
  const s = await db();
  const usersCol = s.collection('users');
  const count = await usersCol.countDocuments();
  if (count > 0) return jsonError(403, 'સેટઅપ પહેલેથી થઈ ગયું છે — લૉગિન કરો', 'already_setup');
  const hash = await hashPassword(password);
  const newUser = {
    id: 1,
    username,
    name,
    password_hash: hash,
    role: 'admin',
    active: true,
    created_at: new Date(),
  };
  await usersCol.insertOne(newUser);
  const res = NextResponse.json({ ok: true });
  await createSessionCookie(res, newUser);
  await audit(newUser, 'setup');
  return res;
}
