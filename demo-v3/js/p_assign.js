'use strict';
/* Bài tập, kiểm tra phía nhân sự. Bài không soạn trong web: người phụ trách dán đường dẫn Google Form, hệ thống nhúng form
   vào trang làm bài của học sinh. Điểm: Google Form tự chấm (form mô phỏng của dữ liệu mẫu) hoặc người phụ trách nhập tay,
   dán từ bảng phản hồi của form. Bản đầy đủ đồng bộ điểm từ Google Sheet phản hồi (xem tài liệu phương án cơ sở dữ liệu). */

const subTag = (a, s) => {
  if (!s) return new Date(a.dueAt).getTime() < Date.now() ? tag('Quá hạn, chưa nộp', 'bad') : tag('Chưa nộp');
  if (s.status === 'da_tra') return tag('Đã trả kết quả', 'ok');
  return s.score == null ? tag('Chờ nhập điểm', 'warn') : tag('Có điểm, chờ trả', 'ai');
};

// ------------------------------------------------------------------ khung Google Form
// Form thật: nhúng bằng iframe (cần mạng, học sinh có thể phải đăng nhập Google nếu form giới hạn người làm).
// Form mô phỏng (dữ liệu mẫu, đường dẫn DEMO-...): vẽ tại chỗ trong iframe cách ly, không tải gì từ Google.
function formFrame(a, u, interactive) {
  const fi = FormLink.parse(a.formUrl);
  if (!fi.ok) return '<div class="form-frame empty">' + none('Chưa có đường dẫn Google Form hợp lệ.', 'doc') + '</div>';
  if (fi.demo) return '<div class="form-frame"><iframe class="gf" sandbox="allow-scripts allow-forms" title="Google Form mô phỏng: ' + esc(a.title) + '" data-aid="' + esc(a.id || '') + '" srcdoc="' + esc(mockFormDoc(a, fi.demo, interactive)) + '"></iframe></div>';
  return '<div class="form-frame"><iframe class="gf" src="' + esc(FormLink.embed(a, u)) + '" title="Google Form: ' + esc(a.title) + '" loading="lazy" allow="clipboard-write"></iframe></div>';
}
function mockFormDoc(a, key, interactive) {
  const qs = QSET[key].map((q) => ({ k: q.kind, t: q.text, o: q.options, p: q.points }));
  // phông Latin đứng trước để dấu tiếng Việt hiển thị đúng; chữ Nhật rơi xuống phông Nhật
  const ff = '"Segoe UI",Roboto,Arial,"Yu Gothic","Meiryo","Noto Sans JP",sans-serif';
  const css = 'body{margin:0;background:#F0EBF8;font:14px/1.5 ' + ff + ';color:#202124}.w{max-width:680px;margin:14px auto;padding:0 12px}' +
    '.c{background:#fff;border:1px solid #DADCE0;border-radius:8px;padding:20px 24px;margin-bottom:12px}.hd{border-top:10px solid #673AB7}h1{font-size:26px;font-weight:400;margin:0 0 6px}' +
    '.q{font-size:16px;margin-bottom:12px}.r{color:#D93025}.pt{float:right;color:#5F6368;font-size:13px}' +
    'label{display:flex;gap:10px;align-items:center;padding:5px 0}input[type=text],textarea{width:100%;box-sizing:border-box;border:0;border-bottom:1px solid #DADCE0;padding:6px 0;font:15px ' + ff + ';outline:0}' +
    'input[type=text]:focus,textarea:focus{border-bottom:2px solid #673AB7}select{font:inherit;padding:6px 8px;border:1px solid #DADCE0;border-radius:4px}' +
    'button{background:#673AB7;color:#fff;border:0;border-radius:4px;padding:9px 24px;font:500 14px Roboto,Arial,sans-serif;cursor:pointer}button[disabled]{background:#B9A8D9;cursor:default}' +
    '.ft{font-size:12px;color:#5F6368;text-align:center;margin:8px 0 18px}.ok{font-size:15px}';
  const js = 'var Q=' + JSON.stringify(qs) + ',AID=' + JSON.stringify(a.id || '') + ',LIVE=' + (interactive ? 'true' : 'false') + ';' +
    'document.getElementById("f").onsubmit=function(e){e.preventDefault();if(!LIVE)return;var f=e.target,ans=[];' +
    'Q.forEach(function(q,i){var n="q"+i;if(q.k==="cb"){ans.push([].slice.call(f.querySelectorAll("[name="+n+"]:checked")).map(function(x){return +x.value}))}' +
    'else if(q.k==="mc"){var c=f.querySelector("[name="+n+"]:checked");ans.push(c?+c.value:null)}else if(q.k==="dd"){var s=f.elements[n].value;ans.push(s===""?null:+s)}else ans.push(f.elements[n].value.trim())});' +
    'parent.postMessage({type:"hoan-mock-form",aid:AID,answers:ans},"*");' +
    'document.getElementById("f").innerHTML="<div class=c><h1 style=font-size:22px>"+document.title+"</h1><div class=ok>Câu trả lời của bạn đã được ghi lại.</div></div>"};';
  const qHtml = qs.map((q, i) => {
    const n = 'q' + i; let b = '';
    if (q.k === 'mc') b = q.o.map((o, j) => '<label><input type="radio" name="' + n + '" value="' + j + '">' + esc(o) + '</label>').join('');
    else if (q.k === 'cb') b = q.o.map((o, j) => '<label><input type="checkbox" name="' + n + '" value="' + j + '">' + esc(o) + '</label>').join('');
    else if (q.k === 'dd') b = '<select name="' + n + '"><option value="">Chọn</option>' + q.o.map((o, j) => '<option value="' + j + '">' + esc(o) + '</option>').join('') + '</select>';
    else if (q.k === 'short') b = '<input type="text" name="' + n + '" placeholder="Câu trả lời của bạn">';
    else b = '<textarea name="' + n + '" rows="3" placeholder="Câu trả lời của bạn"></textarea>';
    return '<div class="c"><div class="q"><span class="pt">' + q.p + ' điểm</span>' + (i + 1) + '. ' + esc(q.t) + ' <span class="r">*</span></div>' + b + '</div>';
  }).join('');
  return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' + esc(a.title || 'Bài chưa đặt tên') + '</title><style>' + css + '</style></head><body><div class="w">' +
    '<div class="c hd"><h1>' + esc(a.title || 'Bài chưa đặt tên') + '</h1>' + (a.desc ? '<div>' + esc(a.desc) + '</div>' : '') + '<div class="r" style="margin-top:10px;font-size:13px">* Biểu thị câu hỏi bắt buộc</div></div>' +
    '<form id="f">' + qHtml + '<div style="display:flex;justify-content:space-between;align-items:center"><button' + (interactive ? '' : ' disabled title="Xem trước: không nộp được"') + '>Gửi</button><span style="color:#673AB7;font-size:13px">' + (interactive ? 'Xóa hết câu trả lời' : 'Xem trước, không nộp được') + '</span></div></form>' +
    '<div class="ft">Google Form mô phỏng của bản demo: chạy trong trình duyệt, không gửi dữ liệu ra ngoài.</div></div><script>' + js + '<\/script></body></html>';
}
const formHelp = '<div class="xs faint">Trong Google Form bấm <b>Gửi</b>, chọn biểu tượng liên kết, <b>Sao chép</b> rồi dán vào đây. Muốn Google tự chấm: Cài đặt, bật <b>Đặt làm bài kiểm tra</b>.</div>';

