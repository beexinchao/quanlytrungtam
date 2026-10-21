'use strict';
/* Khung ứng dụng: thanh bên trái, đăng nhập 5 tài khoản demo, menu tài khoản, cỡ chữ, trang hướng dẫn, đồng bộ giữa các tab, khởi động. */

const ROLE_CARDS = [
  ['u_hoan', ['Xử lý đơn của cả trung tâm', 'Duyệt gợi ý học liệu vào chương trình', 'Tạo lớp N5K14, thêm học sinh, gán quyền', 'Chỉ số toàn trung tâm']],
  ['u_gva', ['Lớp N5K12 có buổi học hôm nay', 'Mở điểm danh, màn hình QR', 'Giao bài bằng link Google Form, nhập điểm', 'Bổ sung học liệu cho lớp']],
  ['u_tgb', ['Trợ giảng 2 lớp đang học', 'Xử lý đơn xin nghỉ của học sinh', 'Điểm danh thủ công', 'Xin nghỉ ngay trên lịch dạy']],
  ['u_hsc', ['Học lớp N5K12', 'Điểm danh QR hoặc web', 'Làm bài trên Google Form nhúng', 'Xem học liệu (không tải về)']],
  ['u_phd', ['Phụ huynh của Học sinh C', 'Xem báo cáo buổi, nhận xét riêng', 'Xem điểm, chuyên cần', 'Xem đơn của con']],
];

// cỡ chữ: phóng to vùng nội dung, lưu theo trình duyệt
const FS_STEPS = [90, 100, 110, 120, 135];
const FS_KEY = 'hoan_nihongo_demo_v3_fs';
const FontSize = {
  get() { try { const v = Number(localStorage.getItem(FS_KEY)); return FS_STEPS.includes(v) ? v : 100; } catch (e) { return 100; } },
  apply() { document.documentElement.style.setProperty('--zoom', FontSize.get() / 100); },
  step(d) { const i = Math.max(0, Math.min(FS_STEPS.length - 1, FS_STEPS.indexOf(FontSize.get()) + d)); try { localStorage.setItem(FS_KEY, String(FS_STEPS[i])); } catch (e) { /* chế độ riêng tư */ } FontSize.apply(); App.render(); },
  ctl() { return '<div class="fs-ctl" title="Cỡ chữ"><button data-a="fs" data-d="-1" aria-label="Giảm cỡ chữ">A-</button><span>Cỡ chữ ' + FontSize.get() + '%</span><button data-a="fs" data-d="1" aria-label="Tăng cỡ chữ">A+</button></div>'; },
};
on('fs', (el) => FontSize.step(Number(el.dataset.d)));

