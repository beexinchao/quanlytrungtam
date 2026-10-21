'use strict';
/* Giảng dạy: lịch, lớp học, buổi học (điểm danh, màn hình QR, nội dung, báo cáo buổi), đổi lịch, nghỉ dạy, dạy bù. */

// nhân sự thấy buổi: người dạy của buổi, hoặc người phụ trách khác (trừ giáo viên chính đã có người dạy thay, người đã được duyệt vắng)
function staffSees(u, s) {
  const c = Q.course(s.courseId);
  if (s.teacherId === u.id) return true;
  if (!P.assigned(u, c) || (s.absentStaff || []).includes(u.id)) return false;
  return u.id !== c.teacherId;
}
const lessonOf = (s) => { const c = Q.course(s.courseId); return c.lessons[s.idx] || { title: s.title, goal: '', content: '', note: '', materials: [] }; };

// ------------------------------------------------------------------ thời khóa biểu (trục dọc là giờ)
const CLASS_COLORS = [
  { bg: '#DCE7FB', bd: '#4A72D9', ink: '#1F3A80' }, { bg: '#DDF3E6', bd: '#2E9A5E', ink: '#18573A' }, { bg: '#FCE4DA', bd: '#D9653B', ink: '#7A2E12' },
  { bg: '#EDE2F7', bd: '#8A55C2', ink: '#4B2577' }, { bg: '#FFF1CC', bd: '#C9930E', ink: '#6B4C00' }, { bg: '#D9F1F2', bd: '#22949A', ink: '#0F5357' },
  { bg: '#FADDE8', bd: '#C94379', ink: '#721E43' }, { bg: '#E6EAD5', bd: '#6E8A2E', ink: '#3D4E14' },
];
const classColor = (cid) => CLASS_COLORS[Math.max(0, Store.db.courses.findIndex((c) => c.id === cid)) % CLASS_COLORS.length];
const toMin = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
function scheduleFor(u, all) {
  const db = Store.db;
  if (P.isStaff(u)) return all ? db.sessions.filter((s) => Q.course(s.courseId).status !== 'da_xoa') : db.sessions.filter((s) => staffSees(u, s));
  const ids = u.role === 'hs' ? [u.id] : u.childIds;
  return db.sessions.filter((s) => { const c = Q.course(s.courseId); return ids.some((sid) => Q.rosterOf(s).some((x) => x.id === sid) || (!Q.sessionStarted(s) && c.members.some((m) => m.uid === sid && !m.leftAt))); });
}
// trạng thái đơn và nút xin nghỉ, dạy bù ngay trên buổi học
function leaveBit(s, u) {
  const future = !Q.sessionStarted(s); const c = Q.course(s.courseId);
  if (u.role === 'hs' || u.role === 'ph') {
    const ids = u.role === 'hs' ? [u.id] : u.childIds;
    const r = Store.db.requests.filter((x) => x.kind === 'hs_nghi' && x.sessionId === s.id && ids.includes(x.userId) && x.status !== 'huy').pop();
    if (r) return tag(r.status === 'duyet' ? 'Nghỉ có phép' : r.status === 'cho' ? 'Đơn nghỉ: chờ duyệt' : 'Đơn nghỉ bị từ chối', r.status === 'duyet' ? 'plum' : r.status === 'cho' ? 'warn' : 'bad');
    return u.role === 'hs' && future && s.status !== 'huy' ? '<button class="tt-btn" data-a="newLeave" data-id="' + s.id + '">Xin nghỉ</button>' : '';
  }
  if (!P.isStaff(u) || u.superAdmin) return '';
  const r = Store.db.requests.filter((x) => (x.kind === 'gv_nghi' || x.kind === 'day_bu') && x.sessionId === s.id && x.userId === u.id && x.status !== 'huy').pop();
  if (r) return tag((r.kind === 'day_bu' ? 'Dạy bù: ' : 'Nghỉ dạy: ') + REQ_STATUS[r.status][0].toLowerCase(), TONE[REQ_STATUS[r.status][1]]);
  if (s.status === 'huy' && P.assigned(u, c) && !Store.db.sessions.some((y) => y.makeupOf === s.id)) return '<button class="tt-btn" data-a="makeup" data-id="' + s.id + '">Đăng ký dạy bù</button>';
  if (future && s.status !== 'huy' && staffSees(u, s)) return '<button class="tt-btn" data-a="staffLeave" data-id="' + s.id + '">Xin nghỉ</button>';
  return '';
}
function ttEvent(s, u, top, height, lane, lanes) {
  const c = Q.course(s.courseId); const col = classColor(c.id); const t = Q.user(s.teacherId);
  const kids = u.role === 'ph' ? u.childIds.filter((k) => c.members.some((m) => m.uid === k)).map((k) => Q.user(k).name).join(', ') : '';
  const flags = [s.status === 'huy' ? tag('Đã hủy') : '', s.status === 'doi_lich' ? tag('Đã đổi lịch', 'warn') : '', s.status === 'day_bu' ? tag('Dạy bù', 'plum') : '',
    P.isStaff(u) && s.teacherId === u.id && c.teacherId !== u.id ? tag('Dạy thay', 'plum') : '', s.attendance.open ? tag('Đang điểm danh', 'ai') : ''].join('');
  return '<div class="tt-ev' + (s.status === 'huy' ? ' off' : '') + '" data-h="#/buoi/' + s.id + '" title="' + esc(c.name + ' · ' + s.title + ' · ' + s.start + ' - ' + s.end) + '" style="top:' + top + 'px;height:' + height + 'px;--hgt:' + height + 'px;left:calc(' + (lane * 100 / lanes) + '% + 3px);width:calc(' + (100 / lanes) + '% - 6px);--bg:' + col.bg + ';--bd:' + col.bd + ';--ink:' + col.ink + '">' +
    '<div class="tt-name">' + esc(c.name) + ' <span>(Buổi ' + (s.idx + 1) + ')</span></div>' + (kids ? '<div class="tt-line"><b>Con:</b> ' + esc(kids) + '</div>' : '') +
    '<div class="tt-line"><b>Nội dung:</b> ' + esc(s.title) + '</div><div class="tt-line"><b>Phòng:</b> ' + esc(s.mode === 'online' ? 'Zoom' : s.mode === 'offline' ? s.room || 'Tại trung tâm' : (s.room || '') + ' + Zoom') + '</div>' +
    '<div class="tt-line"><b>GV:</b> ' + esc(t ? t.name : '-') + '</div><div class="tt-time">' + ic('clock', 14) + s.start + ' → ' + s.end + '</div>' + (flags ? '<div class="tt-flags">' + flags + '</div>' : '') +
    '<div class="tt-foot"><span class="tt-link">Nội dung buổi</span>' + leaveBit(s, u) + '</div></div>';
}
let TTDay = null;
function weekGrid(ss, days, u) {
  const H = 100;
  // trục giờ vừa với các buổi trong tuần (thêm 1 giờ hai đầu); tuần trống: 07:00 - 21:00
  let minH = 7; let maxH = 21;
  if (ss.length) {
    minH = Math.max(0, Math.min(...ss.map((s) => Math.floor(toMin(s.start) / 60))) - 1);
    maxH = Math.min(24, Math.max(...ss.map((s) => Math.ceil(toMin(s.end) / 60))) + 1);
    if (maxH - minH < 5) maxH = Math.min(24, minH + 5);
  }
  const narrow = window.matchMedia('(max-width: 820px)').matches;
  if (TTDay == null || !days.includes(TTDay)) TTDay = days.includes(todayStr()) ? todayStr() : days[0];
  const show = narrow ? [TTDay] : days;
  const hol = Store.db.config.holidays;
  let h = narrow ? '<div class="seg mb12 tt-days">' + days.map((d) => '<button data-a="ttDay" data-d="' + d + '" class="' + (d === TTDay ? 'on' : '') + '">' + DOW[parseYmd(d).getDay()] + ' ' + parseYmd(d).getDate() + '</button>').join('') + '</div>' : '';
  h += '<div class="tt" style="--cols:' + show.length + ';--hh:' + H + 'px"><div class="tt-head"><div></div>' + show.map((d) => { const dt = parseYmd(d); const hd = hol.find((x) => x.date === d);
    return '<div class="tt-dh' + (d === todayStr() ? ' today' : '') + '">' + DOW_FULL[dt.getDay()] + ' <span>(' + fmt.dm(d) + ')</span>' + (hd ? '<div class="xs" style="color:var(--warn)">' + esc(hd.name) + '</div>' : '') + '</div>'; }).join('') + '</div>';
  h += '<div class="tt-body" style="height:' + (maxH - minH) * H + 'px"><div class="tt-times">' + Array.from({ length: maxH - minH + 1 }, (_, i) => '<div style="top:' + i * H + 'px">' + pad(minH + i) + ':00</div>').join('') + '</div>';
  show.forEach((d) => {
    const list = ss.filter((s) => s.date === d).sort((a, b) => toMin(a.start) - toMin(b.start));
    // chia làn khi các buổi trùng giờ
    const lanes = [];
    const placed = list.map((s) => { let li = lanes.findIndex((end) => end <= toMin(s.start)); if (li < 0) { li = lanes.length; lanes.push(0); } lanes[li] = toMin(s.end); return { s, li }; });
    h += '<div class="tt-col' + (d === todayStr() ? ' today' : '') + '">' + placed.map(({ s, li }) => {
      const overlap = placed.filter((x) => toMin(x.s.start) < toMin(s.end) && toMin(s.start) < toMin(x.s.end));
      const n = Math.max(...overlap.map((x) => x.li)) + 1;
      return ttEvent(s, u, ((toMin(s.start) - minH * 60) / 60) * H + 2, ((toMin(s.end) - toMin(s.start)) / 60) * H - 4, li, n);
    }).join('') + (d === todayStr() ? nowLine(minH, maxH, H) : '') + '</div>';
  });
  return h + '</div></div>';
}
function nowLine(minH, maxH, H) { const n = new Date(); const m = n.getHours() * 60 + n.getMinutes(); if (m < minH * 60 || m > maxH * 60) return ''; return '<div class="tt-now" style="top:' + ((m - minH * 60) / 60) * H + 'px"></div>'; }
on('ttDay', (el) => { TTDay = el.dataset.d; App.render(); });
window.matchMedia('(max-width: 820px)').addEventListener('change', () => { if (App.me()) App.render(); });
function calendarPage(p, u, all) {
  const w = Number(p.w || 0);
  const base = startOfDay(new Date()); const mon = addDays(base, -((base.getDay() + 6) % 7) + w * 7);
  const days = Array.from({ length: 7 }, (_, i) => ymd(addDays(mon, i)));
  const ss = scheduleFor(u, all).filter((s) => s.date >= days[0] && s.date <= days[6]);
  const route = all ? '#/lich-tt/' : '#/lich/';
  const title = all ? 'Lịch toàn trung tâm' : u.role === 'ph' ? 'Lịch học của con' : P.isStaff(u) ? 'Lịch dạy của tôi' : 'Lịch học';
  const desc = all ? 'Mọi lớp đang học, mỗi lớp một màu nền.' : u.role === 'hs' ? 'Bấm Xin nghỉ ngay trên buổi học để gửi đơn.' : P.isStaff(u) && !u.superAdmin ? 'Bấm Xin nghỉ trên buổi dạy để gửi đơn cho Hồ An duyệt.' : '';
  let h = head(title, { eyebrow: fmt.d(days[0]) + ' - ' + fmt.d(days[6]), desc,
    acts: '<a class="btn icon" href="' + route + (w - 1) + '" title="Tuần trước">' + ic('back', 18) + '</a><a class="btn ' + (w === 0 ? 'soft' : '') + '" href="' + route + '0">Tuần này</a><a class="btn icon" href="' + route + (w + 1) + '" title="Tuần sau">' + ic('next', 18) + '</a>' });
  const cls = [...new Set(ss.map((s) => s.courseId))].map(Q.course);
  if (cls.length) h += '<div class="legend mb12">' + cls.map((c) => '<span><i style="background:' + classColor(c.id).bd + '"></i>' + esc(c.name) + '</span>').join('') + '</div>';
  h += weekGrid(ss, days, u);
  if (!ss.length) h += '<div class="note mt12">Tuần này không có buổi học.</div>';
  return h;
}
page('/lich/:w?', { nav: 'lich' }, (p, u) => calendarPage(p, u, false));
page('/lich-tt/:w?', { nav: 'lichtt', can: (u) => P.adm(u, 'ADM-11') }, (p, u) => calendarPage(p, u, true));