// ------------------------------------------------------------------ giao bài từ Google Form
let Draft = null;
page('/bai-moi/:cid/:sid?', { nav: 'lop', live: false, can: (u, p) => P.operate(u, Q.course(p.cid)) }, (p, u) => {
  const key = 'new:' + p.cid + ':' + (p.sid || '');
  if (!Draft || Draft.key !== key) { const n = new Date(); Draft = { key, a: { id: null, courseId: p.cid, sessionId: p.sid || '', type: 'bai_tap', title: '', desc: '', timeLimit: 0, allowLate: true, review: false, status: 'nhap', openAt: localInput(n), dueAt: ymd(addDays(n, 3)) + 'T23:59', formUrl: '', codeEntry: '' } }; }
  return builder(u, 'Giao bài từ Google Form');
});
page('/bai/:id/sua', { nav: 'lop', live: false, can: (u, p) => { const a = Q.asg(p.id); return !!a && P.operate(u, Q.course(a.courseId)); } }, (p, u) => {
  if (!Draft || Draft.key !== 'edit:' + p.id) Draft = { key: 'edit:' + p.id, a: JSON.parse(JSON.stringify(Q.asg(p.id))) };
  return builder(u, 'Sửa bài');
});
function urlNote(raw) {
  if (!String(raw || '').trim()) return '<span class="faint">Dán đường dẫn để xem trước bài ngay bên trái.</span>';
  const fi = FormLink.parse(raw);
  if (!fi.ok) return '<span class="bad-t">' + esc(fi.msg) + '</span>';
  if (fi.demo) return '<span class="ok-t">' + ic('check', 14) + ' Form mô phỏng của bản demo.</span>';
  return '<span class="ok-t">' + ic('check', 14) + ' Đường dẫn hợp lệ.</span>' + (fi.edit ? ' <span class="warn-t">Bạn dán link chỉnh sửa; hệ thống đã đổi sang link làm bài.</span>' : '') + (fi.short ? ' <span class="faint">Link rút gọn forms.gle hiển thị được nhưng không tự điền mã học viên.</span>' : '');
}
function builder(u, title) {
  const a = Draft.a; const c = Q.course(a.courseId); const subs = a.id ? Store.db.submissions.filter((s) => s.assignmentId === a.id).length : 0;
  let h = head(title, { eyebrow: '<a href="#/lop/' + c.id + '/bai">' + esc(c.name) + '</a>', desc: 'Không soạn câu hỏi trên web: tạo bài trên Google Form, dán đường dẫn vào đây, học sinh làm bài ngay trong hệ thống.',
    acts: '<button class="btn" data-a="bSave" data-g="0">Lưu nháp</button><button class="btn primary" data-a="bSave" data-g="1">' + ic('send', 16) + (a.status === 'da_giao' ? 'Lưu bài đã giao' : 'Giao bài') + '</button>' });
  if (subs) h += '<div class="note warn mb16">Bài đã có ' + subs + ' bài nộp. Đổi sang form khác có thể làm lệch kết quả đã nhập.</div>';
  h += '<div class="cols c-main"><div><div class="box"><div class="box-h">' + ic('eye', 18) + '<h2 class="grow">Học sinh sẽ thấy</h2><span class="xs faint">Xem trước, không nộp được</span></div><div class="box-b" id="gfPrev">' + (FormLink.parse(a.formUrl).ok ? formFrame(a, u, false) : '<div class="form-frame empty">' + none('Dán đường dẫn Google Form ở khung bên phải để xem trước.', 'doc') + '</div>') + '</div></div></div>' +
    '<div><div class="box" style="position:sticky;top:var(--stick)"><div class="box-h"><h2>Thiết lập bài</h2></div><div class="box-b vstack">' +
    fld('Đường dẫn Google Form', '<input class="in" name="formUrl" data-i="bUrl" value="' + esc(a.formUrl) + '" placeholder="https://forms.gle/... hoặc https://docs.google.com/forms/d/e/.../viewform"><div class="xs mt4" id="gfMsg">' + urlNote(a.formUrl) + '</div>' + formHelp, 'bắt buộc') +
    '<div class="flex xs"><span class="faint">Thử nhanh với form mẫu:</span>' + [['katakana', 'Katakana'], ['so_sanh', 'So sánh'], ['giua_khoa_n5', 'Giữa kỳ N5']].map(([k, t]) => '<button type="button" class="btn s plain" data-a="bDemo" data-k="' + k + '">' + t + '</button>').join('') + '</div>' +
    fld('Loại bài', '<select class="in" name="type" data-c="bInfo">' + opt(Object.entries(ASG_TYPE), a.type) + '</select>') +
    fld('Tiêu đề', '<input class="in" name="title" data-i="bInfo" value="' + esc(a.title) + '" placeholder="vd: Bài tập: So sánh">') +
    fld('Hướng dẫn', '<textarea class="in" name="desc" rows="2" data-i="bInfo">' + esc(a.desc) + '</textarea>') +
    fld('Gắn với buổi', '<select class="in" name="sessionId" data-c="bInfo"><option value="">Không gắn buổi</option>' + opt(Q.sessionsOf(c.id).map((s) => [s.id, 'Buổi ' + (s.idx + 1) + ' · ' + fmt.dm(s.date) + ' · ' + s.title]), a.sessionId) + '</select>') +
    '<div class="grid-f">' + fld('Mở lúc', '<input class="in" type="datetime-local" name="openAt" data-c="bInfo" value="' + esc(a.openAt) + '">') + fld('Hạn nộp', '<input class="in" type="datetime-local" name="dueAt" data-c="bInfo" value="' + esc(a.dueAt) + '">') + '</div>' +
    fld('Thời gian làm bài (phút)', '<input class="in" type="number" min="0" name="timeLimit" data-i="bInfo" value="' + (a.timeLimit || 0) + '">', '0 = không ghi; chỉ để báo cho học sinh') +
    fld('Tự điền mã học viên', '<input class="in" name="codeEntry" data-i="bInfo" value="' + esc(a.codeEntry || '') + '" placeholder="entry.123456789">', 'không bắt buộc') +
    '<div class="xs faint" style="margin-top:6px">Nếu form có câu "Mã học viên": trong Google Form chọn Nhận đường liên kết điền sẵn, lấy mã entry của câu đó. Hệ thống tự điền mã của từng học sinh để khớp điểm.</div>' +
    '<label class="ck"><input type="checkbox" name="allowLate" data-c="bInfo"' + (a.allowLate ? ' checked' : '') + '>Cho phép nộp muộn</label><label class="ck"><input type="checkbox" name="review" data-c="bInfo"' + (a.review ? ' checked' : '') + '>Công bố điểm sau khi xem xét</label></div></div></div></div>';
  return h;
}
let UrlT = null;
onChg('bUrl', (el) => {
  Draft.a.formUrl = el.value;
  const m = document.getElementById('gfMsg'); if (m) m.innerHTML = urlNote(el.value);
  clearTimeout(UrlT);
  UrlT = setTimeout(() => { const box = document.getElementById('gfPrev'); if (box) box.innerHTML = FormLink.parse(Draft.a.formUrl).ok ? formFrame(Draft.a, App.me(), false) : '<div class="form-frame empty">' + none('Dán đường dẫn Google Form ở khung bên phải để xem trước.', 'doc') + '</div>'; }, 350);
});
on('bDemo', (el) => { Draft.a.formUrl = demoFormUrl(el.dataset.k); if (!Draft.a.title) Draft.a.title = { katakana: 'Test nhanh: Katakana', so_sanh: 'Bài tập: So sánh hơn, nhất', giua_khoa_n5: 'Kiểm tra giữa kỳ' }[el.dataset.k]; App.render(); });
onChg('bInfo', (el) => { const a = Draft.a; const v = el.type === 'checkbox' ? el.checked : el.value; a[el.name] = el.name === 'timeLimit' ? Number(v) || 0 : v; if (el.name === 'type' && (v === 'giua_khoa' || v === 'cuoi_khoa')) { a.timeLimit = a.timeLimit || 45; a.review = true; a.allowLate = false; App.render(); } if (el.name === 'title' || el.name === 'desc') { clearTimeout(UrlT); UrlT = setTimeout(() => { const box = document.getElementById('gfPrev'); if (box && FormLink.demoKey(a.formUrl)) box.innerHTML = formFrame(a, App.me(), false); }, 600); } });
on('bSave', (el) => { const g = el.dataset.g === '1'; const a = Object.assign({}, Draft.a, { title: Draft.a.title.trim(), codeEntry: (Draft.a.codeEntry || '').trim() }); const r = A.saveAssignment(App.me(), a, g); if (!done(r)) return; toast(g ? 'Đã giao bài. Học sinh thấy bài ngay.' : 'Đã lưu nháp', 'ok'); Draft = null; nav('#/bai/' + r.id); });

