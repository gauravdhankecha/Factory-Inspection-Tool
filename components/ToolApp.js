'use client';

import { useEffect, useRef } from 'react';
import { SHELL_HTML } from '@/legacy/shell';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildShell(user) {
  const readOnly = user.role === 'viewer';
  const menu = `<div class="usermenu">
      <div class="who"><b>${esc(user.name)}</b><span>${esc(user.roleLabel)}</span></div>
      ${user.canManage ? '<a href="/admin">વપરાશકર્તા / બેકઅપ</a>' : ''}
      <form method="post" action="/api/auth/logout"><button type="submit">લૉગઆઉટ</button></form>
    </div>`;
  let html = SHELL_HTML.replace('<!--USERMENU-->', menu).replace(
    '<!--READONLY-->',
    readOnly ? '<div class="readonly-banner">તમે ફક્ત જોઈ શકો છો — અહીં કરેલો કોઈ ફેરફાર સેવ થશે નહીં.</div>' : ''
  );
  if (readOnly) {
    // start on પડતર instead of the new-inspection form
    html = html
      .replace('<button data-tab="new" class="active">', '<button data-tab="new">')
      .replace('<button data-tab="pending">', '<button data-tab="pending" class="active">');
  }
  return html;
}

export default function ToolApp({ user }) {
  const ref = useRef(null);
  const htmlRef = useRef(null);
  if (htmlRef.current === null) htmlRef.current = buildShell(user);

  useEffect(() => {
    let cancelled = false;
    const readOnly = user.role === 'viewer';
    document.body.classList.toggle('role-viewer', readOnly);
    document.body.classList.toggle('no-delete', user.role !== 'admin');
    (async () => {
      // Word (.docx) and Excel exports use these two libraries as page globals, as before.
      const [jszip, xlsx, shim, tool] = await Promise.all([
        import('jszip'),
        import('xlsx'),
        import('@/legacy/shim'),
        import('@/legacy/tool'),
      ]);
      if (cancelled) return;
      window.JSZip = jszip.default || jszip;
      window.XLSX = xlsx.utils ? xlsx : xlsx.default;
      shim.installShim({ readOnly });
      tool.start({ readOnly });
    })().catch((e) => {
      const main = document.getElementById('main');
      if (main) main.innerHTML = '<div class="empty">પેજ લોડ થયું નહીં: ' + esc(e && e.message) + ' — પેજ રીફ્રેશ કરો.</div>';
    });
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  // The tool draws and updates everything inside this frame itself, so React renders it once only.
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: htmlRef.current }} suppressHydrationWarning />;
}