// ------------------------------------------------------------------ danh sách lớp
let ClassF = 'all';
on('classF', (el) => { ClassF = el.dataset.v; App.render(); });
page('/lop', { nav: 'lop', can: P.isStaff }, (p, u) => {
  const all = Store.db.courses.filter((c) => P.viewCourse(u, c));
  const F = [['all', 'Tất cả'], ['dang_hoc', 'Đang học'], ['cho', 'Chờ khai giảng'], ['nhap', 'Nháp'], ['ket_thuc', 'Đã kết thúc']];
  const L = all.filter((c) => ClassF === 'all' || c.status === ClassF);
  let h = head('Lớp học', { desc: 'Mỗi lớp lấy một chương trình học làm nền, có lịch, người phụ trách và học sinh riêng.', acts: P.adm(u, 'ADM-05') ? '<button class="btn primary" data-a="newClass">' + ic('plus', 17) + 'Tạo lớp</button>' : '' });
  h += '<div class="flex mb16"><div class="seg">' + F.map(([v, t]) => '<button data-a="classF" data-v="' + v + '" class="' + (ClassF === v ? 'on' : '') + '">' + t + ' ' + all.filter((c) => v === 'all' || c.status === v).length + '</button>').join('') + '</div></div>';
  if (!L.length) return h + '<div class="box">' + none('Không có lớp.', 'class') + '</div>';
  return h + '<div class="box tw"><table class="t"><tr><th>Lớp</th><th>Cấp độ</th><th>Lịch học</th><th>Phụ trách</th><th class="n">Học sinh</th><th>Tiến độ</th><th>Trạng thái</th></tr>' + L.map((c) => {
    const ss = Q.sessionsOf(c.id); const dn = ss.filter((s) => s.attendance.closed && s.status !== 'huy').length; const ro = !P.assigned(u, c) && !P.courseAdmin(u) && !P.adm(u, 'ADM-11');
    return '<tr class="go" data-h="#/lop/' + c.id + '"><td><div class="b">' + esc(c.name) + '</div><div class="xs faint">' + esc(Q.program(c.programId).name) + ' · ' + esc(MODE_NAME[c.mode]) + '</div></td><td>' + tag(c.level, 'ai') + '</td><td class="sm">' + fmt.days(c.days) + '<br><span class="faint">' + c.start + ' - ' + c.end + '</span></td>' +
      '<td class="sm">' + esc(c.staffIds.map((x) => Q.user(x).name).join(', ') || '-') + (P.assigned(u, c) ? '<br>' + tag('Bạn phụ trách', 'ok') : ro ? '<br>' + tag('Chỉ xem báo cáo') : '') + '</td><td class="n">' + Q.activeMembers(c).length + '</td>' +
      '<td style="min-width:130px"><div class="xs faint">' + dn + '/' + c.nSessions + ' buổi</div>' + miniBar(c.nSessions ? (dn / c.nSessions) * 100 : 0) + '</td><td>' + classTag(c) + '</td></tr>';
  }).join('') + '</table></div>';
});
function classForm(c) {
  c = c || { days: [1, 3, 5], start: '18:00', end: '19:30', mode: 'online', startDate: ymd(addDays(new Date(), 7)) };
  const gv = Store.db.users.filter((x) => x.role === 'gv' && x.status === 'active'); const tg = Store.db.users.filter((x) => x.role === 'tg' && x.status === 'active');
  const progs = Store.db.programs.filter((p) => p.status === 'ap_dung');
  const nameBox = c.id ? fld('Tên lớp', '<input class="in" value="' + esc(c.name) + '" readonly>', 'theo mẫu N[cấp độ]K[số], không đổi', 'all')
    : fld('Chương trình học làm nền', '<select class="in" name="programId" data-c="classProg"><option value="">Chọn chương trình</option>' + opt(progs.map((p) => [p.id, p.name + ' · cấp độ ' + p.level + ' · ' + p.nSessions + ' buổi · phiên bản ' + p.version])) + '</select>', 'bắt buộc', 'all') +
      '<div class="all class-name"><div class="fld"><label>Số thứ tự lớp (K) <span class="hint">tự đề xuất số kế tiếp của cấp độ</span></label><input class="in num" type="number" min="1" max="999" name="no" data-i="classNo" style="max-width:140px" disabled></div>' +
      '<div><div class="xs faint">Tên lớp</div><div class="cn" id="cname">Chọn chương trình để đặt tên</div></div></div>' +
      '<div class="all xs faint" style="margin-top:-6px">Học liệu của chương trình là nền của lớp. Giáo viên bổ sung học liệu cho từng buổi ở tab Nội dung buổi học; học liệu đó được lưu vào gợi ý của chương trình để Hồ An duyệt.</div>';
  return '<div class="grid-f">' + nameBox +
    fld('Hình thức', '<select class="in" name="mode">' + opt(Object.entries(MODE_NAME), c.mode) + '</select>') + fld('Ngày khai giảng', '<input class="in" type="date" name="startDate" value="' + c.startDate + '">') +
    fld('Lịch học trong tuần', daysPick('days', c.days), '', 'all') +
    fld('Giờ bắt đầu', '<input class="in" type="time" name="start" value="' + c.start + '">') + fld('Giờ kết thúc', '<input class="in" type="time" name="end" value="' + c.end + '">') +
    fld('Đường dẫn Zoom', '<input class="in" name="zoom" value="' + esc(c.zoom || '') + '" placeholder="https://zoom.us/j/...">') + fld('Phòng học', '<input class="in" name="room" value="' + esc(c.room || '') + '" placeholder="vd: Phòng 201">') +
    (c.id ? '' : fld('Giáo viên chính', '<select class="in" name="teacherId"><option value="">Chưa chọn</option>' + opt(gv.map((x) => [x.id, x.name])) + '</select>') +
      fld('Trợ giảng', tg.map((x) => '<label class="ck"><input type="checkbox" name="taIds[]" value="' + x.id + '">' + esc(x.name) + '</label>').join(''))) + '</div>';
}
// tên lớp tự sinh khi chọn chương trình hoặc đổi số thứ tự
function classNamePreview(f) {
  const p = Q.program(f.programId.value); const no = f.no; const box = document.getElementById('cname');
  if (!p) { no.disabled = true; no.value = ''; box.textContent = 'Chọn chương trình để đặt tên'; box.className = 'cn'; return; }
  no.disabled = false; if (!no.value || no.dataset.lv !== p.level) { no.value = nextClassNo(Store.db, p.level); no.dataset.lv = p.level; }
  const name = className(p.level, Number(no.value) || 0); const taken = Store.db.courses.some((c) => c.name === name && c.status !== 'da_xoa');
  box.textContent = name + (taken ? ' (đã có lớp này)' : ''); box.className = 'cn' + (taken ? ' bad-t' : '');
}
onChg('classProg', (el) => classNamePreview(el.form));
onChg('classNo', (el) => classNamePreview(el.form));
on('newClass', () => panel({ title: 'Tạo lớp học', desc: 'Lớp nhận bản sao nội dung từng buổi, học liệu, trọng số điểm của chương trình. Tên lớp đặt theo mẫu N[cấp độ]K[số], ví dụ N5K12. Lớp mới ở trạng thái Nháp.', wide: true, submit: 'Tạo lớp', body: classForm(),
  onSubmit: (d) => { const r = A.createCourse(App.me(), Object.assign(d, { days: d.days || [], taIds: d.taIds || [] })); if (!r.ok) return r.msg; toast('Đã tạo lớp', 'ok'); nav('#/lop/' + r.id); } }));