// ------------------------------------------------------------------ trang bài phía nhân sự
const canSeeAsg = (u, a) => !!a && P.isStaff(u) && (P.assigned(u, Q.course(a.courseId)) || P.adm(u, 'ADM-11'));
page('/bai/:id/:tab?', { nav: 'lop', can: (u, p) => (P.isStaff(u) ? canSeeAsg(u, Q.asg(p.id)) : u.role === 'hs' && !!Q.asg(p.id)) }, (p, u) => {
  const a = Q.asg(p.id);
  if (!P.isStaff(u)) { location.replace('#/lam-bai/' + a.id); return ''; }
  const c = Q.course(a.courseId); const op = P.operate(u, c); const R = Q.activeMembers(c).map((m) => Q.user(m.uid));
  const subs = Store.db.submissions.filter((s) => s.assignmentId === a.id); const ready = subs.filter((s) => s.status !== 'da_tra' && s.score != null).length;
  const tab = ['tt', 'diem', 'form'].includes(p.tab) ? p.tab : 'tt'; const fi = FormLink.parse(a.formUrl);
  const acts = [];
  if (op) acts.push('<a class="btn" href="#/bai/' + a.id + '/sua">' + ic('pen', 16) + 'Sửa</a>');
  if (op && a.status === 'nhap') acts.push('<button class="btn primary" data-a="giao" data-id="' + a.id + '">' + ic('send', 16) + 'Giao bài</button>');
  if (op && ready) acts.push('<button class="btn go" data-a="releaseAll" data-id="' + a.id + '">' + ic('send', 16) + 'Trả kết quả ' + ready + ' bài</button>');
  if (subs.length) acts.push('<button class="btn" data-a="asgCsv" data-id="' + a.id + '">' + ic('down', 16) + 'CSV</button>');
  let h = head(a.title, { eyebrow: '<a href="#/lop/' + c.id + '/bai">' + esc(c.name) + '</a> · ' + esc(ASG_TYPE[a.type]), desc: [a.status === 'nhap' ? 'Nháp' : fmt.due(a.dueAt), a.timeLimit ? a.timeLimit + ' phút' : '', a.allowLate ? 'Cho nộp muộn' : 'Không nhận nộp muộn', a.review ? 'Công bố điểm sau khi xem xét' : 'Có điểm là trả ngay', fi.demo ? 'Google Form mô phỏng' : 'Google Form'].filter(Boolean).map((x) => tag(x, 'line')).join(' '), acts: acts.join('') });
  const waiting = subs.filter((s) => s.score == null).length;
  h += '<div class="tabs">' + [['tt', 'Tóm tắt'], ['diem', 'Nhập điểm' + (waiting ? ' (' + waiting + ' chờ)' : '')], ['form', 'Xem bài (Google Form)']].map(([k, t]) => '<a href="#/bai/' + a.id + '/' + k + '" class="' + (k === tab ? 'on' : '') + '">' + t + '</a>').join('') + '</div>';
  if (tab === 'form') return h + '<div class="cols c-main"><div class="box"><div class="box-b">' + formFrame(a, u, false) + '</div></div><div class="box"><div class="box-h"><h2>Đường dẫn</h2></div><div class="box-b vstack"><div class="ans sm" style="word-break:break-all">' + esc(a.formUrl) + '</div>' +
    (fi.demo ? '<div class="note sm">Form mô phỏng của dữ liệu mẫu. Bấm Sửa, dán link Google Form thật để thay.</div>' : '<a class="btn" href="' + esc(fi.url || a.formUrl) + '" target="_blank" rel="noopener">' + ic('link', 16) + 'Mở form trong tab mới</a>') +
    '<div class="xs faint">Sửa câu hỏi, đáp án ngay trong Google Form: trang làm bài tự hiện bản mới vì là form nhúng.</div>' + (a.codeEntry ? '<div class="xs">Tự điền mã học viên vào ô <b>' + esc(a.codeEntry) + '</b>.</div>' : '') + '</div></div></div>';
  if (tab === 'diem') return h + scoreEditor(a, R, subs, op);
  const scores = subs.filter((s) => s.score != null).map((s) => Number(s.score));
  h += '<div class="cols c4 k2 mb16">' + statTile('Đã nộp', subs.length + '/' + R.length, subs.filter((s) => s.late).length + ' nộp muộn', '', 'users') + statTile('Chờ nhập điểm', waiting, '', waiting ? 'warn' : 'ok', 'pen') + statTile('Đã trả kết quả', subs.filter((s) => s.status === 'da_tra').length, '', 'ok', 'send') + statTile('Điểm TB (thang 10)', fmt.sc(avgOf(scores)), scores.length ? 'Thấp nhất ' + fmt.sc(Math.min(...scores)) + ', cao nhất ' + fmt.sc(Math.max(...scores)) : '', 'plum', 'star') + '</div>';
  if (!subs.length) return h + '<div class="box">' + none(a.status === 'nhap' ? 'Bài đang là nháp. Bấm Giao bài để học sinh làm.' : 'Chưa có bài nộp.', 'pen') + '</div>';
  return h + '<div class="cols c2"><div class="box"><div class="box-h"><h2>Phân bố điểm</h2></div><div class="box-b">' + (scores.length ? distChart(scores) : none('Chưa có điểm.')) + '</div></div>' +
    '<div class="box"><div class="box-h"><h2>Học sinh</h2><span class="sp"></span><a class="btn s soft" href="#/bai/' + a.id + '/diem">Nhập điểm</a></div><div class="box-b tight rows">' + R.map((st) => { const s = Q.subOf(a.id, st.id);
      return '<div class="r' + (s ? ' link" data-h="#/bai/' + a.id + '/cham/' + s.id : '') + '">' + av(st, 30) + '<div class="grow"><div class="rt">' + esc(st.name) + '</div><div class="rd">' + (s ? 'Nộp ' + fmt.dt(s.submittedAt) + (s.late ? ' · muộn' : '') : fmt.due(Q.dueOf(a, st.id))) + '</div></div>' + subTag(a, s) + (s && s.score != null ? ' <b class="num">' + fmt.sc(s.score) + '</b>' : '') + '</div>'; }).join('') + '</div></div></div>';
});
function scoreEditor(a, R, subs, op) {
  if (!op) return '<div class="note">Bạn xem bài với quyền Admin. Người phụ trách lớp nhập điểm.</div>';
  return '<div class="note mb12">Điểm thang 10. Form mô phỏng tự chấm phần trắc nghiệm; form thật: nhập tay hoặc bấm "Dán điểm từ Google Form" (Google Form, tab Câu trả lời, Xem trong Trang tính, chép hai cột mã học viên và điểm).</div>' +
    '<form data-f="scores" data-id="' + a.id + '"><div class="box tw"><table class="t"><tr><th>Học sinh</th><th>Trạng thái</th><th>Nộp lúc</th><th style="width:120px">Điểm</th><th>Nhận xét</th></tr>' + R.map((st) => {
      const s = Q.subOf(a.id, st.id);
      return '<tr><td><div class="flex">' + av(st, 28) + '<div><div class="b">' + esc(st.name) + '</div><div class="xs faint">' + esc(st.code) + '</div></div></div></td><td>' + subTag(a, s) + (s && s.late ? ' ' + tag('Nộp muộn', 'bad') : '') + (a.extensions[st.id] ? ' ' + tag('Hạn riêng ' + fmt.dt(a.extensions[st.id]), 'plum') : '') + '</td><td class="sm">' + (s ? fmt.dt(s.submittedAt) : '-') + '</td>' +
        '<td><input class="in num" type="number" min="0" max="10" step="0.25" name="s_' + st.id + '" value="' + (s && s.score != null ? s.score : '') + '" placeholder="-"></td><td><input class="in" name="f_' + st.id + '" value="' + esc(s ? s.fb : '') + '" placeholder="Không bắt buộc"></td></tr>';
    }).join('') + '</table></div><div class="flex mt16"><button class="btn" name="rel" value="0">Lưu điểm</button><button class="btn go" name="rel" value="1">' + ic('send', 16) + 'Lưu và trả kết quả</button><button type="button" class="btn soft" data-a="pasteScores" data-id="' + a.id + '">' + ic('copy', 16) + 'Dán điểm từ Google Form</button><span class="xs faint grow" style="text-align:right">Sửa điểm đã trả kết quả được ghi nhật ký.</span></div></form>';
}
onSubmit('scores', (d, f, e) => {
  const a = Q.asg(f.dataset.id); const rel = e.submitter && e.submitter.value === '1'; const rows = []; let bad = '';
  Q.activeMembers(Q.course(a.courseId)).forEach((m) => { const v = d['s_' + m.uid]; const sc = v === '' || v == null ? null : Number(v); if (sc != null && (isNaN(sc) || sc < 0 || sc > 10)) bad = 'Điểm từ 0 đến 10'; rows.push({ uid: m.uid, score: sc, fb: (d['f_' + m.uid] || '').trim() }); });
  if (bad) { toast(bad, 'bad'); return; }
  const r = A.setScores(App.me(), a.id, rows, rel); toast(rel ? 'Đã lưu và trả kết quả. Học sinh, phụ huynh xem được ngay.' : 'Đã lưu điểm (' + r.n + ' thay đổi)', 'ok'); App.render();
});
// dán điểm: mỗi dòng "mã học viên hoặc email<tab/;/,>điểm"; điểm dạng "8 / 10" của Google Form được quy về thang 10
on('pasteScores', (el) => {
  const a = Q.asg(el.dataset.id); const R = Q.activeMembers(Q.course(a.courseId)).map((m) => Q.user(m.uid));
  const sample = R.slice(0, 3).map((x, i) => x.code + '\t' + [8, 6.5, 9][i] + ' / 10').join('\n');
  panel({ title: 'Dán điểm từ Google Form', wide: true, submit: 'Kiểm tra và nhập', desc: 'Mỗi dòng: mã học viên (hoặc email) và điểm, cách nhau bởi Tab, dấu chấm phẩy hoặc dấu phẩy. Điểm dạng "8 / 10" được quy về thang 10.',
    body: '<textarea class="in" name="t" rows="9" style="font-family:Consolas,monospace;font-size:13.5px">' + esc(sample) + '</textarea>',
    onSubmit: (d) => {
      const rows = []; const errs = [];
      d.t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).forEach((ln, i) => {
        const mm = /^(.+?)\s*(?:\t|;|,)\s*(.+)$/.exec(ln) || [];
        const k = (mm[1] || ln).trim(); const v = (mm[2] || '').trim();
        if (i === 0 && /mã|email|điểm|score/i.test(ln) && isNaN(parseFloat(v))) return;
        const st = R.find((x) => x.code.toLowerCase() === (k || '').toLowerCase() || x.email.toLowerCase() === (k || '').toLowerCase());
        if (!st) { errs.push('Dòng ' + (i + 1) + ': không có học sinh "' + k + '" trong lớp'); return; }
        const m = /^(\d+(?:[.,]\d+)?)\s*(?:\/\s*(\d+(?:[.,]\d+)?))?$/.exec(v || '');
        if (!m) { errs.push('Dòng ' + (i + 1) + ': điểm "' + v + '" chưa đúng'); return; }
        const got = parseFloat(m[1].replace(',', '.')); const max = m[2] ? parseFloat(m[2].replace(',', '.')) : 10;
        const sc = Math.round((got / max) * 100) / 10; if (sc < 0 || sc > 10) { errs.push('Dòng ' + (i + 1) + ': điểm ngoài thang'); return; }
        rows.push({ uid: st.id, score: sc });
      });
      if (errs.length) return errs.join('. ');
      if (!rows.length) return 'Không có dòng hợp lệ.';
      A.setScores(App.me(), a.id, rows, false); toast('Đã nhập điểm ' + rows.length + ' học sinh. Kiểm tra rồi bấm Lưu và trả kết quả.', 'ok'); App.render();
    } });
});
on('giao', (el) => { if (done(A.saveAssignment(App.me(), JSON.parse(JSON.stringify(Q.asg(el.dataset.id))), true), 'Đã giao bài')) App.render(); });
on('releaseAll', (el) => ask('Trả kết quả', 'Học sinh và phụ huynh thấy điểm, nhận xét của các bài đã có điểm.', () => { const r = A.releaseAll(App.me(), el.dataset.id); toast('Đã trả kết quả ' + r.n + ' bài', 'ok'); App.render(); }, { submit: 'Trả kết quả' }));
on('asgCsv', (el) => { const a = Q.asg(el.dataset.id); const rows = [['Học sinh', 'Mã', 'Nộp lúc', 'Nộp muộn', 'Điểm (thang 10)', 'Trạng thái', 'Nhận xét']]; Store.db.submissions.filter((s) => s.assignmentId === a.id).forEach((s) => { const st = Q.user(s.studentId); rows.push([st.name, st.code, fmt.dt(s.submittedAt), s.late ? 'Có' : '', s.score == null ? '' : s.score, s.status === 'da_tra' ? 'Đã trả kết quả' : s.score == null ? 'Chờ nhập điểm' : 'Có điểm, chờ trả', s.fb]); }); saveText('diem_' + a.title.replace(/\W+/g, '_') + '.csv', toCsv(rows)); });

