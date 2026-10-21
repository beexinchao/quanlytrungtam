'use strict';
/* Báo cáo tổng quan: theo cấp độ, theo chương trình, theo lớp, theo học sinh.
   Phạm vi: lớp phụ trách và lớp cùng cấp độ; Admin có quyền "Xem báo cáo mọi lớp" thấy mọi lớp. */

const repScope = (u) => Store.db.courses.filter((c) => P.viewCourse(u, c) && ['dang_hoc', 'ket_thuc'].includes(c.status));
function classStats(c) {
  const mem = Q.activeMembers(c);
  const held = Q.sessionsOf(c.id).filter((s) => s.attendance.closed && s.status !== 'huy');
  const ended = Q.sessionsOf(c.id).filter((s) => Q.sessionEnded(s) && s.status !== 'huy');
  const onTime = ended.filter((s) => s.report && s.report.status === 'cong_bo' && new Date(s.report.publishedAt).getTime() - at(s.date, s.end).getTime() <= Q.param('baoCaoTre') * 3600e3).length;
  const totals = mem.map((m) => ({ uid: m.uid, g: Calc.grades(m.uid, c.id), a: Calc.attendanceOf(m.uid, c.id) }));
  const perSession = held.map((s) => { const R = Q.rosterOf(s); const ok = R.filter((x) => s.attendance.records[x.id] && ['co_mat', 'di_muon'].includes(s.attendance.records[x.id].st)).length; return { s, rate: R.length ? Math.round((ok / R.length) * 100) : null }; });
  const asgs = Store.db.assignments.filter((a) => a.courseId === c.id && a.status === 'da_giao').sort((a, b) => (a.dueAt < b.dueAt ? -1 : 1)).map((a) => {
    const subs = Store.db.submissions.filter((s) => s.assignmentId === a.id && s.status === 'da_tra');
    return { a, avg: avgOf(subs.map((s) => Calc.score10(a, s))), n: Store.db.submissions.filter((s) => s.assignmentId === a.id).length };
  });
  const byType = {}; Object.keys(ASG_TYPE).forEach((t) => { byType[t] = avgOf(totals.map((x) => x.g.avg[t])); });
  return { c, n: mem.length, rate: avgOf(totals.map((x) => x.a.rate)), score: avgOf(totals.map((x) => x.g.total)), totals, held: held.length, ended: ended.length, onTime, perSession, asgs, byType };
}
const statTile = (k, v, s, tone, icon) => '<div class="stat ' + (tone || '') + '"><div class="k"><span class="ico">' + ic(icon || 'chart', 16) + '</span>' + esc(k) + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + esc(s) + '</div>' : '') + '</div>';
const DIST = [['Dưới 5', (x) => x < 5, '#BF3A2A'], ['5 - 6,9', (x) => x >= 5 && x < 7, '#C27A12'], ['7 - 8,4', (x) => x >= 7 && x < 8.5, '#3346A8'], ['8,5 trở lên', (x) => x >= 8.5, '#2B7A4B']];
const distChart = (scores) => barChart(DIST.map(([l, f, col]) => ({ label: l, value: scores.filter(f).length, color: col })), { h: 190, label: 'Phân bố điểm tổng kết' });
function summaryTiles(stats) {
  const held = stats.reduce((n, s) => n + s.ended, 0); const ot = stats.reduce((n, s) => n + s.onTime, 0);
  return '<div class="cols c4 k2 mb16">' + statTile('Lớp', stats.length, stats.filter((s) => s.c.status === 'dang_hoc').length + ' đang học', '', 'class') + statTile('Lượt học sinh', stats.reduce((n, s) => n + s.n, 0), '', '', 'users') +
    statTile('Chuyên cần trung bình', fmt.pct(avgOf(stats.map((s) => s.rate))), '', 'ok', 'check') + statTile('Điểm tổng kết TB', fmt.sc(avgOf(stats.map((s) => s.score))), 'Báo cáo buổi đúng hạn ' + (held ? Math.round((ot / held) * 100) + '%' : '-'), 'plum', 'star') + '</div>';
}
function classTable(stats) {
  return '<div class="box tw"><table class="t"><tr><th>Lớp</th><th>Cấp độ</th><th>Trạng thái</th><th class="n">Học sinh</th><th class="n">Buổi đã học</th><th class="n">Chuyên cần</th><th class="n">Điểm TB</th><th class="n">Báo cáo đúng hạn</th></tr>' +
    stats.map((s) => '<tr class="go" data-h="#/bao-cao/lop/' + s.c.id + '"><td class="b">' + esc(s.c.name) + '</td><td>' + tag(s.c.level, 'ai') + '</td><td>' + classTag(s.c) + '</td><td class="n">' + s.n + '</td><td class="n">' + s.held + '</td><td class="n">' + fmt.pct(s.rate) + '</td><td class="n">' + fmt.sc(s.score) + '</td><td class="n">' + (s.ended ? Math.round((s.onTime / s.ended) * 100) + '%' : '-') + '</td></tr>').join('') + '</table></div>';
}

