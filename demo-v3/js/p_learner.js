'use strict';
/* Học sinh và phụ huynh: Hôm nay, buổi học (nội dung, học liệu), quét QR, bài tập, làm bài trên Google Form nhúng, kết quả và hỏi giáo viên về bài,
   học liệu, đơn, trang phụ huynh, hồ sơ học tập (dùng chung cho nhân sự). */

const Learner = {
  asg(uid) {
    const cs = new Set(Q.coursesOfStudent(uid).map((c) => c.id));
    return Store.db.assignments.filter((a) => cs.has(a.courseId) && a.status === 'da_giao' && (!a.openAt || new Date(a.openAt).getTime() <= Date.now() || Q.subOf(a.id, uid))).sort((a, b) => (Q.dueOf(a, uid) < Q.dueOf(b, uid) ? -1 : 1));
  },
  canSubmit: (a, uid) => a.allowLate || !!a.extensions[uid] || new Date(Q.dueOf(a, uid)).getTime() > Date.now(),
  todo(uid) { return Learner.asg(uid).filter((a) => !Q.subOf(a.id, uid) && Learner.canSubmit(a, uid)); },
  today(uid) { return Store.db.sessions.filter((s) => s.date === todayStr() && Q.course(s.courseId).status === 'dang_hoc' && Q.rosterOf(s).some((x) => x.id === uid)).sort((a, b) => (a.start < b.start ? -1 : 1)); },
  next(uid) { return Store.db.sessions.filter((s) => s.date > todayStr() && s.status !== 'huy' && Q.course(s.courseId).status === 'dang_hoc' && Q.course(s.courseId).members.some((m) => m.uid === uid && !m.leftAt)).sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1))[0]; },
  reports(uid) { return Store.db.sessions.filter((s) => s.report && s.report.status === 'cong_bo' && Q.rosterOf(s).some((x) => x.id === uid)).sort((a, b) => (a.date < b.date ? 1 : -1)); },
};
const resultLink = (a, sid, u) => (u.role === 'ph' ? '#/bai-lam/' + a.id + '/' + sid : '#/bai-lam/' + a.id);

// ------------------------------------------------------------------ khối tham gia buổi học
function joinBlock(s, u, big) {
  if (s.status === 'huy') return '<div class="mt12">' + tag('Buổi đã hủy') + '</div>';
  const mine = s.attendance.records[u.id]; const from = at(s.date, s.start).getTime() - Q.param('zoomTruoc') * 60e3; const zoomOn = s.mode !== 'offline' && Date.now() >= from && !Q.sessionEnded(s);
  const L = big ? ' l' : '';
  let h = '<div class="flex mt16">';
  if (s.mode !== 'offline') h += zoomOn ? '<button class="btn primary' + L + '" data-a="zoom" data-id="' + s.id + '">' + ic('video') + 'Vào Zoom</button>' : '<button class="btn' + L + '" disabled>' + ic('video') + 'Vào Zoom từ ' + new Date(from).toTimeString().slice(0, 5) + '</button>';
  if (mine) h += '<span class="flex" style="gap:6px">' + attTag(mine.st) + '<span class="xs faint">' + (mine.via === 'qr' ? 'qua mã QR' : mine.via === 'web' ? 'trên web' : '') + '</span></span>';
  else if (s.attendance.open && !s.attendance.closed) h += (s.attendance.methods.web ? '<button class="btn go' + L + '" data-a="checkin" data-id="' + s.id + '">' + ic('check') + 'Điểm danh</button>' : '') + (s.attendance.methods.qr ? '<a class="btn' + L + '" href="#/quet/' + s.id + '">' + ic('qr') + 'Quét mã QR</a>' : '');
  else if (s.attendance.closed) h += attTag(null);
  else h += '<span class="sm faint">Điểm danh mở khi giáo viên bắt đầu buổi.</span>';
  return h + '</div>';
}
on('checkin', (el) => { const r = A.selfCheckin(App.me(), el.dataset.id, 'web'); if (done(r)) toast(r.already ? 'Bạn đã điểm danh rồi' : 'Đã điểm danh: ' + ATT[r.st][0], 'ok'); App.render(); });
function reportCard(s, sid) {
  const c = Q.course(s.courseId); const r = s.report; const rec = s.attendance.records[sid];
  return '<div><div class="flex btw"><div><div class="b">' + esc(c.name) + ' · ' + fmt.rel(s.date) + '</div><div class="xs faint">Buổi ' + (s.idx + 1) + ': ' + esc(s.title) + '</div></div>' + attTag(rec && rec.st) + '</div>' +
    (r.general ? '<p style="margin:10px 0 0">' + br(r.general) + '</p>' : '') + (r.perStudent[sid] ? '<div class="fb"><b>Nhận xét riêng:</b> ' + esc(r.perStudent[sid]) + '</div>' : '') +
    Store.db.assignments.filter((a) => a.sessionId === s.id && a.status === 'da_giao').map((a) => '<div class="xs mt8">' + esc(a.title) + ': ' + (Q.subOf(a.id, sid) ? '<span class="ok-t">đã nộp</span>' : '<span class="bad-t">chưa nộp</span>') + '</div>').join('') + '</div>';
}

