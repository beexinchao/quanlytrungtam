/* Cải tiến dễ dùng v2: giữ nguyên giao diện hiện tại, chạy sau app.js. Không đổi nội dung nghiệp vụ. */
(function () {
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  function run() {
    /* 1. Gom mô tả kỹ thuật (mã SCR/US/UC/FR, bảng quyền) vào mục thu gọn, nhường chỗ cho việc chính */
    var head = $('.page-head');
    if (head && !$('.doc-info', head) && !/^SCR-M(05-03|08-06)$/.test(document.body.getAttribute('data-scr') || '')) {
      var parts = [$('.page-head > p.muted'), $('.page-head > .meta'), $('#perm-info')].filter(Boolean);
      if (parts.length) {
        var d = document.createElement('details');
        d.className = 'doc-info';
        var s = document.createElement('summary');
        s.textContent = 'Thông tin tài liệu (mã màn hình, quyền của vai trò)';
        d.appendChild(s);
        head.appendChild(d);
        parts.forEach(function (p) { d.appendChild(p); });
      }
    }

    /* 2. Mở biểu mẫu thì cuộn tới và đặt con trỏ vào ô đầu tiên */
    $$('[data-show]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = document.getElementById(b.getAttribute('data-show'));
        if (!t || t.hidden) return;
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var f = $('input, select, textarea', t);
        if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }, 350);
      });
    });

    /* 3. Nút bị khóa theo quyền: hiện lý do ngay cạnh nút (không chỉ trong tooltip, vì điện thoại không có tooltip) */
    $$('button[disabled][data-act], .btn[aria-disabled="true"][data-act]').forEach(function (b) {
      if (b.nextElementSibling && b.nextElementSibling.classList.contains('lock-hint')) return;
      var t = b.getAttribute('title');
      if (!t) return;
      var h = document.createElement('span');
      h.className = 'lock-hint';
      h.textContent = t;
      b.insertAdjacentElement('afterend', h);
    });

    /* 4. Dải dữ liệu minh họa: thu thành một dòng, có nút ẩn */
    var banner = $('.demo-banner');
    if (banner && !$('.demo-close', banner)) {
      var x = document.createElement('button');
      x.type = 'button'; x.className = 'demo-close'; x.textContent = 'Ẩn'; x.setAttribute('aria-label', 'Ẩn dải dữ liệu minh họa');
      x.addEventListener('click', function () { banner.style.display = 'none'; });
      banner.appendChild(x);
    }
  }

  /* 5. Ngày hiển thị dd/mm/yyyy (dữ liệu gốc giữ yyyy-mm-dd; ô chọn ngày của trình duyệt tự theo ngôn ngữ máy) */
  var ISO = /\b(20\d{2}|19\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g;
  function vnDate(s) { return s.replace(ISO, function (_, y, m, d) { return d + '/' + m + '/' + y; }); }
  function fixDates(root) {
    var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode && n.parentNode.nodeName;
        if (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        return n.nodeValue.search(/\d{4}-\d{2}-\d{2}/) >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var list = [], n; while ((n = w.nextNode())) list.push(n);
    list.forEach(function (t) { t.nodeValue = vnDate(t.nodeValue); });
    $$('input:not([type]), input[type="text"], input[type="search"]', root || document).forEach(function (i) {
      if (/\d{4}-\d{2}-\d{2}/.test(i.value)) i.value = vnDate(i.value);
    });
  }
  /* Bảng nhiều cột: gắn nhãn cột vào từng ô để CSS hiển thị dạng thẻ trên điện thoại */
  function cardTables() {
    $$('table.data').forEach(function (t) {
      var ths = $$('thead tr:last-child th', t);
      if (ths.length < 3) return;
      var labels = ths.map(function (h) { return h.textContent.trim(); });
      var ok = false;
      $$('tbody tr', t).forEach(function (tr) {
        var tds = $$(':scope > td', tr);
        if (tds.length !== labels.length) return;
        ok = true;
        tds.forEach(function (td, i) {
          if (td.getAttribute('data-label') !== labels[i]) td.setAttribute('data-label', labels[i]);
          /* chỉ gói ô gồm chữ + nhãn nhỏ; không gói ô có nút, ô nhập, liên kết (script của màn hình truy cập theo parentNode) */
          if (td.childNodes.length > 1 && td.querySelector('.tag') && !td.querySelector('button, input, select, textarea, a')) {
            var w = document.createElement('span'); w.className = 'cv';
            while (td.firstChild) w.appendChild(td.firstChild);
            td.appendChild(w);
          }
        });
      });
      if (ok) t.classList.add('as-cards');
    });
  }
  /* Điện thoại và máy tính bảng: menu module thu gọn, nhường chỗ cho nội dung chính */
  function collapseNav() {
    var nav = $('#module-nav');
    if (!nav || $('details.nav-fold', nav) || !window.matchMedia || !window.matchMedia('(max-width: 960px)').matches) return;
    var cur = $('li.current > a', nav);
    var d = document.createElement('details'); d.className = 'nav-fold';
    var s = document.createElement('summary');
    s.textContent = 'Menu: ' + (cur ? cur.textContent : 'chọn module');
    d.appendChild(s);
    while (nav.firstChild) d.appendChild(nav.firstChild);
    nav.appendChild(d);
  }
  function fixAll() { fixDates(); cardTables(); }
  var fixT;
  function watchDates() {
    fixAll();
    if (!window.MutationObserver) return;
    new MutationObserver(function () { clearTimeout(fixT); fixT = setTimeout(fixAll, 60); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* 6. Lối vào "Việc hôm nay" trên mọi màn hình */
  function todayLink() {
    var root = document.body.getAttribute('data-root') || '.';
    var pre = (root === '.' ? '' : root + '/') + 'screens/';
    if (/scr-m(05-03|08-06)/.test(location.pathname) || $('.today-link')) return;
    var base = pre + 'scr-m05-03.html';
    var a = document.createElement('a');
    a.className = 'today-link'; a.textContent = 'Việc hôm nay';
    function sync() {
      var r = null; try { r = sessionStorage.getItem('mockup_vai_tro') || localStorage.getItem('mockup_vai_tro'); } catch (e) { r = null; }
      a.href = (r === 'hoc_vien' || r === 'phu_huynh' ? pre + 'scr-m08-06.html' : base) + (r ? '?vai_tro=' + r : '');
    }
    sync(); a.addEventListener('click', sync);
    var home = $('.topbar .btn-home');
    var bar = $('.topbar');
    if (home) home.parentNode.insertBefore(a, home); else if (bar) bar.appendChild(a);
    /* trang chọn vai trò: nút lớn, hiện khi đã chọn vai trò */
    var hint = $('#role-hint');
    if (hint && !$('.today-cta')) {
      var c = document.createElement('a');
      c.className = 'btn today-cta'; c.textContent = 'Vào Việc hôm nay';
      c.href = base; c.addEventListener('click', function () { var r = null; try { r = sessionStorage.getItem('mockup_vai_tro'); } catch (e) {} if (r) c.href = (r === 'hoc_vien' || r === 'phu_huynh' ? pre + 'scr-m08-06.html' : base) + '?vai_tro=' + r; });
      hint.insertAdjacentElement('afterend', c);
    }
  }

  function runAll() { run(); collapseNav(); todayLink(); watchDates(); }
  if (document.readyState === 'complete') setTimeout(runAll, 0); else window.addEventListener('load', function () { setTimeout(runAll, 0); });
})();