// ------------------------------------------------------------------ điểm một học sinh
page('/bai/:id/cham/:sub', { nav: 'lop', live: false, can: (u, p) => canSeeAsg(u, Q.asg(p.id)) }, (p, u) => {
  const a = Q.asg(p.id); const s = Q.sub(p.sub); const st = Q.user(s.studentId); const c = Q.course(a.courseId); const op = P.operate(u, c);
  const all = Store.db.submissions.filter((x) => x.assignmentId === a.id); const i = all.findIndex((x) => x.id === s.id);
  const th = Store.db.qna.filter((x) => x.assignmentId === a.id && x.studentId === st.id);
  let h = head(st.name, { eyebrow: '<a href="#/bai/' + a.id + '/diem">' + esc(a.title) + '</a>', desc: 'Nộp ' + fmt.dt(s.submittedAt) + (s.late ? ' ' + tag('Nộp muộn', 'bad') : '') + ' ' + subTag(a, s) + ' ' + tag(s.source === 'form' ? 'Google Form tự chấm' : s.source === 'nhap' ? 'Giáo viên nhập điểm' : 'Học sinh báo đã nộp', 'line'),
    acts: (all[i - 1] ? '<a class="btn" href="#/bai/' + a.id + '/cham/' + all[i - 1].id + '">' + ic('back', 16) + 'Bài trước</a>' : '') + (all[i + 1] ? '<a class="btn" href="#/bai/' + a.id + '/cham/' + all[i + 1].id + '">Bài sau' + ic('next', 16) + '</a>' : '') });
  h += '<div class="cols c-main"><div class="vstack"><div class="note sm">Câu trả lời chi tiết của học sinh nằm trong bảng phản hồi của Google Form. ' + (FormLink.parse(a.formUrl).demo ? 'Form mô phỏng chỉ lưu điểm.' : '<a href="' + esc(a.formUrl) + '" target="_blank" rel="noopener">Mở form</a>, tab Câu trả lời, Cá nhân để xem.') + '</div>' +
    '<div class="box"><div class="box-h">' + ic('chat', 18) + '<h2>Đoạn chat của học sinh về bài này</h2></div><div class="box-b tight rows">' + (th.length ? th.map((q) => '<div class="r link" data-h="#/hoi-dap/' + q.id + '">' + av(st, 34) + '<div class="grow"><div class="rt">' + esc(Thread.last(q).by === st.id ? st.name + ': ' : Q.user(Thread.last(q).by).name + ': ') + esc(Thread.last(q).text) + '</div><div class="rd">' + q.messages.length + ' tin · ' + fmt.ago(Thread.last(q).at) + '</div></div>' + (Thread.waiting(q) ? tag('Chờ trả lời', 'warn') : tag('Đã trả lời', 'ok')) + '</div>').join('') : none('Học sinh chưa nhắn về bài này.', 'chat')) + '</div></div></div>' +
    '<form data-f="grade" data-id="' + s.id + '"><div class="box" style="position:sticky;top:var(--stick)"><div class="box-h"><h2>Điểm</h2></div><div class="box-b vstack">' +
    (op ? fld('Điểm (thang 10)', '<input class="in num" type="number" min="0" max="10" step="0.25" name="sc" value="' + (s.score != null ? s.score : '') + '" style="font-size:22px;height:52px">') + fld('Nhận xét cho học sinh', '<textarea class="in" name="fb" rows="3">' + esc(s.fb) + '</textarea>') +
      '<button class="btn w" name="rel" value="0">Lưu điểm</button><button class="btn go w" name="rel" value="1">' + ic('send', 16) + (s.status === 'da_tra' ? 'Cập nhật kết quả đã trả' : 'Lưu và trả kết quả') + '</button>' + (s.status === 'da_tra' ? '<div class="xs faint">Sửa điểm sau khi trả kết quả được ghi nhật ký.</div>' : '')
      : '<div><span style="font:700 34px var(--fd)">' + fmt.sc(s.score) + '</span><span class="faint"> / 10</span></div>' + (s.fb ? '<div class="fb">' + esc(s.fb) + '</div>' : '')) + '</div></div></form></div>';
  return h;
});
onSubmit('grade', (d, f, e) => {
  const s = Q.sub(f.dataset.id); const a = Q.asg(s.assignmentId);
  const sc = d.sc === '' || d.sc == null ? null : Number(d.sc);
  if (sc != null && (isNaN(sc) || sc < 0 || sc > 10)) { toast('Điểm từ 0 đến 10', 'bad'); return; }
  const rel = e.submitter && e.submitter.value === '1';
  if (!done(A.grade(App.me(), s.id, sc, (d.fb || '').trim(), rel), rel ? 'Đã trả kết quả cho ' + Q.user(s.studentId).name : 'Đã lưu điểm')) return;
  const next = Store.db.submissions.find((x) => x.assignmentId === a.id && x.id !== s.id && x.score == null);
  if (rel && next) toast('Còn bài chờ nhập điểm', 'info', 'Mở tiếp', () => nav('#/bai/' + a.id + '/cham/' + next.id));
  App.render();
});