// ------------------------------------------------------------------ tổng quan của học sinh
// đơn của học sinh: tạo từ Lịch học (xin nghỉ) và Bài tập (xin nộp muộn); tổng hợp ở đây
function reqList(L, u) {
  if (!L.length) return none('Chưa có đơn.', 'doc');
  return '<div class="rows">' + L.map((r) => { const s = r.sessionId && Q.session(r.sessionId); const a = r.assignmentId && Q.asg(r.assignmentId);
    const href = s ? '#/buoi/' + s.id : a ? (Q.subOf(a.id, r.userId) ? resultLink(a, r.userId, u) : '#/lam-bai/' + a.id) : '';
    return '<div class="r' + (href ? ' link" data-h="' + href : '') + '"><div class="ib ' + (r.kind === 'nop_muon' ? 'plum' : 'warn') + '">' + ic(r.kind === 'nop_muon' ? 'pen' : 'calendar', 17) + '</div><div class="grow"><div class="rt">' + esc(REQ_KIND[r.kind]) + (u.role === 'ph' ? ' · ' + esc(Q.user(r.userId).name) : '') + '</div><div class="rd">' + esc(reqLine(r)) + '</div>' +
      (r.handledBy ? '<div class="xs faint">' + esc(Q.user(r.handledBy).name) + ' · ' + fmt.dt(r.handledAt) + (r.note ? ' · ' + esc(r.note) : '') + (r.newDue ? ' · hạn mới ' + fmt.dt(r.newDue) : '') + '</div>' : '<div class="xs faint">Gửi ' + fmt.ago(r.createdAt) + '</div>') + '</div>' + reqTag(r) +
      (r.status === 'cho' && r.userId === u.id ? '<button class="btn s plain" data-a="reqCancel" data-id="' + r.id + '">Hủy</button>' : '') + '</div>'; }).join('') + '</div>';
}
page('/tong-quan', { nav: 'tq', can: P.isStudent }, (p, u) => {
  const today = Learner.today(u.id); const next = Learner.next(u.id); const todo = Learner.todo(u.id);
  const res = Learner.asg(u.id).map((a) => ({ a, s: Q.subOf(a.id, u.id) })).filter((x) => x.s && x.s.status === 'da_tra').sort((x, y) => (x.s.returnedAt < y.s.returnedAt ? 1 : -1)).slice(0, 4);
  const reps = Learner.reports(u.id).slice(0, 2); const cs = Q.coursesOfStudent(u.id);
  const reqs = Store.db.requests.filter((r) => r.userId === u.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const unread = myThreads(u).filter((q) => Thread.unread(q, u.id));
  let h = head('Chào ' + u.name, { eyebrow: 'Tổng quan · ' + fmt.day(todayStr()), desc: u.phMode ? 'Học sinh (PH): phụ huynh dùng tài khoản này thay con.' : '' });
  if (!cs.length) return h + '<div class="box">' + none('Bạn chưa được thêm vào lớp nào. Trung tâm sẽ thêm bạn vào lớp.', 'class') + '</div>';
  // tầng 1: buổi học hôm nay hoặc buổi tiếp theo, việc cần làm
  const show = today.length ? today : next ? [next] : [];
  const pendReq = reqs.filter((r) => r.status === 'cho');
  const doItems = todo.slice(0, 4).map((a) => { const due = Q.dueOf(a, u.id); const ms = new Date(due).getTime() - Date.now();
    return '<div class="r link" data-h="#/lam-bai/' + a.id + '"><div class="ib ' + (ms < 0 ? 'bad' : ms < 48 * 3600e3 ? 'warn' : 'plum') + '">' + ic('pen', 17) + '</div><div class="grow"><div class="rt">' + esc(a.title) + '</div><div class="rd ' + (ms < 48 * 3600e3 ? 'bad-t' : '') + '">' + fmt.due(due) + '</div></div><a class="btn s primary" href="#/lam-bai/' + a.id + '">Làm bài</a></div>'; });
  if (unread.length) doItems.unshift('<div class="r link" data-h="#/hoi-dap/' + unread[0].id + '"><div class="ib teal">' + ic('chat', 17) + '</div><div class="grow"><div class="rt">Giáo viên vừa trả lời ' + unread.length + ' câu hỏi</div><div class="rd">Mở tin nhắn để đọc</div></div>' + ic('next', 16) + '</div>');
  if (pendReq.length) doItems.push('<div class="r"><div class="ib warn">' + ic('doc', 17) + '</div><div class="grow"><div class="rt">' + pendReq.length + ' đơn đang chờ xử lý</div><div class="rd">' + esc(reqLine(pendReq[0])) + '</div></div></div>');
  h += secLabel(1, 'Hôm nay', 'Buổi học và việc cần làm') + '<div class="cols c-main mb24"><div class="vstack">' + (show.length ? show.map((s) => { const c = Q.course(s.courseId); const l = lessonOf(s); const col = classColor(c.id);
    return '<div class="box" style="border-top:4px solid ' + col.bd + '"><div class="box-b"><div class="flex btw"><span class="tag ' + (s.date === todayStr() ? 'shu' : 'ai') + '">' + (s.date === todayStr() ? 'Buổi học hôm nay' : 'Buổi tiếp theo · ' + fmt.rel(s.date)) + '</span>' + sessTag(s) + '</div>' +
      '<div class="flex mt12" style="gap:16px">' + calChip(s.date) + '<div><div style="font:700 26px/1.2 var(--fd)">' + s.start + ' - ' + s.end + '</div><div class="b">' + esc(c.name) + ' · Buổi ' + (s.idx + 1) + ': ' + esc(s.title) + '</div><div class="sm faint">' + esc(where(s)) + ' · Người dạy: ' + esc((Q.user(s.teacherId) || {}).name || '') + '</div></div></div>' +
      (s.date === todayStr() ? joinBlock(s, u, true) : '') + (l.goal ? '<div class="note mt16"><b>Mục tiêu buổi học:</b> ' + esc(l.goal) + '</div>' : '') +
      '<div class="flex mt12"><a class="btn s soft" href="#/buoi/' + s.id + '">' + ic('book', 15) + 'Nội dung và học liệu (' + (l.materials || []).length + ')</a>' + leaveBit(s, u).replace('class="tt-btn"', 'class="btn s"') + '</div></div></div>'; }).join('') : '<div class="box">' + none('Không có buổi học sắp tới.', 'calendar') + '</div>') + '</div>' +
    '<div class="box"><div class="box-h">' + ic('check') + '<h2 class="grow">Việc cần làm</h2>' + (todo.length ? tag(todo.length + ' bài', 'warn') : '') + '</div><div class="box-b tight rows">' + (doItems.length ? doItems.join('') : none('Bạn đã làm hết bài, không có việc chờ.', 'check')) +
    '<div class="xs faint" style="padding:10px 0"><a href="#/bai-tap">Bảng bài tập</a> · Xin nghỉ trên buổi học ở <a href="#/lich">Lịch học</a></div></div></div></div>';
  // tầng 2: chỉ số học tập, so với trung bình lớp
  h += secLabel(2, 'Chỉ số học tập', 'So với trung bình lớp') + learnerKpis(u.id) + '<div class="mb24"></div>';
  // tầng 3: kết quả, báo cáo, đơn
  h += secLabel(3, 'Mới cập nhật') + '<div class="cols c2"><div class="box"><div class="box-h">' + ic('star') + '<h2>Kết quả mới</h2><span class="sp"></span><a class="btn s plain" href="#/ket-qua/bai">Tất cả</a></div><div class="box-b tight rows">' + (res.length ? res.map((x) => { const sc = Calc.score10(x.a, x.s); return '<div class="r link" data-h="#/bai-lam/' + x.a.id + '"><div class="grow"><div class="rt">' + esc(x.a.title) + '</div><div class="rd">' + fmt.ago(x.s.returnedAt) + '</div></div>' + tag(fmt.sc(sc) + ' điểm', toneScore(sc)) + '</div>'; }).join('') : none('Chưa có kết quả mới.')) + '</div></div>' +
    '<div class="box"><div class="box-h">' + ic('doc') + '<h2>Báo cáo buổi học mới</h2></div><div class="box-b">' + (reps.length ? reps.map((s) => reportCard(s, u.id)).join('<div class="rule"></div>') : none('Chưa có báo cáo.')) + '</div></div></div>' +
    '<details class="box mt16"><summary class="box-h" style="cursor:pointer;list-style:none">' + ic('doc') + '<h2 class="grow">Đơn của tôi</h2><span class="xs faint">' + reqs.length + ' đơn · bấm để xem</span></summary><div class="box-b tight">' + reqList(reqs.slice(0, 8), u) + '</div></details>';
  return h;
});
// 4 chỉ số học tập của một học sinh (dùng cho học sinh và phụ huynh)
function learnerKpis(sid) {
  const cs = Q.coursesOfStudent(sid); if (!cs.length) return '';
  const att = avgOf(cs.map((c) => Calc.attendanceOf(sid, c.id).rate)); const attC = avgOf(cs.flatMap((c) => Q.activeMembers(c).map((m) => Calc.attendanceOf(m.uid, c.id).rate)));
  const g = avgOf(cs.map((c) => Calc.grades(sid, c.id).total)); const gC = avgOf(cs.flatMap((c) => Q.activeMembers(c).map((m) => Calc.grades(m.uid, c.id).total)));
  const due = Learner.asg(sid).filter((a) => new Date(Q.dueOf(a, sid)).getTime() < Date.now());
  const onT = due.filter((a) => { const s = Q.subOf(a.id, sid); return s && new Date(s.submittedAt).getTime() <= new Date(Q.dueOf(a, sid)).getTime(); }).length;
  const kp = cs.reduce((n, c) => n + Calc.attendanceOf(sid, c.id).kp, 0); const all = Learner.asg(sid); const doneN = all.filter((a) => Q.subOf(a.id, sid)).length;
  const cmp = (v, c, unit) => (v == null || c == null ? '' : (v >= c ? 'Cao hơn' : 'Thấp hơn') + ' lớp TB ' + fmt.sc(Math.abs(Math.round((v - c) * 10) / 10)) + unit);
  return '<div class="cols c4 k2">' + statTile('Chuyên cần', fmt.pct(att), cmp(att, attC, ' điểm %') + (kp ? ' · ' + kp + ' buổi vắng không phép' : ''), toneRate(att), 'check') +
    statTile('Điểm tổng kết', fmt.sc(g), cmp(g, gC, ' điểm') || 'Chưa có điểm', toneScore(g), 'star') +
    statTile('Nộp bài đúng hạn', due.length ? Math.round((onT / due.length) * 100) + '%' : '-', onT + '/' + due.length + ' bài đã đến hạn', toneRate(due.length ? (onT / due.length) * 100 : null), 'clock') +
    statTile('Bài đã làm', doneN + '/' + all.length, Learner.todo(sid).length ? Learner.todo(sid).length + ' bài cần làm' : 'Không còn bài cần làm', '', 'pen') + '</div>';
}

// ------------------------------------------------------------------ buổi học phía học sinh, phụ huynh
function learnerSession(s, u) {
  const c = Q.course(s.courseId); const parent = u.role === 'ph';
  const sid = parent ? u.childIds.find((k) => c.members.some((m) => m.uid === k)) : u.id; const l = lessonOf(s);
  let h = head('Buổi ' + (s.idx + 1) + ': ' + s.title, { eyebrow: esc(c.name), desc: fmt.day(s.date) + ' · ' + s.start + ' - ' + s.end + ' · ' + esc(where(s)) + ' ' + sessTag(s), acts: !parent && !Q.sessionStarted(s) && s.status !== 'huy' ? '<button class="btn" data-a="newLeave" data-id="' + s.id + '">Xin nghỉ buổi này</button>' : '' });
  if (s.note) h += '<div class="note warn mb16">' + esc(s.note) + '</div>';
  h += '<div class="cols c-main"><div class="vstack"><div class="box"><div class="box-h">' + ic('book') + '<h2>Nội dung buổi học</h2></div><div class="box-b vstack">' + (l.goal ? '<div class="note"><b>Mục tiêu:</b> ' + esc(l.goal) + '</div>' : '') + '<div>' + richText(l.content) + '</div>' +
    '<div style="border-top:1px solid var(--line);padding-top:14px"><h3 style="font-size:15.5px" class="mb12">Học liệu</h3>' + materialRows(l.materials, 'course', c.id, s.idx, false) + '</div></div></div>' +
    (s.report && s.report.status === 'cong_bo' ? '<div class="box"><div class="box-h">' + ic('doc') + '<h2>Báo cáo buổi</h2></div><div class="box-b">' + reportCard(s, sid) + '</div></div>' : Q.sessionEnded(s) ? '<div class="box">' + none('Giáo viên chưa công bố báo cáo buổi này.') + '</div>' : '') + '</div>' +
    '<div class="vstack"><div class="box"><div class="box-h"><h2>Tham gia</h2></div><div class="box-b"><div class="sm">' + ic(s.mode === 'online' ? 'video' : 'pin', 16) + ' ' + esc(where(s)) + '</div><div class="sm faint">Người dạy: ' + esc((Q.user(s.teacherId) || {}).name || '') + '</div>' +
    (parent ? '<div class="mt12">' + esc(Q.user(sid).name) + ': ' + attTag((s.attendance.records[sid] || {}).st) + '</div>' : joinBlock(s, u, false)) + '</div></div>' +
    '<div class="box"><div class="box-h"><h2>Bài của buổi</h2></div><div class="box-b tight rows">' + (Store.db.assignments.filter((a) => a.sessionId === s.id && a.status === 'da_giao').map((a) => '<div class="r link" data-h="' + (parent || Q.subOf(a.id, sid) ? resultLink(a, sid, u) : '#/lam-bai/' + a.id) + '"><div class="grow"><div class="rt">' + esc(a.title) + '</div><div class="rd">' + fmt.due(Q.dueOf(a, sid)) + '</div></div>' + subTag(a, Q.subOf(a.id, sid)) + '</div>').join('') || none('Không có bài.')) + '</div></div></div></div>';
  return h;
}

// ------------------------------------------------------------------ quét QR
page('/quet/:id?', { nav: 'tq', can: P.isStudent, live: false }, (p, u) => {
  const open = Learner.today(u.id).filter((s) => s.attendance.open && s.attendance.methods.qr && !s.attendance.closed); const s = (p.id && open.find((x) => x.id === p.id)) || open[0];
  let h = head('Quét mã QR điểm danh', { desc: 'Hướng camera vào mã QR giáo viên chiếu trên màn hình hoặc chia sẻ qua Zoom.' });
  if (!s) return h + '<div class="box">' + none('Không có buổi nào đang mở điểm danh bằng mã QR.', 'qr') + '</div>';
  if (s.attendance.records[u.id]) return h + '<div class="note ok">Bạn đã điểm danh buổi này: ' + ATT[s.attendance.records[u.id].st][0] + '.</div>';
  return h + '<div class="box" style="max-width:480px"><div class="box-b vstack"><div class="sm faint">' + esc(Q.course(s.courseId).name) + ' · ' + s.start + ' - ' + s.end + '</div>' +
    '<div style="background:#151C4A;border-radius:18px;aspect-ratio:4/3;display:grid;place-items:center;position:relative"><div style="width:56%;aspect-ratio:1;border:3px solid #FFB4A5;border-radius:20px"></div><div style="position:absolute;bottom:12px;left:12px;right:12px;text-align:center;color:#fff;font-size:13.5px;opacity:.85">Bản demo không dùng camera: nhập 6 số dưới mã QR</div></div>' +
    '<form data-f="qrIn" data-id="' + s.id + '" class="vstack">' + fld('Mã 6 số', '<input class="in num" name="code" inputmode="numeric" maxlength="7" autocomplete="off" style="font-size:26px;letter-spacing:8px;text-align:center;height:56px">') + '<button class="btn go l w">' + ic('check') + 'Điểm danh</button></form></div></div>';
});
onSubmit('qrIn', (d, f) => { const r = A.selfCheckin(App.me(), f.dataset.id, 'qr', String(d.code).replace(/\s/g, '')); if (!done(r)) return; toast('Đã điểm danh: ' + ATT[r.st][0], 'ok'); nav('#/tong-quan'); });

// ------------------------------------------------------------------ bài tập
// ------------------------------------------------------------------ bảng kanban bài tập (ẩn, hiện cột; lưu theo trình duyệt)
const KB_COLS = [['lam', 'Cần làm', '#3346A8'], ['cho', 'Đã nộp, chờ chấm', '#C27A12'], ['co', 'Có kết quả', '#2B7A4B'], ['qua', 'Quá hạn', '#BF3A2A']];
const KB = {
  key: (u) => 'hoan_nihongo_demo_v3_kb_' + u.id,
  hidden(u) { try { return JSON.parse(localStorage.getItem(KB.key(u)) || '[]'); } catch (e) { return []; } },
  set(u, arr) { try { localStorage.setItem(KB.key(u), JSON.stringify(arr)); } catch (e) { /* chế độ riêng tư */ } },
};
on('kbHide', (el) => { const u = App.me(); KB.set(u, [...new Set(KB.hidden(u).concat(el.dataset.c))]); App.render(); });
on('kbShow', (el) => { const u = App.me(); KB.set(u, KB.hidden(u).filter((x) => x !== el.dataset.c)); App.render(); });
page('/bai-tap', { nav: 'bai', can: P.isStudent }, (p, u) => {
  const all = Learner.asg(u.id).map((a) => ({ a, s: Q.subOf(a.id, u.id) }));
  const G = { lam: all.filter((x) => !x.s && Learner.canSubmit(x.a, u.id)), cho: all.filter((x) => x.s && x.s.status !== 'da_tra'), co: all.filter((x) => x.s && x.s.status === 'da_tra').reverse(), qua: all.filter((x) => !x.s && !Learner.canSubmit(x.a, u.id)) };
  const hid = KB.hidden(u); const cols = KB_COLS.filter((c) => !hid.includes(c[0]));
  let h = head('Bài tập, kiểm tra', { desc: 'Kéo ngang để xem các cột. Ẩn cột bằng nút ở đầu cột.' });
  h += '<div class="kb-bar">' + (hid.length ? '<span class="sm faint">Cột đang ẩn:</span>' + hid.map((k) => { const c = KB_COLS.find((x) => x[0] === k); return '<button class="btn s soft" data-a="kbShow" data-c="' + k + '">' + ic('eye', 14) + esc(c[1]) + ' (' + G[k].length + ')</button>'; }).join('') : '<span class="sm faint">Đang hiện tất cả các cột.</span>') + '</div>';
  if (!cols.length) return h + '<div class="box">' + none('Bạn đã ẩn mọi cột. Bấm tên cột ở trên để hiện lại.', 'eye') + '</div>';
  h += '<div class="kb" style="--n:' + cols.length + '">' + cols.map(([k, name, color]) => '<div class="kb-col"><div class="kb-h"><span class="dot" style="background:' + color + '"></span><b>' + esc(name) + '</b><span class="n">' + G[k].length + '</span><span class="grow"></span><button class="btn s icon plain" title="Ẩn cột" data-a="kbHide" data-c="' + k + '">' + ic('x', 15) + '</button></div>' +
    (G[k].length ? G[k].map(({ a, s }) => kbCard(a, s, u, color)).join('') : '<div class="kb-empty">Không có bài</div>') + '</div>').join('') + '</div>';
  return h;
});
function kbCard(a, s, u, color) {
  const due = Q.dueOf(a, u.id); const href = s ? '#/bai-lam/' + a.id : '#/lam-bai/' + a.id; const c = Q.course(a.courseId);
  const late = Store.db.requests.filter((r) => r.kind === 'nop_muon' && r.userId === u.id && r.assignmentId === a.id && r.status !== 'huy').pop();
  const ms = new Date(due).getTime() - Date.now();
  let foot = '';
  if (s && s.status === 'da_tra') foot = tag(fmt.sc(Calc.score10(a, s)) + ' điểm', toneScore(Calc.score10(a, s)));
  else if (s) foot = '<span class="xs faint">Nộp ' + fmt.dt(s.submittedAt) + (s.late ? ' (muộn)' : '') + '</span>';
  else if (Learner.canSubmit(a, u.id)) foot = '<a class="btn s primary" href="' + href + '">Làm bài</a>' + (ms < 48 * 3600e3 && !late ? '<button class="btn s plain" data-a="newLate" data-id="' + a.id + '">Xin nộp muộn</button>' : '');
  else foot = late && late.status === 'cho' ? tag('Đã xin nộp muộn: chờ duyệt', 'warn') : '<button class="btn s" data-a="newLate" data-id="' + a.id + '">Xin nộp muộn</button>';
  if (late && !s && Learner.canSubmit(a, u.id)) foot += late.status === 'duyet' ? tag('Hạn riêng ' + fmt.dt(late.newDue), 'plum') : late.status === 'cho' ? tag('Xin nộp muộn: chờ duyệt', 'warn') : '';
  return '<div class="kb-card" data-h="' + href + '" style="--bd:' + color + '"><div class="flex btw">' + tag(ASG_TYPE[a.type], 'ai') + '<span class="xs faint">' + esc(c.name) + '</span></div><h4>' + esc(a.title) + '</h4>' +
    '<div class="xs ' + (!s && ms < 24 * 3600e3 ? 'bad-t' : 'faint') + '">' + ic('clock', 13) + ' ' + (s ? 'Hạn ' + fmt.dt(due) : fmt.due(due)) + (a.timeLimit ? ' · ' + a.timeLimit + ' phút' : '') + '</div><div class="flex mt8">' + foot + '</div></div>';
}

// Làm bài: Google Form nhúng ngay trong trang. Form mô phỏng tự báo nộp và gửi điểm tự chấm;
// form thật: học sinh bấm Gửi trên form rồi bấm "Tôi đã nộp bài" để giáo viên biết (bản đầy đủ tự nhận từ Google Sheet).
page('/lam-bai/:id', { nav: 'bai', live: false, can: (u, p) => P.isStudent(u) && Learner.asg(u.id).some((a) => a.id === p.id) }, (p, u) => {
  const a = Q.asg(p.id); const c = Q.course(a.courseId); const fi = FormLink.parse(a.formUrl);
  if (Q.subOf(a.id, u.id)) { location.replace('#/bai-lam/' + a.id); return ''; }
  const due = Q.dueOf(a, u.id); const over = new Date(due).getTime() < Date.now();
  let h = head(a.title, { eyebrow: '<a href="#/bai-tap">Bài tập</a> · ' + esc(c.name), desc: esc(ASG_TYPE[a.type]) + ' · ' + fmt.due(due) + (a.timeLimit ? ' · làm trong ' + a.timeLimit + ' phút' : ''),
    acts: '<a class="btn" href="' + chatLink(a.id, u.id) + '">' + ic('chat', 16) + 'Nhắn giáo viên</a>' + (fi.ok && !fi.demo ? '<a class="btn" href="' + esc(FormLink.embed(a, u, true)) + '" target="_blank" rel="noopener">' + ic('link', 16) + 'Mở form ở tab mới</a>' : '') });
  if (over && !Learner.canSubmit(a, u.id)) { const pend = Store.db.requests.find((r) => r.kind === 'nop_muon' && r.userId === u.id && r.assignmentId === a.id && r.status === 'cho'); return h + '<div class="box box-b"><div class="note warn">Đã quá hạn và bài không nhận nộp muộn.</div><div class="mt12">' + (pend ? tag('Đã gửi đơn xin nộp muộn, đang chờ', 'warn') : '<button class="btn primary" data-a="newLate" data-id="' + a.id + '">Xin nộp muộn</button>') + '</div></div>'; }
  if (over) h += '<div class="note warn mb16">Đã quá hạn. Bài nộp lúc này được ghi nhận là nộp muộn.</div>';
  if (a.desc) h += '<p class="muted" style="margin-top:0">' + esc(a.desc) + '</p>';
  h += '<div class="lam-wrap">' + formFrame(a, u, true) + '</div>';
  if (!fi.demo) h += '<div class="box box-b mt16 lam-done"><div class="grow"><div class="b">Đã bấm Gửi trên Google Form?</div><div class="sm faint">Bấm nút bên cạnh để báo đã nộp. Giáo viên nhập điểm từ bảng câu trả lời của form' + (a.codeEntry ? '; mã học viên ' + esc(u.code) + ' đã được điền sẵn trong form' : '') + '.</div></div><button class="btn go l" data-a="formDone" data-id="' + a.id + '">' + ic('check') + 'Tôi đã nộp bài</button></div>';
  else h += '<div class="xs faint mt8">Bấm Gửi ở cuối form để nộp bài. Mỗi bài nộp một lần.</div>';
  return h;
});
function finishSubmit(r, aid) {
  if (!done(r)) return;
  toast(r.returned ? 'Đã nộp bài. Có kết quả ngay.' : 'Đã nộp bài. Giáo viên sẽ trả kết quả.', 'ok'); nav('#/bai-lam/' + aid);
}
on('formDone', (el) => ask('Báo đã nộp bài', 'Chỉ bấm khi bạn đã bấm Gửi trên Google Form và thấy dòng "Câu trả lời của bạn đã được ghi lại".', () => finishSubmit(A.submit(App.me(), el.dataset.id, {}), el.dataset.id), { submit: 'Tôi đã nộp' }));
// form mô phỏng báo nộp qua postMessage; chỉ nhận tin từ đúng khung form đang hiện
window.addEventListener('message', (e) => {
  const d = e.data; if (!d || d.type !== 'hoan-mock-form') return;
  const fr = [...document.querySelectorAll('iframe.gf')].find((f) => f.contentWindow === e.source); const u = App.me();
  if (!fr || !u || u.role !== 'hs' || fr.dataset.aid !== d.aid) return;
  const a = Q.asg(d.aid); const key = a && FormLink.demoKey(a.formUrl); if (!key) return;
  const sc = Calc.mockScore(key, Array.isArray(d.answers) ? d.answers : []);
  setTimeout(() => finishSubmit(A.submit(u, a.id, { mock: true, score: sc ? sc.score10 : null }), a.id), 900);
});

// ------------------------------------------------------------------ kết quả bài làm, hỏi giáo viên về bài
page('/bai-lam/:id/:sid?', { nav: 'kq', can: (u, p) => !!Q.asg(p.id) && P.seeStudent(u, u.role === 'ph' ? p.sid : u.id) }, (p, u) => {
  const a = Q.asg(p.id); const sid = u.role === 'ph' ? p.sid : u.id; const st = Q.user(sid); const s = Q.subOf(a.id, sid); const c = Q.course(a.courseId);
  let h = head(a.title, { eyebrow: (u.role === 'ph' ? '<a href="#/con/' + sid + '/bai">Việc học của con</a>' : '<a href="#/ket-qua/bai">Kết quả</a>') + ' · ' + esc(c.name), desc: esc(ASG_TYPE[a.type]) + (u.role === 'ph' ? ' · ' + esc(st.name) : '') });
  if (!s) return h + '<div class="box">' + none(u.role === 'ph' ? 'Con chưa nộp bài này. ' + fmt.due(Q.dueOf(a, sid)) : 'Bạn chưa nộp bài này.', 'pen') + '</div>';
  const back = s.status === 'da_tra'; const th = threadOf(a.id, sid);
  const cls = Store.db.submissions.filter((x) => x.assignmentId === a.id && x.status === 'da_tra' && x.score != null).map((x) => Number(x.score));
  h += '<div class="cols c-main"><div class="vstack"><div class="box"><div class="box-h"><h2>Kết quả</h2>' + subTag(a, s) + '</div><div class="box-b vstack">' +
    (back ? '<div class="flex" style="gap:24px;align-items:flex-end"><div><span style="font:700 46px var(--fd)">' + fmt.sc(s.score) + '</span><span class="faint"> / 10</span></div><div class="sm faint">Trung bình lớp ' + fmt.sc(avgOf(cls)) + ' · trả kết quả ' + fmt.dt(s.returnedAt) + '</div></div>' + (s.fb ? '<div class="fb"><b>Nhận xét:</b> ' + esc(s.fb) + '</div>' : '')
      : '<div class="note">' + (s.score == null ? 'Giáo viên đang chấm và nhập điểm.' : 'Điểm công bố sau khi giáo viên xem xét.') + '</div>') +
    '<div class="sm faint">Nộp lúc ' + fmt.dt(s.submittedAt) + (s.late ? ' ' + tag('Nộp muộn', 'bad') : '') + '</div>' +
    (FormLink.parse(a.formUrl).demo ? '' : '<div class="xs faint">Câu trả lời chi tiết và đáp án (nếu giáo viên cho xem) nằm ở email xác nhận của Google Form.</div>') + '</div></div>' +
    '<div class="box"><div class="box-h">' + ic('chat', 18) + '<h2 class="grow">Đoạn chat với giáo viên về bài này</h2>' + (u.role === 'hs' ? '<a class="btn s soft" href="' + chatLink(a.id, sid) + '">' + ic('chat', 15) + (th ? 'Mở đoạn chat' : 'Nhắn giáo viên') + '</a>' : '') + '</div><div class="box-b tight rows">' +
    (th ? '<div class="r' + (u.role === 'hs' ? ' link" data-h="#/hoi-dap/' + th.id : '') + '">' + av(otherSide(th, u.role === 'hs' ? u : Q.user(sid)), 36) + '<div class="grow"><div class="rt">' + esc(Thread.last(th).by === sid ? (u.role === 'hs' ? 'Bạn: ' : st.name + ': ') : Q.user(Thread.last(th).by).name + ': ') + esc(Thread.last(th).text) + '</div><div class="rd">' + th.messages.length + ' tin · ' + fmt.ago(Thread.last(th).at) + (Thread.unread(th, u.id) && u.role === 'hs' ? ' · có tin mới' : '') + '</div></div>' + (u.role === 'hs' ? ic('next', 16) : '') + '</div>'
      : none(u.role === 'hs' ? 'Chưa rõ chỗ nào trong bài, bấm "Nhắn giáo viên". Mọi câu hỏi về bài nằm trong một đoạn chat.' : 'Chưa có trao đổi.', 'chat')) + '</div></div></div>' +
    '<div><div class="box" style="position:sticky;top:var(--stick)"><div class="box-h"><h2>Bài</h2></div><div class="box-b"><dl class="kv" style="grid-template-columns:96px 1fr"><dt>Lớp</dt><dd>' + esc(c.name) + '</dd><dt>Loại</dt><dd>' + esc(ASG_TYPE[a.type]) + '</dd><dt>Hạn</dt><dd>' + fmt.dt(Q.dueOf(a, sid)) + '</dd><dt>Hình thức</dt><dd>Google Form nhúng</dd></dl></div></div></div></div>';
  return h;
});

// ------------------------------------------------------------------ đơn của học sinh
on('newLeave', (el) => {
  const u = App.me();
  const L = Store.db.sessions.filter((s) => !Q.sessionStarted(s) && s.status !== 'huy' && Q.course(s.courseId).status === 'dang_hoc' && Q.course(s.courseId).members.some((m) => m.uid === u.id && !m.leftAt)).sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1)).slice(0, 12);
  if (!L.length) { toast('Không có buổi học sắp tới', 'info'); return; }
  panel({ title: 'Xin nghỉ học', desc: 'Gửi sát giờ học hơn ' + Q.param('baoMuon') + ' giờ thì đơn gắn nhãn báo muộn. Đơn được chấp nhận thì buổi đó ghi Vắng có phép.', submit: 'Gửi đơn',
    body: '<div class="vstack">' + fld('Buổi xin nghỉ', '<select class="in" name="sessionId">' + opt(L.map((s) => [s.id, fmt.rel(s.date) + ' ' + s.start + ' · ' + Q.course(s.courseId).name + ' · ' + s.title]), el.dataset.id) + '</select>') + fld('Lý do', '<textarea class="in" name="reason" rows="4"></textarea>') + fld('Ảnh đính kèm', '<input class="in" type="file" accept="image/*" style="padding-top:8px">', 'không bắt buộc') + '</div>',
    onSubmit: (d) => { const r = A.createRequest(u, { kind: 'hs_nghi', sessionId: d.sessionId, reason: (d.reason || '').trim() }); if (!r.ok) return r.msg; toast('Đã gửi đơn. Giáo viên, trợ giảng thấy ngay.', 'ok'); App.render(); } });
});
on('newLate', (el) => {
  const u = App.me(); const L = Learner.asg(u.id).filter((a) => !Q.subOf(a.id, u.id) && !Store.db.requests.some((r) => r.kind === 'nop_muon' && r.userId === u.id && r.assignmentId === a.id && r.status === 'cho'));
  if (!L.length) { toast('Không có bài cần xin nộp muộn', 'info'); return; }
  panel({ title: 'Xin nộp muộn', desc: 'Người phụ trách đặt hạn nộp mới cho bạn.', submit: 'Gửi đơn', body: '<div class="vstack">' + fld('Bài', '<select class="in" name="assignmentId">' + opt(L.map((a) => [a.id, a.title + ' · ' + fmt.due(Q.dueOf(a, u.id))]), el.dataset.id) + '</select>') + fld('Lý do', '<textarea class="in" name="reason" rows="4"></textarea>') + '</div>',
    onSubmit: (d) => { const r = A.createRequest(u, { kind: 'nop_muon', assignmentId: d.assignmentId, reason: (d.reason || '').trim() }); if (!r.ok) return r.msg; toast('Đã gửi đơn xin nộp muộn', 'ok'); App.render(); } });
});

