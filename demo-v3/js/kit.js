'use strict';
/* Bộ thành phần giao diện v2: định dạng, biểu tượng, nhãn, ngăn kéo biểu mẫu, thông báo, biểu đồ SVG, bộ định tuyến. */

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const br = (s) => esc(s).replace(/\n/g, '<br>');
const MONTH = (d) => 'TH ' + (d.getMonth() + 1);

const fmt = {
  d: (s) => { if (!s) return ''; const d = typeof s === 'string' && s.length === 10 ? parseYmd(s) : new Date(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); },
  dm: (s) => { const d = parseYmd(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); },
  day: (s) => { const d = parseYmd(s); return DOW_FULL[d.getDay()] + ', ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1); },
  rel: (s) => { const n = Math.round((parseYmd(s) - startOfDay(new Date())) / 864e5); return n === 0 ? 'Hôm nay' : n === 1 ? 'Ngày mai' : n === -1 ? 'Hôm qua' : fmt.day(s); },
  t: (iso) => { if (!iso) return ''; const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); },
  dt: (iso) => { if (!iso) return ''; const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ', ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1); },
  ago: (iso) => {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60e3);
    if (m < 1) return 'vừa xong'; if (m < 60) return m + ' phút trước';
    const h = Math.round(m / 60); if (h < 24) return h + ' giờ trước';
    const d = Math.round(h / 24); return d < 30 ? d + ' ngày trước' : fmt.d(iso);
  },
  until: (ms) => { if (ms < 0) return 'đã qua'; const h = ms / 3600e3; if (h < 1) return 'còn ' + Math.max(1, Math.round(ms / 60e3)) + ' phút'; if (h < 48) return 'còn ' + Math.round(h) + ' giờ'; return 'còn ' + Math.round(h / 24) + ' ngày'; },
  due: (iso) => { const ms = new Date(iso).getTime() - Date.now(); return ms < 0 ? 'Quá hạn từ ' + fmt.dt(iso) : 'Hạn ' + fmt.dt(iso) + ' (' + fmt.until(ms) + ')'; },
  days: (arr) => arr.slice().sort((a, b) => (a || 7) - (b || 7)).map((d) => DOW[d]).join(' · '),
  pct: (n) => (n == null ? '-' : String(Math.round(n * 10) / 10).replace('.', ',') + '%'),
  sc: (n) => (n == null ? '-' : String(n).replace('.', ',')),
};
const localInput = (d) => ymd(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());

