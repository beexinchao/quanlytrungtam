'use strict';
/* Chương trình học: danh sách, soạn nội dung chi tiết từng buổi, học liệu (tải tệp lên hoặc dán đường dẫn),
   gợi ý học liệu từ các lớp (giáo viên bổ sung cho lớp; Hồ An quyết định có thêm vào chương trình không).
   Trình soạn buổi (lessonEditor) dùng chung cho chương trình và nội dung buổi của từng lớp. */

const PROG_ST = { sap_ra_mat: [PROG_STATUS.sap_ra_mat, 'plum'], ap_dung: [PROG_STATUS.ap_dung, 'ok'], ngung: [PROG_STATUS.ngung, 'bad'] };
const ownerOf = (kind, id) => (kind === 'program' ? Q.program(id) : Q.course(id));
const pendingSug = (p) => (p.suggestions || []).filter((s) => s.status === 'cho');

// nội dung nhiều dòng: dòng bắt đầu bằng "- " là gạch đầu dòng, dòng khác là tiêu đề nhỏ
function richText(s) {
  if (!s || !s.trim()) return '<span class="faint">Chưa có nội dung chi tiết.</span>';
  let h = ''; let inList = false;
  s.split('\n').forEach((ln) => {
    const t = ln.trim();
    if (/^[-•]\s+/.test(t)) { if (!inList) { h += '<ul style="margin:4px 0 10px;padding-left:20px">'; inList = true; } h += '<li class="jp-mix">' + esc(t.replace(/^[-•]\s+/, '')) + '</li>'; return; }
    if (inList) { h += '</ul>'; inList = false; }
    if (t) h += '<div class="b mt8">' + esc(t) + '</div>';
  });
  return h + (inList ? '</ul>' : '');
}
// học liệu: mọi người chỉ xem trong trang; chỉ Hồ An có nút tải bản gốc
function materialRows(list, kind, id, idx, canEdit) {
  if (!list || !list.length) return none('Chưa có học liệu.', 'file');
  const me = App.me(); const staff = P.isStaff(me); const dl = me && me.superAdmin;
  return '<div class="files">' + list.map((m) => {
    const fromClass = kind === 'course' && m.origin === 'lop';
    const canDel = canEdit && (kind === 'program' || fromClass);
    const src = !staff ? '' : kind === 'course' ? ' ' + (fromClass ? tag('Lớp bổ sung', 'plum') : tag('Từ chương trình', 'line')) : m.fromSuggestion ? ' ' + tag('Từ gợi ý của lớp', 'plum') : '';
    return '<div class="f"><div class="ib ' + (m.kind === 'link' ? 'teal' : '') + '">' + ic(m.kind === 'link' ? 'link' : 'file', 18) + '</div><div class="grow"><div class="b sm">' + esc(m.name) + src + '</div><div class="xs faint">' +
      (m.kind === 'link' ? esc(m.url) : Files.size(m.size)) + ' · ' + esc((Q.user(m.by) || {}).name || '') + ', ' + fmt.ago(m.at) + '</div></div>' +
      '<button type="button" class="btn s" data-a="mOpen" data-k="' + kind + '" data-id="' + id + '" data-i="' + idx + '" data-m="' + m.id + '">' + (m.kind === 'link' ? ic('link', 15) + 'Mở' : ic('eye', 15) + 'Xem') + '</button>' +
      (m.kind === 'file' && dl ? '<button type="button" class="btn s icon" title="Tải bản gốc (chỉ Hồ An)" data-a="mGet" data-k="' + kind + '" data-id="' + id + '" data-i="' + idx + '" data-m="' + m.id + '">' + ic('down', 15) + '</button>' : '') +
      (canDel ? '<button type="button" class="btn s icon plain" title="Gỡ" data-a="mDel" data-k="' + kind + '" data-id="' + id + '" data-i="' + idx + '" data-m="' + m.id + '">' + ic('trash', 15) + '</button>' : '') + '</div>';
  }).join('') + '</div>' + (dl ? '' : '<div class="xs faint mt4">' + ic('lock', 13) + ' Học liệu chỉ xem trên hệ thống, không tải về.</div>');
}
const findMat = (el) => (ownerOf(el.dataset.k, el.dataset.id).lessons[Number(el.dataset.i)].materials || []).find((m) => m.id === el.dataset.m);
on('mOpen', (el) => Files.openFile(findMat(el), false));
on('mGet', (el) => Files.openFile(findMat(el), true));
on('mDel', (el) => {
  const m = findMat(el); const course = el.dataset.k === 'course';
  ask('Gỡ học liệu', '"' + m.name + '" sẽ không còn hiện ở buổi học này.' + (course ? ' Bản đã lưu trong gợi ý học liệu của chương trình vẫn giữ để Hồ An xem xét.' : ''), () => {
    if (!done(A.removeLessonMaterial(App.me(), el.dataset.k, el.dataset.id, Number(el.dataset.i), m.id), 'Đã gỡ học liệu')) return false; App.render(); return true;
  }, { submit: 'Gỡ', danger: true });
});