on('editClass', (el) => { const c = Q.course(el.dataset.id); panel({ title: 'Sửa thông tin lớp', desc: c.status === 'dang_hoc' ? 'Lớp đang học: thay đổi lịch, hình thức chỉ áp cho buổi chưa diễn ra.' : '', wide: true, body: classForm(c),
  onSubmit: (d) => { if (!(d.days || []).length) return 'Chọn ít nhất một ngày học.'; done(A.updateCourse(App.me(), c.id, d), 'Đã lưu'); App.render(); } }); });
on('assign', (el) => {
  const c = Q.course(el.dataset.id); const gv = Store.db.users.filter((x) => x.role === 'gv' && x.status === 'active'); const st = Store.db.users.filter((x) => P.isStaff(x) && x.status === 'active');
  panel({ title: 'Phân công phụ trách', desc: c.name + '. Trợ giảng hỗ trợ trong buổi, không được xếp làm người dạy.', submit: 'Lưu phân công',
    body: fld('Giáo viên chính', '<select class="in" name="t">' + opt(gv.map((x) => [x.id, x.name]), c.teacherId) + '</select>') + '<div class="mt16">' + fld('Người phụ trách thêm', st.map((x) => '<label class="ck"><input type="checkbox" name="o[]" value="' + x.id + '"' + (c.staffIds.includes(x.id) && x.id !== c.teacherId ? ' checked' : '') + '>' + av(x, 24) + esc(x.name) + ' <span class="xs faint">' + ROLE_NAME[x.role] + '</span></label>').join('')) + '</div>',
    onSubmit: (d) => { done(A.assignStaff(App.me(), c.id, d.t, d.o || []), 'Đã lưu phân công'); App.render(); } });
});
on('classStatus', (el) => {
  const c = Q.course(el.dataset.id); const st = el.dataset.st;
  const T = { cho: ['Chuyển Chờ khai giảng', 'Cần có Giáo viên chính.'], dang_hoc: c.status === 'cho' ? ['Bắt đầu lớp', 'Lớp chuyển Đang học, hệ thống sinh ' + c.nSessions + ' buổi theo lịch tuần, bỏ qua ngày nghỉ.'] : ['Mở lại lớp', ''], ket_thuc: ['Kết thúc lớp', 'Mở báo cáo tổng kết lớp để công bố.'], tam_khoa: ['Tạm khóa lớp', 'Lớp chỉ xem, không thao tác.'], da_xoa: ['Xóa lớp', 'Lớp bị ẩn, dữ liệu được giữ, khôi phục được.'] }[st];
  ask(T[0], c.name + '. ' + T[1], (reason) => { const r = A.setCourseStatus(App.me(), c.id, st, reason); if (!done(r, T[0] + ': xong')) return false; App.render(); return true; }, { submit: T[0], reason: ['tam_khoa', 'da_xoa'].includes(st), danger: ['tam_khoa', 'da_xoa'].includes(st) });
});

