/* Zenith EduSystem: dựng lại khung (thanh tiện ích, thanh bên, đường dẫn, thanh dưới của cổng) theo mẫu thiết kế. Chỉ đổi giao diện, không đổi dữ liệu. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    search: 'M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z',
    bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
    M01: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
    M02: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    M03: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    M04: 'M2 6h20v12H2zM12 15a3 3 0 100-6 3 3 0 000 6zM6 12h.01M18 12h.01',
    M05: 'M3 3v18h18M7 15l4-4 3 3 5-6',
    M06: 'M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9',
    M07: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6',
    M08: 'M12 3a3 3 0 100 6 3 3 0 000-6zM5 21v-2a5 5 0 015-5h4a5 5 0 015 5v2',
    M09: 'M6 2h12a1 1 0 011 1v18l-3-2-3 2-3-2-3 2V3a1 1 0 011-1zM9 8h6M9 12h6',
    M10: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4',
    cfg: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z'
  };
  var SHORT = {
    M01: 'Học viên & Nhân sự', M02: 'Khóa học & Lịch học', M03: 'Điểm danh & Chuyên cần', M04: 'Học phí & Thu chi', M05: 'Báo cáo & Thống kê',
    M06: 'Bài tập & Điểm số', M07: 'Thông báo tự động', M08: 'Cổng Phụ huynh & HV', M09: 'Lương giáo viên', M10: 'CRM & Tuyển sinh'
  };
  var TODAY_N = { chu_trung_tam: 4, quan_ly: 4, ke_toan: 4, giao_vien: 4, tro_giang: 3, hoc_vien: 3, phu_huynh: 4 };

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function svg(path, cls) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true'); if (cls) s.setAttribute('class', cls);
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', path); s.appendChild(p); return s;
  }
  function role() { var m = /[?&]vai_tro=([a-z_]+)/.exec(location.search), r = m ? m[1] : null; try { r = r || sessionStorage.getItem('mockup_vai_tro'); } catch (e) { /* bỏ qua */ } return r || 'quan_ly'; }
  function pre() { var root = document.body.getAttribute('data-root') || '.'; return (root === '.' ? '' : root + '/') + 'screens/'; }

  function topbar() {
    var bar = $('.topbar'); if (!bar || $('.zn-search', bar)) return;
    var sp = $('.spacer', bar);
    var box = document.createElement('div'); box.className = 'zn-search';
    box.appendChild(svg(ICONS.search));
    var inp = document.createElement('input'); inp.type = 'search'; inp.placeholder = 'Tìm học viên, lớp học, mã hồ sơ'; inp.setAttribute('aria-label', 'Tìm kiếm chung');
    box.appendChild(inp); var k = document.createElement('kbd'); k.textContent = 'Ctrl K'; box.appendChild(k);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && window.mockupToast) window.mockupToast('Tìm kiếm chung (minh họa): ' + (inp.value || 'chưa nhập')); });
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.focus(); } });
    var sp2 = document.createElement('span'); sp2.className = 'spacer';
    if (sp) { bar.insertBefore(box, sp.nextSibling); bar.insertBefore(sp2, box.nextSibling); } else { bar.appendChild(box); bar.appendChild(sp2); }
    var today = $('.today-link', bar);
    if (today && !$('.zn-count', today)) { var c = document.createElement('span'); c.className = 'zn-count'; c.textContent = TODAY_N[role()] || 4; today.appendChild(c); }
    var bell = document.createElement('button'); bell.type = 'button'; bell.className = 'zn-bell'; bell.setAttribute('aria-label', 'Thông báo, 3 chưa đọc');
    bell.appendChild(svg(ICONS.bell)); var bc = document.createElement('span'); bc.className = 'zn-count'; bc.textContent = '3'; bell.appendChild(bc);
    bell.addEventListener('click', function () { if (window.mockupToast) window.mockupToast('3 thông báo chưa đọc (minh họa)'); });
    var rb = $('#role-bar', bar); if (rb) bar.insertBefore(bell, rb); else bar.appendChild(bell);
    if (today) bar.insertBefore(today, bell);
  }

  function sidebar() {
    var nav = $('#module-nav'); if (!nav || $('.zn-brand', nav)) return;
    var host = $('details.nav-fold', nav) || nav;
    // thương hiệu
    var br = document.createElement('div'); br.className = 'zn-brand';
    var lg = document.createElement('div'); lg.className = 'zn-logo'; lg.textContent = '学';
    var tx = document.createElement('div'); tx.innerHTML = '<b>TRUNG TÂM NIHONGO</b><span>Quản lý Đào tạo</span>';
    br.appendChild(lg); br.appendChild(tx); nav.insertBefore(br, nav.firstChild);
    var h = $('h2', host); if (h) h.textContent = 'Học vụ & Vận hành';
    $$('li > a, li > span.mod', host).forEach(function (a) {
      var m = /^(M\d\d)\s/.exec(a.textContent); if (!m || a.closest('ul ul')) return;
      a.textContent = m[1] + ': ' + (SHORT[m[1]] || a.textContent.slice(4));
      a.insertBefore(svg(ICONS[m[1]], 'zn-ico'), a.firstChild);
    });
    // mục hệ thống
    var ul = $('ul', host); if (ul && !$('.zn-sys', host)) {
      var h2 = document.createElement('h2'); h2.textContent = 'Hệ thống'; h2.className = 'zn-sys';
      var ul2 = document.createElement('ul'); var li = document.createElement('li');
      if (/scr-adm-03/.test(location.pathname)) li.className = 'current';
      var a = document.createElement('a'); a.href = pre() + 'scr-adm-03.html?vai_tro=' + role(); a.appendChild(svg(ICONS.cfg, 'zn-ico')); a.appendChild(document.createTextNode('Cấu hình & Phân quyền'));
      li.appendChild(a); ul2.appendChild(li); host.appendChild(h2); host.appendChild(ul2);
    }
    if (!$('.zn-sysfoot')) {
      var f = document.createElement('div'); f.className = 'zn-sysfoot'; f.innerHTML = 'Mockup v3.0 <b>Trực tuyến</b><br>Chi nhánh: Hà Nội';
      document.body.appendChild(f);
    }
    var summ = $('details.nav-fold > summary', nav);
    if (summ) { var cur = $('li.current > a', nav); if (cur) summ.textContent = 'Menu: ' + cur.textContent.trim(); }
  }

  function crumb() {
    var head = $('.page-head'); var h1 = head && $('h1', head); if (!h1 || $('.zn-crumb', head)) return;
    var mod = document.body.getAttribute('data-module');
    var c = document.createElement('div'); c.className = 'zn-crumb';
    var items = [['Học vụ & Vận hành']];
    if (mod && SHORT[mod]) items.push([mod + ': ' + SHORT[mod]]);
    items.push([h1.textContent.trim(), true]);
    items.forEach(function (it, i) {
      if (i) { var s = document.createElement('i'); s.textContent = '›'; c.appendChild(s); }
      var e = document.createElement(it[1] ? 'b' : 'span'); e.textContent = it[0]; c.appendChild(e);
    });
    if (head.classList.contains('zt-top')) head.parentNode.insertBefore(c, head); else head.insertBefore(c, head.firstChild);
  }

  function bottomNav() {
    if (!document.body.classList.contains('portal') || $('.zn-tabbar')) return;
    var links = $$('.p-nav a');
    if (!links.length) {
      links = [['scr-m08-01', 'Chọn con'], ['scr-m08-02', 'Lịch học'], ['scr-m08-03', 'Học phí'], ['scr-m08-04', 'Điểm'], ['scr-m08-05', 'Thông báo']].map(function (x) {
        var a = document.createElement('a'); a.setAttribute('href', x[0] + '.html?vai_tro=' + role()); a.textContent = x[1]; return a;
      });
    }
    var bar = document.createElement('nav'); bar.className = 'zn-tabbar'; bar.setAttribute('aria-label', 'Điều hướng cổng');
    links.forEach(function (a) {
      var l = document.createElement('a'); l.href = a.getAttribute('href'); l.textContent = a.textContent.replace(/\s*\(\d+\)\s*$/, '');
      if (a.getAttribute('aria-current') === 'page') l.setAttribute('aria-current', 'page');
      var n = /\((\d+)\)/.exec(a.textContent); if (n) { var b = document.createElement('span'); b.className = 'zn-count'; b.textContent = n[1]; l.appendChild(b); }
      bar.appendChild(l);
    });
    document.body.appendChild(bar);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var v = b.getAttribute('data-copy');
    try { if (navigator.clipboard) navigator.clipboard.writeText(v); } catch (x) { /* bỏ qua */ }
    if (window.mockupToast) window.mockupToast('Đã sao chép: ' + v);
  });


  /* Điểm danh: chuyển ô chọn trạng thái thành nhóm nút phân đoạn, vẫn đồng bộ với ô chọn gốc */
  function segAttendance() {
    if (document.body.getAttribute('data-scr') !== 'SCR-M03-01') return;
    $$('select.att').forEach(function (s) {
      if (s.getAttribute('data-seg')) return; s.setAttribute('data-seg', '1');
      var g = document.createElement('div'); g.className = 'zn-seg'; g.setAttribute('role', 'radiogroup'); g.setAttribute('aria-label', s.getAttribute('aria-label') || 'Trạng thái');
      var tr = s.closest('tr');
      function paint() {
        var v = s.value, map = { 'Có mặt': 'ok', 'Vắng có phép': 'warn', 'Vắng không phép': 'bad', 'Đi muộn': 'late', 'Học bù': 'info' };
        if (tr) { tr.className = (tr.className || '').replace(/\bat-\w+\b/g, '').trim() + ' at-' + (map[v] || 'ok'); }
        $$('button', g).forEach(function (b) { var on = b.textContent === v; b.className = on ? 'on ' + (map[v] || '') : ''; b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      }
      $$('option', s).forEach(function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = o.textContent; b.setAttribute('role', 'radio');
        b.addEventListener('click', function () { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); paint(); });
        g.appendChild(b);
      });
      s.style.display = 'none'; s.parentNode.insertBefore(g, s); paint();
      s.addEventListener('change', paint);
      var btn = document.getElementById('btn-all'); if (btn && !btn.getAttribute('data-seg')) { btn.setAttribute('data-seg', '1'); btn.addEventListener('click', function () { setTimeout(function () { $$('select.att').forEach(function (x) { x.dispatchEvent(new Event('change')); }); }, 50); }); }
    });
  }

  function run() { topbar(); sidebar(); crumb(); bottomNav(); segAttendance(); }
  function go() { setTimeout(run, 150); }
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