/* canEdit: sửa tên, nội dung buổi; canMat: thêm, gỡ học liệu (lớp vẫn bổ sung học liệu được sau buổi học) */
function lessonEditor(kind, owner, idx, canEdit, canMat) {
  if (canMat === undefined) canMat = canEdit;
  const l = owner.lessons[idx];
  const s = kind === 'course' ? Q.sessionsOf(owner.id).find((x) => x.idx === idx && x.status !== 'day_bu') : null;
  let h = '<div class="box"><div class="box-h"><span class="tag shu">Buổi ' + (idx + 1) + '</span><h2 class="grow">' + esc(l.title) + '</h2>' + (s ? '<span class="xs faint">' + fmt.day(s.date) + ' · ' + s.start + '</span>' : '') + (canEdit || canMat ? '' : tag('Chỉ xem')) + '</div><div class="box-b vstack">';
  if (canEdit) {
    h += '<form data-f="lessonSave" data-k="' + kind + '" data-id="' + owner.id + '" data-i="' + idx + '" class="vstack">' +
      fld('Tên bài', '<input class="in" name="title" value="' + esc(l.title) + '">') + fld('Mục tiêu buổi học', '<input class="in" name="goal" value="' + esc(l.goal) + '">') +
      fld('Nội dung chi tiết', '<textarea class="in" name="content" rows="12" style="font-family:var(--f),var(--jp)">' + esc(l.content || '') + '</textarea>', 'mỗi ý một dòng; dòng bắt đầu bằng "- " hiện thành gạch đầu dòng') +
      fld('Ghi chú cho giáo viên', '<textarea class="in" name="note" rows="2" placeholder="Chỉ nhân sự thấy">' + esc(l.note || '') + '</textarea>') +
      '<div class="flex"><button class="btn primary">' + ic('check', 16) + 'Lưu nội dung buổi</button><span class="xs faint">' + (kind === 'program' ? 'Lớp tạo sau nhận nội dung này.' : 'Chỉ áp cho lớp ' + esc(owner.name) + '.') + '</span></div></form>';
  } else {
    h += (l.goal ? '<div><div class="xs faint b mb8">MỤC TIÊU</div><div>' + esc(l.goal) + '</div></div>' : '') + '<div><div class="xs faint b mb8">NỘI DUNG CHI TIẾT</div><div>' + richText(l.content) + '</div></div>' +
      (l.note ? '<div class="note warn sm"><b>Ghi chú cho giáo viên:</b> ' + esc(l.note) + '</div>' : '');
  }
  h += '<div style="border-top:1px solid var(--line);padding-top:16px"><div class="flex btw mb12"><h3 style="font-size:15.5px">Học liệu (' + (l.materials || []).length + ')</h3><span class="xs faint">Tệp tối đa ' + Q.param('tepToiDa') + ' MB</span></div>' + materialRows(l.materials, kind, owner.id, idx, canMat);
  if (canMat) {
    if (kind === 'course') h += '<div class="note sm mt12">Học liệu bạn tải lên hiện ngay cho lớp ' + esc(owner.name) + ' và được lưu vào gợi ý học liệu của chương trình ' + esc((Q.program(owner.programId) || {}).name || '') + '. Hồ An quyết định có bổ sung vào chương trình không.</div>';
    h += '<div class="cols c2 mt12"><label class="drop" data-drop data-k="' + kind + '" data-id="' + owner.id + '" data-i="' + idx + '">' + ic('upload', 26) + '<div class="b sm mt4">Tải tệp lên</div><div class="xs faint">Bấm để chọn hoặc kéo thả tệp vào đây (PDF, ảnh, âm thanh, video...)</div><input type="file" multiple hidden data-c="mUpload" data-k="' + kind + '" data-id="' + owner.id + '" data-i="' + idx + '"></label>' +
      '<form class="vstack" data-f="mLink" data-k="' + kind + '" data-id="' + owner.id + '" data-i="' + idx + '" style="border:1px solid var(--line);border-radius:14px;padding:14px"><div class="b sm">' + ic('link', 15) + ' Dán đường dẫn</div><input class="in" name="url" placeholder="https://..."><input class="in" name="name" placeholder="Tên hiển thị (không bắt buộc)"><button class="btn s soft">Thêm đường dẫn</button></form></div>';
  }
  return h + '</div></div></div>';
}
onSubmit('lessonSave', (d, f) => {
  if (!d.title.trim()) { toast('Nhập tên bài', 'bad'); return; }
  A.updateLesson(App.me(), f.dataset.k, f.dataset.id, Number(f.dataset.i), { title: d.title.trim(), goal: d.goal.trim(), content: d.content, note: d.note.trim() });
  toast('Đã lưu nội dung buổi ' + (Number(f.dataset.i) + 1), 'ok'); App.render();
});
const addedMsg = (k, what) => (k === 'course' ? what + '. Đã lưu vào gợi ý học liệu của chương trình.' : what);
onSubmit('mLink', (d, f) => {
  const url = d.url.trim();
  if (!/^https?:\/\/\S+\.\S+/.test(url)) { toast('Đường dẫn cần bắt đầu bằng http:// hoặc https://', 'bad'); return; }
  let name = d.name.trim(); if (!name) { try { name = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { name = url; } }
  A.addLessonMaterial(App.me(), f.dataset.k, f.dataset.id, Number(f.dataset.i), { kind: 'link', name, url });
  toast(addedMsg(f.dataset.k, 'Đã thêm đường dẫn'), 'ok'); App.render();
});
async function uploadFiles(files, ds) {
  const max = Q.param('tepToiDa') * 1048576; let n = 0;
  for (const file of files) {
    if (file.size > max) { toast('"' + file.name + '" lớn hơn ' + Q.param('tepToiDa') + ' MB', 'bad'); continue; }
    try { const meta = await Files.upload(file); A.addLessonMaterial(App.me(), ds.k, ds.id, Number(ds.i), meta); n++; } catch (e) { toast('Không lưu được tệp "' + file.name + '"', 'bad'); }
  }
  if (n) { toast(addedMsg(ds.k, 'Đã tải lên ' + n + ' tệp'), 'ok'); App.render(); }
}
onChg('mUpload', (el) => { uploadFiles([...el.files], el.dataset); el.value = ''; });
document.addEventListener('dragover', (e) => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) { e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', (e) => { const z = e.target.closest && e.target.closest('[data-drop]'); if (z) z.classList.remove('over'); });
document.addEventListener('drop', (e) => { const z = e.target.closest && e.target.closest('[data-drop]'); if (!z) return; e.preventDefault(); z.classList.remove('over'); uploadFiles([...e.dataTransfer.files], z.dataset); });

// ------------------------------------------------------------------ gợi ý học liệu từ các lớp
function sugRows(pr, list, u, showLesson) {
  if (!list.length) return none('Chưa có gợi ý học liệu.', 'file');
  const boss = u.superAdmin;
  return '<div class="files">' + list.map((sg) => {
    const m = sg.material; const c = Q.course(sg.courseId); const st = SUG_STATUS[sg.status];
    return '<div class="f sug ' + sg.status + '"><div class="ib ' + (m.kind === 'link' ? 'teal' : 'plum') + '">' + ic(m.kind === 'link' ? 'link' : 'file', 18) + '</div><div class="grow"><div class="b sm">' + esc(m.name) + ' ' + tag(st[0], st[1]) + '</div>' +
      '<div class="xs faint">' + (showLesson ? 'Buổi ' + (sg.idx + 1) + ': ' + esc((pr.lessons[sg.idx] || {}).title || '') + ' · ' : '') + esc((Q.user(sg.by) || {}).name || '') + ' · lớp ' + esc(c ? c.name : '') + ' · ' + fmt.ago(sg.at) +
      (sg.handledBy ? ' · ' + esc(Q.user(sg.handledBy).name) + ' xử lý ' + fmt.ago(sg.handledAt) + (sg.note ? ': ' + esc(sg.note) : '') : '') + '</div></div>' +
      '<button type="button" class="btn s" data-a="sugView" data-p="' + pr.id + '" data-s="' + sg.id + '">' + (m.kind === 'link' ? ic('link', 15) + 'Mở' : ic('eye', 15) + 'Xem') + '</button>' +
      (boss && sg.status === 'cho' ? '<button type="button" class="btn s go" data-a="sugOk" data-p="' + pr.id + '" data-s="' + sg.id + '">' + ic('plus', 15) + 'Thêm vào chương trình</button><button type="button" class="btn s plain" data-a="sugNo" data-p="' + pr.id + '" data-s="' + sg.id + '">Không thêm</button>' : '') + '</div>';
  }).join('') + '</div>';
}
function sugBox(pr, idx, u) {
  const L = (pr.suggestions || []).filter((s) => s.idx === idx).sort((a, b) => (a.status === 'cho' ? 0 : 1) - (b.status === 'cho' ? 0 : 1) || (a.at < b.at ? 1 : -1));
  if (!L.length) return '';
  const n = L.filter((s) => s.status === 'cho').length;
  return '<div class="box sug-box mb16"><div class="box-h">' + ic('star', 18) + '<h3 class="grow">Gợi ý học liệu từ các lớp cho buổi ' + (idx + 1) + '</h3>' + (n ? tag(n + ' chờ duyệt', 'warn') : '') + '</div><div class="box-b">' +
    (u.superAdmin ? '' : '<div class="xs faint mb8">Giáo viên bổ sung học liệu cho lớp; Hồ An quyết định học liệu nào được thêm vào chương trình.</div>') + sugRows(pr, L, u, false) + '</div></div>';
}
const findSug = (el) => { const pr = Q.program(el.dataset.p); return { pr, sg: (pr.suggestions || []).find((x) => x.id === el.dataset.s) }; };
on('sugView', (el) => Files.openFile(findSug(el).sg.material, false));
on('sugOk', (el) => { const { pr, sg } = findSug(el);
  ask('Thêm học liệu vào chương trình', '"' + sg.material.name + '" được thêm vào buổi ' + (sg.idx + 1) + ' của ' + pr.name + '. Lớp tạo sau nhận học liệu này làm nền; lớp đang học không đổi.', (r, d) => {
    if (!done(A.reviewSuggestion(App.me(), pr.id, sg.id, true, (d.note || '').trim()), 'Đã thêm vào chương trình')) return false; App.render(); return true;
  }, { submit: 'Thêm vào chương trình', body: fld('Ghi chú cho giáo viên', '<input class="in" name="note" placeholder="Không bắt buộc">') }); });
on('sugNo', (el) => { const { pr, sg } = findSug(el);
  ask('Không thêm vào chương trình', '"' + sg.material.name + '" vẫn dùng được ở lớp đã tải lên, không thêm vào ' + pr.name + '.', (r) => {
    if (!done(A.reviewSuggestion(App.me(), pr.id, sg.id, false, r.trim()), 'Đã ghi nhận')) return false; App.render(); return true;
  }, { submit: 'Xác nhận', reason: true, reasonLabel: 'Lý do (giáo viên xem được)' }); });

// ------------------------------------------------------------------ danh sách chương trình
page('/chuong-trinh', { nav: 'ct', can: P.isStaff }, (p, u) => head('Chương trình học', { desc: 'Soạn một lần, dùng làm nền cho nhiều lớp: nội dung chi tiết từng buổi, học liệu, trọng số điểm.', acts: P.editProgram(u) ? '<button class="btn primary" data-a="newProg">' + ic('plus', 17) + 'Tạo chương trình</button>' : '' }) +
  (P.editProgram(u) ? '' : '<div class="note mb16">Trợ giảng xem được chương trình; cần quyền "Soạn chương trình học" để chỉnh sửa.</div>') +
  '<div class="cols c3">' + Store.db.programs.map((pr) => {
    const used = Store.db.courses.filter((c) => c.programId === pr.id && c.status !== 'da_xoa');
    const filled = pr.lessons.filter((l) => (l.content || '').trim().length > 60 || (l.materials || []).length).length; const mats = pr.lessons.reduce((n, l) => n + (l.materials || []).length, 0);
    const sug = pendingSug(pr).length;
    return '<a class="box" style="display:block;color:inherit;text-decoration:none" href="#/chuong-trinh/' + pr.id + '"><div class="box-b"><div class="flex btw mb12">' + tag('Cấp độ ' + pr.level, 'ai') + tag(PROG_ST[pr.status][0], PROG_ST[pr.status][1]) + '</div><h3 style="font-size:19px">' + esc(pr.name) + '</h3><p class="sm muted" style="min-height:44px">' + esc(pr.desc) + '</p>' +
      '<div class="flex btw xs faint mb8"><span>Nội dung đã soạn</span><b>' + filled + '/' + pr.lessons.length + ' buổi</b></div>' + miniBar((filled / pr.lessons.length) * 100, 'ok') +
      '<div class="flex mt12 sm muted">' + ic('list', 15) + pr.nSessions + ' buổi · ' + ic('file', 15) + mats + ' học liệu · ' + ic('class', 15) + used.length + ' lớp</div>' +
      (sug ? '<div class="mt8">' + tag(sug + ' gợi ý học liệu chờ duyệt', 'warn') + '</div>' : '') + '<div class="xs faint mt8">Phiên bản ' + pr.version + ' · cập nhật ' + fmt.ago(pr.updatedAt) + '</div></div></a>';
  }).join('') + '</div>');
on('newProg', () => panel({ title: 'Tạo chương trình học', desc: 'Chương trình mới ở trạng thái Sắp ra mắt: soạn xong bấm Áp dụng để lớp chọn làm nền. Sao chép từ chương trình có sẵn sẽ chép cả nội dung và học liệu.', submit: 'Tạo',
  body: '<div class="grid-f">' + fld('Tên chương trình', '<input class="in" name="name">', '', 'all') + fld('Cấp độ', '<select class="in" name="level">' + opt(Store.db.config.levels.map((l) => [l, l])) + '</select>') + fld('Số buổi', '<input class="in" type="number" name="nSessions" value="24" min="1" max="80">') +
    fld('Sao chép từ', '<select class="in" name="copyFrom"><option value="">Không, tạo trống</option>' + opt(Store.db.programs.map((x) => [x.id, x.name])) + '</select>', '', 'all') + fld('Mô tả', '<textarea class="in" name="desc" rows="3"></textarea>', '', 'all') + '</div>',
  onSubmit: (d) => { if (!d.name.trim()) return 'Nhập tên chương trình.'; const r = A.saveProgram(App.me(), null, d); toast('Đã tạo chương trình', 'ok'); nav('#/chuong-trinh/' + r.id); } }));

// ------------------------------------------------------------------ soạn chương trình
page('/chuong-trinh/:id/:i?', { nav: 'ct', can: (u, p) => P.isStaff(u) && !!Q.program(p.id) }, (p, u) => {
  const pr = Q.program(p.id); const can = P.editProgram(u);
  const info = p.i === 'thong-tin'; const sugTab = p.i === 'goi-y'; const idx = info || sugTab ? -1 : Math.max(0, Math.min(pr.lessons.length - 1, Number(p.i || 0)));
  const used = Store.db.courses.filter((c) => c.programId === pr.id && c.status !== 'da_xoa');
  const sugAll = pr.suggestions || []; const sugN = pendingSug(pr).length;
  const acts = [];
  if (can && pr.status !== 'ap_dung') acts.push('<button class="btn go" data-a="progSt" data-id="' + pr.id + '" data-st="ap_dung">Áp dụng</button>');
  if (can && pr.status === 'ap_dung') acts.push('<button class="btn soft" data-a="progVer" data-id="' + pr.id + '">Công bố phiên bản mới</button><button class="btn stop" data-a="progSt" data-id="' + pr.id + '" data-st="ngung">Ngừng dùng</button>');
  let h = head(pr.name, { eyebrow: '<a href="#/chuong-trinh">Chương trình học</a> · Cấp độ ' + esc(pr.level), desc: tag(PROG_ST[pr.status][0], PROG_ST[pr.status][1]) + ' &nbsp;Phiên bản ' + pr.version + ' · ' + pr.lessons.length + ' buổi · ' + pr.minutes + ' phút/buổi · ' + used.length + ' lớp đang dùng', acts: acts.join('') });
  if (pr.status === 'sap_ra_mat') h += '<div class="note mb16">Chương trình sắp ra mắt: đang soạn, chưa dùng làm nền cho lớp mới. Soạn xong bấm Áp dụng.</div>';
  if (pr.status === 'ap_dung' && can) h += '<div class="note mb16">Chương trình đang áp dụng. Sửa xong, bấm "Công bố phiên bản mới" để lớp tạo sau dùng bản mới; lớp đang học giữ nội dung đã sao chép.</div>';
  if (sugN && !sugTab) h += '<a class="note warn mb16" style="display:flex;gap:10px;align-items:center;text-decoration:none" href="#/chuong-trinh/' + pr.id + '/goi-y">' + ic('star', 18) + '<span class="grow">Có ' + sugN + ' học liệu giáo viên bổ sung ở các lớp đang chờ ' + (u.superAdmin ? 'bạn quyết định' : 'Hồ An quyết định') + ' có thêm vào chương trình.</span><b>Xem gợi ý</b></a>';
  h += '<div class="tabs"><a href="#/chuong-trinh/' + pr.id + '" class="' + (!info && !sugTab ? 'on' : '') + '">Nội dung từng buổi</a><a href="#/chuong-trinh/' + pr.id + '/goi-y" class="' + (sugTab ? 'on' : '') + '">Gợi ý học liệu<span class="n">' + sugN + '/' + sugAll.length + '</span></a><a href="#/chuong-trinh/' + pr.id + '/thong-tin" class="' + (info ? 'on' : '') + '">Thông tin chung, lớp đang dùng</a></div>';
  if (sugTab) {
    const L = sugAll.slice().sort((a, b) => (a.status === 'cho' ? 0 : 1) - (b.status === 'cho' ? 0 : 1) || (a.at < b.at ? 1 : -1));
    return h + '<div class="box"><div class="box-h"><h2 class="grow">Học liệu giáo viên bổ sung ở các lớp</h2><span class="xs faint">Lưu trong kho của chương trình; ' + (u.superAdmin ? 'bạn' : 'Hồ An') + ' chọn học liệu được thêm vào chương trình</span></div><div class="box-b">' + sugRows(pr, L, u, true) + '</div></div>';
  }
  if (info) {
    return h + '<div class="cols c-main"><form class="box" data-f="progInfo" data-id="' + pr.id + '"><div class="box-h"><h2>Thông tin chung</h2></div><div class="box-b vstack">' + fld('Tên', '<input class="in" name="name" value="' + esc(pr.name) + '"' + (can ? '' : ' readonly') + '>') +
      fld('Mô tả', '<textarea class="in" name="desc" rows="3"' + (can ? '' : ' readonly') + '>' + esc(pr.desc) + '</textarea>') + fld('Mục tiêu đầu ra', '<textarea class="in" name="goal" rows="3"' + (can ? '' : ' readonly') + '>' + esc(pr.goal) + '</textarea>') +
      fld('Thời lượng mỗi buổi (phút)', '<input class="in" type="number" name="minutes" value="' + pr.minutes + '"' + (can ? '' : ' readonly') + '>') +
      fld('Trọng số điểm tổng kết', '<div class="flex">' + Object.keys(ASG_TYPE).map((t) => tag(ASG_TYPE[t] + ' ' + pr.weights[t] + '%', 'line')).join('') + '</div>') + (can ? '<div><button class="btn primary">Lưu thông tin</button></div>' : '') + '</div></form>' +
      '<div class="box"><div class="box-h"><h2>Lớp dùng chương trình</h2></div><div class="box-b tight rows">' + (used.length ? used.map((c) => '<div class="r link" data-h="#/lop/' + c.id + '"><div class="grow"><div class="rt">' + esc(c.name) + '</div><div class="rd">Phiên bản ' + c.programVersion + '</div></div>' + classTag(c) + '</div>').join('') : none('Chưa có lớp.')) + '</div></div></div>';
  }
  h += '<div class="split has-sel" style="grid-template-columns:330px minmax(0,1fr)"><div class="box"><div class="box-h"><h3>' + pr.lessons.length + ' buổi</h3><span class="sp"></span>' + (can ? '<button class="btn s soft" data-a="lnAdd" data-id="' + pr.id + '" data-i="' + (idx + 1) + '">' + ic('plus', 15) + 'Thêm buổi</button>' : '') + '</div><div class="lesson-list">' +
    pr.lessons.map((l, i) => { const sg = sugAll.filter((s) => s.idx === i && s.status === 'cho').length;
      return '<a class="ln ' + (i === idx ? 'on' : '') + '" href="#/chuong-trinh/' + pr.id + '/' + i + '"><span class="no">' + (i + 1) + '</span><div class="grow"><div class="sm b">' + esc(l.title) + '</div><div class="meta">' + ((l.content || '').trim().length > 60 ? 'Có nội dung chi tiết' : 'Chưa soạn chi tiết') + ' · ' + (l.materials || []).length + ' học liệu</div></div>' + (sg ? '<span class="tag warn" title="Gợi ý học liệu chờ duyệt">' + sg + ' gợi ý</span>' : '') + '</a>'; }).join('') + '</div>' +
    (can ? '<div class="flex" style="padding:10px 14px;border-top:1px solid var(--line)"><span class="xs faint grow">Buổi đang chọn:</span><button class="btn s icon" title="Chuyển lên" data-a="lnMove" data-id="' + pr.id + '" data-i="' + idx + '" data-d="-1">' + ic('arrowup', 15) + '</button><button class="btn s icon" title="Chuyển xuống" data-a="lnMove" data-id="' + pr.id + '" data-i="' + idx + '" data-d="1">' + ic('arrowdown', 15) + '</button><button class="btn s icon plain" title="Xóa buổi" data-a="lnDel" data-id="' + pr.id + '" data-i="' + idx + '">' + ic('trash', 15) + '</button></div>' : '') +
    '</div><div>' + sugBox(pr, idx, u) + lessonEditor('program', pr, idx, can) + '</div></div>';
  return h;
});
onSubmit('progInfo', (d, f) => { const pr = Q.program(f.dataset.id); Store.tx((db) => { const x = db.programs.find((y) => y.id === pr.id); x.name = d.name.trim() || x.name; x.desc = d.desc; x.goal = d.goal; x.minutes = Number(d.minutes) || x.minutes; x.updatedAt = nowIso(); }); toast('Đã lưu thông tin chương trình', 'ok'); App.render(); });
on('progSt', (el) => { A.setProgramStatus(App.me(), el.dataset.id, el.dataset.st); toast('Đã đổi trạng thái chương trình', 'ok'); App.render(); });
on('progVer', (el) => ask('Công bố phiên bản mới', 'Lớp tạo sau dùng nội dung hiện tại. Lớp đang học, đã kết thúc giữ bản đã sao chép.', () => { A.publishProgramVersion(App.me(), el.dataset.id); toast('Đã công bố phiên bản mới', 'ok'); App.render(); }, { submit: 'Công bố' }));
on('lnAdd', (el) => { A.addLesson(App.me(), el.dataset.id, Number(el.dataset.i)); nav('#/chuong-trinh/' + el.dataset.id + '/' + el.dataset.i); });
on('lnMove', (el) => { const i = Number(el.dataset.i); const j = i + Number(el.dataset.d); if (A.moveLesson(App.me(), el.dataset.id, i, j).ok) nav('#/chuong-trinh/' + el.dataset.id + '/' + j); });
on('lnDel', (el) => { const pr = Q.program(el.dataset.id); const i = Number(el.dataset.i); ask('Xóa buổi ' + (i + 1), '"' + pr.lessons[i].title + '" và học liệu của buổi sẽ bị xóa khỏi chương trình. Lớp đã tạo không bị ảnh hưởng.', () => { const r = A.removeLesson(App.me(), pr.id, i); if (!done(r, 'Đã xóa buổi')) return false; nav('#/chuong-trinh/' + pr.id + '/' + Math.max(0, i - 1)); return true; }, { submit: 'Xóa', danger: true }); });
