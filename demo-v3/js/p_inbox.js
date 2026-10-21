'use strict';
/* Tổng quan của nhân sự, chia theo mức quan trọng:
   1. Ưu tiên hôm nay: buổi dạy hôm nay và việc gấp (đơn sát giờ, báo cáo quá hạn, bài chờ điểm lâu, câu hỏi chờ lâu).
   2. Việc tồn: ô số liệu theo loại việc (bấm để lọc) và hộp việc chia đôi (danh sách - chi tiết).
   3. Tình hình lớp: chỉ số 4 tuần gần nhất so với 4 tuần trước, bảng từng lớp (tham khảo, ít gấp hơn).
   Kèm trang Đơn. Đơn, câu hỏi hiển thị đầy đủ ở khung chi tiết; người xử lý đọc xong mới thao tác. */

const Inbox = {
  mine: (u) => Store.db.courses.filter((c) => P.assigned(u, c) && ['dang_hoc', 'cho'].includes(c.status)),
  requests(u) {
    const ids = new Set(Inbox.mine(u).map((c) => c.id));
    if (u.superAdmin) return Store.db.requests.filter((r) => r.status === 'cho' && r.userId !== u.id);
    return Store.db.requests.filter((r) => r.status === 'cho' && r.userId !== u.id &&
      (((r.kind === 'hs_nghi' || r.kind === 'nop_muon') && ids.has(r.courseId)) || ((r.kind === 'gv_nghi' || r.kind === 'day_bu') && u.superAdmin)));
  },
  grading(u) {
    const ids = new Set(Inbox.mine(u).map((c) => c.id));
    return Store.db.assignments.filter((a) => ids.has(a.courseId) && a.status === 'da_giao').map((a) => {
      const subs = Store.db.submissions.filter((s) => s.assignmentId === a.id && s.status !== 'da_tra');
      return { a, subs, manual: subs.filter((s) => Calc.needsManual(a, s)) };
    }).filter((x) => x.subs.length);
  },
  // cuộc hỏi đáp nhân sự thấy: lớp phụ trách; Hồ An thấy mọi lớp
  threads(u) { const ids = new Set(Inbox.mine(u).map((c) => c.id)); return Store.db.qna.filter((q) => u.superAdmin || ids.has((Q.asg(q.assignmentId) || {}).courseId)); },
  questions(u) { return Inbox.threads(u).filter(Thread.waiting); },
  reports(u) {
    const ids = new Set(Inbox.mine(u).map((c) => c.id));
    return Store.db.sessions.filter((s) => ids.has(s.courseId) && s.status !== 'huy' && Q.sessionEnded(s) && (!s.report || s.report.status !== 'cong_bo'));
  },
  attention(u) {
    const out = []; const lim = Q.param('vangLienTiep'); const low = Q.param('diemThap');
    Inbox.mine(u).filter((c) => c.status === 'dang_hoc').forEach((c) => Q.activeMembers(c).forEach((m) => {
      const why = []; const n = Calc.consecutiveAbsent(m.uid, c.id);
      if (n >= lim) why.push('Vắng ' + n + ' buổi liên tiếp');
      const miss = Store.db.assignments.filter((a) => a.courseId === c.id && a.status === 'da_giao' && new Date(Q.dueOf(a, m.uid)).getTime() < Date.now() && !Q.subOf(a.id, m.uid));
      if (miss.length) why.push('Quá hạn chưa nộp ' + miss.length + ' bài');
      const lows = Store.db.assignments.filter((a) => a.courseId === c.id).map((a) => ({ a, s: Q.subOf(a.id, m.uid) })).filter((x) => x.s && x.s.status === 'da_tra' && Calc.score10(x.a, x.s) < low);
      if (lows.length) why.push('Điểm dưới ' + low + ': ' + lows.length + ' bài');
      if (why.length) out.push({ st: Q.user(m.uid), c, why, miss, lows });
    }));
    return out;
  },
  today(u) { return Store.db.sessions.filter((s) => s.date === todayStr() && Q.course(s.courseId).status === 'dang_hoc' && staffSees(u, s)).sort((x, y) => (x.start < y.start ? -1 : 1)); },
  // gợi ý học liệu từ các lớp chờ Hồ An quyết định
  suggestions(u) { return u.superAdmin ? Store.db.programs.map((p) => ({ p, list: pendingSug(p) })).filter((x) => x.list.length) : []; },
  count(u) { return Inbox.requests(u).length + Inbox.grading(u).reduce((n, x) => n + x.subs.length, 0) + Inbox.questions(u).length + Inbox.reports(u).length + Inbox.suggestions(u).reduce((n, x) => n + x.list.length, 0); },
  // gom thành một danh sách việc; why: lý do gấp (hiện ở khung Cần làm ngay)
  items(u) {
    const L = []; const H = 3600e3;
    Inbox.requests(u).forEach((r) => {
      const s = r.sessionId && Q.session(r.sessionId); const who = Q.user(r.userId);
      const soon = s && at(s.date, s.start).getTime() - Date.now() < 24 * H;
      L.push({ key: 'r-' + r.id, kind: 'don', at: r.createdAt, urgent: soon || r.late, why: soon ? 'Còn ' + fmt.until(at(s.date, s.start).getTime() - Date.now()).replace('còn ', '') + ' đến giờ học' : r.late ? 'Đơn báo muộn' : '', ico: 'doc', tone: soon ? 'bad' : 'warn',
        title: REQ_KIND[r.kind] + ' · ' + who.name, prev: reqLine(r), side: soon ? tag('Sắp đến giờ', 'bad') : r.late ? tag('Báo muộn', 'bad') : '' });
    });
    Inbox.questions(u).forEach((q) => {
      const a = Q.asg(q.assignmentId); const wait = Date.now() - new Date(Thread.last(q).at).getTime();
      L.push({ key: 'q-' + q.id, href: '#/hoi-dap/' + q.id, kind: 'hoi', at: Thread.last(q).at, urgent: wait > 24 * H, why: 'Học sinh chờ trả lời ' + fmt.ago(Thread.last(q).at).replace(' trước', ''), ico: 'chat', tone: '', title: Q.user(q.studentId).name + ' hỏi về ' + a.title, prev: '"' + Thread.last(q).text + '"' });
    });
    Inbox.grading(u).forEach((x) => { const oldest = x.subs.map((s) => s.submittedAt).sort()[0]; const age = Date.now() - new Date(oldest).getTime();
      L.push({ key: 'a-' + x.a.id, kind: 'cham', at: x.subs.map((s) => s.submittedAt).sort().pop(), urgent: x.manual.length > 0 && age > 72 * H, why: 'Bài nộp chờ điểm từ ' + fmt.ago(oldest), ico: 'pen', tone: 'plum',
        title: x.a.title, prev: Q.course(x.a.courseId).name + ' · ' + (x.manual.length ? x.manual.length + ' bài chờ nhập điểm' : x.subs.length + ' bài có điểm, chờ trả kết quả') }); });
    Inbox.reports(u).forEach((s) => {
      const over = Date.now() - at(s.date, s.end).getTime() > Q.param('baoCaoTre') * H;
      L.push({ key: 's-' + s.id, kind: 'bc', at: at(s.date, s.end).toISOString(), urgent: over, why: 'Quá hạn công bố ' + Q.param('baoCaoTre') + ' giờ', ico: 'alert', tone: over ? 'bad' : 'warn', title: 'Báo cáo buổi chưa công bố', prev: Q.course(s.courseId).name + ' · ' + fmt.rel(s.date) + ' · ' + s.title, side: over ? tag('Quá hạn', 'bad') : '' });
    });
    Inbox.suggestions(u).forEach((x) => L.push({ key: 'g-' + x.p.id, kind: 'hl', at: x.list.map((s) => s.at).sort().pop(), ico: 'star', tone: 'plum', title: 'Gợi ý học liệu: ' + x.p.name,
      prev: x.list.length + ' học liệu giáo viên bổ sung ở lớp ' + [...new Set(x.list.map((s) => (Q.course(s.courseId) || {}).name))].join(', ') + ', chờ bạn quyết định' }));
    Inbox.attention(u).forEach((x) => L.push({ key: 'h-' + x.st.id + '-' + x.c.id, kind: 'hs', at: '', ico: 'user', tone: 'teal', title: x.st.name + ' cần chú ý', prev: x.c.name + ' · ' + x.why.join(', ') }));
    return L.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || (a.at < b.at ? 1 : -1));
  },
};