// ------------------------------------------------------------------ học liệu
page('/hoc-lieu/:cid?', { nav: 'hl', can: P.isStudent }, (p, u) => {
  const cs = Q.coursesOfStudent(u.id); if (!cs.length) return head('Học liệu') + '<div class="box">' + none('Chưa có lớp.') + '</div>';
  const c = cs.find((x) => x.id === p.cid) || cs[0];
  const ss = Q.sessionsOf(c.id).filter((s) => s.status !== 'day_bu'); const nx = ss.findIndex((s) => !Q.sessionEnded(s));
  const shown = ss.slice(0, nx < 0 ? ss.length : nx + 1).reverse();
  return head('Học liệu', { desc: 'Nội dung và tài liệu của các buổi đã học và buổi sắp tới.' }) + (cs.length > 1 ? '<div class="seg mb16">' + cs.map((x) => '<a href="#/hoc-lieu/' + x.id + '" class="' + (x.id === c.id ? 'on' : '') + '">' + esc(x.name) + '</a>').join('') + '</div>' : '') +
    shown.map((s, k) => { const l = c.lessons[s.idx] || {}; return '<details class="box mb12"' + (k < 2 ? ' open' : '') + '><summary class="box-h" style="cursor:pointer;list-style:none">' + calChip(s.date) + '<div class="grow"><h3>Buổi ' + (s.idx + 1) + ': ' + esc(l.title || s.title) + '</h3><div class="xs faint">' + (Q.sessionEnded(s) ? 'Đã học' : 'Buổi sắp tới') + ' · ' + (l.materials || []).length + ' học liệu</div></div>' + (Q.sessionEnded(s) ? '' : tag('Sắp tới', 'shu')) + '</summary><div class="box-b vstack">' +
      (l.goal ? '<div class="note sm"><b>Mục tiêu:</b> ' + esc(l.goal) + '</div>' : '') + '<div>' + richText(l.content) + '</div>' + materialRows(l.materials, 'course', c.id, s.idx, false) + '</div></details>'; }).join('');
});

