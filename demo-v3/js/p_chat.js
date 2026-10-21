'use strict';
/* Hỏi đáp kiểu Messenger giữa học sinh và giáo viên, trợ giảng phụ trách lớp.
   Mỗi bài test là một cuộc trò chuyện riêng của từng học sinh (không chia theo câu). Học sinh mở cuộc trò chuyện
   từ bài (Kết quả, Làm bài) hoặc nút "Tin nhắn mới"; đường dẫn #/hoi-dap/bai-<mã bài> mở khung chat trống, tin đầu tiên tạo cuộc trò chuyện. */

const myThreads = (u) => (P.isStaff(u) ? Inbox.threads(u) : Store.db.qna.filter((q) => q.studentId === u.id));
const chatBadge = (u) => (P.isStaff(u) ? Inbox.questions(u).length : myThreads(u).filter((q) => Thread.unread(q, u.id)).length);
const threadOf = (aid, sid) => Store.db.qna.find((q) => q.assignmentId === aid && q.studentId === sid);
const chatLink = (aid, sid) => { const q = threadOf(aid, sid); return '#/hoi-dap/' + (q ? q.id : 'bai-' + aid); };
let ChatF = 'all'; let ChatQ = '';
on('chatF', (el) => { ChatF = el.dataset.v; App.render(); });
onChg('chatQ', (el) => { ChatQ = el.value; const q = ChatQ.trim().toLowerCase(); document.querySelectorAll('.mx-item').forEach((x) => { x.style.display = x.dataset.s.includes(q) ? '' : 'none'; }); });

