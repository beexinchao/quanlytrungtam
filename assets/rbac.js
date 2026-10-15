/* Màn Quản lý vai trò và ma trận phân quyền (minh họa, chỉ đọc). Dữ liệu từ permissions.js. */
(function () {
  'use strict';
  var P = window.PERMISSIONS, KEY = 'mockup_vai_tro';
  function $(s) { return document.querySelector(s); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }
  var m = /[?&]vai_tro=([a-z_]+)/.exec(location.search), me = m ? m[1] : null;
  try { me = me || sessionStorage.getItem(KEY); } catch (e) { /* bỏ qua */ }
  if (!me || !P.matrix[me]) me = 'quan_ly';
  var MOD = { M01: 'Học viên & Nhân sự', M02: 'Khóa học & Lịch học', M03: 'Điểm danh & Chuyên cần', M04: 'Học phí & Thu chi', M05: 'Báo cáo & Thống kê', M06: 'Bài tập & Điểm số', M07: 'Thông báo tự động', M08: 'Cổng Phụ huynh & HV', M09: 'Lương giáo viên', M10: 'CRM & Tuyển sinh' };
  var ACT = [['xem', 'Xem'], ['tao', 'Tạo'], ['sua', 'Sửa'], ['xoa', 'Xóa'], ['duyet', 'Duyệt']];
  var VAL = { day_du: ['Được phép', 'ok'], gioi_han: ['Giới hạn', 'warn'], khong: ['Khóa', 'muted'] };
  var host = $('#rbac');
  var sel = (/[?&]xem=([a-z_]+)/.exec(location.search) || [])[1];
  if (!sel || !P.matrix[sel]) sel = 'giao_vien';

  if (me !== 'chu_trung_tam') {
    var a = el('div', 'alert warn'); a.innerHTML = '<strong>Chỉ chủ trung tâm được sửa phân quyền.</strong> Vai trò hiện tại chỉ xem ma trận ở chế độ minh họa, không có nút lưu.';
    host.appendChild(a);
  }

  var tabs = el('div', 'rb-tabs'); tabs.setAttribute('role', 'tablist');
  P.roles.forEach(function (r) {
    var b = el('a', r.id === sel ? 'on' : '', r.ten); b.href = 'scr-adm-03.html?vai_tro=' + me + '&xem=' + r.id; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', r.id === sel ? 'true' : 'false'); tabs.appendChild(b);
  });
  host.appendChild(tabs);

  var rows = P.modules.map(function (x) { return P.matrix[sel][x.id]; });
  var full = 0, lim = 0, lock = 0;
  rows.forEach(function (c) { ACT.forEach(function (a) { if (c[a[0]] === 'day_du') full++; else if (c[a[0]] === 'gioi_han') lim++; else lock++; }); });
  var tot = full + lim + lock;
  var role = P.roles.filter(function (r) { return r.id === sel; })[0];

  var top = el('div', 'rb-top');
  var sc = el('div', 'card'); sc.appendChild(el('h2', '', 'Phạm vi quyền: ' + role.ten));
  var seen = P.modules.filter(function (x) { return P.matrix[sel][x.id].xem !== 'khong'; }).map(function (x) { return x.id; });
  sc.appendChild(el('p', 'muted', 'Vai trò này xem được ' + seen.length + ' trên 10 module' + (seen.length ? ': ' + seen.join(', ') + '.' : '.') + ' Mỗi tài khoản có đúng một vai trò chính; chỉ chủ trung tâm được gán vai trò chủ trung tâm và quản lý.'));
  top.appendChild(sc);
  var ks = el('div', 'card'); ks.appendChild(el('div', 'zt-stat-k', 'CƠ CẤU QUYỀN (50 Ô)'));
  var big = el('div', 'rb-big', Math.round(full / tot * 100) + '%'); ks.appendChild(big); ks.appendChild(el('div', 'muted', 'số ô được phép đầy đủ'));
  var bar = el('div', 'rb-bar');
  [[full, 'ok'], [lim, 'warn'], [lock, 'muted']].forEach(function (p) { var s = el('span', p[1]); s.style.width = (p[0] / tot * 100) + '%'; bar.appendChild(s); });
  ks.appendChild(bar);
  ks.appendChild(el('p', 'small muted', 'Được phép ' + full + ', giới hạn ' + lim + ', khóa ' + lock + '.'));
  top.appendChild(ks); host.appendChild(top);

  var card = el('div', 'card'); card.appendChild(el('h2', '', 'Ma trận phân quyền 10 phân hệ: ' + role.ten));
  var wrap = el('div', 'table-wrap'); var t = el('table', 'data rb-table');
  var thead = el('thead'), hr = el('tr'); ['Mã và phân hệ'].concat(ACT.map(function (a) { return a[1]; })).concat(['Ghi chú điều kiện']).forEach(function (h) { hr.appendChild(el('th', '', h)); });
  thead.appendChild(hr); t.appendChild(thead);
  var tb = el('tbody');
  P.modules.forEach(function (x) {
    var c = P.matrix[sel][x.id], tr = el('tr');
    var td0 = el('td'); td0.appendChild(el('span', 'tag code', x.id)); td0.appendChild(document.createTextNode(' ' + MOD[x.id])); tr.appendChild(td0);
    ACT.forEach(function (a) { var td = el('td'); td.setAttribute('data-label', a[1]); var v = VAL[c[a[0]]]; td.appendChild(el('span', 'badge ' + v[1], v[0])); tr.appendChild(td); });
    var tn = el('td', 'small muted', c.ghi_chu); tr.appendChild(tn); tb.appendChild(tr);
  });
  t.appendChild(tb); wrap.appendChild(t); card.appendChild(wrap);
  var legend = el('p', 'small muted', 'Được phép: toàn quyền. Giới hạn: theo lớp được phân công hoặc dữ liệu của chính mình. Khóa: không có quyền.'); card.appendChild(legend);
  var act = el('div', 'rb-act');
  var save = el('button', 'btn', 'Lưu cấu hình quyền'); save.type = 'button'; save.disabled = me !== 'chu_trung_tam';
  save.addEventListener('click', function () { if (window.mockupToast) window.mockupToast('Đã lưu cấu hình quyền (minh họa, không ghi dữ liệu thật)'); });
  act.appendChild(save);
  if (me !== 'chu_trung_tam') act.appendChild(el('span', 'lock-hint', 'Chỉ chủ trung tâm được lưu thay đổi phân quyền'));
  var lg = el('a', 'btn secondary', 'Xem nhật ký thao tác'); lg.href = '#'; lg.addEventListener('click', function (e) { e.preventDefault(); if (window.mockupToast) window.mockupToast('Nhật ký thao tác chưa có trong mockup'); });
  act.appendChild(lg); card.appendChild(act);
  host.appendChild(card);
})();