page('/bao-cao/:view?/:id?', { nav: 'bc', can: P.isStaff }, (p, u) => {
  const scope = repScope(u);
  const V = [['khoa', 'Theo cấp độ'], ['chuong-trinh', 'Theo chương trình'], ['lop', 'Theo lớp'], ['hoc-sinh', 'Theo học sinh']];
  const view = V.some((v) => v[0] === p.view) ? p.view : 'khoa';
  let h = head('Báo cáo tổng quan', { desc: P.adm(u, 'ADM-11') ? 'Phạm vi: mọi lớp của trung tâm.' : 'Phạm vi: lớp bạn phụ trách và lớp cùng cấp độ.', acts: '<button class="btn" data-a="repCsv" data-v="' + view + '" data-id="' + esc(p.id || '') + '">' + ic('down', 16) + 'Xuất CSV</button><button class="btn" data-a="print">In, lưu PDF</button>' });
  h += '<div class="tabs">' + V.map(([k, t]) => '<a href="#/bao-cao/' + k + '" class="' + (k === view ? 'on' : '') + '">' + t + '</a>').join('') + '</div>';
  if (!scope.length) return h + '<div class="box">' + none('Chưa có lớp trong phạm vi.', 'chart') + '</div>';
  return h + RepView[view](scope, p.id, u);
});

