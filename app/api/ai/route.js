import { NextResponse } from 'next/server';
import { requireUser, jsonError } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

// Is "photo → form" switched on? (only when ANTHROPIC_API_KEY is set)
export async function GET() {
  const { response } = await requireUser('read');
  if (response) return response;
  return NextResponse.json({ enabled: !!process.env.ANTHROPIC_API_KEY });
}

// Read the field-form photos and return the JSON the form expects.
export async function POST(req) {
  const { response } = await requireUser('write');
  if (response) return response;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return jsonError(503, 'AI સુવિધા ચાલુ નથી (ANTHROPIC_API_KEY નથી)', 'sample_unavailable');

  let form;
  try { form = await req.formData(); } catch (e) { return jsonError(400, 'ફોટા મળ્યા નહીં', 'bad_form'); }
  const prompt = String(form.get('prompt') || '');
  const images = form.getAll('images').filter((f) => f && typeof f !== 'string');
  if (!prompt || !images.length) return jsonError(400, 'ફોટા મળ્યા નહીં', 'no_images');
  if (images.length > 5) return jsonError(400, 'વધુમાં વધુ ૫ ફોટા', 'too_many');

  const content = [];
  for (const img of images) {
    const b64 = Buffer.from(await img.arrayBuffer()).toString('base64');
    const mt = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(img.type) ? img.type : 'image/jpeg';
    content.push({ type: 'image', source: { type: 'base64', media_type: mt, data: b64 } });
  }
  content.push({ type: 'text', text: prompt + '\n\nજવાબમાં ફક્ત એક JSON object આપો — બીજું કોઈ લખાણ નહીં.' });

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 8000, messages: [{ role: 'user', content }] }),
    });
  } catch (e) {
    return jsonError(502, 'AI સર્વર સુધી પહોંચાયું નહીં', 'failed');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body && body.error && body.error.message ? body.error.message : 'HTTP ' + res.status;
    return jsonError(502, 'AI ભૂલ: ' + msg, res.status === 429 ? 'rate_limited' : 'failed');
  }
  const text = (body.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return jsonError(502, 'AI નો જવાબ વાંચી શકાયો નહીં', 'bad_output');
  try {
    return NextResponse.json({ result: JSON.parse(text.slice(start, end + 1)) });
  } catch (e) {
    return jsonError(502, 'AI નો જવાબ વાંચી શકાયો નહીં', 'bad_output');
  }
}