const App = {
  timers: [], after: [], last: '', notified: 0, cur: null, dirty: false,
  me() { const id = sessionStorage.getItem(USER_KEY); const u = id && Q.user(id); return u && u.status === 'active' && u.loginable ? u : null; },
  home(u) { return P.isStaff(u) ? '#/viec' : u.role === 'hs' ? '#/tong-quan' : '#/con'; },
  enter(id) { sessionStorage.setItem(USER_KEY, id); location.hash = App.home(Q.user(id)); App.render(); },
  render() {
    App.timers.forEach(clearInterval); App.timers = []; App.after = []; App.dirty = false;
    document.querySelectorAll('.pop').forEach((x) => x.remove());
    // giữ nội dung đang gõ ở ô có data-keep (ô nhắn tin) khi trang vẽ lại
    const k = document.querySelector('[data-keep]');
    const keep = k ? { id: k.dataset.keep, v: k.value, focus: document.activeElement === k } : null;
    const root = document.getElementById('app');
    const hash = location.hash.slice(1) || '/';
    const same = hash === App.last; const y = window.scrollY; App.last = hash;
    const as = /^\/as\/(\w+)(\/.*)?$/.exec(hash);
    if (as && Q.user(as[1]) && Q.user(as[1]).loginable) { sessionStorage.setItem(USER_KEY, as[1]); location.replace(as[2] ? '#' + as[2] : App.home(Q.user(as[1]))); App.render(); return; }
    const u = App.me();
    if (!u) { root.innerHTML = loginPage(); App.cur = null; return; }
    if (hash === '/' || hash === '/dang-nhap' || hash === '/hom-nay') { location.replace(App.home(u)); return; }
    let r = null; const p = {};
    for (const x of Routes) { const m = x.re.exec(hash); if (m) { r = x; x.keys.forEach((kk, i) => { p[kk] = m[i + 1] ? decodeURIComponent(m[i + 1]) : undefined; }); break; } }
    let html;
    if (!r) html = head('Không tìm thấy trang') + '<div class="box">' + none('Đường dẫn không tồn tại.') + '</div>';
    else if (r.can && !r.can(u, p)) html = head('Không có quyền xem') + '<div class="box">' + none('Tài khoản ' + roleLabel(u) + ' không được xem trang này.', 'lock') + '</div>';
    else { try { html = r.view(p, u); } catch (e) { console.error(e); html = head('Có lỗi khi hiển thị') + '<div class="box box-b"><pre class="xs">' + esc(e.stack || e) + '</pre></div>'; } }
    root.innerHTML = r && r.bare ? html : '<div class="frame">' + appbar(u, r && r.nav) + '<div class="body"><main class="page">' + html + '</main></div></div>' + tabbar(u, r && r.nav);
    App.cur = r;
    if (keep) { const n = document.querySelector('[data-keep="' + keep.id + '"]'); if (n) { n.value = keep.v; if (keep.focus) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } } }
    App.after.forEach((f) => f());
    window.scrollTo(0, same ? y : 0);
  },
  external() {
    const r = App.cur; const a = document.activeElement;
    const typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !['radio', 'checkbox', 'file'].includes(a.type) && !a.hasAttribute('data-keep');
    if (typing || App.dirty || document.querySelector('.scrim') || (r && r.live === false)) {
      if (Date.now() - App.notified > 4000) { App.notified = Date.now(); toast('Có thay đổi mới từ tài khoản khác', 'info', 'Cập nhật', () => App.render()); }
      return;
    }
    App.render();
  },
};
const later = (f) => App.after.push(f);

