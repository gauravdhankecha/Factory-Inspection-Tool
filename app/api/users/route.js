import { NextResponse } from 'next/server';
import { db, audit } from '@/lib/db';
import { requireUser, hashPassword, jsonError } from '@/lib/auth';
import { validUsername, ROLE_KEYS } from '@/lib/users';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { response } = await requireUser('manage');
  if (response) return response;
  const s = await db();
  const rows = await s.collection('users')
    .find({}, { projection: { password_hash: 0, _id: 0 } })
    .sort({ id: 1 })
    .toArray();
  return NextResponse.json({ users: rows });
}

export async function POST(req) {
  const { user, response } = await requireUser('manage');
  if (response) return response;
  let body;
  try { body = await req.json(); } catch (e) { return jsonError(400, 'ખોટી વિનંતી', 'bad_json'); }
  const username = String(body.username || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  const role = String(body.role || '');
  if (!validUsername(username)) return jsonError(400, 'યુઝરનેમ: ૩–૩૦ અંગ્રેજી અક્ષર/આંકડા (a-z, 0-9, . _ -)', 'bad_username');
  if (!name) return jsonError(400, 'નામ લખો', 'bad_name');
  if (password.length < 8) return jsonError(400, 'પાસવર્ડ ઓછામાં ઓછો ૮ અક્ષરનો રાખો', 'weak_password');
  if (!ROLE_KEYS.includes(role)) return jsonError(400, 'ભૂમિકા પસંદ કરો', 'bad_role');
  const s = await db();
  const usersCol = s.collection('users');
  const exists = await usersCol.findOne({ username });
  if (exists) return jsonError(409, 'આ યુઝરનેમ પહેલેથી છે', 'exists');
  const lastUsers = await usersCol.find().sort({ id: -1 }).limit(1).toArray();
  const nextId = lastUsers.length && typeof lastUsers[0].id === 'number' ? lastUsers[0].id + 1 : 1;
  const newUser = {
    id: nextId,
    username,
    name,
    password_hash: await hashPassword(password),
    role,
    active: true,
    created_at: new Date(),
  };
  await usersCol.insertOne(newUser);
  await audit(user, 'user_create', 'users', username, role);
  const { password_hash, _id, ...safeUser } = newUser;
  return NextResponse.json({ user: safeUser });
}
