/* Khung dùng chung của mockup: chọn vai trò, ẩn hoặc vô hiệu theo ma trận phân quyền, điều hướng, thao tác minh họa.
   Đọc window.PERMISSIONS từ assets/permissions.js (sinh từ registry, cùng nguồn với tài liệu 08). Không tải tài nguyên ngoài. */
(function () {
  'use strict';
  function start() {
  var P = window.PERMISSIONS;
  var KEY = 'mockup_vai_tro';
  var ACT_VI = { xem: 'Xem', tao: 'Tạo', sua: 'Sửa', xoa: 'Xóa', duyet: 'Duyệt' };
  var VAL_VI = { day_du: 'Đủ', gioi_han: 'Giới hạn', khong: 'Không' };
  var ROLE_DESC = {
    chu_trung_tam: 'Điều hành, xem báo cáo, duyệt',
    quan_ly: 'Vận hành lớp, tuyển sinh, thông báo',
    ke_toan: 'Học phí, thu chi, lương',
    giao_vien: 'Điểm danh, bài tập, điểm của lớp mình',
    tro_giang: 'Hỗ trợ trong lớp được phân công',
    hoc_vien: 'Cổng học viên, dữ liệu của mình',
    phu_huynh: 'Cổng phụ huynh, dữ liệu của con'
  };
  // Danh sách màn hình theo module (khớp registry SCR; kiểm bằng lệnh mockup ở B-38).
  var SCREENS = {
    M01: [['SCR-M01-01', 'Danh sách và hồ sơ học viên'], ['SCR-M01-02', 'Hồ sơ giáo viên, trợ giảng và tài khoản']],
    M02: [['SCR-M02-01', 'Khóa học và lớp'], ['SCR-M02-02', 'Thời khóa biểu'], ['SCR-M02-03', 'Kỳ thi JLPT']],
    M03: [['SCR-M03-01', 'Điểm danh lớp'], ['SCR-M03-02', 'Học bù và chuyên cần']],
    M04: [['SCR-M04-01', 'Học phí khóa và ghi danh'], ['SCR-M04-02', 'Công nợ và ghi nhận thanh toán'], ['SCR-M04-03', 'Thu bằng mã QR và đối soát'], ['SCR-M04-04', 'Bảo lưu và nghỉ giữa chừng'], ['SCR-M04-05', 'Thu chi vận hành']],
    M05: [['SCR-M05-01', 'Bảng tổng quan'], ['SCR-M05-02', 'Báo cáo chuyên cần, tài chính, kết quả học tập'], ['SCR-M05-03', 'Việc hôm nay']],
    M06: [['SCR-M06-01', 'Bài tập'], ['SCR-M06-02', 'Thang điểm và nhập điểm'], ['SCR-M06-03', 'Điểm tổng kết và nhận xét']],
    M07: [['SCR-M07-01', 'Soạn thông báo và chọn kênh'], ['SCR-M07-02', 'Nhắc tự động theo lịch'], ['SCR-M07-03', 'Lịch sử và trạng thái gửi']],
    M08: [['SCR-M08-01', 'Cổng: đăng nhập và chọn con'], ['SCR-M08-02', 'Cổng: lịch học và điểm danh'], ['SCR-M08-03', 'Cổng: học phí và mã QR'], ['SCR-M08-04', 'Cổng: điểm và nhận xét'], ['SCR-M08-05', 'Cổng: thông báo'], ['SCR-M08-06', 'Cổng: việc hôm nay']],
    M09: [['SCR-M09-01', 'Cấu hình cách tính lương'], ['SCR-M09-02', 'Bảng lương theo kỳ'], ['SCR-M09-03', 'Bảng lương của tôi']],
    M10: [['SCR-M10-01', 'Khách tiềm năng'], ['SCR-M10-02', 'Chuyển thành học viên và thống kê tuyển sinh']]
  };
  var body = document.body;
  var root = body.getAttribute('data-root') || '.';
  var curModule = body.getAttribute('data-module') || '';
  var curScr = body.getAttribute('data-scr') || '';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function fileOf(id) { return 'screens/' + id.toLowerCase() + '.html'; }
  function pageHref(id) { return (root === '.' ? '' : root + '/') + fileOf(id); }
  function indexHref() { return (root === '.' ? '' : root + '/') + 'index.html'; }

  function getRole() {
    var m = /[?&]vai_tro=([a-z_]+)/.exec(location.search);
    var r = m ? m[1] : null;
    if (r && !P.matrix[r]) r = null;
    if (!r) { try { r = sessionStorage.getItem(KEY); } catch (e) { r = null; } }
    if (!r) { try { r = localStorage.getItem(KEY); } catch (e) { r = null; } }
    if (r && !P.matrix[r]) r = null;
    return r;
  }
  function saveRole(r) {
    try { sessionStorage.setItem(KEY, r); } catch (e) { /* bỏ qua */ }
    try { localStorage.setItem(KEY, r); } catch (e) { /* bỏ qua */ }
  }
  function roleName(r) { for (var i = 0; i < P.roles.length; i++) if (P.roles[i].id === r) return P.roles[i].ten; return r; }
  function cell(r, m) { return r && P.matrix[r] ? P.matrix[r][m] : null; }
  function canSee(r, m) { var c = cell(r, m); return !!c && c.xem !== 'khong'; }

  var role = getRole();
  if (!role && curModule) role = 'quan_ly';
  if (role) saveRole(role);

  function withRole(href) {
    if (!role || !/\.html(\?|#|$)/.test(href) || /^[a-z]+:/i.test(href)) return href;
    var hash = '', h = href.indexOf('#');
    if (h >= 0) { hash = href.slice(h); href = href.slice(0, h); }
    href = href.replace(/[?&]vai_tro=[a-z_]*/, '');
    return href + (href.indexOf('?') >= 0 ? '&' : '?') + 'vai_tro=' + role + hash;
  }
  function decorateLinks() {
    $$('a[href]').forEach(function (a) {
      var h0 = a.getAttribute('data-href0');
      if (h0 === null) { h0 = a.getAttribute('href'); a.setAttribute('data-href0', h0); }
      a.setAttribute('href', withRole(h0));
    });
  }
  function setRole(r) {
    role = r; saveRole(r);
    if (curModule) { location.href = location.pathname + '?vai_tro=' + r; } else { render(); }
  }

  var toastT;
  function toast(msg) {
    var t = $('#toast');
    if (!t) { t = el('div'); t.id = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); body.appendChild(t); }
    t.textContent = msg; t.className = 'show';
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, 2600);
  }
  window.mockupToast = toast;

  function permChips(c, withNames) {
    var box = el('div', 'perm-bar');
    ['xem', 'tao', 'sua', 'xoa', 'duyet'].forEach(function (a) {
      var s = el('span', 'perm ' + c[a], ACT_VI[a] + (withNames === false ? '' : ': ' + VAL_VI[c[a]]));
      box.appendChild(s);
    });
    return box;
  }

  function roleSelect() {
    var s = el('select', 'role-select'); s.id = 'role-select'; s.setAttribute('aria-label', 'Vai trò đang dùng');
    P.roles.forEach(function (r) { var o = el('option', '', r.ten); o.value = r.id; if (r.id === role) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', function () { setRole(s.value); });
    return s;
  }

  function buildSidenav() {
    var nav = $('#module-nav');
    if (!nav) return;
    nav.textContent = '';
    nav.appendChild(el('h2', '', 'Module'));
    var ul = el('ul');
    P.modules.forEach(function (m) {
      var li = el('li');
      var ok = canSee(role, m.id);
      if (m.id === curModule) li.className = 'current';
      if (!ok) {
        li.className += ' disabled';
        var sp = el('span', 'mod', m.id + ' ' + m.ten); sp.setAttribute('aria-disabled', 'true'); sp.title = 'Vai trò ' + roleName(role) + ' không có quyền xem module này';
        li.appendChild(sp);
      } else {
        var a = el('a', '', m.id + ' ' + m.ten); a.href = pageHref(SCREENS[m.id][0][0]);
        if (m.id === curModule) a.setAttribute('aria-current', 'page');
        li.appendChild(a);
        if (m.id === curModule) {
          var sub = el('ul');
          SCREENS[m.id].forEach(function (s) {
            var l2 = el('li'); if (s[0] === curScr) l2.className = 'current';
            var a2 = el('a', '', s[1]); a2.href = pageHref(s[0]); if (s[0] === curScr) a2.setAttribute('aria-current', 'page');
            l2.appendChild(a2); sub.appendChild(l2);
          });
          li.appendChild(sub);
        }
      }
      ul.appendChild(li);
    });
    nav.appendChild(ul);
  }

  function buildScreen() {
    var bar = $('#role-bar');
    if (bar) {
      bar.textContent = '';
      var lab = el('label', '', 'Vai trò:'); lab.setAttribute('for', 'role-select');
      bar.appendChild(lab); bar.appendChild(roleSelect());
    }
    var c = cell(role, curModule);
    var info = $('#perm-info');
    if (info && c) {
      info.textContent = '';
      info.appendChild(el('span', 'muted small', 'Quyền của ' + roleName(role) + ' ở ' + curModule + ':'));
      info.appendChild(permChips(c));
    }
    if (!c || c.xem === 'khong') {
      body.classList.add('denied');
      var d = $('#denied');
      if (d) {
        d.textContent = '';
        var a = el('div', 'alert bad');
        a.setAttribute('role', 'alert');
        a.appendChild(el('strong', '', 'Từ chối truy cập (403). '));
        a.appendChild(document.createTextNode('Vai trò ' + roleName(role) + ' không có quyền xem module ' + curModule + '. Thao tác này sẽ được ghi nhật ký.'));
        d.appendChild(a);
        var back = el('a', 'btn secondary', 'Về trang chọn vai trò'); back.href = indexHref();
        d.appendChild(back);
      }
      return;
    }
    $$('[data-act]').forEach(function (b) {
      var act = b.getAttribute('data-act');
      var v = c[act];
      if (v === 'khong') {
        b.disabled = true; b.setAttribute('aria-disabled', 'true');
        b.title = roleName(role) + ' không được phép ' + ACT_VI[act].toLowerCase() + ' ở module này';
      } else if (v === 'gioi_han') {
        b.classList.add('is-limited');
        b.title = 'Giới hạn: ' + (c.ghi_chu || 'theo phạm vi được giao');
      }
    });
  }

  function wireInteractions() {
    $$('[data-toast]').forEach(function (b) {
      b.addEventListener('click', function (ev) { if (b.disabled) return; ev.preventDefault(); toast(b.getAttribute('data-toast')); });
    });
    $$('form[data-demo]').forEach(function (f) {
      f.addEventListener('submit', function (ev) { ev.preventDefault(); toast(f.getAttribute('data-demo') || 'Đã lưu (minh họa, không ghi dữ liệu thật)'); });
    });
    $$('.tabs').forEach(function (tabs) {
      var btns = $$('button[role="tab"]', tabs);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) {
            var on = x === b; x.setAttribute('aria-selected', on ? 'true' : 'false');
            var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
          });
        });
      });
    });
    $$('[data-show]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = document.getElementById(b.getAttribute('data-show')); if (t) t.hidden = !t.hidden;
      });
    });
    $$('input[data-filter]').forEach(function (inp) {
      var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); };
      inp.addEventListener('input', function () {
        var q = norm(inp.value.trim());
        $$('#' + inp.getAttribute('data-filter') + ' tbody tr').forEach(function (tr) { tr.hidden = q && norm(tr.textContent).indexOf(q) < 0; });
      });
    });
    $$('select[data-filter-col]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var tb = document.getElementById(sel.getAttribute('data-filter-table'));
        var col = parseInt(sel.getAttribute('data-filter-col'), 10);
        $$('tbody tr', tb).forEach(function (tr) {
          var t = tr.children[col] ? tr.children[col].textContent : '';
          tr.hidden = sel.value && t.indexOf(sel.value) < 0;
        });
      });
    });
  }

  /* Trang chọn vai trò */
  function renderIndex() {
    var rg = $('#role-grid');
    rg.textContent = '';
    P.roles.forEach(function (r) {
      var b = el('button', 'role-btn'); b.type = 'button'; b.setAttribute('aria-pressed', r.id === role ? 'true' : 'false');
      b.setAttribute('data-role', r.id);
      b.appendChild(el('span', 'n', r.ten)); b.appendChild(el('span', 'd', ROLE_DESC[r.id] || ''));
      b.addEventListener('click', function () { setRole(r.id); });
      rg.appendChild(b);
    });
    var hint = $('#role-hint');
    hint.textContent = role ? 'Đang xem với vai trò: ' + roleName(role) + '. Module không có quyền xem được làm mờ.' : 'Chưa chọn vai trò. Chọn một vai trò để xem danh sách module được phép.';
    var list = $('#module-list'); list.textContent = '';
    P.modules.forEach(function (m) {
      var li = el('li');
      var c = cell(role, m.id);
      var ok = role && c && c.xem !== 'khong';
      var node;
      if (ok) { node = el('a', 'mod-card'); node.href = pageHref(SCREENS[m.id][0][0]); }
      else { node = el('div', 'mod-card is-disabled'); node.setAttribute('aria-disabled', 'true'); }
      node.setAttribute('data-module', m.id);
      node.appendChild(el('span', 'code', m.id));
      node.appendChild(el('span', 't', m.ten));
      node.appendChild(el('span', 's', ok ? SCREENS[m.id].length + ' màn hình' : (role ? 'Không có quyền xem' : 'Chọn vai trò trước')));
      if (c) { var chips = permChips(c, false); chips.className = 'perm-row'; node.appendChild(chips); }
      li.appendChild(node); list.appendChild(li);
    });
    decorateLinks();
  }

  function render() {
    if (curModule) { buildSidenav(); buildScreen(); }
    else renderIndex();
    decorateLinks();
  }

  render();
  wireInteractions();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
