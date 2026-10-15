/* Cổng học viên và phụ huynh (M08): dữ liệu giả theo từng con, chuyển giữa các con, vẽ nội dung các màn hình SCR-M08-01..05.
   Dữ liệu chỉ lấy từ danh sách dữ liệu giả. Chỉ đọc, không ghi dữ liệu thật. Không tải tài nguyên ngoài. */
(function () {
  'use strict';
  var KEY_CON = 'mockup_con', KEY_TK = 'mockup_tk', KEY_DOC = 'mockup_doc';
  var DEMO_DATE = '09/11/2026';

  // Dữ liệu giả theo từng học viên
  var CH = {
    kiet: {
      ten: 'Hồ Tuấn Kiệt', tuoi: 16, ma: 'HV0004', lop: 'N4-K01',
      lich: [['Thứ Ba 10/11', '18:30-20:00', 'P102', 'Buổi thường'], ['Thứ Năm 12/11', '18:30-20:00', 'P102', 'Buổi thường'], ['Thứ Bảy 14/11', '09:45-11:15', 'P102', 'Học bù']],
      dd: [['Thứ Năm 05/11', 'vang_kp', 'Buổi 6'], ['Thứ Ba 03/11', 'vang_kp', 'Buổi 5'], ['Thứ Bảy 31/10', 'co_mat', 'Buổi 4'], ['Thứ Năm 29/10', 'co_mat', 'Buổi 3'], ['Thứ Ba 27/10', 'di_muon', 'Buổi 2']],
      cc: [20, 24],
      hp: [['Đợt 1', 2000000, 2000000, '05/10/2026'], ['Đợt 2', 2000000, 0, '05/11/2026'], ['Đợt 3', 2000000, null, '05/12/2026']],
      diem: [['Kiểm tra 1', 6.5], ['Giữa kỳ', 7.0]], nx: [],
      tb: [
        { id: 'k1', moi: true, kenh: 'Zalo', ngay: '06/11/2026', tieu: 'Nhắc học phí đợt 2', nd: 'Học phí đợt 2 của Hồ Tuấn Kiệt còn 2.000.000 đồng, hạn nộp ngày 05 tháng 11. Mở mục Học phí để xem mã QR.' },
        { id: 'k2', moi: true, kenh: 'SMS', ngay: '06/11/2026', tieu: 'Cảnh báo vắng 2 buổi liên tiếp', nd: 'Hồ Tuấn Kiệt vắng buổi 5 và buổi 6 của lớp N4-K01. Phụ huynh liên hệ giáo viên Tanaka Yuki nếu cần bù buổi.' },
        { id: 'k3', moi: false, kenh: 'Zalo', ngay: '08/11/2026', tieu: 'Nhắc lịch học ngày 12', nd: 'Lớp N4-K01 học lúc 18:30 ngày 12 tháng 11 tại phòng P102.' }
      ]
    },
    chau: {
      ten: 'Lý Bảo Châu', tuoi: 12, ma: 'HV0003', lop: 'N5-K01',
      lich: [['Thứ Hai 09/11', '18:00-19:30', 'P101', 'Buổi thường'], ['Thứ Tư 11/11', '18:00-19:30', 'P101', 'Buổi thường'], ['Thứ Sáu 13/11', '18:00-19:30', 'P101', 'Buổi thường']],
      dd: [['Thứ Sáu 06/11', 'co_mat', 'Buổi 22'], ['Thứ Tư 04/11', 'co_mat', 'Buổi 21'], ['Thứ Hai 02/11', 'co_mat', 'Buổi 20'], ['Thứ Sáu 30/10', 'hoc_bu', 'Buổi 19'], ['Thứ Tư 28/10', 'co_mat', 'Buổi 18']],
      cc: [23, 24],
      hp: [['Đợt 1', 2000000, 2000000, '05/10/2026'], ['Đợt 2', 2000000, 1000000, '12/11/2026'], ['Đợt 3', 2000000, null, '05/12/2026']],
      diem: [['Kiểm tra 1', 9.0], ['Giữa kỳ', 8.0]],
      nx: [{ gv: 'Đỗ Minh Quân', ky: 'Kỳ tháng 11', nd: 'Bảo Châu phát âm bảng chữ cái chính xác, cần luyện thêm 15 phút mỗi ngày với từ vựng bài 5.' }],
      tb: [
        { id: 'c1', moi: true, kenh: 'Zalo', ngay: '09/11/2026', tieu: 'Nhận xét kỳ mới công bố', nd: 'Giáo viên đã công bố nhận xét kỳ tháng 11 của Lý Bảo Châu. Mở mục Điểm để đọc.' },
        { id: 'c2', moi: true, kenh: 'email', ngay: '07/11/2026', tieu: 'Thông báo nghỉ lễ', nd: 'Trung tâm nghỉ lễ một ngày; lớp N5-K01 học bù theo lịch gửi sau.' },
        { id: 'c3', moi: false, kenh: 'Zalo', ngay: '05/11/2026', tieu: 'Nhắc học phí đợt 2', nd: 'Học phí đợt 2 của Lý Bảo Châu còn 1.000.000 đồng, hạn nộp ngày 12 tháng 11.' }
      ]
    },
    nam: {
      ten: 'Nguyễn Hoàng Nam', tuoi: 14, ma: 'HV0002', lop: 'N5-K02',
      lich: [['Thứ Tư 11/11', '18:30-20:00', 'P102', 'Buổi thường'], ['Thứ Sáu 13/11', '18:30-20:00', 'P102', 'Buổi thường'], ['Chủ nhật 15/11', '09:00-10:30', 'P102', 'Thi thử JLPT N5']],
      dd: [['Thứ Sáu 06/11', 'co_mat', 'Buổi 22'], ['Chủ nhật 08/11', 'vang_cp', 'Buổi bù cuối tuần'], ['Thứ Tư 04/11', 'co_mat', 'Buổi 21'], ['Thứ Hai 02/11', 'di_muon', 'Buổi 20'], ['Thứ Sáu 30/10', 'co_mat', 'Buổi 19']],
      cc: [21, 24],
      hp: [['Đợt 1', 2000000, 2000000, '05/10/2026'], ['Đợt 2', 2000000, 0, '15/11/2026'], ['Đợt 3', 2000000, null, '05/12/2026']],
      diem: [['Kiểm tra 1', 7.0], ['Bài tập Từ vựng bài 5', null]],
      nx: [],
      tb: [
        { id: 'n1', moi: true, kenh: 'Zalo', ngay: '09/11/2026', tieu: 'Bài tập mới: Từ vựng bài 5', nd: 'Giáo viên Phạm Thị Hương giao bài Từ vựng bài 5, hạn nộp ngày 12 tháng 11.' },
        { id: 'n2', moi: true, kenh: 'Zalo', ngay: '08/11/2026', tieu: 'Đã ghi nhận vắng có phép ngày 08', nd: 'Buổi ngày 08 tháng 11 của Nguyễn Hoàng Nam được ghi vắng có phép.' },
        { id: 'n3', moi: true, kenh: 'email', ngay: '07/11/2026', tieu: 'Thông báo nghỉ lễ', nd: 'Trung tâm nghỉ lễ một ngày; lịch học bù sẽ gửi sau.' }
      ]
    },
    khang: {
      ten: 'Trần Minh Khang', tuoi: 18, ma: 'HV0001', lop: 'N5-K01',
      lich: [['Thứ Hai 09/11', '18:00-19:30', 'P101', 'Buổi thường'], ['Thứ Tư 11/11', '18:00-19:30', 'P101', 'Buổi thường'], ['Thứ Sáu 13/11', '18:00-19:30', 'P101', 'Buổi thường']],
      dd: [['Thứ Sáu 06/11', 'co_mat', 'Buổi 22'], ['Thứ Tư 04/11', 'co_mat', 'Buổi 21'], ['Thứ Hai 02/11', 'co_mat', 'Buổi 20'], ['Thứ Sáu 30/10', 'di_muon', 'Buổi 19'], ['Thứ Tư 28/10', 'co_mat', 'Buổi 18']],
      cc: [22, 24],
      hp: [['Đợt 1', 2000000, 2000000, '05/10/2026'], ['Đợt 2', 2000000, 2000000, '05/11/2026'], ['Đợt 3', 2000000, 2000000, '05/12/2026']],
      diem: [['Kiểm tra 1', 8.5], ['Giữa kỳ', 7.0]], nx: [],
      tb: [
        { id: 'm1', moi: true, kenh: 'email', ngay: '07/11/2026', tieu: 'Thông báo nghỉ lễ', nd: 'Trung tâm nghỉ lễ một ngày; lớp N5-K01 học bù theo lịch gửi sau.' },
        { id: 'm2', moi: false, kenh: 'Zalo', ngay: '04/11/2026', tieu: 'Đã có điểm Kiểm tra 1', nd: 'Điểm Kiểm tra 1 của Trần Minh Khang là 8,5 trên thang 10.' }
      ]
    }
  };
  var DD = { co_mat: ['Có mặt', 'ok'], di_muon: ['Đi muộn', 'warn'], hoc_bu: ['Học bù', 'info'], vang_cp: ['Vắng có phép', 'muted'], vang_kp: ['Vắng không phép', 'bad'] };
  var ACCOUNTS = {
    phu_huynh: { ten: 'Hồ Thị Lan', ds: ['kiet', 'chau'], loai: 'Phụ huynh' },
    hoc_vien: { ten: 'Học viên', ds: ['nam'], loai: 'Học viên' }
  };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ss(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } }
  function dec(x, k) { return (Math.round(x * Math.pow(10, k)) / Math.pow(10, k)).toFixed(k).replace('.', ','); }
  function money(n) { return U.fmt(n) + ' đồng'; }
  function badge(c, t) { return '<span class="badge ' + c + '">' + esc(t) + '</span>'; }

  var role = U.role();
  function acct() {
    if (role === 'hoc_vien') {
      var k = ss(KEY_TK); if (k !== 'nam' && k !== 'khang') k = 'nam';
      return { ten: CH[k].ten, ds: [k], loai: 'Học viên', preview: false, chon: true };
    }
    var a = ACCOUNTS.phu_huynh;
    return { ten: a.ten, ds: a.ds, loai: 'Phụ huynh', preview: role !== 'phu_huynh', chon: false };
  }
  function cur() {
    var a = acct(), k = ss(KEY_CON);
    if (a.ds.indexOf(k) < 0) k = a.ds[0];
    return k;
  }
  function setCon(k) { ssSet(KEY_CON, k); }

  // Trạng thái đã đọc theo con (lưu trong phiên)
  function readSet(k) { var o = {}; try { o = JSON.parse(ss(KEY_DOC) || '{}'); } catch (e) { o = {}; } return o[k] || []; }
  function markRead(k, id) {
    var o = {}; try { o = JSON.parse(ss(KEY_DOC) || '{}'); } catch (e) { o = {}; }
    o[k] = o[k] || []; if (o[k].indexOf(id) < 0) o[k].push(id); ssSet(KEY_DOC, JSON.stringify(o));
  }
  function unread(k) { var r = readSet(k); return CH[k].tb.filter(function (t) { return t.moi && r.indexOf(t.id) < 0; }).length; }
  function conNo(k) { var s = 0; CH[k].hp.forEach(function (d) { if (d[2] !== null && d[1] - d[2] > 0) s += d[1] - d[2]; }); return s; }

  // Mã QR minh họa: ma trận giả, không quét được
  function fakeQr(seed, n) {
    var s = seed;
    function rnd() { s = (s * (1103515 * 1000 + 245) + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    var g = [], x, y;
    for (y = 0; y < n; y++) { g.push([]); for (x = 0; x < n; x++) g[y].push(rnd() > 0.52); }
    function finder(ox, oy) {
      for (var yy = -1; yy <= 7; yy++) for (var xx = -1; xx <= 7; xx++) {
        var gx = ox + xx, gy = oy + yy; if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
        var edge = xx === 0 || xx === 6 || yy === 0 || yy === 6, core = xx >= 2 && xx <= 4 && yy >= 2 && yy <= 4;
        g[gy][gx] = xx >= 0 && xx <= 6 && yy >= 0 && yy <= 6 && (edge || core);
      }
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    var u = 6, r = '';
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (g[y][x]) r += '<rect x="' + (x * u + u) + '" y="' + (y * u + u) + '" width="' + u + '" height="' + u + '"/>';
    var size = (n + 2) * u;
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Mã QR minh họa, không quét được"><rect width="' + size + '" height="' + size + '" fill="#fff"/><g fill="#1d2733">' + r + '</g></svg>';
  }

  var PAGES = [['m08-01', 'Chọn con'], ['m08-02', 'Lịch học'], ['m08-03', 'Học phí'], ['m08-04', 'Điểm'], ['m08-05', 'Thông báo']];

  function nav(page) {
    var h = '<ul class="p-nav" aria-label="Các mục của cổng">';
    PAGES.forEach(function (p) {
      var lab = p[1];
      if (p[0] === 'm08-05') { var k = cur(); lab += ' (' + unread(k) + ')'; }
      h += '<li><a href="scr-' + p[0] + '.html"' + (p[0] === page ? ' aria-current="page"' : '') + '>' + esc(lab) + '</a></li>';
    });
    return h + '</ul>';
  }
  function childBar(withBtns) {
    var a = acct(), k = cur(), h = '<div class="childbar"><div class="who">' + esc(a.loai) + (a.loai === 'Phụ huynh' ? ' ' + esc(a.ten) : '') + (a.preview ? ' (xem trước bằng vai trò đang chọn)' : '') + '. Ngày minh họa: ' + DEMO_DATE + '.</div>';
    if (a.ds.length > 1) {
      h += '<div class="seg" role="group" aria-label="Chuyển giữa các con">';
      a.ds.forEach(function (c) { h += '<button type="button" data-con="' + c + '" aria-pressed="' + (c === k ? 'true' : 'false') + '">' + esc(CH[c].ten) + '</button>'; });
      h += '</div>';
    } else {
      h += '<div><strong id="ten-hv">' + esc(CH[k].ten) + '</strong> (' + esc(CH[k].ma) + ', lớp ' + esc(CH[k].lop) + ')</div>';
    }
    return h + '</div>';
  }

  // ---------- Từng màn hình
  function vLich(k) {
    var c = CH[k], h = '<h2>Buổi học tuần 09/11 đến 15/11</h2>';
    c.lich.forEach(function (b) {
      h += '<div class="row-item"><div class="r"><span class="t">' + esc(b[0]) + '</span>' + badge(b[3] === 'Học bù' ? 'info' : 'ok', b[3]) + '</div><div class="s">' + esc(b[1]) + ', phòng ' + esc(b[2]) + ', lớp ' + esc(c.lop) + '</div></div>';
    });
    return h;
  }
  function vDD(k) {
    var c = CH[k], pct = c.cc[0] / c.cc[1] * 100;
    var h = '<div class="p-stat"><div><div class="v">' + dec(pct, 1) + '%</div><div class="l">Chuyên cần: ' + c.cc[0] + ' / ' + c.cc[1] + ' buổi</div></div></div>';
    h += '<div class="small muted" style="margin-bottom:8px">Chuyên cần = (có mặt + đi muộn + học bù) / số buổi đã diễn ra.</div>';
    if (c.dd[0][1] === 'vang_kp' && c.dd[1][1] === 'vang_kp') h += '<div class="alert warn" role="alert">Vắng 2 buổi liên tiếp (buổi 5 và buổi 6). Phụ huynh đã nhận cảnh báo.</div>';
    c.dd.forEach(function (d) { var m = DD[d[1]]; h += '<div class="row-item"><div class="r"><span class="t">' + esc(d[0]) + '</span>' + badge(m[1], m[0]) + '</div><div class="s">' + esc(d[2]) + '</div></div>'; });
    return h;
  }
  function bankBox(no, nd) {
    function row(l, v, copy, red) { return '<div class="bk-r"><span>' + l + '</span><b' + (red ? ' class="red"' : '') + '>' + esc(v) + '</b>' + (copy ? '<button type="button" class="btn secondary" data-copy="' + esc(copy) + '">Sao chép</button>' : '') + '</div>'; }
    return '<div class="bank">' + row('Ngân hàng thụ hưởng', 'Ngân hàng minh họa') + row('Tên tài khoản', 'TRUNG TAM NIHONGO (MINH HOA)') + row('Số tài khoản', '0000000000', '0000000000') + row('Số tiền chính xác', U.fmt(no) + ' đồng', String(no)) + row('Nội dung chuyển khoản', nd, nd, true) + '<div class="bk-note">Giữ nguyên nội dung chuyển khoản để hệ thống đối soát tự động. Sau khi kế toán đối soát, trạng thái cập nhật trong 5 phút.</div></div>';
  }
  function vHP(k) {
    var c = CH[k], h = '', tong = conNo(k);
    h += '<div class="p-stat"><div><div class="v">' + U.fmt(tong) + '</div><div class="l">Còn nợ (đồng)</div></div></div>';
    c.hp.forEach(function (d, i) {
      var no = d[2] === null ? null : d[1] - d[2], st, cls;
      if (d[2] === null) { st = 'Chưa phát hành'; cls = 'muted'; }
      else if (no === 0) { st = 'Đã thanh toán'; cls = 'ok'; }
      else { st = (i === 1 && k === 'kiet') ? 'Quá hạn 4 ngày' : 'Còn nợ'; cls = (i === 1 && k === 'kiet') ? 'bad' : 'warn'; }
      h += '<div class="row-item"><div class="r"><span class="t">' + esc(d[0]) + ': ' + U.fmt(d[1]) + ' đồng</span>' + badge(cls, st) + '</div><div class="s">Hạn nộp ' + esc(d[3]) + (d[2] !== null ? '. Đã đóng ' + U.fmt(d[2]) + ' đồng' + (no > 0 ? ', còn nợ ' + U.fmt(no) + ' đồng.' : '.') : '.') + '</div>';
      if (no > 0) {
        h += '<div class="qr-box">' + fakeQr(2000 + i * 17 + k.length * 31 + c.ma.length * 7 + parseInt(c.ma.slice(-2), 10) * 101, 21) + '</div>' +
          '<div class="small muted" style="text-align:center">Mã QR minh họa, không quét được. Chuyển khoản ngân hàng 24/7.</div>' + bankBox(no, c.ma + ' ' + d[0].replace('Đợt ', 'DOT'));
      }
      h += '</div>';
    });
    if (tong === 0) h += '<div class="alert ok">Không có khoản còn nợ nên không hiển thị mã QR.</div>';
    h += '<p class="small muted">Mã QR chỉ hiển thị cho khoản còn nợ. Cổng không ghi nhận thanh toán thay kế toán; sau khi kế toán đối soát, trạng thái cập nhật trong 5 phút.</p>';
    return h;
  }
  function vDiem(k) {
    var c = CH[k], h = '<h2>Điểm (thang 10)</h2>';
    c.diem.forEach(function (d) {
      h += '<div class="row-item"><div class="r"><span class="t">' + esc(d[0]) + '</span>' + (d[1] === null ? badge('muted', 'Chưa chấm') : '<strong>' + dec(d[1], 1) + '</strong>') + '</div>' + (d[1] === null ? '' : '<div class="s">Quy đổi thang 100: ' + dec(d[1] * 10, d[1] * 10 % 1 ? 1 : 0) + '</div>') + '</div>';
    });
    h += '<h2 style="margin-top:14px">Nhận xét của giáo viên</h2>';
    if (!c.nx.length) h += '<div class="alert info">Chưa có nhận xét được công bố cho ' + esc(c.ten) + '. Bản nháp của giáo viên không hiển thị trên cổng.</div>';
    c.nx.forEach(function (n) { h += '<div class="row-item"><div class="t">' + esc(n.ky) + ', giáo viên ' + esc(n.gv) + '</div><div>' + esc(n.nd) + '</div></div>'; });
    return h;
  }
  function vTB(k) {
    var c = CH[k], r = readSet(k), h = '<div class="p-stat"><div><div class="v" id="n-unread">' + unread(k) + '</div><div class="l">Thông báo chưa đọc</div></div></div>';
    c.tb.forEach(function (t) {
      var un = t.moi && r.indexOf(t.id) < 0;
      h += '<div class="row-item' + (un ? ' unread' : '') + '" data-id="' + t.id + '"><button type="button" class="open" aria-expanded="false"><span class="r"><span class="t">' + esc(t.tieu) + '</span>' + (un ? badge('bad', 'Chưa đọc') : badge('muted', 'Đã đọc')) + '</span><span class="s">' + esc(t.ngay) + ', kênh ' + esc(t.kenh) + '</span></button><div class="nd" hidden style="margin-top:6px">' + esc(t.nd) + '</div></div>';
    });
    h += '<p class="small muted">Thông báo mới nằm đầu danh sách; lưu hiển thị 90 ngày gần nhất. Mở thông báo để đánh dấu đã đọc.</p>';
    return h;
  }
  function vLogin() {
    var a = acct(), k = cur(), h = '';
    h += '<div class="card"><h2>Đăng nhập cổng</h2><div class="form-grid">';
    if (a.chon) h += '<div class="field"><label for="l-tk">Tài khoản mẫu</label><select id="l-tk"><option value="nam"' + (k === 'nam' ? ' selected' : '') + '>Học viên Nguyễn Hoàng Nam</option><option value="khang"' + (k === 'khang' ? ' selected' : '') + '>Học viên Trần Minh Khang</option></select></div>';
    else h += '<div class="field"><label for="l-tk">Tài khoản mẫu</label><input id="l-tk" value="phuhuynh01@example.com" readonly></div>';
    h += '<div class="field"><label for="l-mk">Mật khẩu</label><input id="l-mk" type="password" value="" placeholder="Nhập mật khẩu mẫu"></div></div>' +
      '<div class="form-actions"><button class="btn" type="button" id="l-ok">Đăng nhập</button><button class="btn secondary" type="button" id="l-sai">Thử mật khẩu sai</button></div>' +
      '<div id="l-msg" class="alert info" style="margin-top:10px" hidden></div>' +
      '<p class="small muted">Đăng nhập sai 5 lần thì khóa 15 phút. Phiên hết hạn sau 30 phút không thao tác. Cổng chỉ đọc, không có chức năng sửa dữ liệu học vụ.</p></div>';
    h += '<div class="card"><h2>' + (a.ds.length > 1 ? 'Chọn con để xem' : 'Hồ sơ của bạn') + '</h2>';
    a.ds.forEach(function (c) {
      var d = CH[c];
      h += '<div class="row-item"><div class="r"><span class="t">' + esc(d.ten) + '</span>' + badge('info', d.tuoi + ' tuổi') + '</div><div class="s">Lớp ' + esc(d.lop) + ', ' + esc(d.ma) + '. Chuyên cần ' + dec(d.cc[0] / d.cc[1] * 100, 1) + '%, còn nợ ' + U.fmt(conNo(c)) + ' đồng, ' + unread(c) + ' thông báo chưa đọc.</div>' +
        (a.ds.length > 1 ? '<div style="margin-top:8px"><button class="btn secondary" type="button" data-pick="' + c + '">Xem dữ liệu của ' + esc(d.ten) + '</button></div>' : '') + '</div>';
    });
    h += '<div id="pick-msg" class="alert ok" hidden></div></div>';
    h += '<div class="card"><h2>Giới hạn dữ liệu xem được</h2><p class="small">Mỗi tài khoản chỉ nhận dữ liệu của chính học viên hoặc của con mình. Thử xem điểm của học viên khác:</p>' +
      '<button class="btn danger" type="button" id="l-403">Xem điểm của Võ Ngọc Anh</button><div id="l-403m" class="alert bad" role="alert" style="margin-top:10px" hidden></div></div>';
    h += '<div class="card"><h2>Thông tin liên hệ</h2><p class="small">Số điện thoại 0900000001, email hocvien01@example.com.</p><button class="btn secondary" type="button" data-act="sua" data-toast="Đã gửi yêu cầu cập nhật thông tin liên hệ (minh họa)">Cập nhật thông tin liên hệ</button></div>';
    return h;
  }

  var tries = 0;
  function bindLogin() {
    var tk = document.getElementById('l-tk');
    if (tk && tk.tagName === 'SELECT') tk.addEventListener('change', function () { ssSet(KEY_TK, tk.value); setCon(tk.value); Portal.redraw(); });
    document.getElementById('l-ok').addEventListener('click', function () {
      if (tries >= 5) { U.setMsg('l-msg', 'bad', 'Tài khoản đang bị khóa 15 phút do nhập sai 5 lần.'); return; }
      tries = 0; U.setMsg('l-msg', 'ok', 'Đăng nhập thành công. Phiên hết hạn sau 30 phút không thao tác (minh họa).');
    });
    document.getElementById('l-sai').addEventListener('click', function () {
      tries++;
      if (tries >= 5) U.setMsg('l-msg', 'bad', 'Đã nhập sai ' + tries + ' lần. Tài khoản bị khóa 15 phút.');
      else U.setMsg('l-msg', 'warn', 'Sai mật khẩu, lần ' + tries + ' trên 5. Còn ' + (5 - tries) + ' lần trước khi khóa.');
    });
    document.getElementById('l-403').addEventListener('click', function () {
      var who = CH[cur()].ten;
      U.setMsg('l-403m', 'bad', 'Từ chối (403): tài khoản của ' + who + ' không có quyền xem điểm của Võ Ngọc Anh. Yêu cầu đã được ghi nhật ký.');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-pick]'), function (b) {
      b.addEventListener('click', function () { setCon(b.getAttribute('data-pick')); Portal.redraw(); U.setMsg('pick-msg', 'ok', 'Đã chuyển sang ' + CH[cur()].ten + '. Mọi mục của cổng giờ hiển thị dữ liệu của em.'); });
    });
  }
  function bindTB() {
    Array.prototype.forEach.call(document.querySelectorAll('.row-item .open'), function (b) {
      b.addEventListener('click', function () {
        var it = b.parentNode, id = it.getAttribute('data-id'), nd = it.querySelector('.nd');
        nd.hidden = !nd.hidden; b.setAttribute('aria-expanded', nd.hidden ? 'false' : 'true');
        markRead(cur(), id);
        it.className = 'row-item';
        var sp = b.querySelector('.badge'); sp.className = 'badge muted'; sp.textContent = 'Đã đọc';
        document.getElementById('n-unread').textContent = unread(cur());
        var a = document.querySelector('.p-nav a[href*="m08-05"]'); if (a) a.textContent = 'Thông báo (' + unread(cur()) + ')';
      });
    });
  }

  function gate(root) {
    var P = window.PERMISSIONS, c = P && P.matrix[role] ? P.matrix[role].M08 : null;
    if (!c) return;
    Array.prototype.forEach.call(root.querySelectorAll('[data-act]'), function (b) {
      if (c[b.getAttribute('data-act')] === 'khong') { b.disabled = true; b.setAttribute('aria-disabled', 'true'); }
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-toast]'), function (b) {
      b.addEventListener('click', function () { if (!b.disabled && window.mockupToast) window.mockupToast(b.getAttribute('data-toast')); });
    });
  }

  var Portal = {
    page: '',
    start: function (page) { Portal.page = page; Portal.redraw(); },
    redraw: function () {
      var root = document.getElementById('portal'), k = cur(), p = Portal.page, h = nav(p) + childBar();
      if (p === 'm08-01') h += vLogin();
      else if (p === 'm08-02') {
        h += '<div class="card"><div class="tabs" role="tablist" aria-label="Lịch học và điểm danh"><button role="tab" id="t1" aria-selected="true" aria-controls="pl">Lịch học</button><button role="tab" id="t2" aria-selected="false" aria-controls="pd">Điểm danh</button></div>' +
          '<div id="pl" class="tab-panel" role="tabpanel" aria-labelledby="t1">' + vLich(k) + '</div><div id="pd" class="tab-panel" role="tabpanel" aria-labelledby="t2" hidden>' + vDD(k) + '</div></div>';
      }
      else if (p === 'm08-03') h += '<div class="card"><h2>Học phí của ' + esc(CH[k].ten) + '</h2>' + vHP(k) + '</div>';
      else if (p === 'm08-04') h += '<div class="card">' + vDiem(k) + '</div>';
      else if (p === 'm08-05') h += '<div class="card"><h2>Thông báo của ' + esc(CH[k].ten) + '</h2>' + vTB(k) + '</div>';
      var keepTab = document.querySelector('.tabs button[aria-selected="true"]');
      root.innerHTML = h;
      // chuyển con
      Array.prototype.forEach.call(root.querySelectorAll('.seg button'), function (b) {
        b.addEventListener('click', function () { setCon(b.getAttribute('data-con')); Portal.redraw(); if (window.mockupToast) window.mockupToast('Đã chuyển sang ' + CH[cur()].ten); });
      });
      if (p === 'm08-01') bindLogin();
      if (p === 'm08-05') bindTB();
      if (p === 'm08-02') {
        var tabs = root.querySelectorAll('.tabs button');
        Array.prototype.forEach.call(tabs, function (b) {
          b.addEventListener('click', function () {
            Array.prototype.forEach.call(tabs, function (x) { var on = x === b; x.setAttribute('aria-selected', on ? 'true' : 'false'); document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
          });
        });
        if (keepTab && keepTab.id === 't2') tabs[1].click();
      }
      // gắn lại vai trò vào liên kết nội bộ
      gate(root);
    },
    data: CH
  };
  window.Portal = Portal;
})();
