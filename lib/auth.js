import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from './db';

export const COOKIE = 'insp_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// What each role may do:
//   admin  – the officer: everything, including users, deleting cases and backups
//   clerk  – data entry: create and edit cases / diary, but not delete
//   viewer – sir: sees all data, changes nothing
export const ROLES = {
  admin: { label: 'અધિકારી (એડમિન)', canWrite: true, canDelete: true, canManage: true },
  clerk: { label: 'ક્લાર્ક (ડેટા એન્ટ્રી)', canWrite: true, canDelete: false, canManage: false },
  viewer: { label: 'સાહેબ (ફક્ત જોવું)', canWrite: false, canDelete: false, canManage: false },
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error('AUTH_SECRET સેટ નથી અથવા ૩૨ અક્ષરથી ટૂંકો છે');
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}
export async function checkPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

export async function createSessionCookie(res, user) {
  const token = await new SignJWT({ uid: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE)
    .sign(secret());
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(res) {
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

// The signed-in user, read fresh from the database on every request so that
// switching a user off or changing their role takes effect immediately.
export async function currentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  let uid;
  try {
    const { payload } = await jwtVerify(token, secret());
    uid = payload.uid;
  } catch (e) {
    return null;
  }
  const s = await db();
  const u = await s.collection('users').findOne({ id: uid, active: true }, { projection: { password_hash: 0 } });
  if (!u) return null;
  return { ...u, perms: ROLES[u.role] || ROLES.viewer };
}

export async function userCount() {
  const s = await db();
  return await s.collection('users').countDocuments();
}

export function jsonError(status, error, code) {
  return NextResponse.json({ error, code }, { status });
}

// For route handlers: returns { user } or { response } to send back straight away.
export async function requireUser(need) {
  const user = await currentUser();
  if (!user) return { response: jsonError(401, 'લૉગિન જરૂરી છે', 'unauthorized') };
  if (need === 'write' && !user.perms.canWrite)
    return { response: jsonError(403, 'તમારી પાસે ફક્ત જોવાની પરવાનગી છે — ફેરફાર સેવ થયો નથી.', 'forbidden') };
  if (need === 'delete' && !user.perms.canDelete)
    return { response: jsonError(403, 'કાઢી નાખવાની પરવાનગી ફક્ત અધિકારીને છે.', 'forbidden') };
  if (need === 'manage' && !user.perms.canManage)
    return { response: jsonError(403, 'આ કામ ફક્ત અધિકારી (એડમિન) કરી શકે.', 'forbidden') };
  return { user };
}
