'use client';

import { useState } from 'react';
import Brand from './Brand';

// Sign-in form, and (mode="setup") the first-run form that creates the officer's admin account.
export default function AuthForm({ mode }) {
  const setup = mode === 'setup';
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f.entries());
    if (setup && body.password !== body.password2) { setMsg('બંને પાસવર્ડ એકસરખા નથી'); return; }
    setBusy(true); setMsg('');
    try {
      const res = await fetch(setup ? '/api/auth/setup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(data.error || 'ભૂલ આવી, ફરી પ્રયત્ન કરો'); setBusy(false); return; }
      window.location.href = setup ? '/admin' : '/';
    } catch (err) {
      setMsg('સર્વર સુધી પહોંચાયું નહીં — ઇન્ટરનેટ તપાસો'); setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <Brand
          title="Welcome to DISH"
          sub={setup ? 'પહેલી વાર સેટઅપ — અધિકારી (એડમિન) ખાતું બનાવો' : 'નવસારી કચેરી — લૉગિન કરો'}
        />
        {setup && (
          <>
            <label htmlFor="name">તમારું નામ</label>
            <input type="text" id="name" name="name" required defaultValue="શ્રી જી. એલ. ઢાંકેચા" />
          </>
        )}
        <label htmlFor="username">યુઝરનેમ (અંગ્રેજીમાં)</label>
        <input type="text" id="username" name="username" required autoComplete="username" autoCapitalize="none" spellCheck="false" />
        <label htmlFor="password">પાસવર્ડ</label>
        <input type="password" id="password" name="password" required autoComplete={setup ? 'new-password' : 'current-password'} minLength={setup ? 8 : undefined} />
        {setup && (
          <>
            <label htmlFor="password2">પાસવર્ડ ફરીથી</label>
            <input type="password" id="password2" name="password2" required autoComplete="new-password" minLength={8} />
            <p className="hint">ઓછામાં ઓછા ૮ અક્ષર. સાહેબ અને ક્લાર્કના ખાતા પછી "વપરાશકર્તા" પેજમાંથી બનાવી શકશો.</p>
          </>
        )}
        <button className="btn" type="submit" disabled={busy}>{busy ? 'રાહ જુઓ…' : setup ? 'ખાતું બનાવો' : 'લૉગિન'}</button>
        <div className="formmsg error" role="alert">{msg}</div>
      </form>
    </div>
  );
}