// ------------------------------------------------------------------ điều hướng theo vai trò
function navItems(u) {
  if (P.isStaff(u)) {
    const L = [
      { k: 'viec', h: '#/viec', t: 'Tổng quan', m: 'Tổng quan', i: 'inbox', n: Inbox.count(u) },
      { k: 'lich', h: '#/lich', t: 'Lịch dạy của tôi', m: 'Lịch', i: 'calendar' },
    ];
    if (P.adm(u, 'ADM-11')) L.push({ k: 'lichtt', h: '#/lich-tt', t: 'Lịch toàn trung tâm', i: 'calendar' });
    L.push(
      { k: 'lop', h: '#/lop', t: 'Lớp học', m: 'Lớp', i: 'class' },
      { k: 'hd2', h: '#/hoi-dap', t: 'Hỏi đáp', m: 'Hỏi đáp', i: 'chat', n: chatBadge(u) },
      { k: 'ct', h: '#/chuong-trinh', t: 'Chương trình', i: 'book' },
      { k: 'bc', h: '#/bao-cao', t: 'Báo cáo', m: 'Báo cáo', i: 'chart' },
    );
    const adm = [];
    if (P.accounts(u)) adm.push({ k: 'tk', h: '#/tai-khoan', t: 'Tài khoản', i: 'users' });
    if (P.logs(u)) adm.push({ k: 'nk', h: '#/nhat-ky', t: 'Nhật ký', i: 'list' });
    if (P.adm(u, 'ADM-12')) adm.push({ k: 'ch', h: '#/cau-hinh', t: 'Cấu hình', i: 'gear' });
    if (adm.length) L.push({ k: 'qt', t: 'Quản trị', i: 'shield', sub: adm });
    return L;
  }
  if (u.role === 'hs') return [
    { k: 'tq', h: '#/tong-quan', t: 'Tổng quan', m: 'Tổng quan', i: 'home' },
    { k: 'lich', h: '#/lich', t: 'Lịch học', m: 'Lịch', i: 'calendar' },
    { k: 'bai', h: '#/bai-tap', t: 'Bài tập, kiểm tra', m: 'Bài tập', i: 'pen', n: Learner.todo(u.id).length },
    { k: 'kq', h: '#/ket-qua', t: 'Kết quả', m: 'Kết quả', i: 'star' },
    { k: 'hd2', h: '#/hoi-dap', t: 'Hỏi đáp', m: 'Hỏi đáp', i: 'chat', n: chatBadge(u) },
    { k: 'hl', h: '#/hoc-lieu', t: 'Học liệu', i: 'book' },
  ];
  return [
    { k: 'con', h: '#/con', t: 'Tổng quan', m: 'Tổng quan', i: 'home' },
    { k: 'lich', h: '#/lich', t: 'Lịch học của con', m: 'Lịch', i: 'calendar' },
  ];
}
// thanh bên trái (máy tính) và thanh trên gọn (điện thoại)
function sideGroups(u) {
  const items = navItems(u);
  if (P.isStaff(u)) {
    const by = (keys) => items.filter((it) => keys.includes(it.k));
    const G = [{ t: 'Hằng ngày', items: by(['viec', 'lich', 'lichtt', 'lop', 'hd2']) }, { t: 'Giảng dạy', items: by(['ct', 'bc']) }];
    const adm = items.find((it) => it.sub);
    if (adm) G.push({ t: 'Quản trị', items: adm.sub });
    return G;
  }
  return [{ t: u.role === 'hs' ? (u.phMode ? 'Học sinh (PH)' : 'Học tập') : 'Phụ huynh', items }];
}
function appbar(u, key) {
  const G = sideGroups(u).concat([{ t: 'Bản demo', items: [{ k: 'hd', h: '#/huong-dan', t: 'Kịch bản thử', i: 'help' }] }]);
  const brand = '<a class="mark" href="' + App.home(u) + '"><span class="hanko">安</span><span><b>' + esc(Store.db.config.centerName) + '</b><small>Giáo vụ và học tập</small></span></a>';
  const acct = '<button class="acct" data-a="acct">' + av(u, 34) + '<span class="t"><b>' + esc(u.name) + '</b><small>' + esc(roleLabel(u)) + '</small></span>' + ic('more', 18) + '</button>';
  return '<aside class="side">' + brand + '<nav class="side-nav">' + G.map((g) => '<div class="side-g">' + esc(g.t) + '</div>' + g.items.map((it) =>
      '<a href="' + it.h + '" title="' + esc(it.t) + '" class="' + (it.k === key ? 'on' : '') + '">' + ic(it.i, 19) + '<span>' + esc(it.t) + '</span>' + (it.n ? '<span class="dot-n">' + it.n + '</span>' : '') + '</a>').join('')).join('') + '</nav>' +
    '<div class="side-foot">' + FontSize.ctl() + '<span class="demo-pill">' + ic('alert', 14) + 'Dữ liệu giả, lưu trên máy này</span>' + acct + '</div></aside>' +
    '<header class="appbar"><div class="appbar-in">' + brand + acct + '</div></header>';
}
function tabbar(u, key) {
  const items = navItems(u).filter((it) => it.m).slice(0, 5);
  return '<nav class="tabbar">' + items.map((it) => '<a href="' + it.h + '" class="' + (it.k === key ? 'on' : '') + '">' + ic(it.i, 21) + '<span>' + esc(it.m) + '</span>' + (it.n ? '<span class="dot-n">' + it.n + '</span>' : '') + '</a>').join('') + '</nav>';
}
on('acct', (el) => {
  const old = document.querySelector('.pop'); if (old) { old.remove(); return; }
  const u = App.me();
  const p = document.createElement('div'); p.className = 'pop';
  const adm = navItems(u).find((x) => x.sub);
  p.innerHTML = '<div class="mi" style="cursor:default">' + av(u, 42) + '<span><b>' + esc(u.name) + '</b><small>' + esc(roleLabel(u)) + (u.code ? ' · ' + esc(u.code) : '') + '</small></span></div><div class="sep"></div>' +
    '<div style="padding:4px 10px 8px">' + FontSize.ctl() + '</div>' +
    '<a class="mi" href="#/ca-nhan">' + ic('user', 18) + 'Hồ sơ cá nhân</a>' + (adm && !el.closest('.side') ? adm.sub.map((s) => '<a class="mi" href="' + s.h + '">' + ic(s.i, 18) + esc(s.t) + '</a>').join('') : '') +
    (P.adm(u, 'ADM-11') && !el.closest('.side') ? '<a class="mi" href="#/lich-tt">' + ic('calendar', 18) + 'Lịch toàn trung tâm</a>' : '') +
    (u.role === 'hs' && !el.closest('.side') ? '<a class="mi" href="#/hoc-lieu">' + ic('book', 18) + 'Học liệu</a>' : '') +
    '<a class="mi" href="#/huong-dan">' + ic('help', 18) + 'Kịch bản thử</a><button class="mi" data-a="logout">' + ic('out', 18) + 'Đăng xuất</button>' +
    '<div class="sep"></div><div class="cap">Chuyển sang tài khoản khác</div>' +
    LOGIN_IDS.filter((id) => id !== u.id).map((id) => { const x = Q.user(id); return '<button class="mi" data-a="enter" data-id="' + id + '">' + av(x, 30) + '<span><b>' + esc(x.name) + '</b><small>' + esc(roleLabel(x)) + '</small></span></button>'; }).join('') +
    '<div class="sep"></div><button class="mi" data-a="reset">' + ic('restore', 18) + '<span>Đặt lại dữ liệu demo<small>Xóa mọi thay đổi, áp dụng cho mọi tab</small></span></button>';
  document.body.appendChild(p);
  const r = el.getBoundingClientRect();
  if (el.closest('.side')) { p.style.left = r.left + 'px'; p.style.bottom = (window.innerHeight - r.top + 8) + 'px'; } else { p.style.right = '8px'; p.style.top = (r.bottom + 6) + 'px'; }
  setTimeout(() => document.addEventListener('click', function h(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('click', h); } }), 0);
});
on('enter', (el) => App.enter(el.dataset.id));
on('logout', () => { sessionStorage.removeItem(USER_KEY); location.hash = '#/dang-nhap'; App.render(); });
on('reset', () => ask('Đặt lại dữ liệu demo', 'Mọi thay đổi (đơn, điểm danh, bài làm, tệp tải lên...) bị xóa và dữ liệu mẫu được tạo lại. Áp dụng cho mọi tab.', () => { Store.reset(); App.render(); toast('Đã đặt lại dữ liệu demo', 'ok'); }, { submit: 'Đặt lại', danger: true }));
on('tab', (el) => window.open(location.pathname + '#/as/' + el.dataset.id + (el.dataset.to || ''), '_blank'));
on('go', (el) => nav(el.dataset.h));

