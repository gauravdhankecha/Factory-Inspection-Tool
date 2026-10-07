'use client';

import { useEffect, useState } from 'react';

const ACTIONS = {
  login: 'લૉગિન',
  setup: 'પહેલું સેટઅપ',
  create: 'નવું ઉમેર્યું',
  update: 'ફેરફાર',
  delete: 'કાઢી નાખ્યું',
  upload: 'PDF અપલોડ',
  user_create: 'વપરાશકર્તા બનાવ્યા',
  user_update: 'વપરાશકર્તા ફેરફાર',
  backup_download: 'બેકઅપ ડાઉનલોડ',
  backup_import: 'ડેટા ઇમ્પોર્ટ',
};
const COLL = { inspections: 'ઇન્સ્પેક્શન', diary: 'ડાયરી', settings: 'સેટિંગ', users: 'વપરાશકર્તા', files: 'ફાઇલ' };

async function call(url, init) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { window.location.href = '/login'; throw new Error('લૉગિન જરૂરી'); }
  if (!res.ok) throw new Error(data.error || 'ભૂલ આવી');
  return data;
}

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return String(ts); }
}

export default function AdminPanel({ me, roles }) {
  const roleLabel = Object.fromEntries(roles.map((r) => [r.key, r.label]));
  const [users, setUsers] = useState([]);
  const [log, setLog] = useState([]);
  const [msg, setMsg] = useState({ text: '', kind: '' });
  const [importMsg, setImportMsg] = useState({ text: '', kind: '' });
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [u, a] = await Promise.all([call('/api/users'), call('/api/audit')]);
      setUsers(u.users); setLog(a.entries);
    } catch (e) { setMsg({ text: e.message, kind: 'error' }); }
  }
  useEffect(() => { load(); }, []);

  async function addUser(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    try {
      await call('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      form.reset();
      setMsg({ text: `"${body.username}" નું ખાતું બન્યું — યુઝરનેમ અને પાસવર્ડ તેમને આપો.`, kind: 'ok' });
      load();
    } catch (err) { setMsg({ text: err.message, kind: 'error' }); }
    setBusy(false);
  }

  async function patch(u, change, okText) {
    try {
      await call('/api/users/' + u.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change) });
      setMsg({ text: okText, kind: 'ok' });
      load();
    } catch (err) { setMsg({ text: err.message, kind: 'error' }); load(); }
  }

  function resetPassword(u) {
    const pw = window.prompt(`${u.name} (${u.username}) માટે નવો પાસવર્ડ (ઓછામાં ઓછા ૮ અક્ષર):`);
    if (!pw) return;
    patch(u, { password: pw }, `${u.username} નો પાસવર્ડ બદલાયો.`);
  }

  async function importFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImportMsg({ text: 'ઇમ્પોર્ટ થાય છે…', kind: '' });
    try {
      const text = await file.text();
      JSON.parse(text);
      const r = await call('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: text });
      const c = r.counts || {};
      setImportMsg({ text: `ઇમ્પોર્ટ પૂરું: ઇન્સ્પેક્શન ${c.inspections || 0}, ડાયરી ${c.diary || 0}, સેટિંગ ${c.settings || 0}.`, kind: 'ok' });
      load();
    } catch (err) {
      setImportMsg({ text: 'ઇમ્પોર્ટ થયું નહીં: ' + (err instanceof SyntaxError ? 'આ JSON ફાઇલ નથી' : err.message), kind: 'error' });
    }
    e.target.value = '';
  }

  return (
    <>
      <header id="topbar">
        <div className="brandtext"><b>વપરાશકર્તા / બેકઅપ</b><span>{me.name} · {me.roleLabel}</span></div>
        <div className="topright usermenu">
          <a href="/">← ટૂલ પર પાછા</a>
          <form method="post" action="/api/auth/logout"><button type="submit">લૉગઆઉટ</button></form>
        </div>
      </header>
      <main className="admin-main">
        <div className="card">
          <h2>વપરાશકર્તા</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            <b>અધિકારી</b> — બધું, કેસ કાઢી નાખવા અને આ પેજ. <b>ક્લાર્ક</b> — નવા ઇન્સ્પેક્શન, ફેરફાર, ડાયરી (કાઢી નહીં શકે).{' '}
            <b>સાહેબ</b> — બધો ડેટા જોઈ શકે અને ડાઉનલોડ કરી શકે, ફેરફાર નહીં.
          </p>
          {users.map((u) => (
            <div className="userrow" key={u.id}>
              <div className="uname">
                <b>{u.name}{u.id === me.id ? ' (તમે)' : ''}</b>
                <span>{u.username}{u.active ? '' : ' · બંધ'}</span>
              </div>
              <select
                value={u.role}
                disabled={u.id === me.id}
                onChange={(e) => patch(u, { role: e.target.value }, `${u.username} ની ભૂમિકા: ${roleLabel[e.target.value]}`)}
                aria-label="ભૂમિકા"
              >
                {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <button className="btn small secondary" type="button" onClick={() => resetPassword(u)}>પાસવર્ડ બદલો</button>
              {u.id !== me.id && (
                <button
                  className={'btn small ' + (u.active ? 'danger' : 'secondary')}
                  type="button"
                  onClick={() => patch(u, { active: !u.active }, u.active ? `${u.username} નું ખાતું બંધ કર્યું.` : `${u.username} નું ખાતું ચાલુ કર્યું.`)}
                >
                  {u.active ? 'ખાતું બંધ કરો' : 'ફરી ચાલુ કરો'}
                </button>
              )}
            </div>
          ))}
          <div className={'formmsg ' + msg.kind} role="status">{msg.text}</div>
        </div>

        <form className="card" onSubmit={addUser}>
          <h2>નવું ખાતું બનાવો</h2>
          <div className="grid2">
            <div><label htmlFor="nu-name">નામ</label><input type="text" id="nu-name" name="name" required placeholder="દા.ત. શ્રી … સાહેબ" /></div>
            <div>
              <label htmlFor="nu-role">ભૂમિકા</label>
              <select id="nu-role" name="role" defaultValue="clerk">
                {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
            <div><label htmlFor="nu-user">યુઝરનેમ (અંગ્રેજીમાં)</label><input type="text" id="nu-user" name="username" required autoCapitalize="none" spellCheck="false" placeholder="દા.ત. clerk1" /></div>
            <div><label htmlFor="nu-pass">પાસવર્ડ</label><input type="password" id="nu-pass" name="password" required minLength={8} autoComplete="new-password" /></div>
          </div>
          <button className="btn" type="submit" disabled={busy}>ખાતું બનાવો</button>
        </form>

        <div className="card">
          <h2>બેકઅપ અને જૂનો ડેટા</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            બધો ડેટા એક JSON ફાઇલમાં ડાઉનલોડ કરો (દર અઠવાડિયે રાખવા જેવું). જૂના Claude ટૂલનો ડેટા પ્રોજેક્ટના{' '}
            <code>data/inspection-backup.json</code> માં છે — એ ફાઇલ નીચે ઇમ્પોર્ટ કરો.
          </p>
          <div className="row">
            <a className="btn secondary" href="/api/backup">બેકઅપ ડાઉનલોડ કરો</a>
          </div>
          <label htmlFor="imp">બેકઅપ / જૂનો ડેટા ઇમ્પોર્ટ કરો (.json)</label>
          <input type="file" id="imp" accept=".json,application/json" onChange={importFile} />
          <p className="hint">એ જ id વાળા રેકોર્ડ બદલાઈ જશે, બાકીના એમ જ રહેશે.</p>
          <div className={'formmsg ' + importMsg.kind} role="status">{importMsg.text}</div>
        </div>

        <div className="card">
          <h2>તાજેતરની પ્રવૃત્તિ</h2>
          <div className="tablewrap">
            <table className="diary left-align">
              <thead><tr><th>સમય</th><th>કોણ</th><th>શું</th><th>વિગત</th></tr></thead>
              <tbody>
                {log.length === 0 && <tr><td colSpan={4}>હજુ કોઈ પ્રવૃત્તિ નથી</td></tr>}
                {log.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(l.at)}</td>
                    <td>{l.username || '—'}</td>
                    <td>{ACTIONS[l.action] || l.action}{l.collection ? ' · ' + (COLL[l.collection] || l.collection) : ''}</td>
                    <td>{l.summary || l.doc_id || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
