/* Màn "Việc hôm nay" theo vai trò (SCR-M05-03). Dữ liệu giả, khớp dữ liệu minh họa ở các màn khác. Chỉ đọc. */
(function () {
  'use strict';
  var KEY = 'mockup_vai_tro';
  var P = window.PERMISSIONS;
  function $(s) { return document.querySelector(s); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }

  var m = /[?&]vai_tro=([a-z_]+)/.exec(location.search), role = m ? m[1] : null;
  if (role && !P.matrix[role]) role = null;
  if (!role) { try { role = sessionStorage.getItem(KEY) || localStorage.getItem(KEY); } catch (e) { role = null; } }
  if (!role || !P.matrix[role]) role = 'quan_ly';
  try { sessionStorage.setItem(KEY, role); localStorage.setItem(KEY, role); } catch (e) { /* bỏ qua */ }

  var portalRole = role === 'hoc_vien' || role === 'phu_huynh', onPortal = /scr-m08-06/.test(location.pathname);
  if (portalRole !== onPortal) { location.replace((portalRole ? 'scr-m08-06.html' : 'scr-m05-03.html') + '?vai_tro=' + role); return; }
  function scr(id) { return id.toLowerCase().replace(/^scr-/, 'scr-') + '.html'; }
  function href(id) { return scr(id) + '?vai_tro=' + role; }

  var T = {
    chu_trung_tam: {
      ten: 'Chủ trung tâm', tomtat: 'Tình hình trung tâm hôm nay',
      so: [['6', 'học viên đang học', ''], ['2.000.000', 'đồng nợ quá hạn', 'bad'], ['93%', 'chuyên cần tuần này', 'ok'], ['3', 'khách tiềm năng mới', '']],
      viec: [
        ['Xem bảng tổng quan', 'Học viên, doanh thu, chuyên cần trong một màn', 'SCR-M05-01', true],
        ['Duyệt bảo lưu đang chờ', '1 hồ sơ chờ duyệt', 'SCR-M04-04'],
        ['Xem công nợ quá hạn', '1 khoản quá hạn 4 ngày', 'SCR-M04-02'],
        ['Xem khách tiềm năng', '3 khách mới tuần này', 'SCR-M10-01']
      ]
    },
    quan_ly: {
      ten: 'Quản lý', tomtat: 'Vận hành lớp học hôm nay',
      so: [['3', 'lớp học hôm nay', ''], ['1', 'hồ sơ cần bổ sung', 'warn'], ['3', 'khách tiềm năng chờ liên hệ', ''], ['2', 'thông báo chờ gửi', '']],
      viec: [
        ['Tạo hồ sơ học viên mới', 'Nhập học viên vừa đăng ký', 'SCR-M01-01', true],
        ['Xem thời khóa biểu tuần', 'Kiểm tra lớp và phòng', 'SCR-M02-02'],
        ['Liên hệ khách tiềm năng', '3 khách chờ gọi lại', 'SCR-M10-01'],
        ['Soạn thông báo cho phụ huynh', 'Chọn kênh Zalo, SMS hoặc email', 'SCR-M07-01']
      ]
    },
    ke_toan: {
      ten: 'Kế toán', tomtat: 'Thu chi và công nợ hôm nay',
      so: [['2.000.000', 'đồng nợ quá hạn', 'bad'], ['1', 'khoản chờ đối soát QR', 'warn'], ['1', 'bảng lương kỳ này chờ chốt', ''], ['3', 'khoản đến hạn tuần này', '']],
      viec: [
        ['Ghi nhận thanh toán', 'Học viên đóng tiền mặt hoặc chuyển khoản', 'SCR-M04-02', true],
        ['Đối soát thu bằng mã QR', '1 khoản chờ đối soát', 'SCR-M04-03'],
        ['Xem bảng lương kỳ này', 'Kiểm tra trước khi chốt', 'SCR-M09-02'],
        ['Xem báo cáo tài chính', 'Thu chi theo tháng', 'SCR-M05-02']
      ]
    },
    giao_vien: {
      ten: 'Giáo viên', tomtat: 'Lớp của tôi hôm nay',
      so: [['1', 'buổi dạy hôm nay', ''], ['18:30', 'giờ vào lớp N4-K01, phòng P102', ''], ['15', 'học viên trong lớp N4-K01', ''], ['1', 'bài tập chờ nhập điểm', 'warn']],
      viec: [
        ['Điểm danh lớp N4-K01', '18:30-20:00, phòng P102', 'SCR-M03-01', true],
        ['Nhập điểm bài tập', '1 bài chờ nhập điểm', 'SCR-M06-02'],
        ['Giao bài tập mới', 'Cho lớp N4-K01', 'SCR-M06-01'],
        ['Xem lương của tôi', 'Kỳ tháng này', 'SCR-M09-03']
      ]
    },
    tro_giang: {
      ten: 'Trợ giảng', tomtat: 'Hỗ trợ lớp được phân công hôm nay',
      so: [['1', 'buổi hỗ trợ hôm nay', ''], ['18:30', 'giờ vào lớp N4-K01', ''], ['2', 'học viên cần học bù', 'warn']],
      viec: [
        ['Điểm danh lớp được phân công', 'Chỉ lớp trợ giảng phụ trách', 'SCR-M03-01', true],
        ['Xem học bù và chuyên cần', '2 học viên cần xếp học bù', 'SCR-M03-02'],
        ['Xem bài tập của lớp', 'Chỉ xem, không giao bài', 'SCR-M06-01']
      ]
    },
    hoc_vien: {
      ten: 'Học viên', tomtat: 'Việc học của tôi',
      so: [['Thứ Năm', 'buổi học kế tiếp, 18:30', ''], ['1', 'bài tập sắp đến hạn', 'warn'], ['0', 'khoản còn nợ', 'ok']],
      viec: [
        ['Xem lịch học', 'Buổi học tuần này', 'SCR-M08-02', true],
        ['Xem điểm và nhận xét', 'Kết quả mới nhất', 'SCR-M08-04'],
        ['Đọc thông báo', 'Thông báo từ trung tâm', 'SCR-M08-05']
      ]
    },
    phu_huynh: {
      ten: 'Phụ huynh', tomtat: 'Việc học của con hôm nay',
      so: [['Thứ Năm', 'buổi học kế tiếp của Hồ Tuấn Kiệt, 18:30', ''], ['2.000.000', 'đồng còn nợ, quá hạn 4 ngày', 'bad'], ['2', 'thông báo chưa đọc', 'warn']],
      viec: [
        ['Xem học phí và mã QR', 'Còn nợ 2.000.000 đồng, đợt 2', 'SCR-M08-03', true],
        ['Xem lịch học và điểm danh', 'Con có đi học không', 'SCR-M08-02'],
        ['Xem điểm và nhận xét', 'Kết quả mới nhất của con', 'SCR-M08-04'],
        ['Đọc thông báo', '2 thông báo mới', 'SCR-M08-05']
      ]
    }
  };

  var d = T[role];
  var cell = function (id) { var mod = id.slice(4, 7); var c = P.matrix[role] && P.matrix[role][mod]; return c && c.xem !== 'khong'; };

  var bar = $('#role-bar');
  var lab = el('label', '', 'Vai trò:'); lab.setAttribute('for', 'role-select');
  var sel = el('select', 'role-select'); sel.id = 'role-select';
  P.roles.forEach(function (r) { var o = el('option', '', r.ten); o.value = r.id; if (r.id === role) o.selected = true; sel.appendChild(o); });
  sel.addEventListener('change', function () { location.href = location.pathname + '?vai_tro=' + sel.value; });
  bar.appendChild(lab); bar.appendChild(sel);
  var home = $('.btn-home'); if (home) home.href = '../index.html?vai_tro=' + role;

  $('#today-title').textContent = 'Việc hôm nay: ' + d.ten;
  $('#today-sub').textContent = d.tomtat + '. Ngày minh họa 09/11/2026.';

  var stats = $('#today-stats'); stats.textContent = '';
  d.so.forEach(function (s) {
    var b = el('div', 'tstat' + (s[2] ? ' ' + s[2] : ''));
    b.appendChild(el('div', 'v', s[0])); b.appendChild(el('div', 'l', s[1])); stats.appendChild(b);
  });

  var list = $('#today-list'); list.textContent = '';
  d.viec.forEach(function (v) {
    if (!cell(v[2])) return;
    var li = el('li', 'titem' + (v[3] ? ' primary' : ''));
    var tx = el('div', 'tx'); tx.appendChild(el('div', 't', v[0])); tx.appendChild(el('div', 's', v[1]));
    var a = el('a', 'btn' + (v[3] ? '' : ' secondary'), v[3] ? 'Làm ngay' : 'Mở'); a.href = href(v[2]);
    a.setAttribute('aria-label', v[0]);
    li.appendChild(tx); li.appendChild(a); list.appendChild(li);
  });

  var all = $('#today-all'); all.href = '../index.html?vai_tro=' + role;
})();