// ------------------------------------------------------------------ đăng nhập
function loginPage() {
  return '<div class="login"><div class="login-in"><div class="login-top"><span class="hanko">安</span><h1>' + esc(Store.db.config.centerName) + '</h1>' +
    '<p>Bản demo hệ thống quản lý giáo vụ và học tập. Chọn một vai trò để vào thử. Muốn thấy các vai trò tương tác với nhau, hãy mở thêm tab và chọn vai trò khác.</p></div>' +
    '<div class="roles">' + ROLE_CARDS.map(([id, pts]) => { const u = Q.user(id); return '<button class="role" data-a="enter" data-id="' + id + '">' + av(u, 46) + '<div><div class="rr">' + esc(roleLabel(u)) + '</div><div class="rn">' + esc(u.name) + '</div></div><ul>' + pts.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul><span class="go">Vào với vai trò này ' + ic('next', 14) + '</span></button>'; }).join('') + '</div>' +
    '<form class="login-form" data-f="login"><div class="b mb12">Hoặc đăng nhập bằng tài khoản</div><div class="vstack">' + fld('Email hoặc số điện thoại', '<input class="in" name="id" autocomplete="username" placeholder="giaovien.a@demo.vn">') +
    fld('Mật khẩu', '<input class="in" type="password" name="pw" autocomplete="current-password" placeholder="123456">') + '<div class="err" id="lerr" hidden></div>' +
    '<div class="flex btw"><button class="btn primary">Đăng nhập</button><span class="xs faint">Mật khẩu demo: 123456</span></div></div></form>' +
    '<p class="xs faint" style="text-align:center;margin-top:18px">Dữ liệu giả, lưu trong trình duyệt của máy này. Không gửi dữ liệu ra ngoài.</p></div></div>';
}
onSubmit('login', (d) => {
  const r = A.login(d.id, d.pw);
  if (!r.ok) { const e = document.getElementById('lerr'); e.textContent = r.msg; e.hidden = false; return; }
  App.enter(r.user.id);
});

// ------------------------------------------------------------------ hồ sơ cá nhân
page('/ca-nhan', { nav: '' }, (p, u) => head('Hồ sơ cá nhân', { eyebrow: esc(roleLabel(u)) }) +
  '<div class="cols c2"><div class="box"><div class="box-h"><h2>Thông tin liên hệ</h2></div><form class="box-b vstack" data-f="me"><div class="person">' + av(u, 56) + '<div><b style="font-size:18px">' + esc(u.name) + '</b><span class="faint sm">' + esc(u.code || roleLabel(u)) + '</span></div></div>' +
  fld('Email', '<input class="in" name="email" value="' + esc(u.email) + '">') + fld('Số điện thoại', '<input class="in" name="phone" value="' + esc(u.phone) + '">') +
  (u.role === 'ph' ? fld('Con đã liên kết', '<div>' + esc(u.childIds.map((x) => Q.user(x).name).join(', ')) + '</div>') : '') + '<div><button class="btn primary">Lưu</button></div></form></div>' +
  '<div class="box"><div class="box-h"><h2>Đổi mật khẩu</h2></div><form class="box-b vstack" data-f="pw">' + fld('Mật khẩu hiện tại', '<input class="in" type="password" name="old">') + fld('Mật khẩu mới', '<input class="in" type="password" name="nw">', 'ít nhất 6 ký tự') + '<div><button class="btn primary">Đổi mật khẩu</button></div></form></div></div>');
onSubmit('me', (d) => { const u = App.me(); Store.tx((db) => { const x = db.users.find((y) => y.id === u.id); x.email = d.email.trim(); x.phone = d.phone.trim(); }); toast('Đã lưu', 'ok'); App.render(); });
onSubmit('pw', (d) => { if (done(A.changePassword(App.me(), d.old, d.nw), 'Đã đổi mật khẩu')) App.render(); });

// ------------------------------------------------------------------ kịch bản thử
page('/huong-dan', { nav: 'hd' }, () => {
  const t = (id, to, label) => '<button class="btn s soft" data-a="tab" data-id="' + id + '" data-to="' + (to || '') + '">' + ic('swap', 15) + esc(label || 'Mở tab ' + Q.user(id).name) + '</button>';
  const S = [
    ['Điểm danh bằng mã QR', 'Giáo viên mở điểm danh, học sinh tự điểm danh, số người có mặt trên màn hình giáo viên tăng ngay.', ['Giáo viên A: Tổng quan, khung Buổi dạy hôm nay, bấm Mở điểm danh. Màn hình QR hiện ra.', 'Học sinh C: Tổng quan, bấm Điểm danh (web) hoặc Quét mã QR rồi nhập 6 số trên màn hình QR.', 'Màn hình QR của Giáo viên A tự cập nhật. Vào chi tiết buổi để Chốt điểm danh.'], [['u_gva'], ['u_hsc']]],
    ['Xin nghỉ ngay trên lịch học', 'Đơn gắn với buổi học: học sinh bấm Xin nghỉ trên thời khóa biểu, người phụ trách và Hồ An thấy đơn ở Tổng quan.', ['Học sinh C: Lịch học, bấm Xin nghỉ trên một buổi sắp tới, gửi đơn. Buổi hiện nhãn Đơn nghỉ: chờ duyệt.', 'Trợ giảng B hoặc Hồ An: Tổng quan, bấm vào đơn để xem chi tiết, Chấp nhận.', 'Học sinh C và Phụ huynh D: buổi đổi thành Nghỉ có phép; Tổng quan liệt kê đơn và kết quả.'], [['u_hsc', '/lich'], ['u_tgb'], ['u_phd']]],
    ['Giao bài bằng link Google Form', 'Không soạn câu hỏi trên web: dán link Google Form, bài hiện ngay trong trang làm bài của học sinh.', ['Giáo viên A: Lớp học, N5K12, tab Bài tập, kiểm tra, Giao bài từ Google Form. Dán link Google Form thật (cần mạng) hoặc bấm một form mẫu; khung bên trái hiện bài ngay.', 'Giáo viên A: đặt tiêu đề, hạn nộp, bấm Giao bài.', 'Học sinh C: Bài tập, bấm bài vừa giao: form hiện trong trang. Form mẫu: trả lời rồi bấm Gửi, điểm tự chấm hiện ngay.'], [['u_gva', '/lop/c_n5k12/bai'], ['u_hsc', '/bai-tap']]],
    ['Nhập điểm, dán điểm từ Google Form', 'Bài có câu tự luận hoặc form thật: người phụ trách nhập điểm thang 10 hoặc dán từ bảng câu trả lời của form.', ['Học sinh C: làm "Bài tập: Tính từ い và な" (form mẫu có câu tự luận nên chờ điểm).', 'Giáo viên A: Tổng quan, ô Bài chờ điểm, mở bài, Nhập điểm. Bấm "Dán điểm từ Google Form" để thử dán mã học viên và điểm "8 / 10".', 'Bấm Lưu và trả kết quả: thẻ bài của Học sinh C chuyển sang cột Có kết quả, Phụ huynh D thấy điểm.'], [['u_hsc', '/bai-tap'], ['u_gva'], ['u_phd']]],
    ['Học liệu: lớp bổ sung, Hồ An duyệt vào chương trình', 'Lớp lấy học liệu của chương trình làm nền; giáo viên tải thêm học liệu cho buổi; học liệu đó vào gợi ý của chương trình để Hồ An quyết định.', ['Giáo viên A: Lớp học, N5K12, tab Nội dung buổi học, chọn một buổi, tải tệp hoặc dán đường dẫn. Học liệu hiện ngay cho lớp, gắn nhãn Lớp bổ sung.', 'Hồ An: Tổng quan có ô Gợi ý học liệu chờ duyệt; hoặc Chương trình, Sơ cấp N5: buổi có gợi ý hiện khung Gợi ý học liệu từ các lớp. Bấm Thêm vào chương trình hoặc Không thêm.', 'Lớp tạo sau từ Sơ cấp N5 nhận học liệu đã được thêm.'], [['u_gva', '/lop/c_n5k12/nd/3'], ['u_hoan', '/chuong-trinh/p_n5/goi-y']]],
    ['Học liệu chỉ xem, không tải về', 'Giáo viên, học sinh, phụ huynh xem học liệu ngay trong trang, khung xem đóng dấu tên người xem, không có nút tải về. Chỉ Hồ An tải được bản gốc.', ['Học sinh C: Học liệu, bấm Xem ở một tệp: tệp mở trong khung xem, không có nút tải, không chuột phải.', 'Hồ An: Chương trình, Sơ cấp N5, buổi 1: có thêm nút tải bản gốc.'], [['u_hsc', '/hoc-lieu'], ['u_hoan', '/chuong-trinh/p_n5/0']]],
    ['Tổng quan theo mức ưu tiên', 'Tầng 1 là buổi dạy hôm nay và việc gấp; tầng 2 là việc tồn theo loại (bấm ô để lọc); tầng 3 là chỉ số lớp 4 tuần so với 4 tuần trước.', ['Giáo viên A: Tổng quan, xem khung Cần làm ngay, bấm ô Đơn chờ xử lý để lọc danh sách việc.', 'Hồ An: Tổng quan, cuối trang là Tình hình toàn trung tâm và bảng từng lớp.', 'Học sinh C, Phụ huynh D: Tổng quan có Việc cần làm và Chỉ số học tập so với trung bình lớp.'], [['u_gva'], ['u_hoan'], ['u_hsc']]],
    ['Hỏi đáp kiểu Messenger, mỗi bài test một đoạn chat', 'Không chia theo câu: mỗi học sinh có một đoạn chat với giáo viên, trợ giảng cho mỗi bài test; tin hiện ngay ở tab kia, có "Đã xem".', ['Giáo viên A: Hỏi đáp, mở đoạn chat của Đỗ Ngọc Ánh, nhắn trả lời (Enter để gửi).', 'Học sinh C: Hỏi đáp, bấm biểu tượng bút (Tin nhắn mới), chọn một bài test; hoặc mở bài ở Kết quả, bấm Nhắn giáo viên. Tab Giáo viên A thấy tin mới ngay.'], [['u_gva', '/hoi-dap'], ['u_hsc', '/hoi-dap']]],
    ['Hồ An: lịch dạy, lịch toàn trung tâm, đơn của cả trung tâm', 'Hồ An có lịch dạy riêng và lịch mọi lớp (mỗi lớp một màu), xử lý đơn của mọi học sinh và nhân sự, không cần gửi đơn nghỉ.', ['Hồ An: Lịch toàn trung tâm để xem mọi lớp; Lịch dạy của tôi để xem buổi của mình.', 'Hồ An: Tổng quan có đơn nghỉ dạy của Giáo viên A, Trợ giảng B và đơn của học sinh. Duyệt đơn của Giáo viên A: Hồ An dạy thay, buổi hiện trên Lịch dạy với nhãn Dạy thay.'], [['u_hoan', '/lich-tt'], ['u_gva', '/lich']]],
    ['Tạo lớp tên N5K14, báo cáo theo cấp độ', 'Tên lớp tự đặt theo mẫu N[cấp độ]K[số]; báo cáo so sánh theo cấp độ, chương trình, lớp, học sinh.', ['Hồ An: Lớp học, Tạo lớp, chọn chương trình Sơ cấp N5: tên lớp đề xuất N5K14 (sửa được số K).', 'Hồ An: Lớp học, N5K13, tab Học sinh, Thêm học sinh, rồi Bắt đầu lớp: hệ thống sinh 24 buổi.', 'Hồ An: Báo cáo, chuyển giữa các tab Theo cấp độ, Theo chương trình, Theo lớp, Theo học sinh.'], [['u_hoan', '/lop'], ['u_hoan', '/bao-cao']]],
  ];
  return head('Kịch bản thử', { eyebrow: 'Bản demo', desc: 'Mỗi nút mở một tab mới đã đăng nhập sẵn. Đặt các tab cạnh nhau để thấy thao tác ở tab này hiện ngay ở tab kia.' }) +
    '<div class="cols c2">' + S.map(([ti, de, steps, tabs], i) => '<div class="box"><div class="box-h"><span class="tag shu">' + (i + 1) + '</span><h2>' + esc(ti) + '</h2></div><div class="box-b"><p class="muted sm" style="margin-top:0">' + esc(de) + '</p><ol class="sm" style="padding-left:18px">' + steps.map((s) => '<li class="mb8">' + esc(s) + '</li>').join('') + '</ol><div class="flex">' + tabs.map(([id, to]) => t(id, to)).join('') + '</div></div></div>').join('') + '</div>' +
    '<div class="box mt24"><div class="box-h"><h2>Tài khoản đăng nhập</h2><span class="sp"></span><span class="faint sm">Mật khẩu chung: 123456</span></div><div class="tw"><table class="t"><tr><th>Tên</th><th>Vai trò</th><th>Đăng nhập</th></tr>' +
    LOGIN_IDS.map((id) => { const x = Q.user(id); return '<tr><td><div class="flex">' + av(x, 28) + esc(x.name) + '</div></td><td>' + esc(roleLabel(x)) + '</td><td class="sm">' + esc(x.email) + '</td></tr>'; }).join('') + '</table></div></div>' +
    '<p class="faint sm mt16">Các học sinh khác trong lớp là dữ liệu minh họa, không đăng nhập được. Tài khoản do Hồ An tạo mới trong demo đăng nhập được với mật khẩu tạm 123456.</p>';
});

// ------------------------------------------------------------------ sự kiện chung
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-a]');
  if (t && On[t.dataset.a]) { if (t.tagName === 'A') e.preventDefault(); On[t.dataset.a](t, e); return; }
  const row = e.target.closest('[data-h]');
  if (row && !e.target.closest('a,button,input,select,textarea,label')) nav(row.dataset.h);
});
document.addEventListener('submit', (e) => { const f = e.target.closest('[data-f]'); if (f && Sub[f.dataset.f]) { e.preventDefault(); Sub[f.dataset.f](readForm(f), f, e); } });
document.addEventListener('change', (e) => { const t = e.target.closest('[data-c]'); if (t && Chg[t.dataset.c]) Chg[t.dataset.c](t, e); });
document.addEventListener('input', (e) => { const t = e.target.closest('[data-i]'); if (t && Chg[t.dataset.i]) Chg[t.dataset.i](t, e); });
['input', 'change'].forEach((ev) => document.addEventListener(ev, (e) => { if (e.target.closest && e.target.closest('main form') && !e.target.closest('[data-c]') && !e.target.hasAttribute('data-keep')) App.dirty = true; }));
window.addEventListener('hashchange', () => { document.querySelectorAll('.scrim').forEach((x) => x.remove()); App.render(); });
window.addEventListener('storage', (e) => { if (e.key !== DB_KEY || !e.newValue) return; try { Store.db = JSON.parse(e.newValue); } catch (x) { return; } App.external(); });

FontSize.apply();
Store.load();
A.housekeeping();
App.render();