// ------------------------------------------------------------------ hồ sơ học tập (học sinh, phụ huynh, nhân sự)
const REC = [['tq', 'Tổng quan'], ['bc', 'Báo cáo buổi'], ['bai', 'Bài tập, kiểm tra'], ['dd', 'Điểm danh']];
function record(sid, u, tab, base) {
  const staff = P.isStaff(u);
  const cs = Store.db.courses.filter((c) => c.members.some((m) => m.uid === sid) && !['nhap', 'da_xoa'].includes(c.status) && (!staff || P.viewCourse(u, c)));
  tab = REC.some((t) => t[0] === tab) ? tab : 'tq';
  let h = '<div class="tabs">' + REC.map(([k, t]) => '<a href="' + base + k + '" class="' + (k === tab ? 'on' : '') + '">' + t + '</a>').join('') + '</div>';
  if (!cs.length) return h + '<div class="box">' + none('Chưa có lớp.', 'class') + '</div>';
  const link = (a) => { const s = Q.subOf(a.id, sid); return staff ? (s ? '#/bai/' + a.id + '/cham/' + s.id : '#/bai/' + a.id) : resultLink(a, sid, u); };
  if (tab === 'tq') return h + cs.map((c) => { const a = Calc.attendanceOf(sid, c.id); const g = Calc.grades(sid, c.id); const miss = Store.db.assignments.filter((x) => x.courseId === c.id && x.status === 'da_giao' && !Q.subOf(x.id, sid) && new Date(Q.dueOf(x, sid)).getTime() < Date.now());
    return '<div class="box mb16"><div class="box-h"><h2>' + esc(c.name) + '</h2>' + classTag(c) + '</div><div class="box-b"><div class="cols c4 k2">' + statTile('Chuyên cần', fmt.pct(a.rate), a.ok + '/' + a.held + ' buổi', toneRate(a.rate), 'check') + statTile('Vắng không phép', a.kp, a.cp + ' buổi có phép', a.kp ? 'bad' : 'ok', 'alert') + statTile('Điểm tổng kết', fmt.sc(g.total), Object.keys(ASG_TYPE).filter((t) => g.avg[t] != null).map((t) => ASG_TYPE[t] + ' ' + fmt.sc(g.avg[t])).join(' · '), toneScore(g.total), 'star') + statTile('Bài quá hạn chưa nộp', miss.length, '', miss.length ? 'bad' : 'ok', 'pen') + '</div>' +
      (c.report && c.report.status === 'cong_bo' ? '<div class="fb mt16"><b>Nhận xét tổng kết lớp:</b> ' + esc(c.report.general) + '</div>' : '') + '</div></div>'; }).join('');
  if (tab === 'bc') { const R = Learner.reports(sid).filter((s) => cs.some((c) => c.id === s.courseId)); return h + '<div class="box"><div class="box-b">' + (R.length ? R.map((s) => reportCard(s, sid)).join('<div class="rule"></div>') : none('Chưa có báo cáo buổi.')) + '</div></div>'; }
  if (tab === 'bai') { const L = Store.db.assignments.filter((a) => cs.some((c) => c.id === a.courseId) && a.status === 'da_giao').sort((a, b) => (a.dueAt < b.dueAt ? 1 : -1));
    return h + '<div class="box tw"><table class="t"><tr><th>Bài</th><th>Lớp</th><th>Hạn</th><th>Trạng thái</th><th class="n">Điểm</th></tr>' + L.map((a) => { const s = Q.subOf(a.id, sid); const vis = s && (s.status === 'da_tra' || staff) && !Calc.needsManual(a, s);
      return '<tr class="go" data-h="' + link(a) + '"><td><div class="b">' + esc(a.title) + '</div><div class="xs faint">' + esc(ASG_TYPE[a.type]) + '</div></td><td class="sm">' + esc(Q.course(a.courseId).name) + '</td><td class="sm">' + fmt.dt(Q.dueOf(a, sid)) + '</td><td>' + subTag(a, s) + '</td><td class="n">' + (vis ? tag(fmt.sc(Calc.score10(a, s)), toneScore(Calc.score10(a, s))) : '-') + '</td></tr>'; }).join('') + '</table></div>'; }
  return h + cs.map((c) => { const ss = Q.sessionsOf(c.id).filter((s) => (s.attendance.closed || s.attendance.records[sid]) && Q.rosterOf(s).some((x) => x.id === sid)).reverse();
    return '<div class="box mb16"><div class="box-h"><h2>' + esc(c.name) + '</h2></div><div class="tw"><table class="t"><tr><th>Ngày</th><th>Buổi</th><th>Trạng thái</th></tr>' + (ss.map((s) => '<tr><td class="sm">' + fmt.day(s.date) + '</td><td>' + esc(s.title) + '</td><td>' + (s.status === 'huy' ? tag('Buổi hủy') : attTag((s.attendance.records[sid] || {}).st)) + '</td></tr>').join('') || '<tr><td colspan="3">' + none('Chưa có buổi.') + '</td></tr>') + '</table></div></div>'; }).join('');
}
page('/ket-qua/:tab?', { nav: 'kq', can: P.isStudent }, (p, u) => head('Kết quả học tập', { desc: u.phMode ? 'Học sinh (PH): xem được mọi thông tin dành cho phụ huynh.' : 'Chuyên cần, điểm, báo cáo buổi của bạn.' }) + record(u.id, u, p.tab, '#/ket-qua/'));
page('/hoc-sinh/:sid/:tab?', { nav: 'lop', can: (u, p) => P.isStaff(u) && !!Q.user(p.sid) && Store.db.courses.some((c) => P.viewCourse(u, c) && c.members.some((m) => m.uid === p.sid)) }, (p, u) => {
  const st = Q.user(p.sid);
  return head(st.name, { eyebrow: 'Hồ sơ học tập', desc: esc(st.code) + ' · ' + (st.phMode ? 'Học sinh (PH)' : 'Phụ huynh: ' + esc(st.parentIds.map((x) => Q.user(x).name + ' (' + Q.user(x).phone + ')').join(', ') || 'chưa liên kết')), acts: '<a class="btn" href="#/bao-cao/hoc-sinh/' + st.id + '">' + ic('chart', 16) + 'Biểu đồ</a>' + (P.accounts(u) ? '<a class="btn" href="#/tai-khoan/' + st.id + '">Tài khoản</a>' : '') }) + record(st.id, u, p.tab, '#/hoc-sinh/' + st.id + '/');
});