// ------------------------------------------------------------------ chi tiết lớp
page('/lop/:id/:tab?/:x?', { nav: 'lop', can: (u, p) => P.viewCourse(u, Q.course(p.id)) }, (p, u) => {
  const c = Q.course(p.id); const pr = Q.program(c.programId);
  const full = P.assigned(u, c) || P.adm(u, 'ADM-11') || P.courseAdmin(u); const op = P.operate(u, c);
  const tabs = full ? [['tq', 'Tổng quan'], ['buoi', 'Buổi học'], ['hs', 'Học sinh'], ['bai', 'Bài tập, kiểm tra'], ['nd', 'Nội dung buổi học'], ['bc', 'Báo cáo lớp']] : [['tq', 'Tổng quan'], ['bc', 'Báo cáo lớp']];
  const tab = tabs.some((t) => t[0] === p.tab) ? p.tab : 'tq';
  const a = [];
  const can5or6 = P.adm(u, 'ADM-05') || P.adm(u, 'ADM-06');
  if (c.status === 'nhap' && can5or6) a.push('<button class="btn primary" data-a="classStatus" data-id="' + c.id + '" data-st="cho">Chuyển Chờ khai giảng</button>');
  if (c.status === 'cho' && can5or6) a.push('<button class="btn primary" data-a="classStatus" data-id="' + c.id + '" data-st="dang_hoc">' + ic('play', 16) + 'Bắt đầu lớp</button>');
  if (c.status === 'dang_hoc' && P.adm(u, 'ADM-06')) a.push('<button class="btn" data-a="classStatus" data-id="' + c.id + '" data-st="ket_thuc">Kết thúc lớp</button>');
  if (c.status === 'tam_khoa' && P.adm(u, 'ADM-07')) a.push('<button class="btn" data-a="classStatus" data-id="' + c.id + '" data-st="dang_hoc">Mở lại</button>');
  if (P.adm(u, 'ADM-06') && !['ket_thuc', 'da_xoa'].includes(c.status)) a.push('<button class="btn" data-a="editClass" data-id="' + c.id + '">' + ic('pen', 16) + 'Sửa</button>');
  if (P.adm(u, 'ADM-08') && !['ket_thuc', 'da_xoa'].includes(c.status)) a.push('<button class="btn" data-a="assign" data-id="' + c.id + '">' + ic('users', 16) + 'Phân công</button>');
  if (P.adm(u, 'ADM-07') && c.status === 'dang_hoc') a.push('<button class="btn stop" data-a="classStatus" data-id="' + c.id + '" data-st="tam_khoa">Tạm khóa</button>');
  if (P.adm(u, 'ADM-07') && ['nhap', 'cho', 'ket_thuc'].includes(c.status)) a.push('<button class="btn stop" data-a="classStatus" data-id="' + c.id + '" data-st="da_xoa">' + ic('trash', 16) + 'Xóa</button>');
  let h = head(c.name, { eyebrow: '<a href="#/lop">Lớp học</a> · Cấp độ ' + esc(c.level), desc: classTag(c) + ' &nbsp;' + esc(pr.name) + ' · ' + esc(MODE_NAME[c.mode]) + ' · ' + fmt.days(c.days) + ', ' + c.start + ' - ' + c.end, acts: a.join('') });
  if (!full) h += '<div class="note mb16">Bạn không phụ trách lớp này. Lớp cùng cấp độ ' + esc(c.level) + ' nên bạn xem được báo cáo (chỉ đọc).</div>';
  else if (!P.assigned(u, c)) h += '<div class="note mb16">Bạn xem lớp với quyền Admin. Điểm danh, bài, báo cáo buổi dành cho người phụ trách.</div>';
  h += '<div class="tabs">' + tabs.map(([k, t]) => '<a href="#/lop/' + c.id + '/' + k + '" class="' + (k === tab ? 'on' : '') + '">' + t + '</a>').join('') + '</div>';
  return h + ClassTab[tab](c, u, op, p.x);
});
const avgOf = (arr) => { const v = arr.filter((x) => x != null); return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : null; };
const ClassTab = {
  tq(c, u) {
    const ss = Q.sessionsOf(c.id); const dn = ss.filter((s) => s.attendance.closed && s.status !== 'huy'); const next = ss.find((s) => !Q.sessionEnded(s) && s.status !== 'huy');
    const mem = Q.activeMembers(c); const rate = avgOf(mem.map((m) => Calc.attendanceOf(m.uid, c.id).rate)); const sc = avgOf(mem.map((m) => Calc.grades(m.uid, c.id).total));
    const kv = (k, v) => '<dt>' + k + '</dt><dd>' + v + '</dd>';
    return '<div class="cols c4 k2 mb16"><div class="stat"><div class="k"><span class="ico">' + ic('calendar', 16) + '</span>Buổi đã học</div><div class="v">' + dn.length + '<span class="faint" style="font-size:18px">/' + c.nSessions + '</span></div></div>' +
      '<div class="stat"><div class="k"><span class="ico">' + ic('users', 16) + '</span>Học sinh</div><div class="v">' + mem.length + '</div></div>' +
      '<div class="stat ok"><div class="k"><span class="ico">' + ic('check', 16) + '</span>Chuyên cần TB</div><div class="v">' + fmt.pct(rate) + '</div></div>' +
      '<div class="stat plum"><div class="k"><span class="ico">' + ic('star', 16) + '</span>Điểm tổng kết TB</div><div class="v">' + fmt.sc(sc) + '</div></div></div>' +
      '<div class="cols c-main"><div class="box"><div class="box-h"><h2>Thông tin lớp</h2></div><div class="box-b"><dl class="kv">' +
      kv('Chương trình', esc(Q.program(c.programId).name) + ' · phiên bản ' + c.programVersion) + kv('Cấp độ', esc(c.level)) + kv('Giáo viên chính', esc((Q.user(c.teacherId) || {}).name || 'Chưa phân công')) +
      kv('Người phụ trách', esc(c.staffIds.map((x) => Q.user(x).name + ' (' + ROLE_NAME[Q.user(x).role] + ')').join(', ') || '-')) + kv('Lịch học', fmt.days(c.days) + ' · ' + c.start + ' - ' + c.end) + kv('Khai giảng', fmt.d(c.startDate)) +
      kv('Hình thức', esc(MODE_NAME[c.mode])) + kv('Zoom, phòng', esc([c.zoom, c.room].filter(Boolean).join(' · ') || '-')) + '</dl></div></div>' +
      '<div class="box"><div class="box-h"><h2>Buổi tiếp theo</h2></div><div class="box-b">' + (next ? '<a class="when-card" style="text-decoration:none;color:inherit" href="#/buoi/' + next.id + '">' + calChip(next.date) + '<div><div class="b">' + fmt.rel(next.date) + ' · ' + next.start + ' - ' + next.end + '</div><div class="sm">Buổi ' + (next.idx + 1) + ': ' + esc(next.title) + '</div><div class="xs faint">' + esc(where(next)) + '</div></div></a>' : none(c.status === 'cho' ? 'Lớp chưa bắt đầu. Thêm học sinh rồi bấm Bắt đầu lớp.' : 'Không còn buổi nào.', 'calendar')) + '</div></div></div>';
  },
  buoi(c) {
    const ss = Q.sessionsOf(c.id);
    if (!ss.length) return '<div class="box">' + none('Buổi học được sinh khi bắt đầu lớp.', 'calendar') + '</div>';
    return '<div class="box tw"><table class="t"><tr><th>#</th><th>Ngày</th><th>Nội dung</th><th>Người dạy</th><th>Điểm danh</th><th>Báo cáo</th></tr>' + ss.map((s) => {
      const R = Q.rosterOf(s); const pr = Object.values(s.attendance.records).filter((r) => r.st === 'co_mat' || r.st === 'di_muon').length;
      return '<tr class="go" data-h="#/buoi/' + s.id + '"><td class="faint">' + (s.idx + 1) + '</td><td class="sm"><b>' + fmt.rel(s.date) + '</b><br><span class="faint">' + s.start + ' - ' + s.end + '</span></td><td>' + esc(s.title) + ' ' + sessTag(s) + '</td><td class="sm">' + esc((Q.user(s.teacherId) || {}).name || '-') + '</td>' +
        '<td>' + (s.status === 'huy' ? '-' : s.attendance.closed ? '<span class="num">' + pr + '/' + R.length + '</span>' : s.attendance.open ? tag('Đang mở', 'ai') : '<span class="faint">-</span>') + '</td><td>' + (s.report && s.report.status === 'cong_bo' ? tag('Đã công bố', 'ok') : Q.sessionEnded(s) && s.status !== 'huy' ? tag('Chưa công bố', 'warn') : '<span class="faint">-</span>') + '</td></tr>';
    }).join('') + '</table></div>';
  },
  hs(c, u) {
    const can = P.adm(u, 'ADM-09') && !['ket_thuc', 'da_xoa'].includes(c.status); const mem = Q.activeMembers(c); const left = c.members.filter((m) => m.leftAt);
    let h = '<div class="flex btw mb12"><span class="muted">' + mem.length + ' học sinh. Không giới hạn sĩ số.</span>' + (can ? '<button class="btn primary" data-a="addStu" data-id="' + c.id + '">' + ic('plus', 17) + 'Thêm học sinh</button>' : '') + '</div>';
    if (!mem.length) return h + '<div class="box">' + none('Lớp chưa có học sinh.', 'users') + '</div>';
    h += '<div class="box tw"><table class="t"><tr><th>Học sinh</th><th>Phụ huynh</th><th>Chuyên cần</th><th class="n">Điểm tổng kết</th>' + (can ? '<th></th>' : '') + '</tr>' + mem.map((m) => {
      const s = Q.user(m.uid); const a = Calc.attendanceOf(s.id, c.id); const g = Calc.grades(s.id, c.id);
      return '<tr class="go" data-h="#/hoc-sinh/' + s.id + '"><td><div class="flex">' + av(s, 32) + '<div><div class="b">' + esc(s.name) + '</div><div class="xs faint">' + esc(s.code) + (s.loginable ? '' : ' · minh họa') + '</div></div></div></td>' +
        '<td class="sm">' + (s.phMode ? '<span class="faint">Phụ huynh dùng tài khoản học sinh</span>' : esc(s.parentIds.map((x) => Q.user(x).name).join(', ') || '-')) + '</td>' +
        '<td style="min-width:140px"><div class="flex btw xs"><b>' + fmt.pct(a.rate) + '</b><span class="faint">' + a.ok + '/' + a.held + '</span></div>' + miniBar(a.rate, toneRate(a.rate)) + '</td><td class="n">' + (g.total == null ? '-' : tag(fmt.sc(g.total), toneScore(g.total))) + '</td>' +
        (can ? '<td><button class="btn s plain" data-a="rmStu" data-id="' + c.id + '" data-uid="' + s.id + '">Rút, chuyển</button></td>' : '') + '</tr>';
    }).join('') + '</table></div>';
    if (left.length) h += '<div class="box mt16 box-b"><div class="b mb8">Đã rút, chuyển</div>' + left.map((m) => '<div class="sm">' + esc(Q.user(m.uid).name) + ' · ' + fmt.d(m.leftAt) + ' · ' + esc(m.reason) + '</div>').join('') + '</div>';
    return h;
  },
  bai(c, u, op) {
    const L = Store.db.assignments.filter((a) => a.courseId === c.id).sort((a, b) => (a.dueAt < b.dueAt ? 1 : -1)); const n = Q.activeMembers(c).length;
    let h = '<div class="flex btw mb12"><span class="muted">' + L.length + ' bài · làm trên Google Form nhúng</span>' + (op ? '<a class="btn primary" href="#/bai-moi/' + c.id + '">' + ic('plus', 17) + 'Giao bài từ Google Form</a>' : '') + '</div>';
    if (!L.length) return h + '<div class="box">' + none('Chưa có bài.', 'pen') + '</div>';
    return h + '<div class="box tw"><table class="t"><tr><th>Bài</th><th>Hạn nộp</th><th class="n">Đã nộp</th><th>Chờ nhập điểm, trả kết quả</th><th>Trạng thái</th></tr>' + L.map((a) => {
      const subs = Store.db.submissions.filter((s) => s.assignmentId === a.id); const pend = subs.filter((s) => s.status !== 'da_tra').length; const noScore = subs.filter((s) => s.score == null).length;
      return '<tr class="go" data-h="#/bai/' + a.id + '"><td><div class="b">' + esc(a.title) + '</div><div class="xs faint">' + esc(ASG_TYPE[a.type]) + '</div></td><td class="sm">' + fmt.dt(a.dueAt) + '</td><td class="n">' + subs.length + '/' + n + '</td><td>' + (noScore ? tag(noScore + ' chờ điểm', 'warn') + ' ' : '') + (pend - noScore ? tag(pend - noScore + ' chờ trả', 'ai') : '') + (!pend ? '<span class="faint">-</span>' : '') + '</td><td>' + (a.status === 'nhap' ? tag('Nháp') : tag('Đã giao', 'ok')) + '</td></tr>';
    }).join('') + '</table></div>';
  },
  nd(c, u, op, x) {
    const idx = Math.max(0, Math.min(c.lessons.length - 1, Number(x || 0)));
    const ss = Q.sessionsOf(c.id); const s = ss.find((y) => y.idx === idx && y.status !== 'day_bu');
    const live = (op || P.adm(u, 'ADM-06')) && !['ket_thuc', 'da_xoa'].includes(c.status);
    const can = live && !(s && Q.sessionStarted(s));
    const pr = Q.program(c.programId);
    return '<div class="note mb16">Nền tảng từ chương trình ' + esc(pr.name) + ': nội dung và học liệu của chương trình. Sửa nội dung ở đây chỉ áp cho lớp này (buổi chưa diễn ra). Học liệu giáo viên tự soạn thêm tải lên theo buổi; học liệu đó lưu vào gợi ý của chương trình, Hồ An quyết định có bổ sung vào chương trình không.</div>' +
      '<div class="split has-sel" style="grid-template-columns:320px minmax(0,1fr)"><div class="box lesson-list">' + c.lessons.map((l, i) => { const se = ss.find((y) => y.idx === i && y.status !== 'day_bu'); const diff = pr.lessons[i] && (pr.lessons[i].title !== l.title || pr.lessons[i].content !== l.content);
        const extra = (l.materials || []).filter((m) => m.origin === 'lop').length;
        return '<a class="ln ' + (i === idx ? 'on' : '') + '" href="#/lop/' + c.id + '/nd/' + i + '"><span class="no">' + (i + 1) + '</span><div class="grow"><div class="sm b">' + esc(l.title) + '</div><div class="meta">' + (se ? fmt.dm(se.date) : 'Chưa xếp lịch') + ' · ' + (l.materials || []).length + ' học liệu' + (extra ? ' (' + extra + ' lớp bổ sung)' : '') + (diff ? ' · đã chỉnh riêng' : '') + '</div></div></a>'; }).join('') + '</div>' +
      '<div>' + lessonEditor('course', c, idx, can, live) + '</div></div>';
  },
  bc(c, u) {
    const types = Object.keys(ASG_TYPE); const pr = Q.program(c.programId);
    const rows = Q.activeMembers(c).map((m) => { const s = Q.user(m.uid); return { s, a: Calc.attendanceOf(s.id, c.id), g: Calc.grades(s.id, c.id) }; });
    const rep = c.report || { status: 'nhap', general: '' };
    return '<div class="flex btw mb12"><span class="muted sm">Điểm tổng kết theo trọng số: ' + types.map((t) => ASG_TYPE[t] + ' ' + pr.weights[t] + '%').join(', ') + '</span><div class="flex"><button class="btn s" data-a="csvClass" data-id="' + c.id + '">' + ic('down', 15) + 'Xuất CSV</button><button class="btn s" data-a="print">In, lưu PDF</button><a class="btn s soft" href="#/bao-cao/lop/' + c.id + '">Xem biểu đồ</a></div></div>' +
      '<div class="box tw"><table class="t"><tr><th>Học sinh</th><th>Chuyên cần</th>' + types.map((t) => '<th class="n">' + ASG_TYPE[t] + '</th>').join('') + '<th class="n">Tổng kết</th></tr>' + rows.map((r) => '<tr class="go" data-h="#/hoc-sinh/' + r.s.id + '"><td>' + esc(r.s.name) + '</td><td>' + fmt.pct(r.a.rate) + ' <span class="xs faint">' + r.a.ok + '/' + r.a.held + '</span></td>' + types.map((t) => '<td class="n">' + fmt.sc(r.g.avg[t]) + '</td>').join('') + '<td class="n b">' + fmt.sc(r.g.total) + '</td></tr>').join('') + '</table></div>' +
      '<div class="box mt16"><div class="box-h"><h2>Nhận xét tổng kết lớp</h2><span class="sp"></span>' + (rep.status === 'cong_bo' ? tag('Đã công bố ' + fmt.dt(rep.publishedAt), 'ok') : tag('Nháp', 'warn')) + '</div><div class="box-b">' +
      (P.assigned(u, c) ? '<form data-f="classReport" data-id="' + c.id + '"><textarea class="in" name="g" rows="4" placeholder="Nhận xét chung về lớp">' + esc(rep.general) + '</textarea><div class="flex mt12"><button class="btn" name="pub" value="0">Lưu nháp</button><button class="btn primary" name="pub" value="1">' + ic('send', 16) + 'Công bố cho học sinh, phụ huynh</button></div></form>' : (rep.status === 'cong_bo' ? '<div class="content-view">' + esc(rep.general) + '</div>' : '<span class="faint">Chưa công bố.</span>')) + '</div></div>';
  },
};
on('print', () => window.print());
on('csvClass', (el) => {
  const c = Q.course(el.dataset.id); const types = Object.keys(ASG_TYPE); const rows = [['Học sinh', 'Mã', 'Chuyên cần %', ...types.map((t) => ASG_TYPE[t]), 'Tổng kết']];
  Q.activeMembers(c).forEach((m) => { const s = Q.user(m.uid); const a = Calc.attendanceOf(s.id, c.id); const g = Calc.grades(s.id, c.id); rows.push([s.name, s.code, a.rate, ...types.map((t) => g.avg[t]), g.total]); });
  saveText('bao_cao_lop_' + c.name.replace(/\W+/g, '_') + '.csv', toCsv(rows));
});
onSubmit('classReport', (d, f, e) => { const pub = e.submitter && e.submitter.value === '1'; A.saveCourseReport(App.me(), f.dataset.id, d.g, pub); toast(pub ? 'Đã công bố báo cáo lớp' : 'Đã lưu nháp', 'ok'); App.render(); });
on('addStu', (el) => {
  const c = Q.course(el.dataset.id); const cand = Store.db.users.filter((x) => x.role === 'hs' && x.status === 'active' && !c.members.some((m) => m.uid === x.id && !m.leftAt));
  panel({ title: 'Thêm học sinh vào lớp', desc: c.name + (c.status === 'dang_hoc' ? '. Học sinh vào lớp đang học tham gia từ buổi kế tiếp.' : ''), submit: 'Thêm vào lớp',
    body: '<div class="search mb12">' + ic('search', 18) + '<input class="in" placeholder="Tìm theo tên hoặc mã học viên" data-i="filterRows"></div>' + (cand.length ? '<div class="rows">' + cand.map((x) => { const cur = Q.coursesOfStudent(x.id).map((k) => k.name).join(', ');
      return '<label class="r ck" data-name="' + esc((x.name + ' ' + x.code).toLowerCase()) + '"><input type="checkbox" name="ids[]" value="' + x.id + '">' + av(x, 32) + '<span class="grow"><b>' + esc(x.name) + '</b><span class="xs faint" style="display:block">' + esc(x.code) + ' · ' + (cur ? 'đang học ' + esc(cur) : 'chưa vào lớp nào') + '</span></span></label>'; }).join('') + '</div>' : none('Mọi học sinh đã ở trong lớp.')) +
      '<div class="mt16"><button type="button" class="btn s soft" data-a="newUserFor" data-id="' + c.id + '">' + ic('plus', 15) + 'Tạo tài khoản học sinh mới</button></div>',
    onSubmit: (d) => { if (!(d.ids || []).length) return 'Chọn ít nhất một học sinh.'; const r = A.addMembers(App.me(), c.id, d.ids); toast('Đã thêm ' + d.ids.length + ' học sinh', 'ok'); (r.warn || []).forEach((w) => toast('Cảnh báo: ' + w, 'bad')); App.render(); } });
});
onChg('filterRows', (el) => { const q = el.value.trim().toLowerCase(); el.closest('form').querySelectorAll('[data-name]').forEach((x) => { x.style.display = x.dataset.name.includes(q) ? '' : 'none'; }); });
on('newUserFor', (el) => { document.querySelectorAll('.scrim').forEach((x) => x.remove()); userForm({ role: 'hs', courseId: el.dataset.id }); });
on('rmStu', (el) => {
  const c = Q.course(el.dataset.id); const s = Q.user(el.dataset.uid); const others = Store.db.courses.filter((x) => x.id !== c.id && ['dang_hoc', 'cho'].includes(x.status));
  panel({ title: 'Rút hoặc chuyển lớp', desc: s.name + ' · ' + c.name + '. Dữ liệu đã có giữ ở lớp cũ.', submit: 'Xác nhận', danger: true,
    body: fld('Chuyển sang lớp', '<select class="in" name="to"><option value="">Chỉ rút khỏi lớp</option>' + opt(others.map((x) => [x.id, x.name])) + '</select>') + '<div class="mt16">' + fld('Lý do', '<textarea class="in" name="reason" rows="3"></textarea>', 'bắt buộc') + '</div>',
    onSubmit: (d) => { if (!d.reason.trim()) return 'Nhập lý do.'; done(A.removeMember(App.me(), c.id, s.id, d.reason.trim(), d.to || null), 'Đã cập nhật'); App.render(); } });
});