// ------------------------------------------------------------------ chỉ số tình hình lớp (4 tuần gần nhất so với 4 tuần trước)
const Metrics = {
  scope(u) { return Store.db.courses.filter((c) => c.status === 'dang_hoc' && (P.adm(u, 'ADM-11') || P.assigned(u, c))); },
  win(k) { const end = Date.now() - k * 28 * 864e5; return [end - 28 * 864e5, end]; },
  attendance(cs, w) {
    let ok = 0; let n = 0;
    cs.forEach((c) => Q.sessionsOf(c.id).forEach((s) => { const t = at(s.date, s.start).getTime(); if (!s.attendance.closed || s.status === 'huy' || t < w[0] || t >= w[1]) return;
      Q.rosterOf(s).forEach((st) => { const r = s.attendance.records[st.id]; if (!r) return; n++; if (r.st === 'co_mat' || r.st === 'di_muon') ok++; }); }));
    return n ? Math.round((ok / n) * 1000) / 10 : null;
  },
  onTime(cs, w) {
    let ok = 0; let n = 0;
    cs.forEach((c) => Store.db.assignments.filter((x) => x.courseId === c.id && x.status === 'da_giao').forEach((x) => Q.activeMembers(c).forEach((m) => {
      const due = new Date(Q.dueOf(x, m.uid)).getTime(); if (due < w[0] || due >= w[1] || due > Date.now()) return;
      n++; const s = Q.subOf(x.id, m.uid); if (s && new Date(s.submittedAt).getTime() <= due) ok++; })));
    return n ? Math.round((ok / n) * 1000) / 10 : null;
  },
  score(cs, w) {
    const ids = new Set(Store.db.assignments.filter((x) => cs.some((c) => c.id === x.courseId)).map((x) => x.id));
    return avgOf(Store.db.submissions.filter((s) => ids.has(s.assignmentId) && s.status === 'da_tra' && s.score != null && new Date(s.returnedAt).getTime() >= w[0] && new Date(s.returnedAt).getTime() < w[1]).map((s) => Number(s.score)));
  },
  reports(cs, w) {
    let ok = 0; let n = 0; const lim = Q.param('baoCaoTre') * 3600e3;
    cs.forEach((c) => Q.sessionsOf(c.id).forEach((s) => { const end = at(s.date, s.end).getTime(); if (s.status === 'huy' || end < w[0] || end >= w[1] || end > Date.now() - lim) return;
      n++; if (s.report && s.report.status === 'cong_bo' && new Date(s.report.publishedAt).getTime() - end <= lim) ok++; }));
    return n ? Math.round((ok / n) * 100) : null;
  },
};
// ô chỉ số có so sánh với kỳ trước; better: 'up' khi tăng là tốt
function kpi(k, v, cur, prev, unit, icon, tone) {
  let d = '<span class="faint">Chưa có số liệu 4 tuần trước</span>';
  if (cur != null && prev != null) {
    const x = Math.round((cur - prev) * 10) / 10;
    d = x === 0 ? '<span class="faint">Không đổi so với 4 tuần trước</span>' : '<span class="dl ' + (x > 0 ? 'up' : 'down') + '">' + ic(x > 0 ? 'arrowup' : 'arrowdown', 12, 2.4) + fmt.sc(Math.abs(x)) + unit + '</span> <span class="faint">so với 4 tuần trước</span>';
  }
  return '<div class="stat ' + (tone || '') + '"><div class="k"><span class="ico">' + ic(icon, 16) + '</span>' + esc(k) + '</div><div class="v">' + v + '</div><div class="s">' + d + '</div></div>';
}
function reqLine(r) {
  const s = r.sessionId && Q.session(r.sessionId); const a = r.assignmentId && Q.asg(r.assignmentId);
  if (r.kind === 'nop_muon') return Q.course(r.courseId).name + ' · ' + (a ? a.title : '');
  if (r.kind === 'day_bu') return Q.course(r.courseId).name + ' · dạy bù ' + fmt.dm(r.date) + ' ' + r.start;
  return Q.course(r.courseId).name + ' · ' + (s ? fmt.rel(s.date) + ' ' + s.start : '');
}

