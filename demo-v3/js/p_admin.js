'use strict';
/* Quản trị: tài khoản, quyền con Admin, liên kết phụ huynh, nhật ký, cấu hình chung. */

const U_ST = { active: ['Hoạt động', 'ok'], locked: ['Đã khóa', 'warn'], deleted: ['Đã xóa', 'bad'] };
const AF = { role: '', status: 'active', q: '' };
onChg('af', (el) => { AF[el.name] = el.value; if (el.name !== 'q') { App.render(); return; } clearTimeout(AF.t); AF.t = setTimeout(() => { App.render(); const i = document.querySelector('[name=q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); });
page('/tai-khoan/:sel?', { nav: 'tk', can: P.accounts }, (p, u) => {
  const q = AF.q.trim().toLowerCase();
  const L = Store.db.users.filter((x) => (!AF.role || x.role === AF.role || (AF.role === 'login' && x.loginable)) && (!AF.status || x.status === AF.status) && (!q || (x.name + ' ' + x.email + ' ' + x.phone + ' ' + x.code).toLowerCase().includes(q)));
  const sel = p.sel && Q.user(p.sel);
  let h = head('Tài khoản', { desc: 'Trung tâm tạo tài khoản khi học sinh, phụ huynh liên hệ; học sinh không tự đăng ký trên web.', acts: P.adm(u, 'ADM-01') ? '<button class="btn" data-a="importU">' + ic('upload', 16) + 'Nhập từ tệp</button><button class="btn primary" data-a="newU">' + ic('plus', 17) + 'Tạo tài khoản</button>' : '' });
  h += '<div class="flex mb12"><div class="search grow" style="max-width:380px">' + ic('search', 18) + '<input class="in" name="q" data-i="af" value="' + esc(AF.q) + '" placeholder="Tên, email, số điện thoại, mã học viên"></div>' +
    '<select class="in" style="width:auto" name="role" data-c="af">' + opt([['', 'Mọi vai trò'], ['login', 'Tài khoản đăng nhập demo'], ['gv', 'Giáo viên'], ['tg', 'Trợ giảng'], ['hs', 'Học sinh'], ['ph', 'Phụ huynh']], AF.role) + '</select>' +
    '<select class="in" style="width:auto" name="status" data-c="af">' + opt([['', 'Mọi trạng thái'], ['active', 'Hoạt động'], ['locked', 'Đã khóa'], ['deleted', 'Đã xóa']], AF.status) + '</select><span class="faint sm">' + L.length + ' tài khoản</span></div>';
  h += '<div class="split ' + (sel ? 'has-sel' : '') + '"><div class="box inbox">' + (L.length ? L.map((x) => '<a class="it ' + (sel && sel.id === x.id ? 'on' : '') + '" href="#/tai-khoan/' + x.id + '">' + av(x, 38) + '<div class="grow"><div class="flex btw" style="flex-wrap:nowrap"><span class="rt">' + esc(x.name) + '</span>' + tag(U_ST[x.status][0], U_ST[x.status][1]) + '</div><div class="prev">' + esc(roleLabel(x)) + (x.code ? ' · ' + esc(x.code) : '') + '</div><div class="xs faint">' + esc(x.email) + (x.loginable ? '' : ' · minh họa') + '</div></div></a>').join('') : none('Không có tài khoản phù hợp.', 'users')) + '</div>' +
    '<div class="detail">' + (sel ? '<a class="btn s plain back-m mb8" href="#/tai-khoan">' + ic('back', 16) + 'Danh sách</a>' + userDetail(sel, u) : '<div class="box">' + none('Chọn một tài khoản để xem, sửa, phân quyền.', 'user') + '</div>') + '</div></div>';
  return h;
});
function userDetail(x, u) {
  const canEdit = P.adm(u, 'ADM-04') && (!x.superAdmin || x.id === u.id); const acts = [];
  if (!x.superAdmin && x.id !== u.id) {
    if (x.status === 'active' && P.adm(u, 'ADM-02')) acts.push('<button class="btn s" data-a="uSt" data-id="' + x.id + '" data-st="locked">' + ic('lock', 15) + 'Khóa</button>');
    if (x.status === 'locked' && P.adm(u, 'ADM-02')) acts.push('<button class="btn s go" data-a="uSt" data-id="' + x.id + '" data-st="active">' + ic('unlock', 15) + 'Mở khóa</button>');
    if (x.status !== 'deleted' && P.adm(u, 'ADM-03')) acts.push('<button class="btn s stop" data-a="uSt" data-id="' + x.id + '" data-st="deleted">' + ic('trash', 15) + 'Xóa</button>');
    if (x.status === 'deleted' && P.adm(u, 'ADM-03')) acts.push('<button class="btn s go" data-a="uSt" data-id="' + x.id + '" data-st="active">' + ic('restore', 15) + 'Khôi phục</button>');
  }
  let h = '<div class="box"><div class="box-h">' + av(x, 44) + '<div class="grow"><h2>' + esc(x.name) + '</h2><div class="xs faint">' + esc(roleLabel(x)) + (x.code ? ' · ' + esc(x.code) : '') + '</div></div>' + acts.join('') + '</div><div class="box-b vstack">';
  if (x.superAdmin) h += '<div class="note">Super Admin: có mọi quyền con, là người duy nhất gán quyền Admin và duyệt nghỉ, dạy bù. Không ai khóa, xóa, gỡ quyền của tài khoản này.</div>';
  if (!x.loginable) h += '<div class="note warn">Học sinh minh họa: có trong lớp để tạo số liệu, không đăng nhập được trong bản demo.</div>';
  if (x.status !== 'active' && x.lockReason) h += '<div class="note warn">Lý do: ' + esc(x.lockReason) + '</div>';
  h += '<form data-f="uEdit" data-id="' + x.id + '" class="grid-f">' + fld('Họ tên', '<input class="in" name="name" value="' + esc(x.name) + '"' + (canEdit ? '' : ' readonly') + '>', '', 'all') + fld('Email', '<input class="in" name="email" value="' + esc(x.email) + '"' + (canEdit ? '' : ' readonly') + '>') + fld('Số điện thoại', '<input class="in" name="phone" value="' + esc(x.phone) + '"' + (canEdit ? '' : ' readonly') + '>') +
    (x.role === 'hs' ? '<label class="ck all"><input type="checkbox" name="phMode"' + (x.phMode ? ' checked' : '') + (canEdit ? '' : ' disabled') + '>Học sinh (PH): phụ huynh dùng tài khoản này thay con nhỏ</label>' : '') + (canEdit ? '<div class="all"><button class="btn primary s">Lưu thông tin</button></div>' : '') + '</form>';
  if (P.isStaff(x)) {
    const ed = u.superAdmin && !x.superAdmin;
    h += '<div style="border-top:1px solid var(--line);padding-top:16px"><div class="flex btw mb8"><h3 style="font-size:15.5px">Quyền Admin</h3><span class="xs faint">' + (ed ? 'Hiệu lực ngay, không cần đăng nhập lại' : 'Chỉ Hồ An gán quyền') + '</span></div><form data-f="uAdm" data-id="' + x.id + '"><div class="cols c2" style="gap:0 16px">' +
      ADM_LIST.map(([code, name, g]) => '<label class="ck sm"><input type="checkbox" name="adm[]" value="' + code + '"' + (x.superAdmin || x.adm.includes(code) ? ' checked' : '') + (ed && g ? '' : ' disabled') + '>' + esc(name) + (g ? '' : ' <span class="xs faint">(chỉ Hồ An)</span>') + '</label>').join('') + '</div>' + (ed ? '<button class="btn s primary mt12">Lưu quyền</button>' : '') + '</form></div>';
  }
  if (x.role === 'hs') {
    const ps = Store.db.users.filter((y) => y.role === 'ph' && y.status === 'active' && !x.parentIds.includes(y.id));
    h += '<div style="border-top:1px solid var(--line);padding-top:16px"><h3 style="font-size:15.5px" class="mb8">Phụ huynh liên kết</h3>' + (x.parentIds.length ? '<div class="rows">' + x.parentIds.map((pid) => { const pa = Q.user(pid); return '<div class="r">' + av(pa, 30) + '<div class="grow"><div class="rt">' + esc(pa.name) + '</div><div class="rd">' + esc(pa.phone) + '</div></div>' + (canEdit ? '<button class="btn s plain" data-a="unlink" data-s="' + x.id + '" data-p="' + pa.id + '">Gỡ</button>' : '') + '</div>'; }).join('') + '</div>' : '<div class="faint sm">' + (x.phMode ? 'Học sinh (PH): không cần tài khoản phụ huynh.' : 'Chưa liên kết.') + '</div>') +
      (canEdit && x.parentIds.length < 2 && ps.length ? '<form data-f="link" data-id="' + x.id + '" class="flex mt8"><select class="in grow" name="pid">' + opt(ps.map((y) => [y.id, y.name])) + '</select><button class="btn s">Liên kết</button></form>' : '') + '</div>' +
      '<div><div class="xs faint b mb8">LỚP ĐANG HỌC</div><div class="flex">' + (Q.coursesOfStudent(x.id).map((c) => '<a class="tag ai" href="#/lop/' + c.id + '">' + esc(c.name) + '</a>').join('') || '<span class="faint sm">Chưa vào lớp</span>') + '</div><a class="btn s plain mt8" href="#/hoc-sinh/' + x.id + '">Hồ sơ học tập</a></div>';
  }
  if (x.role === 'ph') h += '<div><div class="xs faint b mb8">CON</div><div class="flex">' + x.childIds.map((cid) => '<a class="tag ai" href="#/tai-khoan/' + cid + '">' + esc(Q.user(cid).name) + '</a>').join('') + '</div></div>';
  const logs = Store.db.logs.filter((l) => l.target === x.name).slice(0, 6);
  if (logs.length) h += '<div><div class="xs faint b mb8">NHẬT KÝ LIÊN QUAN</div>' + logs.map((l) => '<div class="sm mb8"><b>' + esc(l.action) + '</b> · ' + esc(Q.user(l.userId).name) + ' · ' + fmt.dt(l.at) + (l.newV ? '<div class="xs faint">' + esc(l.newV) + '</div>' : '') + '</div>').join('') + '</div>';
  return h + '</div></div>';
}
function userForm(pre) {
  pre = pre || {};
  const ps = Store.db.users.filter((x) => x.role === 'ph' && x.status === 'active'); const cs = Store.db.courses.filter((c) => ['nhap', 'cho', 'dang_hoc'].includes(c.status));
  panel({ title: 'Tạo tài khoản', desc: 'Hệ thống sinh mật khẩu tạm và gửi qua email. Bản demo: mật khẩu tạm 123456, không gửi email.', submit: 'Tạo tài khoản',
    body: '<div class="grid-f">' + fld('Họ tên', '<input class="in" name="name">', '', 'all') + fld('Vai trò', '<select class="in" name="role" data-c="uRole">' + opt([['hs', 'Học sinh'], ['ph', 'Phụ huynh'], ['gv', 'Giáo viên'], ['tg', 'Trợ giảng']], pre.role || 'hs') + '</select>') + fld('Số điện thoại', '<input class="in" name="phone">') + fld('Email', '<input class="in" name="email">', 'cần email hoặc số điện thoại', 'all') +
      '<div class="all vstack" id="hsOnly"' + (pre.role && pre.role !== 'hs' ? ' hidden' : '') + '><label class="ck"><input type="checkbox" name="phMode">Học sinh (PH): phụ huynh dùng thay con nhỏ</label><div class="grid-f">' + fld('Liên kết phụ huynh', '<select class="in" name="parentId"><option value="">Không</option>' + opt(ps.map((x) => [x.id, x.name])) + '</select>') + fld('Thêm vào lớp', '<select class="in" name="courseId"><option value="">Không</option>' + opt(cs.map((c) => [c.id, c.name]), pre.courseId) + '</select>') + '</div></div>' +
      '<label class="ck all"><input type="checkbox" name="consent" checked>Đã có đồng ý xử lý dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP)</label></div>',
    onSubmit: (d) => { if (!d.consent) return 'Cần xác nhận đồng ý xử lý dữ liệu cá nhân.'; const r = A.createUser(App.me(), d); if (!r.ok) return r.msg; toast('Đã tạo ' + r.user.name + '. Đăng nhập: ' + (r.user.email || r.user.phone) + ' / 123456', 'ok'); App.render(); } });
}
onChg('uRole', (el) => { document.getElementById('hsOnly').hidden = el.value !== 'hs'; });
on('newU', () => userForm());
on('importU', () => {
  const sample = 'Họ tên;Vai trò;Email;Số điện thoại;Lớp\nTô Minh Châu;Học sinh;chau@demo.vn;0911000201;N5K13\nHà Quang Vinh;Học sinh;vinh@demo.vn;0911000202;N5K13';
  panel({ title: 'Nhập tài khoản từ tệp', wide: true, submit: 'Kiểm tra và nhập', desc: 'Dán nội dung tệp Excel/CSV theo mẫu. Chỉ lưu khi mọi dòng hợp lệ.', body: '<textarea class="in" name="t" rows="8" style="font-family:Consolas,monospace;font-size:13.5px">' + esc(sample) + '</textarea>',
    onSubmit: (d) => {
      const roles = { 'học sinh': 'hs', 'phụ huynh': 'ph', 'giáo viên': 'gv', 'trợ giảng': 'tg' };
      const rows = d.t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(1).map((ln) => ln.split(';').map((x) => (x || '').trim())); const errs = [];
      rows.forEach((r, i) => {
        if (!r[0] || !roles[(r[1] || '').toLowerCase()]) errs.push('Dòng ' + (i + 2) + ': thiếu họ tên hoặc vai trò sai');
        else if (!r[2] && !r[3]) errs.push('Dòng ' + (i + 2) + ': cần email hoặc số điện thoại');
        else if (Store.db.users.some((x) => x.status !== 'deleted' && ((r[2] && x.email === r[2].toLowerCase()) || (r[3] && x.phone === r[3])))) errs.push('Dòng ' + (i + 2) + ': đã có tài khoản');
        else if (r[4] && !Store.db.courses.some((c) => c.name === r[4])) errs.push('Dòng ' + (i + 2) + ': không có lớp "' + r[4] + '"');
      });
      if (errs.length) return errs.join('. ');
      rows.forEach((r) => { const c = r[4] && Store.db.courses.find((x) => x.name === r[4]); A.createUser(App.me(), { name: r[0], role: roles[r[1].toLowerCase()], email: r[2], phone: r[3], courseId: c ? c.id : '' }); });
      toast('Đã nhập ' + rows.length + ' tài khoản', 'ok'); App.render();
    } });
});
onSubmit('uEdit', (d, f) => { if (done(A.updateUser(App.me(), f.dataset.id, { name: d.name.trim(), email: d.email.trim(), phone: d.phone.trim(), phMode: d.phMode }), 'Đã lưu')) App.render(); });
onSubmit('uAdm', (d, f) => { if (done(A.setAdm(App.me(), f.dataset.id, d.adm || []), 'Đã lưu quyền. Người dùng thấy menu, nút mới ngay.')) App.render(); });
onSubmit('link', (d, f) => { if (done(A.linkParent(App.me(), f.dataset.id, d.pid, true), 'Đã liên kết phụ huynh')) App.render(); });
on('unlink', (el) => ask('Gỡ liên kết phụ huynh', 'Phụ huynh mất quyền xem dữ liệu của con ngay.', () => { A.linkParent(App.me(), el.dataset.s, el.dataset.p, false); toast('Đã gỡ liên kết', 'ok'); App.render(); }, { submit: 'Gỡ', danger: true }));
on('uSt', (el) => {
  const x = Q.user(el.dataset.id); const st = el.dataset.st;
  const T = { locked: ['Khóa tài khoản', 'Tạm dừng truy cập, giữ dữ liệu.'], deleted: ['Xóa tài khoản', 'Xóa mềm: ẩn, không đăng nhập được, dữ liệu giữ nguyên, khôi phục được.'], active: [x.status === 'deleted' ? 'Khôi phục tài khoản' : 'Mở khóa tài khoản', ''] }[st];
  ask(T[0], x.name + '. ' + T[1], (reason) => { const r = A.setStatus(App.me(), x.id, st, reason); if (!done(r, T[0] + ': xong')) return false; App.render(); return true; }, { reason: st !== 'active', danger: st !== 'active', submit: T[0] });
});

// ------------------------------------------------------------------ nhật ký
const LF = { who: '', act: '' };
onChg('lf', (el) => { LF[el.name] = el.value; App.render(); });
page('/nhat-ky', { nav: 'nk', can: P.logs }, () => {
  const L = Store.db.logs.filter((l) => (!LF.who || l.userId === LF.who) && (!LF.act || l.action === LF.act));
  return head('Nhật ký quản trị', { desc: 'Ai, lúc nào, thao tác gì, giá trị cũ, giá trị mới. Không sửa, không xóa được.' }) +
    '<div class="flex mb12"><select class="in" style="width:auto" name="who" data-c="lf">' + opt([['', 'Mọi người thao tác'], ...Store.db.users.filter((x) => P.isStaff(x)).map((x) => [x.id, x.name])], LF.who) + '</select><select class="in" style="width:auto" name="act" data-c="lf">' + opt([['', 'Mọi thao tác'], ...[...new Set(Store.db.logs.map((l) => l.action))].map((a) => [a, a])], LF.act) + '</select><span class="faint sm">' + L.length + ' dòng</span></div>' +
    '<div class="box tw"><table class="t"><tr><th>Thời điểm</th><th>Người thao tác</th><th>Thao tác</th><th>Đối tượng</th><th>Cũ</th><th>Mới</th></tr>' + (L.length ? L.map((l) => '<tr><td class="sm num">' + fmt.dt(l.at) + '<div class="xs faint">' + fmt.d(l.at) + '</div></td><td><div class="flex">' + av(Q.user(l.userId), 24) + esc(Q.user(l.userId).name) + '</div></td><td class="b">' + esc(l.action) + '</td><td>' + esc(l.target) + '</td><td class="sm faint">' + esc(l.oldV) + '</td><td class="sm">' + esc(l.newV) + '</td></tr>').join('') : '<tr><td colspan="6">' + none() + '</td></tr>') + '</table></div>';
});

// ------------------------------------------------------------------ cấu hình
page('/cau-hinh', { nav: 'ch', live: false, can: (u) => P.adm(u, 'ADM-12') }, () => {
  const cf = Store.db.config;
  return head('Cấu hình chung', { desc: 'Tham số vận hành, cấp độ, ngày nghỉ, mẫu nhận xét. Giá trị mặc định là đề xuất.' }) +
    '<form data-f="cfg"><div class="cols c-main"><div class="box"><div class="box-h"><h2>Tham số vận hành</h2></div><div class="box-b rows">' + PARAMS.map(([k, name, def, unit]) => '<div class="r"><div class="grow"><div class="sm b">' + esc(name) + '</div><div class="xs faint">Mặc định ' + def + ' ' + esc(unit) + '</div></div><input class="in num" style="width:90px" type="number" min="0" name="p_' + k + '" value="' + cf.params[k] + '"><span class="xs faint" style="width:90px">' + esc(unit) + '</span></div>').join('') + '</div></div>' +
    '<div class="vstack"><div class="box"><div class="box-h"><h2>Cấp độ</h2></div><div class="box-b"><input class="in" name="levels" value="' + esc(cf.levels.join(', ')) + '"><div class="xs faint mt8">Cách nhau bởi dấu phẩy.</div></div></div>' +
    '<div class="box"><div class="box-h"><h2>Ngày nghỉ</h2></div><div class="box-b"><textarea class="in" name="holidays" rows="4">' + esc(cf.holidays.map((x) => x.date + ' ' + x.name).join('\n')) + '</textarea><div class="xs faint mt8">Mỗi dòng: YYYY-MM-DD dấu cách tên ngày nghỉ. Buổi học sinh sau khi lưu bỏ qua các ngày này.</div></div></div>' +
    '<div class="box"><div class="box-h"><h2>Mẫu nhận xét</h2></div><div class="box-b"><textarea class="in" name="templates" rows="6">' + esc(cf.templates.join('\n')) + '</textarea></div></div></div></div><div class="mt16"><button class="btn primary">Lưu cấu hình</button></div></form>';
});
onSubmit('cfg', (d) => {
  const params = {}; PARAMS.forEach(([k]) => { params[k] = Math.max(0, Number(d['p_' + k]) || 0); });
  if (params.qrDoiMoi < 5) { toast('Mã QR cần đổi sau ít nhất 5 giây', 'bad'); return; }
  const holidays = d.holidays.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).map((x) => ({ date: x.slice(0, 10), name: x.slice(11).trim() || 'Ngày nghỉ' })).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date));
  A.saveConfig(App.me(), { params, holidays, levels: d.levels.split(',').map((x) => x.trim()).filter(Boolean), templates: d.templates.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) });
  toast('Đã lưu cấu hình', 'ok'); App.render();
});