// ------------------------------------------------------------------ buổi học
const canSeeSession = (u, s) => {
  if (!s) return false; const c = Q.course(s.courseId);
  if (P.isStaff(u)) return P.viewCourse(u, c) || s.teacherId === u.id;
  const ids = u.role === 'hs' ? [u.id] : u.childIds;
  return ids.some((id) => c.members.some((m) => m.uid === id));
};
const RollEdit = {};
page('/buoi/:id/:tab?', { nav: 'lich', can: (u, p) => canSeeSession(u, Q.session(p.id)) }, (p, u) => {
  const s = Q.session(p.id);
  if (!P.isStaff(u)) return learnerSession(s, u);
  const c = Q.course(s.courseId); const op = P.operate(u, c) || s.teacherId === u.id; const started = Q.sessionStarted(s);
  const tabs = [['dd', 'Điểm danh'], ['nd', 'Nội dung, học liệu'], ['bc', 'Báo cáo buổi'], ['khac', 'Bài và đơn']];
  const tab = tabs.some((t) => t[0] === p.tab) ? p.tab : 'dd';
  const a = [];
  if (s.mode !== 'offline') a.push('<button class="btn" data-a="zoom" data-id="' + s.id + '">' + ic('video', 17) + 'Vào Zoom</button>');
  if (op && !started && s.status !== 'huy') a.push('<button class="btn" data-a="resched" data-id="' + s.id + '">' + ic('calendar', 17) + 'Đổi lịch</button>' + (u.superAdmin ? '' : '<button class="btn" data-a="staffLeave" data-id="' + s.id + '">Xin nghỉ</button>'));
  if (op && s.status === 'huy' && !u.superAdmin) a.push('<button class="btn primary" data-a="makeup" data-id="' + s.id + '">Đăng ký dạy bù</button>');
  let h = head('Buổi ' + (s.idx + 1) + ': ' + s.title, { eyebrow: '<a href="#/lop/' + c.id + '/buoi">' + esc(c.name) + '</a>', desc: fmt.day(s.date) + ' · ' + s.start + ' - ' + s.end + ' · ' + esc(where(s)) + ' · Người dạy: ' + esc((Q.user(s.teacherId) || {}).name || '-') + ' ' + sessTag(s), acts: a.join('') });
  if (s.note) h += '<div class="note warn mb16">' + esc(s.note) + '</div>';
  if ((s.absentStaff || []).length) h += '<div class="note mb16">Vắng hỗ trợ (đã duyệt): ' + esc(s.absentStaff.map((x) => Q.user(x).name).join(', ')) + '</div>';
  if (s.status === 'huy') return h + '<div class="box">' + none('Buổi học đã hủy. Người phụ trách đăng ký dạy bù để Hồ An duyệt.', 'x') + '</div>';
  h += '<div class="tabs">' + tabs.map(([k, t]) => '<a href="#/buoi/' + s.id + '/' + k + '" class="' + (k === tab ? 'on' : '') + '">' + t + '</a>').join('') + '</div>';
  if (tab === 'dd') return h + rollView(s, u, op);
  if (tab === 'nd') return h + lessonEditor('course', c, s.idx, op && !started && s.status !== 'day_bu', P.operate(u, c));
  if (tab === 'bc') return h + reportEditor(s, u, op);
  const asg = Store.db.assignments.filter((x) => x.sessionId === s.id); const reqs = Store.db.requests.filter((r) => r.sessionId === s.id && r.kind === 'hs_nghi');
  return h + '<div class="cols c2"><div class="box"><div class="box-h"><h2>Bài của buổi</h2><span class="sp"></span>' + (op ? '<a class="btn s soft" href="#/bai-moi/' + c.id + '/' + s.id + '">' + ic('plus', 15) + 'Tạo bài</a>' : '') + '</div><div class="box-b tight rows">' +
    (asg.length ? asg.map((x) => '<div class="r link" data-h="#/bai/' + x.id + '"><div class="ib plum">' + ic('pen', 17) + '</div><div class="grow"><div class="rt">' + esc(x.title) + '</div><div class="rd">' + esc(ASG_TYPE[x.type]) + ' · ' + (x.status === 'nhap' ? 'Nháp' : fmt.due(x.dueAt)) + '</div></div></div>').join('') : none('Chưa có bài.', 'pen')) + '</div></div>' +
    '<div class="box"><div class="box-h"><h2>Đơn xin nghỉ của buổi</h2></div><div class="box-b tight rows">' + (reqs.length ? reqs.map((r) => '<div class="r link" data-h="#/viec/r-' + r.id + '">' + av(Q.user(r.userId), 32) + '<div class="grow"><div class="rt">' + esc(Q.user(r.userId).name) + '</div><div class="rd">' + esc(r.reason) + '</div></div>' + reqTag(r) + '</div>').join('') : none('Không có đơn.', 'doc')) + '</div></div></div>';
});
function rollView(s, u, op) {
  const R = Q.rosterOf(s); const att = s.attendance; const recs = att.records;
  const n = R.filter((x) => recs[x.id] && (recs[x.id].st === 'co_mat' || recs[x.id].st === 'di_muon')).length; const pct = R.length ? Math.round((n / R.length) * 100) : 0;
  const editing = op && (!att.closed || RollEdit[s.id]);
  const canFix = op && (Date.now() - new Date(att.closedAt || 0).getTime() < Q.param('suaSauChot') * 864e5 || P.adm(u, 'ADM-06'));
  const via = { qr: 'Mã QR', web: 'Web', tay: 'Thủ công', don: 'Theo đơn', chot: 'Tự chốt' };
  let h = '<div class="cols c-main"><div class="box"><div class="box-h"><h2>Danh sách lớp</h2><span class="sp"></span>' + (att.closed ? tag('Đã chốt ' + fmt.dt(att.closedAt), 'ok') : att.open ? tag('Đang mở: ' + [att.methods.qr && 'QR', att.methods.web && 'web'].filter(Boolean).join(', '), 'ai') : tag('Chưa mở')) + '</div><div class="box-b">';
  if (!R.length) return h + none('Buổi chưa có học sinh.') + '</div></div></div>';
  if (!editing) {
    h += R.map((x) => { const r = recs[x.id]; return '<div class="roll"><div class="who">' + av(x, 32) + '<b>' + esc(x.name) + '</b></div>' + attTag(r && r.st) + (r ? '<span class="xs faint">' + via[r.via] + (r.at ? ' · ' + fmt.t(r.at) : '') + '</span>' : '') + '</div>'; }).join('');
    if (att.edits.length) h += '<div class="rule"></div><div class="b sm mb8">Lịch sử sửa sau chốt</div>' + att.edits.map((e) => '<div class="xs faint">' + fmt.dt(e.at) + ' · ' + esc(Q.user(e.by).name) + ': ' + esc(Q.user(e.uid).name) + ' ' + (e.from ? ATT[e.from][0] : '-') + ' thành ' + ATT[e.to][0] + ' · ' + esc(e.reason) + '</div>').join('');
    if (op && att.closed) h += '<div class="mt16">' + (canFix ? '<button class="btn s" data-a="rollFix" data-id="' + s.id + '">' + ic('pen', 15) + 'Sửa điểm danh</button>' : '<span class="xs faint">Quá ' + Q.param('suaSauChot') + ' ngày sau chốt: chỉ Admin sửa được.</span>') + '</div>';
  } else {
    h += '<form data-f="roll" data-id="' + s.id + '">' + R.map((x) => { const r = recs[x.id]; const exc = att.excused.includes(x.id);
      return '<div class="roll"><div class="who">' + av(x, 32) + '<div><b>' + esc(x.name) + '</b>' + (exc ? ' ' + tag('Có đơn nghỉ', 'plum') : '') + (r && r.via !== 'tay' ? '<div class="xs faint">Tự điểm danh qua ' + via[r.via] + ' lúc ' + fmt.t(r.at) + '</div>' : '') + '</div></div><div class="pick">' +
        Object.keys(ATT).map((k) => '<label><input type="radio" name="m_' + x.id + '" value="' + k + '"' + (r && r.st === k ? ' checked' : '') + '><span class="' + k + '">' + ATT[k][0] + '</span></label>').join('') + '</div></div>'; }).join('') +
      (att.closed ? '<div class="mt16">' + fld('Lý do sửa sau chốt', '<input class="in" name="reason">', 'bắt buộc, được ghi nhật ký') + '</div>' : '') +
      '<div class="flex mt16"><button type="button" class="btn" data-a="restOk">Còn lại là Có mặt</button><button class="btn primary">Lưu điểm danh</button>' + (att.closed ? '<button type="button" class="btn plain" data-a="rollFixOff" data-id="' + s.id + '">Hủy</button>' : '<button type="button" class="btn go" data-a="rollClose" data-id="' + s.id + '">' + ic('lock', 15) + 'Chốt điểm danh</button>') + '</div></form>';
  }
  h += '</div></div><div class="vstack"><div class="box box-b"><div class="flex" style="gap:18px"><div class="ring" style="--p:' + pct + '"><div><div><b>' + n + '/' + R.length + '</b><br><small>có mặt</small></div></div></div><div class="grow">' +
    Object.keys(ATT).map((k) => '<div class="flex btw sm"><span>' + ATT[k][0] + '</span><b class="num">' + R.filter((x) => recs[x.id] && recs[x.id].st === k).length + '</b></div>').join('') + '</div></div>';
  if (op && !att.closed) h += '<div class="rule"></div>' + (att.open ? '<div class="vstack">' + (att.methods.qr ? '<a class="btn primary w" href="#/qr/' + s.id + '">' + ic('qr', 17) + 'Mở màn hình QR</a>' : '') + '<button class="btn w" data-a="rollPause" data-id="' + s.id + '">Tạm đóng tự điểm danh</button></div>' : '<button class="btn primary w" data-a="openRoll" data-id="' + s.id + '">' + ic('qr', 17) + 'Mở điểm danh</button>') +
    '<p class="xs faint mb8">Khi chốt, học sinh chưa có trạng thái ghi Vắng không phép, hoặc Vắng có phép nếu có đơn được chấp nhận. Hệ thống tự chốt ' + Q.param('chotSau') + ' phút sau giờ kết thúc.</p>';
  return h + '</div></div></div>';
}
on('openRoll', (el) => {
  const s = Q.session(el.dataset.id);
  panel({ title: 'Mở điểm danh', desc: Q.course(s.courseId).name + ' · ' + s.title + '. Bản demo cho mở điểm danh bất kỳ lúc nào.', submit: 'Mở điểm danh',
    body: '<label class="ck"><input type="checkbox" name="qr" checked>Quét mã QR (mã đổi mỗi ' + Q.param('qrDoiMoi') + ' giây, chống gửi mã cho người vắng)</label><label class="ck"><input type="checkbox" name="web" checked>Bấm Điểm danh trên web (laptop, điện thoại)</label>',
    onSubmit: (d) => { if (!d.qr && !d.web) return 'Chọn ít nhất một cách.'; done(A.openAttendance(App.me(), s.id, { qr: d.qr, web: d.web }), 'Đã mở điểm danh'); nav(d.qr ? '#/qr/' + s.id : '#/buoi/' + s.id); } });
});
on('restOk', (el) => { const f = el.closest('form'); new Set([...f.querySelectorAll('input[type=radio]')].map((x) => x.name)).forEach((n) => { if (!f.querySelector('input[name="' + n + '"]:checked')) f.querySelector('input[name="' + n + '"][value="co_mat"]').checked = true; }); App.dirty = true; });
const marksOf = (d) => { const m = {}; Object.keys(d).forEach((k) => { if (k.startsWith('m_')) m[k.slice(2)] = d[k]; }); return m; };
onSubmit('roll', (d, f) => { const s = Q.session(f.dataset.id); if (s.attendance.closed && !String(d.reason || '').trim()) { toast('Nhập lý do sửa sau chốt', 'bad'); return; } A.markAttendance(App.me(), s.id, marksOf(d), d.reason); RollEdit[s.id] = false; toast('Đã lưu điểm danh', 'ok'); App.render(); });
on('rollClose', (el) => { const d = readForm(el.closest('form')); const id = el.dataset.id; ask('Chốt điểm danh', 'Sau khi chốt, sửa điểm danh cần lý do và được ghi nhật ký. Báo cáo buổi nháp sẵn sàng để công bố.', () => { A.markAttendance(App.me(), id, marksOf(d), ''); A.closeAttendance(App.me(), id); toast('Đã chốt điểm danh', 'ok'); App.render(); }, { submit: 'Chốt' }); });
on('rollPause', (el) => { A.closeAttendanceWindow(App.me(), el.dataset.id); toast('Đã tạm đóng. Có thể mở lại trước khi chốt.', 'ok'); App.render(); });
on('rollFix', (el) => { RollEdit[el.dataset.id] = true; App.render(); });
on('rollFixOff', (el) => { RollEdit[el.dataset.id] = false; App.render(); });
on('zoom', (el) => toast('Bản demo: không mở Zoom thật (' + (Q.session(el.dataset.id).zoom || 'chưa có đường dẫn') + ')', 'info'));

