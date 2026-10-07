import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(req) {
  const res = NextResponse.redirect(new URL('/login', req.url), 303);
  clearSessionCookie(res);
  return res;
}
