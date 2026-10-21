'use strict';
// Máy chủ tĩnh cho bản demo, chỉ nghe trên máy này (127.0.0.1). Không cần cài thêm gói nào.
// Chạy: node server.js [cổng]   (mặc định 8686)
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.argv[2] || process.env.PORT || 8686);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root) || path.basename(file) === 'server.js') { res.writeHead(403); res.end('Không được phép'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Không tìm thấy'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => {
  console.log('Bản demo Hồ An Nihongo đang chạy: http://localhost:' + port);
  console.log('Nhấn Ctrl+C để dừng.');
});