// ------------------------------------------------------------------ báo cáo buổi
function reportEditor(s, u, op) {
  const R = Q.rosterOf(s); const recs = s.attendance.records; const rep = s.report || { status: 'nhap', general: '', perStudent: {} };
  const asg = Store.db.assignments.filter((x) => x.sessionId === s.id && x.status === 'da_giao');
  const absent = R.filter((x) => recs[x.id] && recs[x.id].st.startsWith('vang'));
  let h = '<div class="cols c-main"><div class="box"><div class="box-h"><h2>Nhận xét</h2><span class="sp"></span>' + (rep.status === 'cong_bo' ? tag('Đã công bố ' + fmt.dt(rep.publishedAt), 'ok') : tag('Nháp', 'warn')) + '</div><div class="box-b">';
  if (!op) h += rep.general ? '<div class="content-view">' + esc(rep.general) + '</div>' : '<span class="faint">Chưa có nhận xét.</span>';
  else {
    h += '<form data-f="report" data-id="' + s.id + '" class="vstack">' + fld('Nhận xét chung cho lớp', '<textarea class="in" name="general" id="rg" rows="4">' + esc(rep.general) + '</textarea>') +
      '<div class="flex">' + Store.db.config.templates.slice(0, 3).map((t, i) => '<button type="button" class="btn s plain" data-a="tpl" data-i="' + i + '">+ ' + esc(t.length > 38 ? t.slice(0, 38) + '...' : t) + '</button>').join('') + '</div>' +
      '<div><div class="fld"><label>Nhận xét riêng từng học sinh <span class="hint">phụ huynh chỉ thấy nhận xét của con mình</span></label></div>' + R.map((x) => '<div class="roll"><div class="who" style="flex:0 0 210px">' + av(x, 28) + '<span class="sm">' + esc(x.name) + '</span> ' + attTag((recs[x.id] || {}).st) + '</div><input class="in grow" style="min-width:220px" name="p_' + x.id + '" value="' + esc(rep.perStudent[x.id] || '') + '" placeholder="Không bắt buộc"></div>').join('') + '</div>' +
      '<div class="flex"><button class="btn" name="pub" value="0">Lưu nháp</button><button class="btn primary" name="pub" value="1">' + ic('send', 16) + (rep.status === 'cong_bo' ? 'Cập nhật bản công bố' : 'Công bố') + '</button></div></form>';
  }
  h += '</div></div><div class="box"><div class="box-h"><h2>Phần tự tổng hợp</h2></div><div class="box-b"><dl class="kv" style="grid-template-columns:100px 1fr"><dt>Nội dung</dt><dd>' + esc(s.title) + '</dd><dt>Điểm danh</dt><dd>' + Object.keys(ATT).map((k) => ATT[k][0] + ': ' + R.filter((x) => recs[x.id] && recs[x.id].st === k).length).join('<br>') + '</dd>' +
    (absent.length ? '<dt>Vắng</dt><dd>' + esc(absent.map((x) => x.name).join(', ')) + '</dd>' : '') +
    asg.map((a) => { const miss = R.filter((x) => !Q.subOf(a.id, x.id)); return '<dt>Bài</dt><dd>' + esc(a.title) + ': ' + (R.length - miss.length) + '/' + R.length + ' đã nộp' + (miss.length ? '<br><span class="xs faint">Chưa nộp: ' + esc(miss.map((x) => x.name).join(', ')) + '</span>' : '') + '</dd>'; }).join('') + '</dl>' +
    (!Q.sessionEnded(s) && !s.attendance.closed ? '<div class="note mt12 sm">Buổi chưa kết thúc. Bạn có thể soạn trước nhận xét.</div>' : '') + '</div></div></div>';
  return h;
}
on('tpl', (el) => { const t = document.getElementById('rg'); t.value = (t.value ? t.value.trim() + ' ' : '') + Store.db.config.templates[Number(el.dataset.i)]; App.dirty = true; t.focus(); });
onSubmit('report', (d, f, e) => {
  const per = {}; Object.keys(d).forEach((k) => { if (k.startsWith('p_') && d[k].trim()) per[k.slice(2)] = d[k].trim(); });
  const pub = e.submitter && e.submitter.value === '1';
  A.saveReport(App.me(), f.dataset.id, d.general.trim(), per, pub); toast(pub ? 'Đã công bố. Học sinh, phụ huynh xem được ngay.' : 'Đã lưu nháp', 'ok'); App.render();
});