// ------------------------------------------------------------------ tổng quan của phụ huynh
page('/con/:child?/:tab?', { nav: 'con', can: (u) => u.role === 'ph' }, (p, u) => {
  const kids = u.childIds.map(Q.user).filter(Boolean);
  if (!kids.length) return head('Tổng quan') + '<div class="box">' + none('Tài khoản chưa liên kết với học sinh nào.', 'users') + '</div>';
  const k = kids.find((x) => x.id === p.child) || kids[0]; const today = Learner.today(k.id); const nx = Learner.next(k.id); const todo = Learner.todo(k.id);
  const last = Learner.reports(k.id)[0]; const reqs = Store.db.requests.filter((r) => r.userId === k.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  let h = head('Việc học của ' + k.name, { eyebrow: 'Tổng quan', desc: 'Chỉ xem. Báo cáo, điểm, đơn cập nhật ngay khi giáo viên công bố, xử lý.' });
  if (kids.length > 1) h += '<div class="seg mb16">' + kids.map((x) => '<a href="#/con/' + x.id + '" class="' + (x.id === k.id ? 'on' : '') + '">' + esc(x.name) + '</a>').join('') + '</div>';
  h += secLabel(1, 'Hôm nay', 'Lịch học và bài con cần làm') + '<div class="cols c2 mb24"><div class="box"><div class="box-h">' + ic('calendar') + '<h2>Lịch học</h2><span class="sp"></span><a class="btn s plain" href="#/lich">Cả tuần</a></div><div class="box-b tight rows">' + today.map((s) => '<div class="r">' + calChip(s.date) + '<div class="grow"><div class="rt">Hôm nay ' + s.start + ' - ' + s.end + '</div><div class="rd">' + esc(s.title) + '</div></div>' + attTag((s.attendance.records[k.id] || {}).st) + '</div>').join('') +
    (nx ? '<div class="r">' + calChip(nx.date) + '<div class="grow"><div class="rt">' + fmt.rel(nx.date) + ' ' + nx.start + ' - ' + nx.end + '</div><div class="rd">' + esc(Q.course(nx.courseId).name) + ' · ' + esc(nx.title) + '</div></div>' + leaveBit(nx, u) + '</div>' : '') + (!today.length && !nx ? none('Không có buổi sắp tới.') : '') + '</div></div>' +
    '<div class="box"><div class="box-h">' + ic('pen') + '<h2 class="grow">Bài con cần làm</h2>' + (todo.length ? tag(todo.length + ' bài', 'warn') : '') + '</div><div class="box-b tight rows">' + (todo.length ? todo.map((a) => { const due = Q.dueOf(a, k.id); return '<div class="r"><div class="grow"><div class="rt">' + esc(a.title) + '</div><div class="rd ' + (new Date(due).getTime() - Date.now() < 48 * 3600e3 ? 'bad-t' : '') + '">' + fmt.due(due) + '</div></div></div>'; }).join('') : none('Con đã làm hết bài.', 'check')) + '</div></div></div>' +
    secLabel(2, 'Chỉ số học tập của con', 'So với trung bình lớp') + learnerKpis(k.id) + '<div class="mb24"></div>' +
    secLabel(3, 'Mới cập nhật') + '<div class="cols c2 mb16"><div class="box"><div class="box-h">' + ic('doc') + '<h2>Báo cáo buổi gần nhất</h2></div><div class="box-b">' + (last ? reportCard(last, k.id) : none('Chưa có báo cáo.')) + '</div></div>' +
    '<div class="box"><div class="box-h">' + ic('doc') + '<h2>Đơn của con</h2></div><div class="box-b tight">' + reqList(reqs.slice(0, 5), u) + '</div></div></div>';
  return h + '<div class="mt24">' + record(k.id, u, p.tab, '#/con/' + k.id + '/') + '</div>';
});
