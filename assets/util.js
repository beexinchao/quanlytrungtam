/* Hàm tiện ích dùng chung cho các màn hình mockup: định dạng tiền, đọc vai trò, thông báo minh họa. Không tải tài nguyên ngoài. */
(function () {
  'use strict';
  var U = {};
  U.fmt = function (n) {
    var neg = n < 0; n = Math.abs(Math.round(n));
    var s = String(n), out = '';
    while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (neg ? '-' : '') + s + out;
  };
  U.num = function (v) { var n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10); return isNaN(n) ? 0 : n; };
  U.role = function () {
    var m = /[?&]vai_tro=([a-z_]+)/.exec(location.search);
    if (m) return m[1];
    try { var r = sessionStorage.getItem('mockup_vai_tro'); if (r) return r; } catch (e) { /* bỏ qua */ }
    try { var q = localStorage.getItem('mockup_vai_tro'); if (q) return q; } catch (e2) { /* bỏ qua */ }
    return 'quan_ly';
  };
  U.toast = function (msg) { if (window.mockupToast) window.mockupToast(msg); };
  U.$ = function (id) { return document.getElementById(id); };
  U.setMsg = function (id, cls, text) {
    var e = document.getElementById(id); if (!e) return;
    e.className = 'alert ' + cls; e.textContent = text; e.hidden = false;
  };
  window.U = U;
})();
