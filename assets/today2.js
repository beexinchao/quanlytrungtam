/* Việc hôm nay theo mẫu Zenith (SCR-M05-03 cho nhân sự, SCR-M08-06 cho cổng). Dữ liệu giả, khớp dữ liệu ở các màn khác. Chỉ đọc. */
(function () {
  'use strict';
  var KEY = 'mockup_vai_tro', KEY_CON = 'mockup_con';
  var P = window.PERMISSIONS;
  function $(s, c) { return (c || document).querySelector(s); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }
  function ss(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } }

  var m = /[?&]vai_tro=([a-z_]+)/.exec(location.search), role = m ? m[1] : null;
  if (role && !P.matrix[role]) role = null;
  if (!role) role = ss(KEY) || 'quan_ly';
  if (!P.matrix[role]) role = 'quan_ly';
  try { sessionStorage.setItem(KEY, role); localStorage.setItem(KEY, role); } catch (e) { /* bỏ qua */ }
  var portalRole = role === 'hoc_vien' || role === 'phu_huynh', onPortal = /scr-m08-06/.test(location.pathname);
  if (portalRole !== onPortal) { location.replace((portalRole ? 'scr-m08-06.html' : 'scr-m05-03.html') + '?vai_tro=' + role); return; }

  function href(id) { return id.toLowerCase() + '.html?vai_tro=' + role; }
  function canSee(id) { var c = P.matrix[role] && P.matrix[role][id.slice(4, 7)]; return !!c && c.xem !== 'khong'; }
  function toast(t) { if (window.mockupToast) window.mockupToast(t); }
  function svgI(path) {
    var NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8');
    s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', path); s.appendChild(p); return s;
  }
  var ROLE_NAME = { chu_trung_tam: 'Chủ trung tâm', quan_ly: 'Quản lý đào tạo', ke_toan: 'Kế toán', giao_vien: 'Giáo viên', tro_giang: 'Trợ giảng', hoc_vien: 'Học viên', phu_huynh: 'Phụ huynh' };

  /* ---------- Nhân sự ---------- */
  var STAFF = {
    chu_trung_tam: {
      tomtat: 'Điều hành trung tâm',
      so: [['Công nợ quá hạn', '6.000.000', 'đồng', '3 khoản quá hạn', 'bad'], ['Chờ duyệt', '02', 'yêu cầu', '1 bảo lưu, 1 vượt sĩ số', 'warn'], ['Lớp học hôm nay', '03', 'ca học', '18:00 đến 20:00 tối nay', ''], ['Khách tiềm năng mới', '03', 'liên hệ', 'tuần này', 'ok']],
      viec: [
        ['Xem bảng tổng quan', 'Học viên, doanh thu, chuyên cần trong một màn hình', 'SCR-M05-01', 'BÁO CÁO', '', 'Hôm nay', true],
        ['Duyệt bảo lưu đang chờ', '1 hồ sơ bảo lưu chờ duyệt', 'SCR-M04-04', 'CHỜ DUYỆT', 'warn', 'Hạn: hôm nay'],
        ['Xem công nợ quá hạn', '3 khoản quá hạn, tổng 6.000.000 đồng', 'SCR-M04-02', 'KHẨN CẤP', 'bad', 'Quá hạn'],
        ['Xem khách tiềm năng', '3 khách mới trong tuần', 'SCR-M10-01', 'TUYỂN SINH', 'ok', 'Tuần này']
      ]
    },
    quan_ly: {
      tomtat: 'Vận hành đào tạo',
      so: [['Công nợ quá hạn', '6.000.000', 'đồng', '3 khoản quá hạn', 'bad'], ['Hồ sơ và đơn chờ duyệt', '02', 'yêu cầu', '1 bảo lưu, 1 vượt sĩ số', 'warn'], ['Lớp học hôm nay', '03', 'ca học', '18:00 đến 20:00 tối nay', ''], ['Khách tiềm năng mới', '03', 'liên hệ', '3 khách chờ gọi lại', 'ok']],
      viec: [
        ['Duyệt yêu cầu vượt sĩ số lớp N5-K01', 'Lớp đã đạt 20 / 20 học viên. Thêm học viên thứ 21 cần người có quyền duyệt kèm lý do.', 'SCR-M02-01', 'ƯU TIÊN CAO NHẤT • ĐÀO TẠO', 'info', 'Hạn chót: 12:00 trưa nay', true, 'Làm ngay: Duyệt vượt sĩ số', ['Xem chi tiết lớp', 'SCR-M02-01'], ['Giáo viên: Đỗ Minh Quân', 'Phòng P101']],
        ['Gửi nhắc nộp và đối soát học phí quá hạn', '3 khoản quá hạn, tổng 6.000.000 đồng. Soạn sẵn thông báo Zalo và SMS kèm số nợ từng người.', 'SCR-M07-01', 'KHẨN CẤP • KẾ TOÁN VÀ THU VỤ', 'bad', 'Quá hạn 4 ngày', false, 'Gửi nhắc nộp ngay', ['Mở danh sách công nợ', 'SCR-M04-02'], ['Kênh: Zalo, SMS', 'Tổng nợ: 6.000.000 đồng']],
        ['Kiểm tra thời khóa biểu tuần này', 'Giáo viên Tanaka Yuki trùng 30 phút ở lớp N4-K01 (thứ Hai 18:00 và 19:00). Cần xếp lại trước khi lưu lịch.', 'SCR-M02-02', 'VẬN HÀNH PHÒNG HỌC • LỊCH', 'muted', 'Tuần này', false, 'Mở thời khóa biểu', null, ['Đề xuất: dời lớp sang 19:30']],
        ['Nhắc học viên chưa đăng ký kỳ thi JLPT 12/2026', 'Còn học viên chưa đăng ký cấp độ phù hợp với khóa đang học. Nhắc trước hạn đăng ký của trung tâm.', 'SCR-M02-03', 'KHẢO THÍ • ĐÁNH GIÁ', 'ok', 'Tháng 12/2026', false, 'Mở quản lý kỳ thi', null, ['Cấp độ N3, N4, N5']]
      ],
      side: true
    },
    ke_toan: {
      tomtat: 'Thu chi và công nợ',
      so: [['Công nợ quá hạn', '6.000.000', 'đồng', '3 khoản quá hạn', 'bad'], ['Chờ đối soát QR', '01', 'khoản', 'khớp một phần', 'warn'], ['Bảng lương kỳ này', '01', 'chờ chốt', 'kỳ tháng 11/2026', ''], ['Đến hạn tuần này', '03', 'khoản', 'trong 7 ngày', 'ok']],
      viec: [
        ['Ghi nhận thanh toán', 'Học viên đóng tiền mặt hoặc chuyển khoản', 'SCR-M04-02', 'THU HỌC PHÍ', 'bad', 'Hôm nay', true],
        ['Đối soát thu bằng mã QR', '1 khoản chờ đối soát', 'SCR-M04-03', 'ĐỐI SOÁT', 'warn', 'Hôm nay'],
        ['Xem bảng lương kỳ này', 'Kiểm tra trước khi chốt', 'SCR-M09-02', 'LƯƠNG', '', 'Cuối kỳ'],
        ['Xem báo cáo tài chính', 'Thu chi theo tháng', 'SCR-M05-02', 'BÁO CÁO', '', 'Tháng 11/2026']
      ]
    },
    giao_vien: {
      tomtat: 'Lớp của tôi hôm nay',
      so: [['Buổi dạy hôm nay', '01', 'buổi', 'lớp N4-K01', ''], ['Giờ vào lớp', '18:30', '', 'phòng P102', ''], ['Học viên trong lớp', '15', 'học viên', 'N4-K01', 'ok'], ['Bài tập chờ nhập điểm', '01', 'bài', 'Kiểm tra 1', 'warn']],
      viec: [
        ['Điểm danh lớp N4-K01', '18:30 đến 20:00, phòng P102', 'SCR-M03-01', 'ĐIỂM DANH', 'info', 'Giờ học: 18:30', true],
        ['Nhập điểm bài tập', '1 bài chờ nhập điểm', 'SCR-M06-02', 'ĐIỂM SỐ', 'warn', 'Tuần này'],
        ['Giao bài tập mới', 'Cho lớp N4-K01', 'SCR-M06-01', 'BÀI TẬP', '', 'Tuần này'],
        ['Xem lương của tôi', 'Kỳ tháng 11/2026', 'SCR-M09-03', 'LƯƠNG', '', 'Cuối kỳ']
      ]
    },
    tro_giang: {
      tomtat: 'Hỗ trợ lớp được phân công',
      so: [['Buổi hỗ trợ hôm nay', '01', 'buổi', 'lớp N4-K01', ''], ['Giờ vào lớp', '18:30', '', 'phòng P102', ''], ['Cần xếp học bù', '02', 'học viên', 'theo dõi hạn bù', 'warn']],
      viec: [
        ['Điểm danh lớp được phân công', 'Chỉ lớp trợ giảng phụ trách', 'SCR-M03-01', 'ĐIỂM DANH', 'info', 'Giờ học: 18:30', true],
        ['Xem học bù và chuyên cần', '2 học viên cần xếp học bù', 'SCR-M03-02', 'HỌC BÙ', 'warn', 'Tuần này'],
        ['Xem bài tập của lớp', 'Chỉ xem, không giao bài', 'SCR-M06-01', 'BÀI TẬP', '', 'Tuần này']
      ]
    }
  };
  var SIDE_CLASS = [['P. 101', 'Lớp N5-K01', 'Đỗ Minh Quân', '20/20 HV', 'bad', '18:00'], ['P. 102', 'Lớp N4-K01', 'Tanaka Yuki', '15/20 HV', 'ok', '18:30'], ['P. 201', 'Lớp N3-K01', 'Sato Haruka', '9/18 HV', 'ok', '18:30']];

  function renderStaff() {
    var d = STAFF[role], main = $('main.main'); main.textContent = '';
    var head = el('div', 'page-head zt-top');
    var l = el('div'); l.appendChild(el('h1', '', 'Việc hôm nay: ' + ROLE_NAME[role]));
    var urgent = d.viec.filter(function (v) { return v[4] === 'bad'; }).length, wait = d.viec.length - urgent;
    var sub = el('p', 'zt-sub'); sub.innerHTML = 'Hôm nay, Thứ Hai ngày 09/11/2026 <span class="zt-dot">•</span> <b class="zt-bad">' + urgent + ' việc cần xử lý ngay</b> <span class="zt-dot">•</span> ' + wait + ' việc chờ xử lý';
    l.appendChild(sub); head.appendChild(l);
    var tabs = el('div', 'zt-roles'); tabs.setAttribute('role', 'navigation'); tabs.setAttribute('aria-label', 'Chuyển vai trò');
    ['chu_trung_tam', 'quan_ly', 'ke_toan', 'giao_vien', 'tro_giang'].forEach(function (r) {
      var a = el('a', r === role ? 'on' : '', ROLE_NAME[r]); a.href = 'scr-m05-03.html?vai_tro=' + r; if (r === role) a.setAttribute('aria-current', 'true'); tabs.appendChild(a);
    });
    head.appendChild(tabs); main.appendChild(head);

    var st = el('section', 'zt-stats'); st.setAttribute('aria-label', 'Tình hình nhanh');
    d.so.forEach(function (s) {
      var c = el('div', 'zt-stat ' + (s[4] || ''));
      c.appendChild(el('div', 'k', s[0]));
      var v = el('div', 'v', s[1]); if (s[2]) { var u = el('small', '', ' ' + s[2]); v.appendChild(u); } c.appendChild(v);
      c.appendChild(el('div', 'n', s[3])); st.appendChild(c);
    });
    main.appendChild(st);

    var grid = el('div', 'zt-grid' + (d.side ? ' has-side' : ''));
    var col = el('section', 'zt-col'); col.setAttribute('aria-labelledby', 'zt-h');
    var th = el('div', 'zt-listhead'); var h = el('h2', '', 'Danh sách tác vụ ưu tiên hôm nay'); h.id = 'zt-h'; th.appendChild(h);
    th.appendChild(el('span', 'zt-pill', d.viec.length + ' việc đang mở')); col.appendChild(th);
    var shown = 0;
    d.viec.forEach(function (v) {
      if (!canSee(v[2])) return; shown++;
      var card = el('article', 'zt-task ' + (v[4] || ''));
      var cb = el('input'); cb.type = 'checkbox'; cb.setAttribute('aria-label', 'Chọn việc: ' + v[0]); card.appendChild(cb);
      var body = el('div', 'body');
      var top = el('div', 'meta1'); top.appendChild(el('span', 'chip ' + (v[4] || ''), v[3])); top.appendChild(el('span', 'due', v[5])); body.appendChild(top);
      body.appendChild(el('h3', '', v[0])); body.appendChild(el('p', '', v[1]));
      if (v[9]) { var ml = el('div', 'meta2'); v[9].forEach(function (x) { ml.appendChild(el('span', '', x)); }); body.appendChild(ml); }
      card.appendChild(body);
      var act = el('div', 'act');
      var a1 = el('a', 'btn' + (v[4] === 'bad' ? ' accent' : ''), v[7] || (v[6] ? 'Làm ngay' : 'Mở')); a1.href = href(v[2]); a1.setAttribute('aria-label', v[0]); act.appendChild(a1);
      if (v[8] && canSee(v[8][1])) { var a2 = el('a', 'btn secondary', v[8][0]); a2.href = href(v[8][1]); act.appendChild(a2); }
      card.appendChild(act); col.appendChild(card);
    });
    if (!shown) col.appendChild(el('p', 'zt-empty', 'Chưa có việc nào cho vai trò này.'));
    grid.appendChild(col);

    if (d.side) {
      var side = el('aside', 'zt-side');
      var c1 = el('div', 'card'); var hh = el('h2', 'zt-sh'); hh.appendChild(svgI('M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z')); hh.appendChild(document.createTextNode(' Lịch giảng dạy tối nay')); c1.appendChild(hh);
      SIDE_CLASS.forEach(function (s) {
        var r = el('div', 'zt-cls'); r.appendChild(el('span', 'room ' + (s[4] === 'bad' ? 'red' : ''), s[0]));
        var t = el('div', 'tt'); t.appendChild(el('b', '', s[1])); t.appendChild(el('span', '', s[2] + ', ' + s[5])); r.appendChild(t);
        r.appendChild(el('span', 'badge ' + (s[4] === 'bad' ? 'bad' : 'ok'), s[3])); c1.appendChild(r);
      });
      var all = el('a', 'btn secondary zt-wide', 'Xem thời khóa biểu tuần'); all.href = href('SCR-M02-02'); c1.appendChild(all);
      side.appendChild(c1);
      var c2 = el('div', 'card'); var h2 = el('h2', 'zt-sh'); h2.appendChild(document.createTextNode('Ghi chú vận hành nhanh')); c2.appendChild(h2);
      c2.appendChild(el('p', 'zt-note', 'Đầu giờ 17:45, trợ giảng phụ trách ca tối bật sẵn hệ thống máy lạnh và kiểm tra loa phát thanh phòng P101 cho buổi luyện nghe lớp N5.'));
      c2.appendChild(el('p', 'zt-note soft', 'Dữ liệu minh họa, không phải thông báo thật.')); side.appendChild(c2);
      grid.appendChild(side);
    }
    main.appendChild(grid);

    var foot = el('div', 'card zt-foot');
    var fa = el('a', '', 'Xem tất cả module'); fa.href = '../index.html?vai_tro=' + role; foot.appendChild(fa);
    var fb = el('button', 'btn', 'Đánh dấu đã hoàn tất các việc đã chọn'); fb.type = 'button';
    fb.addEventListener('click', function () { var n = main.querySelectorAll('.zt-task input:checked').length; toast(n ? 'Đã đánh dấu hoàn tất ' + n + ' việc (minh họa)' : 'Chưa chọn việc nào'); });
    foot.appendChild(fb); main.appendChild(foot);
  }

  /* ---------- Cổng học viên, phụ huynh ---------- */
  var KIDS = {
    kiet: { ten: 'Hồ Tuấn Kiệt', ma: 'HV0004', lop: 'N4-K01', next: ['Thứ Ba 10/11', '18:30', 'P102', 'N4-K01'], no: 2000000, nhan: 'Quá hạn 4 ngày', han: '05/11/2026', dot: 'Đợt 2', tb: 2, sub: 'Thông báo từ trung tâm' },
    chau: { ten: 'Lý Bảo Châu', ma: 'HV0003', lop: 'N5-K01', next: ['Hôm nay, Thứ Hai 09/11', '18:00', 'P101', 'N5-K01'], no: 1000000, nhan: 'Còn 3 ngày', han: '12/11/2026', dot: 'Đợt 2', tb: 2, sub: 'Nhận xét kỳ mới công bố' },
    nam: { ten: 'Nguyễn Hoàng Nam', ma: 'HV0002', lop: 'N5-K02', next: ['Thứ Tư 11/11', '18:30', 'P102', 'N5-K02'], no: 2000000, nhan: 'Còn 6 ngày', han: '15/11/2026', dot: 'Đợt 2', tb: 3, sub: 'Bài tập mới: Từ vựng bài 5' }
  };
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  function renderPortal() {
    var main = $('main.main'); main.textContent = '';
    var ds = role === 'phu_huynh' ? ['kiet', 'chau'] : ['nam'];
    var cur = ss(KEY_CON); if (ds.indexOf(cur) < 0) cur = ds[0];
    var k = KIDS[cur];
    var wrap = el('div', 'zp');

    var who = el('div', 'zp-who'); who.appendChild(el('span', 'l', role === 'phu_huynh' ? 'Phụ huynh Hồ Thị Lan' : 'Học viên'));
    if (ds.length > 1) {
      var chips = el('div', 'zp-chips'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Chọn con');
      ds.forEach(function (id) {
        var b = el('button', id === cur ? 'on' : '', KIDS[id].ten + ' (' + KIDS[id].lop + ')'); b.type = 'button'; b.setAttribute('aria-pressed', id === cur ? 'true' : 'false');
        b.addEventListener('click', function () { ssSet(KEY_CON, id); renderPortal(); }); chips.appendChild(b);
      });
      who.appendChild(chips);
    } else who.appendChild(el('b', '', k.ten));
    wrap.appendChild(who);

    var head = el('div', 'zp-head');
    head.appendChild(el('span', 'badge info', 'ƯU TIÊN TRONG NGÀY'));
    head.appendChild(el('h1', '', 'Việc hôm nay của ' + (role === 'phu_huynh' ? 'Phụ huynh' : 'Học viên')));
    head.appendChild(el('p', 'zt-sub', 'Hôm nay: Thứ Hai, 09/11/2026 • ' + k.ten + ' (' + k.ma + ', lớp ' + k.lop + ')'));
    wrap.appendChild(head);

    var kp = el('div', 'zp-kpis');
    var a = el('div', 'zp-kpi'); a.appendChild(el('span', 'k', 'Buổi học tới')); a.appendChild(el('b', '', k.next[1])); a.appendChild(el('span', 'n', k.next[0] + ', ' + k.next[2])); kp.appendChild(a);
    var b = el('div', 'zp-kpi ' + (k.nhan.indexOf('Quá') === 0 ? 'bad' : 'warn')); b.appendChild(el('span', 'k', 'Học phí cần đóng')); b.appendChild(el('b', '', money(k.no) + ' đ')); b.appendChild(el('span', 'n', k.nhan)); kp.appendChild(b);
    var c = el('div', 'zp-kpi ok'); c.appendChild(el('span', 'k', 'Tin nhắn mới')); c.appendChild(el('b', '', k.tb + ' thông báo')); c.appendChild(el('span', 'n', 'Zalo, SMS, email')); kp.appendChild(c);
    wrap.appendChild(kp);

    var h = el('h2', 'zp-h', 'Hành động ưu tiên hôm nay'); h.appendChild(el('span', '', '3 nhiệm vụ')); wrap.appendChild(h);

    var t1 = el('article', 'zp-card ' + (k.nhan.indexOf('Quá') === 0 ? 'bad' : 'warn'));
    t1.appendChild(el('span', 'chip ' + (k.nhan.indexOf('Quá') === 0 ? 'bad' : 'warn'), (k.nhan.indexOf('Quá') === 0 ? 'KHẨN CẤP • ' : 'SẮP ĐẾN HẠN • ') + k.nhan.toUpperCase()));
    t1.appendChild(el('span', 'due', 'Hạn chót: ' + k.han));
    t1.appendChild(el('h3', '', 'Nộp học phí ' + k.dot + ' (' + money(k.no) + ' đồng)'));
    t1.appendChild(el('p', '', 'Khoản phí còn nợ của ' + k.ten + '. Bấm nút bên dưới để xem chi tiết và quét mã QR chuyển khoản.'));
    var a1 = el('a', 'btn accent zp-wide', 'Xem học phí và mã QR'); a1.href = href('SCR-M08-03'); t1.appendChild(a1);
    t1.appendChild(el('small', '', 'Cổng chỉ xem. Kế toán đối soát rồi trạng thái cập nhật trong 5 phút.'));
    wrap.appendChild(t1);

    var t2 = el('article', 'zp-card');
    t2.appendChild(el('span', 'chip info', 'LỚP ' + k.lop + ' • ' + k.next[1] + ' TỚI'));
    t2.appendChild(el('h3', '', 'Chuẩn bị cho buổi học ' + k.next[0].toLowerCase()));
    t2.appendChild(el('p', '', 'Phòng ' + k.next[2] + '. Xem lịch học và tình hình điểm danh của ' + k.ten + '.'));
    var a2 = el('a', 'btn secondary zp-wide', 'Xem lịch học và điểm danh'); a2.href = href('SCR-M08-02'); t2.appendChild(a2);
    wrap.appendChild(t2);

    var t3 = el('article', 'zp-card');
    t3.appendChild(el('span', 'chip ok', 'ĐIỂM VÀ NHẬN XÉT'));
    t3.appendChild(el('h3', '', 'Xem điểm và nhận xét mới nhất'));
    t3.appendChild(el('p', '', k.sub + '. Chỉ hiện nội dung giáo viên đã công bố.'));
    var a3 = el('a', 'btn secondary zp-wide', 'Mở bảng điểm và nhận xét'); a3.href = href('SCR-M08-04'); t3.appendChild(a3);
    wrap.appendChild(t3);

    var pwa = el('article', 'zp-pwa');
    pwa.appendChild(el('b', '', 'Cài cổng lên màn hình chính'));
    pwa.appendChild(el('p', '', 'Nhận nhắc buổi học, điểm danh và học phí ngay trên điện thoại.'));
    var steps = el('div', 'steps');
    var s1 = el('div', ''); s1.innerHTML = '<i>1</i>Mở menu Chia sẻ của trình duyệt'; var s2 = el('div', ''); s2.innerHTML = '<i>2</i>Chọn "Thêm vào màn hình chính"';
    steps.appendChild(s1); steps.appendChild(s2); pwa.appendChild(steps);
    var ok = el('button', 'btn secondary', 'Đã hiểu'); ok.type = 'button'; ok.addEventListener('click', function () { pwa.style.display = 'none'; }); pwa.appendChild(ok);
    wrap.appendChild(pwa);

    var more = el('a', 'zp-link', 'Xem tất cả mục của cổng'); more.href = href('SCR-M08-01'); wrap.appendChild(more);
    main.appendChild(wrap);
  }

  var home = $('.btn-home'); if (home) home.href = '../index.html?vai_tro=' + role;
  if (portalRole) renderPortal(); else renderStaff();
})();