// ------------------------------------------------------------------ đổi lịch, nghỉ dạy, dạy bù
on('resched', (el) => {
  const s = Q.session(el.dataset.id);
  panel({ title: 'Đổi lịch buổi học', desc: 'Không cần duyệt nếu không trùng lịch người dạy, phòng học.', submit: 'Đổi lịch',
    body: '<div class="grid-f">' + fld('Ngày', '<input class="in" type="date" name="date" value="' + s.date + '">') + fld('Hình thức', '<select class="in" name="mode">' + opt(Object.entries(MODE_NAME), s.mode) + '</select>') +
      fld('Bắt đầu', '<input class="in" type="time" name="start" value="' + s.start + '">') + fld('Kết thúc', '<input class="in" type="time" name="end" value="' + s.end + '">') +
      fld('Zoom', '<input class="in" name="zoom" value="' + esc(s.zoom) + '">') + fld('Phòng', '<input class="in" name="room" value="' + esc(s.room) + '">') + fld('Lý do', '<input class="in" name="reason">', 'bắt buộc', 'all') + '</div>',
    onSubmit: (d) => { if (!d.reason.trim()) return 'Nhập lý do.'; const r = A.reschedule(App.me(), s.id, d); if (!r.ok) return r.msg; toast('Đã đổi lịch', 'ok'); App.render(); } });
});
on('staffLeave', (el) => {
  const u = App.me();
  if (u.superAdmin) { toast('Hồ An không cần gửi đơn nghỉ dạy', 'info'); return; }
  const L = Store.db.sessions.filter((s) => !Q.sessionStarted(s) && s.status !== 'huy' && staffSees(u, s) && Q.course(s.courseId).status === 'dang_hoc').sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1)).slice(0, 30);
  if (!L.length) { toast('Không có buổi dạy sắp tới', 'info'); return; }
  const gv = Store.db.users.filter((x) => x.role === 'gv' && x.status === 'active' && x.id !== u.id);
  const props = u.role === 'tg' ? [['khong_thay', 'Không cần người thay (trợ giảng hỗ trợ)']] : [['nguoi_thay', 'Có người dạy thay'], ['huy_buoi', 'Hủy buổi, dạy bù sau']];
  panel({ title: 'Xin nghỉ dạy', desc: 'Đơn gửi Hồ An duyệt. Đơn gần giờ học được đẩy lên đầu Việc cần làm của Hồ An.', submit: 'Gửi đơn',
    body: '<div class="grid-f">' + fld('Buổi xin nghỉ', '<select class="in" name="sessionId">' + opt(L.map((s) => [s.id, fmt.dm(s.date) + ' ' + s.start + ' · ' + Q.course(s.courseId).name + ' · ' + s.title]), el.dataset.id) + '</select>', '', 'all') +
      fld('Đề xuất', '<select class="in" name="proposal">' + opt(props) + '</select>') + (u.role === 'tg' ? '' : fld('Người dạy thay', '<select class="in" name="substituteId"><option value="">Chọn giáo viên</option>' + opt(gv.map((x) => [x.id, x.name])) + '</select>')) +
      fld('Lý do', '<textarea class="in" name="reason" rows="3"></textarea>', '', 'all') + '</div>',
    onSubmit: (d) => { if (d.proposal === 'nguoi_thay' && !d.substituteId) return 'Chọn người dạy thay.'; const r = A.createRequest(u, { kind: 'gv_nghi', sessionId: d.sessionId, proposal: d.proposal, substituteId: d.substituteId || '', reason: (d.reason || '').trim() }); if (!r.ok) return r.msg; toast('Đã gửi đơn xin nghỉ', 'ok'); App.render(); } });
});
on('makeup', (el) => {
  const u = App.me(); const s = el.dataset.id ? Q.session(el.dataset.id) : null;
  const L = Store.db.sessions.filter((x) => x.status === 'huy' && P.assigned(u, Q.course(x.courseId)) && !Store.db.sessions.some((y) => y.makeupOf === x.id));
  if (!L.length) { toast('Không có buổi đã hủy cần dạy bù', 'info'); return; }
  panel({ title: 'Đăng ký dạy bù', desc: 'Hồ An duyệt xong, buổi bù hiện trên lịch của lớp.', submit: 'Gửi đăng ký',
    body: '<div class="grid-f">' + fld('Buổi đã hủy', '<select class="in" name="sessionId">' + opt(L.map((x) => [x.id, fmt.dm(x.date) + ' · ' + Q.course(x.courseId).name + ' · ' + x.title]), s && s.id) + '</select>', '', 'all') +
      fld('Ngày dạy bù', '<input class="in" type="date" name="date" value="' + ymd(addDays(new Date(), 3)) + '">') + fld('Hình thức', '<select class="in" name="mode">' + opt(Object.entries(MODE_NAME), s ? s.mode : 'online') + '</select>') +
      fld('Bắt đầu', '<input class="in" type="time" name="start" value="' + (s ? s.start : '19:00') + '">') + fld('Kết thúc', '<input class="in" type="time" name="end" value="' + (s ? s.end : '20:30') + '">') + fld('Ghi chú', '<input class="in" name="reason" value="Dạy bù buổi đã hủy">', '', 'all') + '</div>',
    onSubmit: (d) => { const r = A.createRequest(u, { kind: 'day_bu', sessionId: d.sessionId, date: d.date, start: d.start, end: d.end, mode: d.mode, reason: d.reason }); if (!r.ok) return r.msg; toast('Đã gửi đăng ký dạy bù', 'ok'); App.render(); } });
});