// ------------------------------------------------------------------ trang Việc cần làm
let InboxFilter = 'all';
on('ibf', (el) => { InboxFilter = InboxFilter === el.dataset.v && !['all', 'donxong', 'dontoi'].includes(el.dataset.v) ? 'all' : el.dataset.v; nav('#/viec'); setTimeout(() => { const q = document.getElementById('queue'); if (q) q.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 80); });
const secLabel = (n, t, d) => '<div class="ov-lbl"><span class="no">' + n + '</span><b>' + esc(t) + '</b>' + (d ? '<span class="faint">' + esc(d) + '</span>' : '') + '</div>';
page('/viec/:sel?', { nav: 'viec', can: P.isStaff }, (p, u) => {
  const all = Inbox.items(u);
  const isHist = InboxFilter === 'donxong' || InboxFilter === 'dontoi';
  const hist = isHist ? reqHistory(u, InboxFilter) : [];
  const list = isHist ? hist : all.filter((x) => InboxFilter === 'all' || x.kind === InboxFilter);
  const sel = p.sel && (all.find((x) => x.key === p.sel) || hist.find((x) => x.key === p.sel) || (p.sel.startsWith('r-') && Q.req(p.sel.slice(2)) ? { key: p.sel } : null));
  const today = Inbox.today(u); const urgent = all.filter((x) => x.urgent);
  const of = (k) => all.filter((x) => x.kind === k);
  const summary = [today.length ? today.length + ' buổi dạy hôm nay' : 'Hôm nay không có buổi dạy', urgent.length ? urgent.length + ' việc gấp' : 'không có việc gấp', all.length + ' việc tồn'].join(' · ');
  let h = head('Chào ' + u.name, { eyebrow: 'Tổng quan · ' + fmt.day(todayStr()), desc: summary + '.' });

  // ---- tầng 1: ưu tiên hôm nay
  h += secLabel(1, 'Ưu tiên hôm nay', 'Buổi dạy và việc cần xử lý ngay');
  const next = !today.length && Store.db.sessions.filter((s) => s.date > todayStr() && s.status !== 'huy' && Q.course(s.courseId).status === 'dang_hoc' && staffSees(u, s)).sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1))[0];
  const center = P.adm(u, 'ADM-11') ? Store.db.sessions.filter((s) => s.date === todayStr() && s.status !== 'huy' && Q.course(s.courseId).status === 'dang_hoc') : [];
  h += '<div class="cols c-main mb24"><div class="box ov-today"><div class="box-h">' + ic('clock') + '<h2 class="grow">Buổi dạy hôm nay</h2>' + (center.length ? '<a class="btn s plain" href="#/lich-tt">Toàn trung tâm: ' + center.length + ' buổi</a>' : '<a class="btn s plain" href="#/lich">Lịch dạy</a>') + '</div><div class="box-b tight rows">' +
    (today.length ? today.map((s) => todayRow(s, u)).join('') : none('Hôm nay bạn không có buổi dạy.', 'calendar') + (next ? '<div class="r">' + calChip(next.date) + '<div class="grow"><div class="rt">Buổi tiếp theo: ' + fmt.rel(next.date) + ' · ' + next.start + ' - ' + next.end + '</div><div class="rd">' + esc(Q.course(next.courseId).name) + ' · Buổi ' + (next.idx + 1) + ': ' + esc(next.title) + '</div></div><a class="btn s" href="#/buoi/' + next.id + '">Chuẩn bị</a></div>' : '')) + '</div></div>' +
    '<div class="box ov-urgent ' + (urgent.length ? 'hot' : '') + '"><div class="box-h">' + ic('alert') + '<h2 class="grow">Cần làm ngay</h2>' + (urgent.length ? tag(urgent.length + ' việc', 'bad') : tag('Không có', 'ok')) + '</div><div class="box-b tight rows">' +
    (urgent.length ? urgent.slice(0, 5).map((x) => '<div class="r link" data-h="' + (x.href || '#/viec/' + x.key) + '"><div class="ib ' + x.tone + '">' + ic(x.ico, 17) + '</div><div class="grow"><div class="rt">' + esc(x.title) + '</div><div class="rd bad-t" style="font-weight:600">' + esc(x.why) + '</div></div>' + ic('next', 16) + '</div>').join('') + (urgent.length > 5 ? '<div class="xs faint" style="padding:8px 0">Và ' + (urgent.length - 5) + ' việc gấp khác trong danh sách việc.</div>' : '')
      : none('Không có việc gấp. Xử lý dần việc tồn bên dưới.', 'check')) + '</div></div></div>';

  // ---- tầng 2: việc tồn (ô số liệu là bộ lọc)
  h += secLabel(2, 'Việc tồn', 'Bấm một ô để lọc danh sách');
  const sub = (L, f) => (L.length ? f(L) : 'Không có');
  const T = [
    ['don', 'Đơn chờ xử lý', 'doc', (L) => { const n = L.filter((x) => x.urgent).length; return n ? n + ' đơn sát giờ hoặc báo muộn' : 'Không có đơn gấp'; }],
    ['cham', 'Bài chờ điểm', 'pen', (L) => { const subs = Inbox.grading(u).flatMap((x) => x.subs); return subs.length + ' bài nộp · cũ nhất ' + fmt.ago(subs.map((s) => s.submittedAt).sort()[0]); }],
    ['hoi', 'Câu hỏi chờ trả lời', 'chat', (L) => 'Chờ lâu nhất ' + fmt.ago(L.map((x) => x.at).sort()[0]).replace(' trước', '')],
    ['bc', 'Báo cáo buổi chưa công bố', 'alert', (L) => { const n = L.filter((x) => x.urgent).length; return n ? n + ' báo cáo quá hạn' : 'Chưa quá hạn'; }],
    ['hs', 'Học sinh cần chú ý', 'user', (L) => 'Trong ' + new Set(L.map((x) => x.prev.split(' · ')[0])).size + ' lớp'],
  ];
  if (u.superAdmin) T.push(['hl', 'Gợi ý học liệu chờ duyệt', 'star', () => Inbox.suggestions(u).length + ' chương trình']);
  h += '<div class="kpi-row" style="--n:' + T.length + '">' + T.map(([k, t, i, f]) => { const L = of(k); const n = k === 'cham' ? Inbox.grading(u).reduce((s, x) => s + x.subs.length, 0) : k === 'hl' ? Inbox.suggestions(u).reduce((s, x) => s + x.list.length, 0) : L.length;
    const tone = L.some((x) => x.urgent) ? 'bad' : n ? 'warn' : 'ok';
    return '<button class="stat kpi ' + tone + (InboxFilter === k ? ' on' : '') + '" data-a="ibf" data-v="' + k + '"><div class="k"><span class="ico">' + ic(i, 16) + '</span>' + esc(t) + '</div><div class="v">' + n + '</div><div class="s">' + esc(sub(L, f)) + '</div></button>'; }).join('') + '</div>';
  const FN = { all: 'Tất cả việc tồn', don: 'Đơn chờ xử lý', cham: 'Bài chờ điểm', hoi: 'Câu hỏi chờ trả lời', bc: 'Báo cáo buổi chưa công bố', hs: 'Học sinh cần chú ý', hl: 'Gợi ý học liệu chờ duyệt', donxong: 'Đơn đã xử lý', dontoi: 'Đơn của tôi' };
  h += '<div id="queue" class="flex btw mb12 mt16"><div class="flex"><h3 style="font-size:16px">' + esc(FN[InboxFilter]) + ' <span class="faint" style="font-weight:500">(' + list.length + ')</span></h3>' + (InboxFilter !== 'all' ? '<button class="btn s plain" data-a="ibf" data-v="all">' + ic('x', 14) + 'Bỏ lọc</button>' : '') + '</div>' +
    '<div class="seg"><button data-a="ibf" data-v="all" class="' + (!isHist ? 'on' : '') + '">Việc tồn</button><button data-a="ibf" data-v="donxong" class="' + (InboxFilter === 'donxong' ? 'on' : '') + '">Đơn đã xử lý</button>' + (u.superAdmin ? '' : '<button data-a="ibf" data-v="dontoi" class="' + (InboxFilter === 'dontoi' ? 'on' : '') + '">Đơn của tôi</button>') + '</div></div>';
  h += '<div class="split ' + (sel ? 'has-sel' : '') + ' mb24"><div class="box inbox">' + (list.length ? list.map((x) =>
    '<a class="it ' + (sel && sel.key === x.key ? 'on' : '') + '" href="' + (x.href || '#/viec/' + x.key) + '"><div class="ib ' + x.tone + '">' + ic(x.ico, 18) + '</div><div class="grow"><div class="flex btw" style="flex-wrap:nowrap"><span class="rt">' + esc(x.title) + '</span><span class="when">' + (x.at ? fmt.ago(x.at) : '') + '</span></div><div class="prev">' + esc(x.prev) + '</div>' + (x.side || x.urgent ? '<div class="mt4">' + (x.side || tag('Gấp', 'bad')) + '</div>' : '') + '</div></a>').join('') : none('Không có việc trong mục này.', 'check')) + '</div>';
  h += '<div class="detail">' + (sel ? '<a class="btn s plain back-m mb8" href="#/viec">' + ic('back', 16) + 'Danh sách</a>' + inboxDetail(sel.key, u) : '<div class="box">' + none('Chọn một việc ở danh sách để xem chi tiết.', 'eye') + '</div>') + '</div></div>';

  // ---- tầng 3: tình hình lớp (tham khảo)
  return h + overviewMetrics(u);
});
function overviewMetrics(u) {
  const cs = Metrics.scope(u); const w0 = Metrics.win(0); const w1 = Metrics.win(1); const all = P.adm(u, 'ADM-11');
  let h = secLabel(3, all ? 'Tình hình toàn trung tâm' : 'Tình hình lớp bạn phụ trách', '4 tuần gần nhất, so với 4 tuần trước');
  if (!cs.length) return h + '<div class="box">' + none('Chưa có lớp đang học.', 'class') + '</div>';
  const a0 = Metrics.attendance(cs, w0); const a1 = Metrics.attendance(cs, w1); const o0 = Metrics.onTime(cs, w0); const o1 = Metrics.onTime(cs, w1);
  const s0 = Metrics.score(cs, w0); const s1 = Metrics.score(cs, w1); const r0 = Metrics.reports(cs, w0); const r1 = Metrics.reports(cs, w1);
  h += '<div class="cols c4 k2 mb16">' + kpi('Chuyên cần', fmt.pct(a0), a0, a1, ' điểm %', 'check', toneRate(a0)) + kpi('Nộp bài đúng hạn', fmt.pct(o0), o0, o1, ' điểm %', 'pen', toneRate(o0)) +
    kpi('Điểm TB bài đã trả', fmt.sc(s0) + '<span class="faint" style="font-size:16px"> /10</span>', s0, s1, ' điểm', 'star', toneScore(s0)) + kpi('Báo cáo buổi đúng hạn', r0 == null ? '-' : r0 + '%', r0, r1, ' điểm %', 'doc', toneRate(r0)) + '</div>';
  // số liệu phụ: tuần này, quy mô
  const mon = addDays(startOfDay(new Date()), -((new Date().getDay() + 6) % 7)); const sun = addDays(mon, 6);
  const wk = Store.db.sessions.filter((s) => s.status !== 'huy' && s.date >= ymd(mon) && s.date <= ymd(sun) && staffSees(u, s));
  const hrs = wk.reduce((n, s) => n + (toMin(s.end) - toMin(s.start)) / 60, 0);
  const studs = new Set(cs.flatMap((c) => Q.activeMembers(c).map((m) => m.uid)));
  const soon = Store.db.courses.filter((c) => c.status === 'cho' && (all || P.assigned(u, c)));
  const leaves = Store.db.requests.filter((r) => r.kind === 'hs_nghi' && cs.some((c) => c.id === r.courseId) && new Date(r.createdAt).getTime() >= w0[0]);
  const mini = (k, v, s) => '<div class="mini-stat"><div class="k">' + esc(k) + '</div><div class="v">' + v + '</div><div class="s">' + esc(s) + '</div></div>';
  h += '<div class="mini-row mb16">' + mini('Buổi dạy tuần này', wk.length, String(Math.round(hrs * 10) / 10).replace('.', ',') + ' giờ · đã dạy ' + wk.filter((s) => Q.sessionEnded(s)).length + ' buổi') +
    mini('Lớp đang học', cs.length, soon.length ? soon.length + ' lớp sắp khai giảng' : 'Không có lớp sắp khai giảng') + mini('Học sinh đang học', studs.size, 'Trong ' + cs.length + ' lớp') +
    mini('Đơn xin nghỉ 4 tuần', leaves.length, leaves.length ? Math.round((leaves.filter((r) => r.status === 'duyet').length / leaves.length) * 100) + '% được chấp nhận' : 'Không có đơn') + '</div>';
  // bảng từng lớp
  h += '<div class="box tw"><table class="t"><tr><th>Lớp</th><th>Tiến độ</th><th class="n">Chuyên cần 4 tuần</th><th class="n">Nộp đúng hạn</th><th class="n">Điểm TB</th><th class="n">Học sinh cần chú ý</th><th class="n">Việc tồn</th></tr>' + cs.map((c) => {
    const dn = Q.sessionsOf(c.id).filter((s) => s.attendance.closed && s.status !== 'huy').length; const ar = Metrics.attendance([c], w0); const ot = Metrics.onTime([c], w0);
    const sc = avgOf(Q.activeMembers(c).map((m) => Calc.grades(m.uid, c.id).total)); const att = Inbox.attention(u).filter((x) => x.c.id === c.id).length;
    const todo = Inbox.items(u).filter((x) => x.prev.startsWith(c.name) || x.prev.includes(' ' + c.name)).length;
    return '<tr class="go" data-h="#/lop/' + c.id + '"><td><div class="b">' + esc(c.name) + '</div><div class="xs faint">' + esc(Q.program(c.programId).name) + ' · ' + esc((Q.user(c.teacherId) || {}).name || '') + '</div></td><td style="min-width:140px"><div class="xs faint">' + dn + '/' + c.nSessions + ' buổi</div>' + miniBar((dn / c.nSessions) * 100) + '</td>' +
      '<td class="n">' + (ar == null ? '-' : tag(fmt.pct(ar), toneRate(ar))) + '</td><td class="n">' + (ot == null ? '-' : tag(fmt.pct(ot), toneRate(ot))) + '</td><td class="n">' + (sc == null ? '-' : tag(fmt.sc(sc), toneScore(sc))) + '</td><td class="n">' + (att ? tag(att + ' em', 'bad') : '<span class="faint">0</span>') + '</td><td class="n">' + (todo || '<span class="faint">0</span>') + '</td></tr>';
  }).join('') + '</table></div>';
  return h;
}
function todayRow(s, u) {
  const c = Q.course(s.courseId); const roster = Q.rosterOf(s); const n = Object.values(s.attendance.records).filter((r) => r.st === 'co_mat' || r.st === 'di_muon').length;
  const can = P.operate(u, c) || s.teacherId === u.id;
  const st = s.status === 'huy' ? tag('Đã hủy') : s.attendance.closed ? tag('Đã chốt: ' + n + '/' + roster.length + ' có mặt', 'ok') : s.attendance.open ? tag('Đang điểm danh: ' + n + '/' + roster.length, 'ai') : tag('Chưa mở điểm danh');
  return '<div class="r">' + calChip(s.date) + '<div class="grow"><div class="rt">' + s.start + ' - ' + s.end + ' · ' + esc(c.name) + '</div><div class="rd">Buổi ' + (s.idx + 1) + ': ' + esc(s.title) + ' · ' + esc(where(s)) + '</div><div class="mt4">' + st + '</div></div><div class="flex">' +
    (can && !s.attendance.open && !s.attendance.closed && s.status !== 'huy' ? '<button class="btn primary s" data-a="openRoll" data-id="' + s.id + '">' + ic('qr', 16) + 'Mở điểm danh</button>' : '') +
    (s.attendance.open ? '<a class="btn primary s" href="#/qr/' + s.id + '">' + ic('qr', 16) + 'Màn hình QR</a>' : '') + '<a class="btn s" href="#/buoi/' + s.id + '">Chi tiết buổi</a></div></div>';
}
function inboxDetail(key, u) {
  const [k, ...rest] = key.split('-'); const id = rest.join('-');
  if (k === 'r') return reqDetail(Q.req(id), u, true);
  if (k === 'q') { location.replace('#/hoi-dap/' + id); return ''; }
  if (k === 'a') return gradingDetail(Q.asg(id), u);
  if (k === 's') return reportDetail(Q.session(id), u);
  if (k === 'h') { const [sid, ...cid] = rest; return attentionDetail(Q.user(sid), Q.course(cid.join('-')), u); }
  if (k === 'g') { const pr = Q.program(id); return '<div class="box"><div class="box-h"><div class="ib plum">' + ic('star', 18) + '</div><div class="grow"><h2>Gợi ý học liệu: ' + esc(pr.name) + '</h2><div class="xs faint">Giáo viên bổ sung cho lớp; bạn quyết định có thêm vào chương trình không</div></div></div><div class="box-b">' + sugRows(pr, pendingSug(pr), u, true) + '<div class="mt12"><a class="btn plain" href="#/chuong-trinh/' + pr.id + '/goi-y">Mở trang gợi ý của chương trình</a></div></div></div>'; }
  return '';
}