const RepView = {
  // ---- theo cấp độ
  khoa(scope, id) {
    const levels = [...new Set(scope.map((c) => c.level))].sort().reverse();
    const lv = levels.includes(id) ? id : 'all';
    let h = '<div class="flex mb16"><span class="b sm">Cấp độ:</span><div class="seg"><a href="#/bao-cao/khoa" class="' + (lv === 'all' ? 'on' : '') + '">So sánh các cấp độ</a>' + levels.map((l) => '<a href="#/bao-cao/khoa/' + l + '" class="' + (lv === l ? 'on' : '') + '">Cấp độ ' + l + '</a>').join('') + '</div></div>';
    if (lv === 'all') {
      const rows = levels.map((l) => { const st = scope.filter((c) => c.level === l).map(classStats); return { l, st, rate: avgOf(st.map((s) => s.rate)), score: avgOf(st.map((s) => s.score)), n: st.reduce((x, s) => x + s.n, 0) }; });
      const all = scope.map(classStats);
      h += summaryTiles(all);
      h += '<div class="cols c2 mb16"><div class="box"><div class="box-h"><h2>Chuyên cần theo cấp độ</h2></div><div class="box-b">' + rows.map((r, i) => hbar('Cấp độ ' + r.l, r.rate, 100, SERIES_C[i % 6], fmt.pct(r.rate))).join('') + '</div></div>' +
        '<div class="box"><div class="box-h"><h2>Điểm tổng kết trung bình theo cấp độ</h2></div><div class="box-b">' + rows.map((r, i) => hbar('Cấp độ ' + r.l, r.score, 10, SERIES_C[i % 6], fmt.sc(r.score))).join('') + '</div></div></div>';
      h += '<div class="box tw"><table class="t"><tr><th>Cấp độ</th><th class="n">Số lớp</th><th class="n">Lượt học sinh</th><th class="n">Chuyên cần TB</th><th class="n">Điểm TB</th></tr>' + rows.map((r) => '<tr class="go" data-h="#/bao-cao/khoa/' + r.l + '"><td>' + tag('Cấp độ ' + r.l, 'ai') + '</td><td class="n">' + r.st.length + '</td><td class="n">' + r.n + '</td><td class="n">' + fmt.pct(r.rate) + '</td><td class="n">' + fmt.sc(r.score) + '</td></tr>').join('') + '</table></div>';
      return h;
    }
    const st = scope.filter((c) => c.level === lv).map(classStats);
    h += summaryTiles(st);
    h += '<div class="cols c2 mb16"><div class="box"><div class="box-h"><h2>So sánh các lớp cấp độ ' + lv + '</h2></div><div class="box-b"><div class="xs faint b mb8">CHUYÊN CẦN</div>' + st.map((s, i) => hbar(s.c.name, s.rate, 100, SERIES_C[i % 6], fmt.pct(s.rate))).join('') +
      '<div class="xs faint b mb8 mt16">ĐIỂM TỔNG KẾT TRUNG BÌNH</div>' + st.map((s, i) => hbar(s.c.name, s.score, 10, SERIES_C[i % 6], fmt.sc(s.score))).join('') + '</div></div>' +
      '<div class="box"><div class="box-h"><h2>Phân bố điểm tổng kết cấp độ ' + lv + '</h2></div><div class="box-b">' + distChart(st.flatMap((s) => s.totals.map((x) => x.g.total)).filter((x) => x != null)) + '</div></div></div>';
    return h + classTable(st);
  },
  // ---- theo chương trình
  'chuong-trinh'(scope, id) {
    const progs = Store.db.programs.filter((p) => scope.some((c) => c.programId === p.id));
    const pr = progs.find((p) => p.id === id) || progs[0];
    const st = scope.filter((c) => c.programId === pr.id).map(classStats);
    let h = '<div class="flex mb16"><span class="b sm">Chương trình:</span><select class="in" style="width:auto;min-width:260px" data-c="repPick" data-v="chuong-trinh">' + opt(progs.map((p) => [p.id, p.name + ' (' + p.level + ')']), pr.id) + '</select><span class="faint sm">' + st.length + ' lớp dùng chương trình này</span></div>';
    h += summaryTiles(st);
    const maxS = Math.max(...st.map((s) => s.perSession.length), 1); const labels = Array.from({ length: maxS }, (_, i) => String(i + 1));
    h += '<div class="box mb16"><div class="box-h"><h2>Chuyên cần theo buổi của chương trình</h2><span class="sp"></span><div class="legend">' + st.map((s, i) => '<span><i style="background:' + SERIES_C[i % 6] + '"></i>' + esc(s.c.name) + '</span>').join('') + '</div></div><div class="box-b">' +
      lineChart(st.map((s, i) => ({ name: s.c.name, color: SERIES_C[i % 6], points: labels.map((_, k) => (s.perSession[k] ? s.perSession[k].rate : null)) })), labels, { max: 100, fmt: (v) => v + '%', label: 'Chuyên cần theo buổi', w: 1180 }) +
      '<div class="xs faint">Trục ngang: buổi thứ mấy trong chương trình. Giúp thấy buổi nào của chương trình học sinh hay vắng.</div></div></div>';
    h += '<div class="box mb16"><div class="box-h"><h2>Điểm trung bình theo loại bài</h2></div><div class="box-b"><div class="cols c' + Math.min(4, Object.keys(ASG_TYPE).length) + ' k2">' + Object.keys(ASG_TYPE).map((t) => '<div><div class="xs faint b mb8">' + esc(ASG_TYPE[t].toUpperCase()) + '</div>' + st.map((s, i) => hbar(s.c.name, s.byType[t], 10, SERIES_C[i % 6], fmt.sc(s.byType[t]))).join('') + '</div>').join('') + '</div></div></div>';
    return h + classTable(st);
  },
  // ---- theo lớp
  lop(scope, id) {
    const c = scope.find((x) => x.id === id) || scope[0]; const s = classStats(c);
    let h = '<div class="flex mb16"><span class="b sm">Lớp:</span><select class="in" style="width:auto;min-width:260px" data-c="repPick" data-v="lop">' + opt(scope.map((x) => [x.id, x.name + ' · cấp độ ' + x.level]), c.id) + '</select>' + classTag(c) + '<a class="btn s plain" href="#/lop/' + c.id + '">Mở trang lớp</a></div>';
    h += '<div class="cols c4 k2 mb16">' + statTile('Học sinh', s.n, '', '', 'users') + statTile('Buổi đã học', s.held + '/' + c.nSessions, '', '', 'calendar') + statTile('Chuyên cần TB', fmt.pct(s.rate), '', 'ok', 'check') + statTile('Điểm tổng kết TB', fmt.sc(s.score), 'Báo cáo đúng hạn ' + (s.ended ? Math.round((s.onTime / s.ended) * 100) + '%' : '-'), 'plum', 'star') + '</div>';
    h += '<div class="cols c2 mb16"><div class="box"><div class="box-h"><h2>Chuyên cần từng buổi</h2></div><div class="box-b">' + (s.perSession.length ? lineChart([{ name: c.name, color: '#3346A8', points: s.perSession.map((x) => x.rate) }], s.perSession.map((x) => fmt.dm(x.s.date)), { max: 100, fmt: (v) => v + '%', w: 620 }) : none('Chưa có buổi đã chốt điểm danh.')) + '</div></div>' +
      '<div class="box"><div class="box-h"><h2>Điểm trung bình từng bài</h2></div><div class="box-b">' + (s.asgs.length ? barChart(s.asgs.map((x) => ({ label: x.a.title.replace(/^(Bài tập|Test nhanh|Test): ?/, ''), value: x.avg, color: x.a.type === 'giua_khoa' || x.a.type === 'cuoi_khoa' ? '#D9503B' : '#3346A8' })), { max: 10, fmt: fmt.sc, cut: 14, w: 620 }) + '<div class="legend mt8"><span><i style="background:#3346A8"></i>Bài tập, test</span><span><i style="background:#D9503B"></i>Kiểm tra giữa kỳ, cuối kỳ</span></div>' : none('Chưa có bài.')) + '</div></div></div>';
    const types = Object.keys(ASG_TYPE);
    h += '<div class="box tw"><div class="box-h"><h2>Học sinh</h2><span class="sp"></span><span class="xs faint">Bấm một học sinh để xem báo cáo cá nhân</span></div><table class="t"><tr><th>Học sinh</th><th>Chuyên cần</th>' + types.map((t) => '<th class="n">' + ASG_TYPE[t] + '</th>').join('') + '<th class="n">Tổng kết</th><th>Cần chú ý</th></tr>' +
      s.totals.map((x) => { const st = Q.user(x.uid); const flags = [];
        if (Calc.consecutiveAbsent(st.id, c.id) >= Q.param('vangLienTiep')) flags.push(tag('Vắng liên tiếp', 'bad'));
        if (x.g.total != null && x.g.total < Q.param('diemThap')) flags.push(tag('Điểm thấp', 'bad'));
        if (x.a.rate != null && x.a.rate < 75) flags.push(tag('Chuyên cần thấp', 'warn'));
        return '<tr class="go" data-h="#/bao-cao/hoc-sinh/' + st.id + '"><td><div class="flex">' + av(st, 28) + esc(st.name) + '</div></td><td style="min-width:120px"><div class="xs b">' + fmt.pct(x.a.rate) + '</div>' + miniBar(x.a.rate, toneRate(x.a.rate)) + '</td>' + types.map((t) => '<td class="n">' + fmt.sc(x.g.avg[t]) + '</td>').join('') + '<td class="n b">' + fmt.sc(x.g.total) + '</td><td>' + flags.join(' ') + '</td></tr>'; }).join('') + '</table></div>';
    return h;
  },
  // ---- theo học sinh
  'hoc-sinh'(scope, id, u) {
    const ids = [...new Set(scope.flatMap((c) => c.members.map((m) => m.uid)))]; const studs = ids.map(Q.user).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    const st = studs.find((x) => x.id === id) || studs.find((x) => x.id === 'u_hsc') || studs[0];
    const cs = scope.filter((c) => c.members.some((m) => m.uid === st.id));
    let h = '<div class="flex mb16"><span class="b sm">Học sinh:</span><select class="in" style="width:auto;min-width:280px" data-c="repPick" data-v="hoc-sinh">' + opt(studs.map((x) => [x.id, x.name + (x.code ? ' · ' + x.code : '')]), st.id) + '</select><a class="btn s plain" href="#/hoc-sinh/' + st.id + '">Hồ sơ học tập đầy đủ</a></div>';
    h += '<div class="box mb16 box-b"><div class="person">' + av(st, 52) + '<div class="grow"><b style="font-size:18px">' + esc(st.name) + '</b><span class="sm faint">' + esc(st.code) + ' · ' + (st.phMode ? 'Học sinh (PH)' : 'Phụ huynh: ' + esc(st.parentIds.map((x) => Q.user(x).name).join(', ') || 'chưa liên kết')) + '</span></div><div class="flex">' + cs.map((c) => tag(c.name, 'ai')).join('') + '</div></div></div>';
    cs.forEach((c) => {
      const a = Calc.attendanceOf(st.id, c.id); const g = Calc.grades(st.id, c.id); const cls = classStats(c);
      const ss = Q.sessionsOf(c.id).filter((s) => s.attendance.closed && s.status !== 'huy' && Q.rosterOf(s).some((x) => x.id === st.id));
      const asg = cls.asgs.map((x) => { const sub = Q.subOf(x.a.id, st.id); return { a: x.a, me: sub && sub.status === 'da_tra' ? Calc.score10(x.a, sub) : null, avg: x.avg, sub }; });
      const colors = { co_mat: '#2B7A4B', di_muon: '#C27A12', vang_cp: '#7A3E8F', vang_kp: '#BF3A2A' };
      h += '<div class="box mb16"><div class="box-h"><h2>' + esc(c.name) + '</h2>' + classTag(c) + '</div><div class="box-b vstack">' +
        '<div class="cols c4 k2">' + statTile('Chuyên cần', fmt.pct(a.rate), a.ok + '/' + a.held + ' buổi · lớp TB ' + fmt.pct(cls.rate), toneRate(a.rate), 'check') + statTile('Vắng', a.kp + a.cp, a.kp + ' không phép, ' + a.cp + ' có phép', a.kp ? 'bad' : '', 'alert') +
        statTile('Điểm tổng kết', fmt.sc(g.total), 'Lớp TB ' + fmt.sc(cls.score), toneScore(g.total), 'star') + statTile('Bài đã nộp', asg.filter((x) => x.sub).length + '/' + asg.length, '', '', 'pen') + '</div>' +
        '<div><div class="xs faint b mb8">ĐIỂM DANH TỪNG BUỔI</div><div class="flex" style="gap:4px">' + ss.map((s) => { const r = s.attendance.records[st.id]; return '<span title="' + esc(fmt.dm(s.date) + ' · ' + s.title + ': ' + (r ? ATT[r.st][0] : '-')) + '" style="width:18px;height:18px;border-radius:5px;background:' + (r ? colors[r.st] : '#E7E0D3') + '"></span>'; }).join('') + '</div>' +
        '<div class="legend mt8">' + Object.keys(ATT).map((k) => '<span><i style="background:' + colors[k] + '"></i>' + ATT[k][0] + '</span>').join('') + '</div></div>' +
        '<div><div class="flex btw"><div class="xs faint b mb8">ĐIỂM TỪNG BÀI SO VỚI TRUNG BÌNH LỚP</div><div class="legend"><span><i style="background:#D9503B"></i>' + esc(st.name) + '</span><span><i style="background:#3346A8"></i>Trung bình lớp</span></div></div>' +
        (asg.length ? lineChart([{ name: st.name, color: '#D9503B', points: asg.map((x) => x.me) }, { name: 'Trung bình lớp', color: '#3346A8', points: asg.map((x) => x.avg) }], asg.map((x, i) => 'Bài ' + (i + 1)), { max: 10, fmt: fmt.sc, h: 200, w: 1140 }) +
          '<div class="tw mt8"><table class="t"><tr><th>#</th><th>Bài</th><th>Trạng thái</th><th class="n">Điểm</th><th class="n">TB lớp</th></tr>' + asg.map((x, i) => '<tr><td class="faint">' + (i + 1) + '</td><td>' + esc(x.a.title) + '</td><td>' + (x.sub ? (x.sub.status === 'da_tra' ? tag('Đã có điểm', 'ok') : tag('Chờ chấm', 'warn')) : new Date(Q.dueOf(x.a, st.id)).getTime() < Date.now() ? tag('Không nộp', 'bad') : tag('Chưa nộp')) + '</td><td class="n b">' + fmt.sc(x.me) + '</td><td class="n">' + fmt.sc(x.avg) + '</td></tr>').join('') + '</table></div>' : none('Chưa có bài.')) + '</div></div></div>';
    });
    return h;
  },
};
onChg('repPick', (el) => nav('#/bao-cao/' + el.dataset.v + '/' + el.value));
on('repCsv', (el) => {
  const u = App.me(); const scope = repScope(u); const v = el.dataset.v; let rows;
  if (v === 'hoc-sinh') {
    const sid = el.dataset.id || 'u_hsc'; const st = Q.user(sid) || Q.user('u_hsc');
    rows = [['Lớp', 'Bài', 'Điểm (thang 10)']];
    scope.filter((c) => c.members.some((m) => m.uid === st.id)).forEach((c) => Store.db.assignments.filter((a) => a.courseId === c.id && a.status === 'da_giao').forEach((a) => { const s = Q.subOf(a.id, st.id); rows.push([c.name, a.title, s && s.status === 'da_tra' ? Calc.score10(a, s) : '']); }));
  } else if (v === 'lop') {
    const c = scope.find((x) => x.id === el.dataset.id) || scope[0]; const types = Object.keys(ASG_TYPE);
    rows = [['Học sinh', 'Chuyên cần %', ...types.map((t) => ASG_TYPE[t]), 'Tổng kết']];
    classStats(c).totals.forEach((x) => rows.push([Q.user(x.uid).name, x.a.rate, ...types.map((t) => x.g.avg[t]), x.g.total]));
  } else {
    rows = [['Lớp', 'Cấp độ', 'Chương trình', 'Học sinh', 'Chuyên cần TB %', 'Điểm TB']];
    scope.map(classStats).forEach((s) => rows.push([s.c.name, s.c.level, Q.program(s.c.programId).name, s.n, s.rate, s.score]));
  }
  saveText('bao_cao_' + v + '.csv', toCsv(rows));
});