page('/hoi-dap/:id?', { nav: 'hd2', can: (u) => P.isStaff(u) || u.role === 'hs' }, (p, u) => {
  const staff = P.isStaff(u);
  // cuộc trò chuyện mới của học sinh với một bài
  let draft = null;
  if (!staff && p.id && p.id.startsWith('bai-')) {
    const a = Q.asg(p.id.slice(4)); const old = a && threadOf(a.id, u.id);
    if (old) { location.replace('#/hoi-dap/' + old.id); return ''; }
    if (a && Learner.asg(u.id).some((x) => x.id === a.id)) draft = { id: null, assignmentId: a.id, studentId: u.id, messages: [], readAt: {} };
  }
  if (p.id && !draft && myThreads(u).some((q) => q.id === p.id)) A.markRead(u, p.id); // đọc trước khi lấy danh sách để chấm tin mới tắt ngay
  let L = myThreads(u).slice().sort((a, b) => (staff ? (Thread.waiting(b) ? 1 : 0) - (Thread.waiting(a) ? 1 : 0) : 0) || (new Date(Thread.last(b).at) - new Date(Thread.last(a).at)));
  if (staff && ChatF === 'cho') L = L.filter(Thread.waiting);
  const cur = draft || (p.id && myThreads(u).find((q) => q.id === p.id));
  let h = '<div class="mx ' + (cur ? 'has-sel' : '') + '"><aside class="mx-list"><div class="mx-list-h"><div class="flex btw"><h1 style="font-size:24px">Đoạn chat</h1>' +
    (staff ? '' : '<button class="btn s soft icon" data-a="chatNew" title="Tin nhắn mới" aria-label="Tin nhắn mới">' + ic('pen', 17) + '</button>') + '</div>' +
    '<div class="mx-search">' + ic('search', 16) + '<input placeholder="Tìm theo tên, bài" data-i="chatQ" value="' + esc(ChatQ) + '"></div>' +
    (staff ? '<div class="mx-chips"><button data-a="chatF" data-v="all" class="' + (ChatF === 'all' ? 'on' : '') + '">Tất cả</button><button data-a="chatF" data-v="cho" class="' + (ChatF === 'cho' ? 'on' : '') + '">Chờ trả lời ' + Inbox.questions(u).length + '</button></div>' : '') + '</div>' +
    '<div class="mx-items">' + (draft ? threadItem(draft, u, cur) : '') + (L.length ? L.map((q) => threadItem(q, u, cur)).join('') : draft ? '' : none(staff ? 'Không có cuộc trò chuyện.' : 'Chưa có tin nhắn. Bấm biểu tượng bút để nhắn giáo viên về một bài test.', 'chat')) + '</div></aside>' +
    '<section class="mx-pane">' + (cur ? chatPane(cur, u) : '<div class="mx-empty">' + ic('chat', 54, 1.2) + '<div class="b mt8">Chọn một đoạn chat</div><div class="sm faint">Mỗi bài test là một đoạn chat với giáo viên, trợ giảng của lớp.</div></div>') + '</section></div>';
  if (cur) later(() => { const m = document.getElementById('msgs'); if (m) m.scrollTop = m.scrollHeight; if (draft) { const t = document.querySelector('.mx-in textarea'); if (t) t.focus(); } });
  return h;
});
// người hiển thị ở phía bên kia: nhân sự thấy học sinh; học sinh thấy người trả lời gần nhất hoặc giáo viên chính
const otherSide = (q, u) => { const a = Q.asg(q.assignmentId); return P.isStaff(u) ? Q.user(q.studentId) : Q.user((q.messages.slice().reverse().find((m) => m.by !== q.studentId) || {}).by || Q.course(a.courseId).teacherId); };
function threadItem(q, u, cur) {
  const a = Q.asg(q.assignmentId); const st = Q.user(q.studentId); const last = q.messages.length ? Thread.last(q) : null; const c = Q.course(a.courseId);
  const staff = P.isStaff(u); const who = otherSide(q, u);
  const unread = q.id && Thread.unread(q, u.id); const wait = staff && q.id && Thread.waiting(q);
  const title = staff ? st.name : a.title;
  const prev = last ? (last.by === u.id ? 'Bạn: ' : staff ? '' : Q.user(last.by).name.split(' ').pop() + ': ') + last.text : 'Tin nhắn mới';
  return '<a class="mx-item ' + (cur && cur.id === q.id && cur.assignmentId === q.assignmentId ? 'on' : '') + (unread ? ' unread' : '') + '" href="#/hoi-dap/' + (q.id || 'bai-' + a.id) + '" data-s="' + esc((title + ' ' + a.title + ' ' + c.name).toLowerCase()) + '">' + av(who, 48) +
    '<div class="grow"><div class="mx-t">' + esc(title) + '</div><div class="mx-sub">' + esc(staff ? a.title + ' · ' + c.name : c.name + ' · ' + ASG_TYPE[a.type]) + '</div>' +
    '<div class="mx-prev"><span>' + esc(prev) + '</span>' + (last ? '<span class="mx-when">· ' + fmt.ago(last.at).replace(' trước', '') + '</span>' : '') + '</div></div>' +
    (wait ? '<span class="mx-dot warn" title="Chờ trả lời"></span>' : unread ? '<span class="mx-dot" title="Tin mới"></span>' : '') + '</a>';
}
function chatPane(q, u) {
  const a = Q.asg(q.assignmentId); const sub = Q.subOf(a.id, q.studentId); const st = Q.user(q.studentId); const c = Q.course(a.courseId);
  const staff = P.isStaff(u); const who = otherSide(q, u);
  const staffIn = [...new Set(q.messages.filter((m) => m.by !== q.studentId).map((m) => m.by))].map((x) => Q.user(x).name);
  const scoreTxt = sub ? (sub.score != null && (staff || sub.status === 'da_tra') ? 'Điểm ' + fmt.sc(sub.score) + '/10' : 'Chưa có điểm') : 'Chưa nộp';
  let h = '<div class="mx-h"><a class="btn s plain icon back-m" href="#/hoi-dap" aria-label="Đoạn chat">' + ic('back', 18) + '</a>' + av(who, 40) +
    '<div class="grow" style="min-width:0"><div class="b mx-name">' + esc(staff ? st.name : a.title) + '</div><div class="xs faint mx-name">' + esc(staff ? a.title + ' · ' + c.name : 'Giáo viên, trợ giảng lớp ' + c.name + (staffIn.length ? ' · ' + staffIn.join(', ') : '')) + '</div></div>' +
    (staff ? (q.id ? (Thread.waiting(q) ? tag('Chờ trả lời', 'warn') : tag('Đã trả lời', 'ok')) : '') + (sub ? '<a class="btn s plain" href="#/bai/' + a.id + '/cham/' + sub.id + '" title="Điểm">' + ic('star', 16) + '</a>' : '') + '<a class="btn s plain" href="#/bai/' + a.id + '/form" title="Xem bài">' + ic('eye', 16) + '</a>'
      : '<a class="btn s plain" href="' + (sub ? '#/bai-lam/' + a.id : '#/lam-bai/' + a.id) + '" title="Mở bài">' + ic('pen', 16) + '</a>') + '</div>' +
    '<div class="mx-pin">' + ic('pen', 14) + '<span class="grow">' + esc(ASG_TYPE[a.type] + ': ' + a.title) + '</span>' + tag(scoreTxt, 'line') + '</div><div class="mx-msgs" id="msgs">';
  if (!q.messages.length) h += '<div class="mx-intro">' + av(who, 72) + '<div class="b mt8">' + esc(a.title) + '</div><div class="sm faint">Nhắn giáo viên, trợ giảng lớp ' + esc(c.name) + ' về bài test này. Mọi câu hỏi về bài nằm trong một đoạn chat.</div></div>';
  // nhóm tin liên tiếp của cùng người (cách nhau dưới 5 phút); mốc giờ khi cách nhau trên 30 phút
  const M = q.messages; let prevAt = 0;
  M.forEach((m, i) => {
    const t = new Date(m.at).getTime(); const p = M[i - 1]; const n = M[i + 1];
    if (!p || t - prevAt > 30 * 60e3) h += '<div class="mx-time">' + (ymd(new Date(m.at)) === todayStr() ? '' : fmt.rel(ymd(new Date(m.at))) + ' ') + fmt.t(m.at) + '</div>';
    const first = !p || p.by !== m.by || t - new Date(p.at).getTime() > 5 * 60e3 || t - prevAt > 30 * 60e3;
    const last = !n || n.by !== m.by || new Date(n.at).getTime() - t > 5 * 60e3 || new Date(n.at).getTime() - t > 30 * 60e3;
    const mine = m.by === u.id; const sender = Q.user(m.by);
    const showName = !mine && first && (staff ? m.by !== q.studentId : true);
    h += '<div class="mx-row ' + (mine ? 'me' : '') + (first ? ' first' : '') + (last ? ' last' : '') + '">' + (mine ? '' : '<span class="mx-av">' + (last ? av(sender, 28) : '') + '</span>') +
      '<div class="mx-col">' + (showName ? '<div class="mx-sender">' + esc(sender.name) + '</div>' : '') + '<div class="mx-b" title="' + esc(fmt.dt(m.at)) + '">' + esc(m.text) + '</div></div></div>';
    prevAt = t;
  });
  // "Đã xem" dưới tin cuối của mình khi bên kia đã đọc
  const lastMine = M.length && M[M.length - 1].by === u.id ? M[M.length - 1] : null;
  if (lastMine && q.readAt) { const seen = Object.entries(q.readAt).some(([k, v]) => k !== u.id && new Date(v) >= new Date(lastMine.at)); h += '<div class="mx-seen">' + (seen ? 'Đã xem' : 'Đã gửi') + '</div>'; }
  h += '</div><form class="mx-in" data-f="chatSend" data-id="' + (q.id || '') + '" data-aid="' + a.id + '"><textarea name="t" rows="1" data-keep="chat-' + (q.id || 'bai-' + a.id) + '" data-enter placeholder="Aa"></textarea><button class="mx-send" aria-label="Gửi">' + ic('send', 20) + '</button></form>';
  return h;
}
onSubmit('chatSend', (d, f) => {
  const t = (d.t || '').trim(); if (!t) return;
  f.querySelector('textarea').value = '';
  if (f.dataset.id) { A.reply(App.me(), f.dataset.id, t); App.render(); }
  else { const r = A.ask(App.me(), f.dataset.aid, t); nav('#/hoi-dap/' + r.id); }
  setTimeout(() => { const ta = document.querySelector('.mx-in textarea'); if (ta) ta.focus(); }, 30);
});
// học sinh chọn bài test để mở đoạn chat
on('chatNew', () => {
  const u = App.me(); const L = Learner.asg(u.id);
  if (!L.length) { toast('Chưa có bài test nào', 'info'); return; }
  panel({ title: 'Tin nhắn mới', desc: 'Chọn bài test muốn hỏi. Mỗi bài là một đoạn chat với giáo viên, trợ giảng của lớp.', submit: 'Mở đoạn chat',
    body: fld('Bài test', '<select class="in" name="aid">' + opt(L.map((a) => [a.id, a.title + ' · ' + Q.course(a.courseId).name + (threadOf(a.id, u.id) ? ' (đã có đoạn chat)' : '')])) + '</select>'),
    onSubmit: (d) => { nav(chatLink(d.aid, u.id)); } });
});
// Enter gửi tin, Shift + Enter xuống dòng; ô nhập tự giãn
document.addEventListener('keydown', (e) => { const t = e.target; if (t.matches && t.matches('textarea[data-enter]') && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); t.form.requestSubmit(); } });
document.addEventListener('input', (e) => { const t = e.target; if (t.matches && t.matches('textarea[data-enter]')) { t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight) + 'px'; } });
