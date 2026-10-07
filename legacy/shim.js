// window.claude — the small API the inspection tool was written against, now backed by
// this app's own server routes:
//   db        → /api/db/...        (Postgres)
//   downloads → a normal browser download
//   assets    → /api/files         (reply PDFs, stored in Postgres)
//   sample    → /api/ai            (photo-to-form reading through the Anthropic API)

let toastTimer = null;
export function toast(msg, kind) {
  let el = document.getElementById('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.className = kind === 'error' ? 'error' : '';
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, kind === 'error' ? 7000 : 3000);
}

async function api(url, init) {
  const res = await fetch(url, { credentials: 'same-origin', ...init });
  if (res.status === 401) {
    toast('લૉગિન સમય પૂરો થયો — ફરી લૉગિન કરો.', 'error');
    setTimeout(() => { location.href = '/login'; }, 1500);
    throw Object.assign(new Error('unauthorized'), { code: 'unauthorized' });
  }
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  if (!res.ok) {
    const err = new Error((body && body.error) || ('HTTP ' + res.status));
    err.code = (body && body.code) || ('http_' + res.status);
    err.status = res.status;
    throw err;
  }
  return body;
}

function writeFailed(err) {
  if (err && err.status === 403) {
    // the page has already changed its own copy; a refresh shows what is really saved
    toast((err.message || 'આ ફેરફાર કરવાની તમને પરવાનગી નથી.') + ' (સાચો ડેટા જોવા પેજ રીફ્રેશ કરો)', 'error');
  } else if (err && err.code !== 'unauthorized') {
    toast('સેવ થઈ શક્યું નહીં: ' + (err.message || err) + ' — ઇન્ટરનેટ તપાસી ફરી પ્રયત્ન કરો.', 'error');
  }
  throw err;
}

const seg = (s) => encodeURIComponent(s);

let readOnly = false;
function readOnlyRefusal() {
  const err = Object.assign(new Error('તમારી પાસે ફક્ત જોવાની પરવાનગી છે — આ ફેરફાર સેવ થશે નહીં.'), { status: 403, code: 'forbidden' });
  return writeFailed(err);
}

function makeDb() {
  return {
    collection(name) {
      return {
        async get() {
          const data = await api('/api/db/' + seg(name));
          return { docs: (data.items || []).map((it) => ({ id: it.id, data: () => it.data })) };
        },
      };
    },
    doc(path) {
      const i = path.indexOf('/');
      const url = '/api/db/' + seg(path.slice(0, i)) + '/' + seg(path.slice(i + 1));
      return {
        async get() {
          try {
            const data = await api(url);
            return data && data.item ? { data: () => data.item } : null;
          } catch (e) {
            if (e.status === 404) return null;
            throw e;
          }
        },
        async set(value) {
          if (readOnly) return readOnlyRefusal();
          try {
            await api(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
          } catch (e) { writeFailed(e); }
        },
        async delete() {
          if (readOnly) return readOnlyRefusal();
          try { await api(url, { method: 'DELETE' }); } catch (e) { writeFailed(e); }
        },
      };
    },
  };
}

function makeDownloads() {
  return {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return { ok: true };
    },
  };
}

function makeAssets() {
  return {
    async upload(file, opts) {
      if (readOnly) return readOnlyRefusal();
      if (file.size > 4 * 1024 * 1024) {
        const err = new Error('PDF ૪ MB થી મોટી છે — નાની (compress) કરી ફરી અપલોડ કરો.');
        toast(err.message, 'error');
        throw err;
      }
      const fd = new FormData();
      fd.append('file', file, file.name || 'reply.pdf');
      if (opts && opts.type) fd.append('type', opts.type);
      try {
        return await api('/api/files', { method: 'POST', body: fd });
      } catch (e) { writeFailed(e); }
    },
  };
}

// Phone photos are often 4–8 MB; the server accepts about 4 MB per request, so shrink each photo
// in the browser first (long side 2000px, JPEG) — still plenty sharp for reading the form.
async function shrinkImage(file) {
  try {
    const bmp = await createImageBitmap(file);
    const max = 2000;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
    return blob || file;
  } catch (e) {
    return file;
  }
}

function makeSample() {
  let status = null;
  return {
    async limits() {
      if (!status) status = await api('/api/ai').catch(() => ({ enabled: false }));
      return status.enabled ? { images: true } : null;
    },
    async json(prompt, opts) {
      const fd = new FormData();
      fd.append('prompt', prompt);
      const files = Array.from((opts && opts.images) || []);
      for (const f of files) fd.append('images', await shrinkImage(f), 'page.jpg');
      const data = await api('/api/ai', { method: 'POST', body: fd });
      return data.result;
    },
  };
}

export function installShim(opts) {
  readOnly = !!(opts && opts.readOnly);
  const caps = { db: makeDb(), downloads: makeDownloads(), assets: makeAssets(), sample: makeSample() };
  window.claude = {
    async use(name) {
      if (!caps[name]) throw new Error('unknown capability ' + name);
      return caps[name];
    },
  };
}
