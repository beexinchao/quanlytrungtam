'use strict';
/* Kho tệp học liệu: lưu tệp tải lên trong IndexedDB của trình duyệt (mọi tab cùng thấy).
   Thông tin tệp (tên, dung lượng, mã tệp) nằm trong dữ liệu chương trình, lớp; nội dung tệp nằm ở đây. */
const Files = {
  p: null,
  open() {
    if (!this.p) {
      this.p = new Promise((res, rej) => {
        const r = indexedDB.open('hoan_nihongo_demo_v3_files', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('files');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return this.p;
  },
  async run(mode, fn) {
    const d = await this.open();
    return new Promise((res, rej) => {
      const t = d.transaction('files', mode); const st = t.objectStore('files');
      const out = fn(st);
      t.oncomplete = () => res(out && out.result !== undefined ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  },
  put(id, blob, name) { return this.run('readwrite', (st) => st.put({ blob, name }, id)); },
  get(id) { return this.run('readonly', (st) => st.get(id)); },
  clear() { return this.run('readwrite', (st) => st.clear()); },
  // tệp mẫu của dữ liệu khởi tạo (ghi bất đồng bộ)
  seed(list) {
    this.clear().catch(() => {}).then(() => Promise.all(list.map((f) => this.put(f.id, new Blob([f.text], { type: 'text/plain;charset=utf-8' }), f.name)))).catch(() => {});
  },
  async upload(file) {
    const id = 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await this.put(id, file, file.name);
    return { kind: 'file', name: file.name, fileId: id, size: file.size, type: file.type || '' };
  },
  // Giáo viên, trợ giảng, học sinh, phụ huynh chỉ xem học liệu ngay trong trang (khung xem có đóng dấu tên người xem),
  // không có nút tải về, không mở tệp ở tab riêng. Chỉ Hồ An (chủ học liệu) tải được bản gốc.
  async openFile(m, download) {
    if (m.kind === 'link') { window.open(m.url, '_blank', 'noopener'); return; }
    const rec = await this.get(m.fileId).catch(() => null);
    if (!rec) { toast('Không tìm thấy nội dung tệp trong trình duyệt này (tệp chỉ lưu trên máy đã tải lên).', 'bad'); return; }
    const me = App.me();
    const url = URL.createObjectURL(rec.blob);
    setTimeout(() => URL.revokeObjectURL(url), 15 * 60e3);
    if (download) {
      if (!me || !me.superAdmin) { toast('Học liệu chỉ được xem trên hệ thống, không tải về.', 'bad'); return; }
      const a = document.createElement('a'); a.href = url; a.download = m.name; a.click(); return;
    }
    const t = rec.blob.type || m.type || '';
    let body;
    if (/^image\//.test(t)) body = '<img class="vw-img" src="' + url + '" alt="' + esc(m.name) + '" draggable="false">';
    else if (t === 'application/pdf') body = '<iframe class="vw-frame" src="' + url + '#toolbar=0&navpanes=0" title="' + esc(m.name) + '"></iframe>';
    else if (/^text\//.test(t)) body = '<pre class="vw-text">' + esc(await rec.blob.text()) + '</pre>';
    else if (/^audio\//.test(t)) body = '<audio class="vw-media" controls controlsList="nodownload noplaybackrate" src="' + url + '"></audio>';
    else if (/^video\//.test(t)) body = '<video class="vw-media" controls controlsList="nodownload" disablePictureInPicture src="' + url + '"></video>';
    else body = none('Tệp "' + m.name + '" chưa xem trực tiếp được trong bản demo. Bản đầy đủ chuyển tệp Word, PowerPoint sang PDF khi tải lên để xem trên web.', 'file');
    const stamp = esc((me ? me.name + (me.code ? ' · ' + me.code : '') : '') + ' · ' + fmt.d(new Date().toISOString()));
    panel({ title: m.name, desc: 'Chỉ xem trên hệ thống, không tải về. Khung xem đóng dấu tên người xem.', wide: true, submit: false, cancel: 'Đóng',
      body: '<div class="vw">' + body + '<div class="vw-wm" aria-hidden="true">' + Array.from({ length: 24 }, () => '<span>' + stamp + '</span>').join('') + '</div></div>' });
  },
  size(n) { if (!n && n !== 0) return ''; if (n < 1024) return n + ' B'; if (n < 1048576) return Math.round(n / 1024) + ' KB'; return (Math.round((n / 1048576) * 10) / 10).toString().replace('.', ',') + ' MB'; },
};
// chặn chuột phải, kéo thả trong khung xem học liệu
['contextmenu', 'dragstart'].forEach((ev) => document.addEventListener(ev, (e) => { if (e.target.closest && e.target.closest('.vw')) e.preventDefault(); }));