// ------------------------------------------------------------------ chi tiết đơn
function reqDetail(r, u, canAct) {
  if (!r) return '<div class="box">' + none('Đơn không còn tồn tại.') + '</div>';
  const who = Q.user(r.userId); const c = Q.course(r.courseId); const s = r.sessionId && Q.session(r.sessionId); const a = r.assignmentId && Q.asg(r.assignmentId);
  const act = canAct && r.status === 'cho' && Inbox.requests(u).some((x) => x.id === r.id);
  let h = '<div class="box"><div class="box-h"><div class="ib ' + (r.kind.startsWith('gv') || r.kind === 'day_bu' ? 'plum' : 'warn') + '">' + ic('doc', 18) + '</div><div class="grow"><h2>' + esc(REQ_KIND[r.kind]) + '</h2><div class="xs faint">Gửi ' + fmt.dt(r.createdAt) + ' · ' + fmt.ago(r.createdAt) + '</div></div>' + reqTag(r) + (r.late ? ' ' + tag('Báo muộn', 'bad') : '') + '</div><div class="box-b vstack">';
  // người gửi
  const att = who.role === 'hs' ? Calc.attendanceOf(who.id, c.id) : null;
  const prevLeaves = Store.db.requests.filter((x) => x.userId === who.id && x.kind === r.kind && x.id !== r.id && x.status === 'duyet').length;
  h += '<div class="person">' + av(who, 48) + '<div class="grow"><b>' + esc(who.name) + '</b><span class="sm faint">' + esc(roleLabel(who)) + (who.code ? ' · ' + esc(who.code) : '') + ' · ' + esc(c.name) + '</span></div>' +
    (att ? '<div style="width:150px"><div class="flex btw xs"><span class="faint">Chuyên cần</span><b>' + fmt.pct(att.rate) + '</b></div>' + miniBar(att.rate, toneRate(att.rate)) + '<div class="xs faint mt4">' + prevLeaves + ' đơn đã nghỉ trước đây · ' + att.kp + ' buổi vắng không phép</div></div>' : '') + '</div>';
  // đối tượng của đơn
  if (s) {
    const ms = at(s.date, s.start).getTime() - Date.now();
    h += '<div><div class="xs faint b mb8">' + (r.kind === 'day_bu' ? 'BUỔI ĐÃ HỦY CẦN DẠY BÙ' : 'BUỔI XIN NGHỈ') + '</div><div class="when-card">' + calChip(s.date) + '<div class="grow"><div class="b" style="font-size:16px">' + fmt.day(s.date) + ' · ' + s.start + ' - ' + s.end + '</div><div class="sm">Buổi ' + (s.idx + 1) + ': ' + esc(s.title) + '</div><div class="sm faint">' + esc(where(s)) + ' · Người dạy: ' + esc((Q.user(s.teacherId) || {}).name || '') + '</div></div>' +
      (r.kind !== 'day_bu' ? '<div style="text-align:right"><div class="b ' + (ms < 24 * 3600e3 ? 'bad-t' : '') + '">' + fmt.until(ms) + '</div><div class="xs faint">đến giờ học</div></div>' : '') + '</div></div>';
  }
  if (r.kind === 'day_bu') {
    const conflict = Store.db.sessions.find((x) => x.status !== 'huy' && x.date === r.date && x.teacherId === (s && s.teacherId) && x.start < r.end && r.start < x.end);
    h += '<div><div class="xs faint b mb8">LỊCH DẠY BÙ ĐỀ XUẤT</div><div class="when-card">' + calChip(r.date) + '<div class="grow"><div class="b" style="font-size:16px">' + fmt.day(r.date) + ' · ' + r.start + ' - ' + r.end + '</div><div class="sm faint">' + esc(MODE_NAME[r.mode] || '') + '</div></div></div>' + (conflict ? '<div class="note warn mt8">Trùng lịch với buổi ' + esc(Q.course(conflict.courseId).name) + ' (' + conflict.start + ' - ' + conflict.end + ').</div>' : '<div class="note ok mt8">Không trùng lịch người dạy.</div>') + '</div>';
  }
  if (a) {
    const due = Q.dueOf(a, who.id);
    h += '<div><div class="xs faint b mb8">BÀI XIN NỘP MUỘN</div><div class="when-card"><div class="ib plum">' + ic('pen', 18) + '</div><div class="grow"><div class="b">' + esc(a.title) + '</div><div class="sm faint">' + esc(ASG_TYPE[a.type]) + ' · ' + fmt.due(due) + (a.allowLate ? ' · bài cho phép nộp muộn' : ' · bài không nhận nộp muộn') + '</div></div></div></div>';
  }
  if (r.kind === 'gv_nghi') {
    const sub = r.substituteId && Q.user(r.substituteId);
    const clash = sub && Store.db.sessions.find((x) => x.id !== s.id && x.status !== 'huy' && x.date === s.date && x.teacherId === sub.id && x.start < s.end && s.start < x.end);
    h += '<dl class="kv"><dt>Đề xuất</dt><dd>' + (r.proposal === 'nguoi_thay' ? 'Có người dạy thay' : r.proposal === 'huy_buoi' ? 'Hủy buổi, đăng ký dạy bù sau' : 'Không cần người thay (trợ giảng hỗ trợ)') + '</dd>' +
      (sub ? '<dt>Người dạy thay</dt><dd><div class="flex">' + av(sub, 26) + esc(sub.name) + (clash ? ' ' + tag('Trùng lịch', 'bad') : ' ' + tag('Rảnh giờ này', 'ok')) + '</div></dd>' : '') +
      '<dt>Ảnh hưởng</dt><dd>' + Q.rosterOf(s).length + ' học sinh trong buổi</dd></dl>';
  }
  h += '<div><div class="xs faint b mb8">LÝ DO</div><div class="quote">' + esc(r.reason) + '</div></div>';
  if (r.status !== 'cho') h += '<dl class="kv"><dt>Người xử lý</dt><dd>' + esc((Q.user(r.handledBy) || {}).name || '') + ' · ' + fmt.dt(r.handledAt) + '</dd>' + (r.note ? '<dt>Ghi chú</dt><dd>' + esc(r.note) + '</dd>' : '') + (r.newDue ? '<dt>Hạn mới</dt><dd>' + fmt.dt(r.newDue) + '</dd>' : '') + '</dl>';
  if (act) {
    const def = ymd(addDays(new Date(), 2)) + 'T23:59';
    h += '<form data-f="reqDo" data-id="' + r.id + '" class="vstack" style="border-top:1px solid var(--line);padding-top:16px">' +
      (r.kind === 'nop_muon' ? fld('Hạn nộp mới cho học sinh', '<input class="in" type="datetime-local" name="due" value="' + def + '">') : '') +
      fld('Ghi chú gửi người làm đơn', '<textarea class="in" name="note" rows="2" placeholder="Không bắt buộc khi chấp nhận, bắt buộc khi từ chối"></textarea>') +
      '<div class="flex"><button class="btn go" name="ok" value="1">' + ic('check', 17) + (r.kind.startsWith('gv') || r.kind === 'day_bu' ? 'Duyệt' : 'Chấp nhận') + '</button><button class="btn stop" name="ok" value="0">' + ic('x', 17) + 'Từ chối</button>' +
      '<span class="xs faint grow" style="text-align:right">' + (r.kind === 'hs_nghi' ? 'Chấp nhận: buổi này ghi Vắng có phép.' : r.kind === 'gv_nghi' && r.proposal === 'nguoi_thay' ? 'Duyệt: người dạy thay nhận buổi này.' : r.kind === 'gv_nghi' && r.proposal === 'huy_buoi' ? 'Duyệt: buổi chuyển Đã hủy.' : '') + '</span></div></form>';
  } else if (r.status === 'cho' && r.userId === u.id) h += '<div><button class="btn stop s" data-a="reqCancel" data-id="' + r.id + '">Hủy đơn</button></div>';
  return h + '</div></div>';
}
onSubmit('reqDo', (d, f, e) => {
  const yes = e.submitter && e.submitter.value === '1'; const r = Q.req(f.dataset.id);
  if (!yes && !d.note.trim()) { toast('Nhập ghi chú lý do từ chối', 'bad'); return; }
  if (done(A.handleRequest(App.me(), r.id, yes, d.note.trim(), { newDue: d.due }), yes ? 'Đã chấp nhận đơn' : 'Đã từ chối đơn')) nav('#/viec');
});
on('reqCancel', (el) => { if (done(A.cancelRequest(App.me(), el.dataset.id), 'Đã hủy đơn')) App.render(); });

