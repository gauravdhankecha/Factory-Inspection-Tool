import { NextResponse } from 'next/server';
import { db, audit } from '@/lib/db';
import { requireUser, hashPassword, jsonError } from '@/lib/auth';
import { ROLE_KEYS } from '@/lib/users';

export const dynamic = 'force-dynamic';

// Change a user's name, role, password, or switch them on/off.
export async function PATCH(req, { params }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) return jsonError(400, 'ખોટી id', 'bad_id');
  const { user, response } = await requireUser('manage');
  if (response) return response;
  let body;
  try { body = await req.json(); } catch (e) { return jsonError(400, 'ખોટી વિનંતી', 'bad_json'); }
  const s = await db();
  const usersCol = s.collection('users');
  const target = await usersCol.findOne({ id });
  if (!target) return jsonError(404, 'વપરાશકર્તા મળ્યા નહીં', 'not_found');

  const isSelf = target.id === user.id;
  if (isSelf && ((body.role && body.role !== 'admin') || body.active === false))
    return jsonError(400, 'તમે પોતાની એડમિન પરવાનગી કે ખાતું બંધ કરી શકો નહીં', 'self_lockout');

  const changes = [];
  const updateFields = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return jsonError(400, 'નામ લખો', 'bad_name');
    updateFields.name = name;
    changes.push('name');
  }
  if (body.role !== undefined) {
    if (!ROLE_KEYS.includes(body.role)) return jsonError(400, 'ભૂમિકા પસંદ કરો', 'bad_role');
    updateFields.role = body.role;
    changes.push('role=' + body.role);
  }
  if (body.active !== undefined) {
    updateFields.active = !!body.active;
    changes.push(body.active ? 'on' : 'off');
  }
  if (body.password !== undefined) {
    const pw = String(body.password);
    if (pw.length < 8) return jsonError(400, 'પાસવર્ડ ઓછામાં ઓછો ૮ અક્ષરનો રાખો', 'weak_password');
    updateFields.password_hash = await hashPassword(pw);
    changes.push('password');
  }
  if (Object.keys(updateFields).length > 0) {
    await usersCol.updateOne({ id }, { $set: updateFields });
  }
  await audit(user, 'user_update', 'users', target.username, changes.join(', '));
  const updated = await usersCol.findOne({ id }, { projection: { password_hash: 0, _id: 0 } });
  return NextResponse.json({ user: updated });
}