// biểu tượng nét mảnh 24 px
const IC = {
  inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  class: '<path d="M4 6.5L12 3l8 3.5-8 3.5z"/><path d="M7 8.5v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5"/><path d="M20 6.5v6"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  book: '<path d="M12 6c-2-1.6-4.6-2-8-2v14c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2V4c-3.4 0-6 .4-8 2z"/><path d="M12 6v14"/>',
  chart: '<path d="M4 20h16"/><rect x="5.5" y="11" width="3" height="6" rx="1"/><rect x="10.5" y="6" width="3" height="11" rx="1"/><rect x="15.5" y="9" width="3" height="8" rx="1"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2"/><path d="M15.5 5.5a3 3 0 010 6M17.5 14.6c1.8.7 3 2.4 3.5 4.9"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-4 3.8-6.3 7.5-6.3s6.7 2.3 7.5 6.3"/>',
  home: '<path d="M4 10.5L12 4l8 6.5V20h-5v-6H9v6H4z"/>',
  pen: '<path d="M14.5 5.5l4 4L9 19H5v-4z"/><path d="M12.5 7.5l4 4"/>',
  star: '<path d="M12 3.8l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 014.8.9c0 1.7-2.4 2.1-2.4 3.8M12 17v.01"/>',
  check: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2M14 18v2M18 18h2v2"/>',
  video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path d="M15.5 10.5L21 7.5v9l-5.5-3"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  chat: '<path d="M5 5h14a1 1 0 011 1v9a1 1 0 01-1 1h-7l-5 4v-4H5a1 1 0 01-1-1V6a1 1 0 011-1z"/>',
  send: '<path d="M21 3L10 14M21 3l-6.5 18-4.5-7-7-4.5z"/>',
  out: '<path d="M14 4h5v16h-5M10 16l4-4-4-4M14 12H4"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  down: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  up: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
  link: '<path d="M10 13.5a4 4 0 005.7.3l2.8-2.8a4 4 0 00-5.7-5.7l-1.2 1.2"/><path d="M14 10.5a4 4 0 00-5.7-.3L5.5 13a4 4 0 005.7 5.7l1.2-1.2"/>',
  file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  upload: '<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9.5 7V4h5v3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 017 0v3"/>',
  unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 016.8-1.2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  arrowup: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowdown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V4H4v11.5h4.5"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0112 7.3a4.2 4.2 0 017.5 2.4C19.5 15.4 12 20 12 20z"/>',
  restore: '<path d="M4.5 12a7.5 7.5 0 107.5-7.5H8M8 1.5L5 4.5l3 3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};
const ic = (n, s, w) => '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>';

const AVC = ['#3346A8', '#1F7A80', '#7A3E8F', '#B4552C', '#2B7A4B', '#8A5A12', '#A33A5A', '#3D6FA8', '#5A6B2B', '#6A4FB0'];
function av(u, s) {
  if (!u) return '';
  s = s || 36;
  let h = 0; for (const c of u.id) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  const w = u.name.trim().split(/\s+/);
  const ini = w.length > 1 && w[w.length - 1].length === 1 ? w[w.length - 1] : (w.length > 1 ? w[w.length - 2][0] : '') + w[w.length - 1][0];
  return '<span class="av" style="width:' + s + 'px;height:' + s + 'px;font-size:' + Math.round(s * 0.4) + 'px;background:' + AVC[h % AVC.length] + '">' + esc(ini.toUpperCase()) + '</span>';
}
const tag = (t, k) => '<span class="tag ' + (k || '') + '">' + esc(t) + '</span>';
const TONE = { xanh: 'ok', vang: 'warn', do: 'bad', tim: 'plum', xam: '', lam: 'ai' };
const classTag = (c) => tag(COURSE_STATUS[c.status][0], TONE[COURSE_STATUS[c.status][1]]);
const ATT_TONE = { co_mat: 'ok', di_muon: 'warn', vang_cp: 'plum', vang_kp: 'bad' };
const attTag = (st) => (st ? tag(ATT[st][0], ATT_TONE[st]) : tag('Chưa điểm danh', ''));
const reqTag = (r) => tag(REQ_STATUS[r.status][0], TONE[REQ_STATUS[r.status][1]]);
const none = (t, i) => '<div class="none">' + ic(i || 'inbox', 40, 1.4) + esc(t || 'Chưa có dữ liệu') + '</div>';
const toneRate = (r) => (r == null ? '' : r >= 85 ? 'ok' : r >= 70 ? 'warn' : 'bad');
const toneScore = (s) => (s == null ? '' : s >= 7 ? 'ok' : s >= 5 ? 'warn' : 'bad');
const miniBar = (p, t) => '<div class="mini-bar ' + (t || '') + '"><i style="width:' + Math.max(0, Math.min(100, p || 0)) + '%"></i></div>';
const where = (s) => (s.mode === 'online' ? 'Online qua Zoom' : s.mode === 'offline' ? (s.room || 'Tại trung tâm') : (s.room || 'Tại trung tâm') + ' và Zoom');
const sessTag = (s) => (s.status === 'huy' ? tag('Đã hủy', '') : s.status === 'doi_lich' ? tag('Đã đổi lịch', 'warn') : s.status === 'day_bu' ? tag('Dạy bù', 'plum') : '');
const calChip = (dateStr) => { const d = parseYmd(dateStr); return '<div class="cal-chip"><div class="m">' + MONTH(d) + '</div><div class="d">' + d.getDate() + '</div><div class="w">' + DOW[d.getDay()] + '</div></div>'; };
const opt = (list, sel) => list.map(([v, t]) => '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
const daysPick = (name, sel) => '<div class="days">' + [1, 2, 3, 4, 5, 6, 0].map((d) => '<label><input type="checkbox" name="' + name + '[]" value="' + d + '"' + (sel.includes(d) ? ' checked' : '') + '><span>' + DOW[d] + '</span></label>').join('') + '</div>';
const fld = (label, inner, hint, cls) => '<div class="fld ' + (cls || '') + '"><label>' + esc(label) + (hint ? ' <span class="hint">' + esc(hint) + '</span>' : '') + '</label>' + inner + '</div>';

// ------------------------------------------------------------------ thông báo nổi
function toast(msg, k, label, fn) {
  const el = document.createElement('div');
  el.className = 'tst ' + (k || '');
  el.innerHTML = '<span>' + esc(msg) + '</span>' + (label ? '<button>' + esc(label) + '</button>' : '');
  if (label) el.querySelector('button').onclick = () => { el.remove(); fn(); };
  document.getElementById('toast').appendChild(el);
  setTimeout(() => el.remove(), label ? 9000 : 3600);
}
const done = (res, msg) => { if (res && res.ok === false) { toast(res.msg || 'Chưa thực hiện được.', 'bad'); return false; } if (msg) toast(msg, 'ok'); return true; };

// ------------------------------------------------------------------ ngăn kéo biểu mẫu
/* panel({title, desc, body, submit, danger, wide, cancel, onSubmit(data, form) -> true | 'lỗi', onOpen(form)}) */
function panel(o) {
  const sc = document.createElement('div');
  sc.className = 'scrim';
  sc.innerHTML = '<form class="drawer ' + (o.wide ? 'wide' : '') + '" novalidate><div class="drawer-h"><div class="flex btw"><h2>' + esc(o.title) + '</h2><button type="button" class="btn plain icon" data-x aria-label="Đóng">' + ic('x') + '</button></div>' + (o.desc ? '<p>' + esc(o.desc) + '</p>' : '') + '</div>' +
    '<div class="drawer-b">' + (o.body || '') + '<div class="err" hidden></div></div><div class="drawer-f"><button type="button" class="btn plain" data-x>' + esc(o.cancel || 'Hủy') + '</button>' +
    (o.submit === false ? '' : '<button class="btn ' + (o.danger ? 'danger' : 'primary') + '">' + esc(o.submit || 'Lưu') + '</button>') + '</div></form>';
  document.getElementById('layer').appendChild(sc);
  const f = sc.querySelector('form');
  const close = () => sc.remove();
  sc.addEventListener('mousedown', (e) => { if (e.target === sc) close(); });
  f.querySelectorAll('[data-x]').forEach((b) => { b.onclick = close; });
  f.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const res = o.onSubmit ? await o.onSubmit(readForm(f), f) : true;
    if (res === true || res === undefined) close();
    else if (typeof res === 'string') { const m = f.querySelector('.err'); m.textContent = res; m.hidden = false; }
  };
  if (o.onOpen) o.onOpen(f);
  const first = f.querySelector('.drawer-b input:not([type=checkbox]):not([type=radio]):not([type=file]),.drawer-b textarea,.drawer-b select');
  if (first) setTimeout(() => first.focus(), 40);
  return { close, f };
}
function ask(title, desc, fn, o) {
  o = o || {};
  panel({ title, desc, submit: o.submit || 'Xác nhận', danger: o.danger,
    body: o.reason ? fld(o.reasonLabel || 'Lý do', '<textarea class="in" name="reason" rows="4"></textarea>', 'bắt buộc') : (o.body || ''),
    onSubmit: (d) => { if (o.reason && !String(d.reason || '').trim()) return 'Nhập lý do.'; return fn(d.reason, d) === false ? 'Chưa thực hiện được.' : true; } });
}
function readForm(f) {
  const o = {};
  new FormData(f).forEach((v, k) => { if (v instanceof File) return; if (k.endsWith('[]')) { const kk = k.slice(0, -2); (o[kk] = o[kk] || []).push(v); } else o[k] = v; });
  f.querySelectorAll('input[type=checkbox]:not([name$="[]"])').forEach((c) => { if (c.name) o[c.name] = c.checked; });
  return o;
}
function saveText(name, text) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const toCsv = (rows) => rows.map((r) => r.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\r\n');

// ------------------------------------------------------------------ biểu đồ SVG
/* cột dọc: items [{label, value, color?}], max */
function barChart(items, o) {
  o = o || {}; const H = o.h || 200; const W = o.w || Math.max(600, items.length * (o.bw || 56)); const max = o.max || Math.max(1, ...items.map((x) => x.value || 0));
  const bw = Math.min(40, (W / items.length) * 0.55); const step = W / items.length; const top = 22; const bot = 34; const ih = H - top - bot;
  let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Biểu đồ') + '">';
  [0, 0.5, 1].forEach((g) => { const y = top + ih * (1 - g); s += '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#E7E0D3" stroke-dasharray="' + (g ? '3 4' : '') + '"/>'; });
  items.forEach((it, i) => {
    const v = it.value == null ? 0 : it.value; const h = (v / max) * ih; const x = step * i + (step - bw) / 2; const y = top + ih - h;
    s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(h, it.value == null ? 0 : 2) + '" rx="5" fill="' + (it.color || '#3346A8') + '"><title>' + esc(it.label + ': ' + (o.fmt ? o.fmt(it.value) : it.value)) + '</title></rect>';
    s += '<text class="val" x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle">' + esc(it.value == null ? '' : o.fmt ? o.fmt(it.value) : it.value) + '</text>';
    s += '<text class="lbl" x="' + (x + bw / 2) + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(String(it.label).slice(0, o.cut || 12)) + '</text>';
  });
  return s + '</svg>';
}
/* đường: series [{name, color, points:[number|null]}], labels [] */
function lineChart(series, labels, o) {
  o = o || {}; const H = o.h || 220; const W = o.w || Math.max(900, labels.length * 34); const top = 16; const bot = 30; const left = 34; const ih = H - top - bot; const iw = W - left - 10;
  const max = o.max || 100; const x = (i) => left + (labels.length <= 1 ? iw / 2 : (iw * i) / (labels.length - 1)); const y = (v) => top + ih * (1 - v / max);
  let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Biểu đồ đường') + '">';
  [0, 0.5, 1].forEach((g) => { s += '<line x1="' + left + '" x2="' + W + '" y1="' + y(max * g) + '" y2="' + y(max * g) + '" stroke="#E7E0D3" stroke-dasharray="' + (g ? '3 4' : '') + '"/><text x="0" y="' + (y(max * g) + 4) + '">' + Math.round(max * g) + '</text>'; });
  labels.forEach((l, i) => { if (labels.length < 16 || i % 2 === 0) s += '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(l) + '</text>'; });
  series.forEach((se) => {
    let d = ''; let pen = false;
    se.points.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; pen = true; });
    s += '<path d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
    se.points.forEach((v, i) => { if (v != null) s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.2" fill="#fff" stroke="' + se.color + '" stroke-width="2"><title>' + esc(se.name + ' · ' + labels[i] + ': ' + (o.fmt ? o.fmt(v) : v)) + '</title></circle>'; });
  });
  return s + '</svg>';
}
const hbar = (label, v, max, color, text) => '<div class="hb"><span>' + esc(label) + '</span><div class="track"><i style="width:' + (v == null ? 0 : Math.min(100, (v / max) * 100)) + '%;background:' + color + '"></i></div><b class="num" style="text-align:right">' + esc(text) + '</b></div>';
const SERIES_C = ['#3346A8', '#1F7A80', '#D9503B', '#7A3E8F', '#C27A12', '#2B7A4B'];

// ------------------------------------------------------------------ định tuyến, sự kiện
const Routes = []; const On = {}; const Sub = {}; const Chg = {};
function page(path, meta, view) {
  const keys = [];
  const re = new RegExp('^' + path.replace(/\/:(\w+)(\?)?/g, (_, k, q) => { keys.push(k); return q ? '(?:/([^/]+))?' : '/([^/]+)'; }) + '/?$');
  Routes.push(Object.assign({ re, keys, view, live: true }, meta));
}
const on = (n, f) => { On[n] = f; };
const onSubmit = (n, f) => { Sub[n] = f; };
const onChg = (n, f) => { Chg[n] = f; };
const nav = (h) => { if (location.hash === h) App.render(); else location.hash = h; };
const head = (title, o) => {
  o = o || {};
  return '<div class="ph"><div class="grow">' + (o.eyebrow ? '<div class="eyebrow">' + o.eyebrow + '</div>' : '') + '<h1>' + esc(title) + '</h1>' + (o.desc ? '<div class="desc">' + o.desc + '</div>' : '') + '</div>' + (o.acts ? '<div class="acts">' + o.acts + '</div>' : '') + '</div>';
};