// ------------------------------------------------------------------ chi tiết bài chờ điểm, báo cáo, học sinh cần chú ý
function gradingDetail(a, u) {
  const c = Q.course(a.courseId); const subs = Store.db.submissions.filter((s) => s.assignmentId === a.id && s.status !== 'da_tra');
  const ready = subs.filter((s) => s.score != null);
  return '<div class="box"><div class="box-h"><div class="ib plum">' + ic('pen', 18) + '</div><div class="grow"><h2>' + esc(a.title) + '</h2><div class="xs faint">' + esc(c.name) + ' · ' + esc(ASG_TYPE[a.type]) + ' · ' + fmt.due(a.dueAt) + '</div></div></div><div class="box-b">' +
    (a.review ? '<div class="note mb12">Bài đặt "công bố điểm sau khi xem xét": học sinh, phụ huynh chỉ thấy điểm sau khi bấm Trả kết quả.</div>' : '') +
    '<div class="rows">' + subs.map((s) => { const st = Q.user(s.studentId); const man = s.score == null;
      return '<div class="r">' + av(st, 34) + '<div class="grow"><div class="rt">' + esc(st.name) + '</div><div class="rd">Nộp ' + fmt.dt(s.submittedAt) + (s.late ? ' · nộp muộn' : '') + (man ? '' : ' · điểm ' + fmt.sc(s.score) + '/10') + '</div></div>' + (man ? tag('Chờ nhập điểm', 'warn') : tag('Có điểm', 'ai')) + '</div>'; }).join('') + '</div>' +
    '<div class="flex mt16"><a class="btn primary" href="#/bai/' + a.id + '/diem">' + ic('pen', 16) + 'Nhập điểm</a>' + (ready.length ? '<button class="btn go" data-a="releaseAll" data-id="' + a.id + '">' + ic('send', 16) + 'Trả kết quả ' + ready.length + ' bài có điểm</button>' : '') + '<a class="btn plain" href="#/bai/' + a.id + '/form">Xem form</a></div></div></div>';
}
function reportDetail(s, u) {
  const c = Q.course(s.courseId); const roster = Q.rosterOf(s); const recs = s.attendance.records;
  const cnt = (k) => roster.filter((x) => recs[x.id] && recs[x.id].st === k).length;
  return '<div class="box"><div class="box-h"><div class="ib warn">' + ic('alert', 18) + '</div><div class="grow"><h2>Báo cáo buổi chưa công bố</h2><div class="xs faint">' + esc(c.name) + '</div></div></div><div class="box-b vstack"><div class="when-card">' + calChip(s.date) + '<div><div class="b">' + fmt.day(s.date) + ' · ' + s.start + ' - ' + s.end + '</div><div class="sm">Buổi ' + (s.idx + 1) + ': ' + esc(s.title) + '</div></div></div>' +
    '<dl class="kv"><dt>Điểm danh</dt><dd>' + Object.keys(ATT).map((k) => attTag(k).replace('</span>', ' ' + cnt(k) + '</span>')).join(' ') + '</dd><dt>Hạn công bố</dt><dd>' + Q.param('baoCaoTre') + ' giờ sau khi buổi kết thúc</dd></dl>' +
    '<div class="note">Hệ thống đã tự gom điểm danh, nội dung buổi, tình trạng nộp bài. Bạn chỉ cần thêm nhận xét và công bố.</div><div><a class="btn primary" href="#/buoi/' + s.id + '/bao-cao">' + ic('pen', 16) + 'Viết nhận xét và công bố</a></div></div></div>';
}
function attentionDetail(st, c, u) {
  const att = Calc.attendanceOf(st.id, c.id); const g = Calc.grades(st.id, c.id); const x = Inbox.attention(u).find((y) => y.st.id === st.id && y.c.id === c.id) || { why: [], miss: [], lows: [] };
  return '<div class="box"><div class="box-h"><div class="ib teal">' + ic('user', 18) + '</div><div class="grow"><h2>' + esc(st.name) + '</h2><div class="xs faint">' + esc(c.name) + '</div></div></div><div class="box-b vstack"><div class="flex">' + x.why.map((w) => tag(w, 'bad')).join('') + '</div>' +
    '<div class="cols c3"><div class="stat"><div class="k">Chuyên cần</div><div class="v">' + fmt.pct(att.rate) + '</div><div class="s">' + att.ok + '/' + att.held + ' buổi</div></div><div class="stat"><div class="k">Vắng không phép</div><div class="v">' + att.kp + '</div></div><div class="stat"><div class="k">Điểm tổng kết</div><div class="v">' + fmt.sc(g.total) + '</div></div></div>' +
    (x.miss.length ? '<div><div class="xs faint b mb8">BÀI QUÁ HẠN CHƯA NỘP</div>' + x.miss.map((a) => '<div class="sm">' + esc(a.title) + ' · ' + fmt.due(Q.dueOf(a, st.id)) + '</div>').join('') + '</div>' : '') +
    '<dl class="kv"><dt>Phụ huynh</dt><dd>' + (st.phMode ? 'Phụ huynh dùng tài khoản học sinh' : esc(st.parentIds.map((p) => Q.user(p).name + ' · ' + Q.user(p).phone).join(', ') || 'Chưa liên kết')) + '</dd></dl>' +
    '<div><a class="btn" href="#/hoc-sinh/' + st.id + '">Xem hồ sơ học tập</a></div></div></div>';
}