// ------------------------------------------------------------------ màn hình QR
function qrSvg(code) {
  const N = 25; let h = 0; for (const ch of code) h = (h * 131 + ch.charCodeAt(0)) >>> 0;
  const r = rng(h); const fin = (x, y) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  let cells = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!fin(x, y) && r() < 0.47) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
  const f = (x, y) => '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>';
  return '<svg viewBox="-1 -1 27 27" shape-rendering="crispEdges" fill="#151C4A"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/>' + cells + f(0, 0) + f(N - 7, 0) + f(0, N - 7) + '</svg>';
}
page('/qr/:id', { bare: true, can: (u, p) => P.isStaff(u) && !!Q.session(p.id) }, (p) => {
  const s = Q.session(p.id); const c = Q.course(s.courseId); const R = Q.rosterOf(s); const recs = s.attendance.records; const per = Q.param('qrDoiMoi');
  const n = R.filter((x) => recs[x.id] && (recs[x.id].st === 'co_mat' || recs[x.id].st === 'di_muon')).length;
  const recent = Object.entries(recs).filter(([, r]) => r.via === 'qr' || r.via === 'web').sort((a, b) => (a[1].at < b[1].at ? 1 : -1)).slice(0, 6);
  if (!s.attendance.open || !s.attendance.methods.qr) return '<div class="qr-stage" style="grid-template-columns:1fr;text-align:center"><div><h1>' + esc(c.name) + '</h1><p>' + (s.attendance.closed ? 'Điểm danh đã chốt.' : 'Điểm danh bằng mã QR đang đóng.') + '</p><a class="btn" href="#/buoi/' + s.id + '">Quay lại buổi học</a></div></div>';
  later(() => {
    const tick = () => {
      const box = document.getElementById('qrn'); if (!box) return;
      const code = QR.code(s.id, per); const left = per - (Math.floor(Date.now() / 1000) % per);
      if (box.dataset.c !== code) { box.dataset.c = code; box.textContent = code.slice(0, 3) + ' ' + code.slice(3); document.getElementById('qri').innerHTML = qrSvg(code); }
      document.getElementById('qrb').style.width = (left / per) * 100 + '%'; document.getElementById('qrl').textContent = left;
    };
    tick(); App.timers.push(setInterval(tick, 1000));
  });
  return '<div class="qr-stage"><div class="qr-card" id="qri"></div><div class="qr-side"><div style="opacity:.75">' + esc(c.name) + ' · Buổi ' + (s.idx + 1) + ' · ' + s.start + ' - ' + s.end + '</div><h1 class="mt8">Quét mã để điểm danh</h1>' +
    '<p style="opacity:.8">Hoặc nhập 6 số này ở trang Quét QR của học sinh. Mã đổi sau <b id="qrl"></b> giây.</p><div class="qr-num" id="qrn"></div><div class="qr-bar"><i id="qrb"></i></div>' +
    '<div class="mt24"><div class="qr-count">' + n + '<span style="font-size:28px;opacity:.6"> / ' + R.length + '</span></div><div style="opacity:.8">học sinh đã điểm danh</div></div>' +
    (recent.length ? '<div class="mt16 sm" style="opacity:.85">Mới nhất: ' + recent.map(([id, r]) => esc(Q.user(id).name) + ' (' + ATT[r.st][0].toLowerCase() + ')').join(', ') + '</div>' : '') +
    '<div class="flex mt24"><a class="btn" href="#/buoi/' + s.id + '">Quay lại buổi học</a><button class="btn" data-a="qrStop" data-id="' + s.id + '">Tạm đóng</button></div></div></div>';
});
on('qrStop', (el) => { A.closeAttendanceWindow(App.me(), el.dataset.id); nav('#/buoi/' + el.dataset.id); });