// lịch sử đơn (đã xử lý, của tôi) hiện trong Tổng quan
function reqHistory(u, kind) {
  const mineC = new Set(Store.db.courses.filter((c) => P.assigned(u, c)).map((c) => c.id));
  const L = kind === 'dontoi' ? Store.db.requests.filter((r) => r.userId === u.id)
    : Store.db.requests.filter((r) => r.status !== 'cho' && r.userId !== u.id && (u.superAdmin || r.handledBy === u.id || (mineC.has(r.courseId) && !r.kind.startsWith('gv') && r.kind !== 'day_bu')));
  return L.sort((x, y) => (x.createdAt < y.createdAt ? 1 : -1)).map((r) => ({ key: 'r-' + r.id, kind: 'don', at: r.createdAt, ico: 'doc', tone: r.status === 'duyet' ? 'ok' : r.status === 'tu_choi' ? 'bad' : 'warn',
    title: REQ_KIND[r.kind] + ' · ' + Q.user(r.userId).name, prev: reqLine(r), side: reqTag(r) }));
}

// ------------------------------------------------------------------ trang Đơn (danh sách đầy đủ, mở từ Tổng quan)
page('/don/:tab?/:sel?', { nav: 'don' }, (p, u) => {
  if (u.role === 'ph') {
    const L = Store.db.requests.filter((r) => u.childIds.includes(r.userId)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return head('Đơn của con', { desc: 'Đơn xin nghỉ, xin nộp muộn của con và kết quả xử lý.' }) + reqSplit(L, p.sel, u, '#/don/x/', false);
  }
  if (!P.isStaff(u)) {
    const L = Store.db.requests.filter((r) => r.userId === u.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return head('Đơn của tôi', { desc: 'Xin nghỉ học, xin nộp muộn. Người phụ trách lớp xử lý đơn.', acts: '<button class="btn primary" data-a="newLeave">' + ic('plus', 17) + 'Xin nghỉ học</button><button class="btn" data-a="newLate">Xin nộp muộn</button>' }) + reqSplit(L, p.sel, u, '#/don/x/', false);
  }
  const tab = ['cho', 'xong', 'toi'].includes(p.tab) ? p.tab : 'cho';
  const mineC = new Set(Store.db.courses.filter((c) => P.assigned(u, c)).map((c) => c.id));
  const lists = {
    cho: Inbox.requests(u),
    xong: Store.db.requests.filter((r) => r.status !== 'cho' && r.userId !== u.id && (r.handledBy === u.id || (mineC.has(r.courseId) && !r.kind.startsWith('gv') && r.kind !== 'day_bu') || (u.superAdmin && (r.kind === 'gv_nghi' || r.kind === 'day_bu')))),
    toi: Store.db.requests.filter((r) => r.userId === u.id),
  };
  Object.values(lists).forEach((L) => L.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  return head('Đơn', { desc: u.superAdmin ? 'Đơn của học sinh trong lớp bạn phụ trách và đơn nghỉ, dạy bù của nhân sự.' : 'Đơn của học sinh trong lớp bạn phụ trách. Đơn nghỉ dạy, dạy bù do Hồ An duyệt.', acts: u.superAdmin ? '' : '<button class="btn" data-a="staffLeave">Xin nghỉ dạy</button><button class="btn" data-a="makeup">Đăng ký dạy bù</button>' }) +
    '<div class="tabs">' + [['cho', 'Cần xử lý'], ['xong', 'Đã xử lý'], ['toi', 'Đơn của tôi']].map(([k, t]) => '<a href="#/don/' + k + '" class="' + (k === tab ? 'on' : '') + '">' + t + '<span class="n">' + lists[k].length + '</span></a>').join('') + '</div>' +
    reqSplit(lists[tab], p.sel, u, '#/don/' + tab + '/', tab === 'cho');
});
function reqSplit(L, sel, u, base, canAct) {
  const cur = sel && L.find((r) => r.id === sel);
  return '<div class="split ' + (cur ? 'has-sel' : '') + '"><div class="box inbox">' + (L.length ? L.map((r) => { const who = Q.user(r.userId);
    return '<a class="it ' + (cur && cur.id === r.id ? 'on' : '') + '" href="' + base + r.id + '">' + av(who, 36) + '<div class="grow"><div class="flex btw" style="flex-wrap:nowrap"><span class="rt">' + esc(REQ_KIND[r.kind]) + '</span><span class="when">' + fmt.ago(r.createdAt) + '</span></div><div class="sm">' + esc(who.name) + '</div><div class="prev">' + esc(reqLine(r)) + '</div><div class="mt4">' + reqTag(r) + (r.late ? ' ' + tag('Báo muộn', 'bad') : '') + '</div></div></a>'; }).join('') : none('Không có đơn.', 'doc')) + '</div>' +
    '<div class="detail">' + (cur ? '<a class="btn s plain back-m mb8" href="' + base.replace(/\/x\/$/, '').replace(/\/$/, '') + '">' + ic('back', 16) + 'Danh sách</a>' + reqDetail(cur, u, canAct) : '<div class="box">' + none('Chọn một đơn để xem chi tiết.', 'eye') + '</div>') + '</div></div>';
}
