'use strict';
/* Kho dữ liệu giả lập của bản demo Hồ An Nihongo (theo bộ tài liệu v5.3).
   - Dữ liệu dùng chung lưu ở localStorage: mọi tab trong cùng trình duyệt thấy thay đổi của nhau ngay.
   - Người đang đăng nhập lưu ở sessionStorage: mỗi tab đăng nhập một tài khoản riêng.
   Không có máy chủ dữ liệu, không gửi gì ra ngoài. Mọi tên, số liệu là giả.
   Bản v3: gọi "lớp" thay cho "khóa học", tên lớp N[cấp độ]K[số]; bài và kiểm tra nhúng từ Google Form;
   học liệu giáo viên bổ sung cho lớp được lưu vào kho đề xuất của chương trình để Hồ An duyệt. */

const DB_KEY = 'hoan_nihongo_demo_v3_db';
const USER_KEY = 'hoan_nihongo_demo_v3_user';
const DB_VERSION = 5;

// ------------------------------------------------------------------ hằng số nghiệp vụ
const ADM_LIST = [
  ['ADM-00', 'Gán, thu hồi quyền Admin', false],
  ['ADM-01', 'Tạo tài khoản', true],
  ['ADM-02', 'Khóa, mở khóa tài khoản', true],
  ['ADM-03', 'Xóa (mềm) tài khoản', true],
  ['ADM-04', 'Sửa thông tin tài khoản', true],
  ['ADM-05', 'Tạo lớp học', true],
  ['ADM-06', 'Sửa thông tin lớp học', true],
  ['ADM-07', 'Khóa, xóa (mềm) lớp học', true],
  ['ADM-08', 'Phân công phụ trách lớp học', true],
  ['ADM-09', 'Thêm, rút, chuyển học sinh trong lớp', true],
  ['ADM-10', 'Duyệt xin nghỉ, dạy bù của Giáo viên, Trợ giảng', false],
  ['ADM-11', 'Xem báo cáo mọi lớp', true],
  ['ADM-12', 'Sửa cấu hình chung', true],
  ['ADM-13', 'Soạn chương trình học (cho Trợ giảng)', true],
];

const PARAMS = [
  ['zoomTruoc', 'Hiện nút Vào Zoom và cho mở điểm danh trước giờ học', 15, 'phút'],
  ['diMuonSau', 'Tính Đi muộn khi điểm danh sau giờ bắt đầu', 10, 'phút'],
  ['qrDoiMoi', 'Mã QR điểm danh đổi mới sau mỗi', 20, 'giây'],
  ['chotSau', 'Tự chốt điểm danh sau giờ kết thúc', 30, 'phút'],
  ['suaSauChot', 'Người phụ trách được sửa điểm danh sau chốt trong', 3, 'ngày'],
  ['baoMuon', 'Đơn xin nghỉ gửi sát giờ học hơn mốc này bị gắn nhãn báo muộn', 12, 'giờ'],
  ['vangLienTiep', 'Cảnh báo khi học sinh vắng liên tiếp', 2, 'buổi'],
  ['diemThap', 'Cảnh báo điểm thấp dưới', 5, 'điểm (thang 10)'],
  ['baoCaoTre', 'Báo cáo buổi bị tính quá hạn sau khi buổi kết thúc', 12, 'giờ'],
  ['tepToiDa', 'Dung lượng tối đa mỗi tệp học liệu', 20, 'MB'],
];

const ROLE_NAME = { gv: 'Giáo viên', tg: 'Trợ giảng', hs: 'Học sinh', ph: 'Phụ huynh' };
const COURSE_STATUS = {
  nhap: ['Nháp', 'xam'], cho: ['Chờ khai giảng', 'tim'], dang_hoc: ['Đang học', 'xanh'],
  ket_thuc: ['Đã kết thúc', 'xam'], tam_khoa: ['Tạm khóa', 'vang'], da_huy: ['Đã hủy', 'do'], da_xoa: ['Đã xóa', 'do'],
};
const MODE_NAME = { online: 'Online (Zoom)', offline: 'Tại trung tâm', ket_hop: 'Kết hợp' };
const ATT = {
  co_mat: ['Có mặt', 'co-mat'], di_muon: ['Đi muộn', 'di-muon'],
  vang_cp: ['Vắng có phép', 'vang-cp'], vang_kp: ['Vắng không phép', 'vang-kp'],
};
const ASG_TYPE = { bai_tap: 'Bài tập', test: 'Test', giua_khoa: 'Kiểm tra giữa kỳ', cuoi_khoa: 'Kiểm tra cuối kỳ' };
// kiểu câu của Google Form mô phỏng (chỉ dùng cho dữ liệu mẫu, xem formView trong p_assign.js)
const Q_KIND = { mc: 'Trắc nghiệm', cb: 'Hộp kiểm', dd: 'Menu thả xuống', short: 'Câu trả lời ngắn', para: 'Đoạn' };
const PROG_STATUS = { sap_ra_mat: 'Sắp ra mắt', ap_dung: 'Đang áp dụng', ngung: 'Ngừng dùng' };
const SUG_STATUS = { cho: ['Chờ Hồ An duyệt', 'warn'], da_them: ['Đã thêm vào chương trình', 'ok'], bo_qua: ['Không thêm', ''] };
const REQ_KIND = { hs_nghi: 'Xin nghỉ học', nop_muon: 'Xin nộp muộn', gv_nghi: 'Xin nghỉ dạy', day_bu: 'Đăng ký dạy bù' };
const REQ_STATUS = { cho: ['Chờ xử lý', 'vang'], duyet: ['Đã chấp nhận', 'xanh'], tu_choi: ['Từ chối', 'do'], huy: ['Đã hủy', 'xam'] };

// ------------------------------------------------------------------ tiện ích ngày giờ
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const at = (dateStr, hm) => { const d = parseYmd(dateStr); const [h, m] = hm.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
const todayStr = () => ymd(new Date());
const nowIso = () => new Date().toISOString();
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DOW_FULL = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function rng(seed) { // mulberry32: dữ liệu giả lập giống nhau mỗi lần đặt lại
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let idCounter = 0;
const newId = (p) => p + '_' + Date.now().toString(36) + (idCounter++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

// ------------------------------------------------------------------ nội dung mẫu
const N5_LESSONS = [
  'Hiragana hàng あ đến さ', 'Hiragana hàng た đến は', 'Hiragana hàng ま đến ん, âm đục', 'Katakana cơ bản',
  'Chào hỏi, giới thiệu bản thân', 'Đây là cái gì: これ, それ, あれ', 'Số đếm, giờ giấc', 'Động từ ます: đi, đến, về',
  'Động từ ます: ăn, uống, xem', 'Tính từ い và な', 'Có và ở: あります, います', 'Ôn tập, kiểm tra giữa kỳ',
  'So sánh hơn, nhất', 'Thể て: nhờ vả, xin phép', 'Thể て: đang làm', 'Thể ない: không làm',
  'Thể từ điển: sở thích, khả năng', 'Thể た: kinh nghiệm', 'Cách nói lịch sự trong lớp', 'Đọc hiểu đoạn ngắn',
  'Nghe hiểu hội thoại hằng ngày', 'Luyện đề N5 (phần 1)', 'Luyện đề N5 (phần 2)', 'Kiểm tra cuối kỳ',
];
const N4_LESSONS = [
  'Ôn tập N5', 'Thể khả năng', 'Thể ý chí: định làm', 'Thể mệnh lệnh, cấm chỉ', 'Câu điều kiện と', 'Câu điều kiện ば',
  'Câu điều kiện たら, なら', 'Cho và nhận: あげます, もらいます, くれます', 'Cho nhận với thể て', 'Thể bị động',
  'Thể sai khiến', 'Thể sai khiến bị động', 'Kính ngữ: tôn kính ngữ', 'Kính ngữ: khiêm nhường ngữ', 'Ôn tập, kiểm tra giữa kỳ',
  'Dự đoán: そうです, ようです', 'Truyền đạt: らしい, そうです', 'Mục đích: ために, ように', 'Thay đổi: ようになる',
  'Liệt kê: し, たり', 'Thời điểm: とき, あいだ', 'Trước sau: まえに, あとで', 'Đọc hiểu thư, thông báo', 'Đọc hiểu đoạn trung bình',
  'Nghe hiểu: chọn tranh', 'Nghe hiểu: ý chính', 'Luyện đề N4 (phần 1)', 'Luyện đề N4 (phần 2)', 'Luyện đề N4 (phần 3)', 'Kiểm tra cuối kỳ',
];
const N3_LESSONS = Array.from({ length: 36 }, (_, i) => (i === 17 ? 'Ôn tập, kiểm tra giữa kỳ' : i === 35 ? 'Kiểm tra cuối kỳ' : 'Bài ' + (i + 1) + ': (đang soạn)'));

const COMMENT_TEMPLATES = [
  'Lớp tập trung tốt, phát âm tiến bộ rõ.',
  'Cả lớp nắm được mẫu câu chính; cần ôn thêm từ vựng ở nhà.',
  'Một số bạn còn nhầm trợ từ は và が, buổi sau sẽ luyện thêm.',
  'Em tích cực phát biểu, làm bài đầy đủ.',
  'Em cần luyện viết chữ đều hơn và nộp bài đúng hạn.',
  'Em vắng buổi này, nhờ phụ huynh nhắc em xem lại học liệu.',
];

const QSET = {
  dong_tu: [
    { kind: 'mc', text: '「たべます」 nghĩa là gì?', options: ['Ăn', 'Uống', 'Ngủ', 'Đi'], answer: 0, points: 2 },
    { kind: 'cb', text: 'Chọn tất cả các động từ:', options: ['のみます', 'あかい', 'いきます', 'ほん'], answer: [0, 2], points: 2 },
    { kind: 'short', text: 'Viết bằng hiragana từ có nghĩa là "nước".', options: [], answer: ['みず'], points: 2 },
    { kind: 'para', text: 'Dịch sang tiếng Nhật: "Tôi ăn cơm lúc 7 giờ."', options: [], answer: null, points: 4 },
  ],
  tinh_tu: [
    { kind: 'mc', text: '「おおきい」 thuộc loại từ nào?', options: ['Tính từ い', 'Tính từ な', 'Danh từ', 'Động từ'], answer: 0, points: 2 },
    { kind: 'dd', text: 'この へやは ＿＿＿ です。 Chọn từ đúng.', options: ['しずか', 'しずかな', 'しずかい', 'しずかの'], answer: 0, points: 2 },
    { kind: 'short', text: 'Từ trái nghĩa với 「たかい」 (đắt) là gì? Viết bằng hiragana.', options: [], answer: ['やすい'], points: 2 },
    { kind: 'para', text: 'Viết 2 câu mô tả căn phòng của em, có dùng tính từ.', options: [], answer: null, points: 4 },
  ],
  katakana: [
    { kind: 'mc', text: 'Chữ 「コ」 đọc là gì?', options: ['ko', 'yu', 'ro', 'ni'], answer: 0, points: 2 },
    { kind: 'mc', text: 'Từ 「テレビ」 nghĩa là gì?', options: ['Ti vi', 'Điện thoại', 'Máy tính', 'Bàn'], answer: 0, points: 2 },
    { kind: 'short', text: 'Viết "cà phê" bằng katakana.', options: [], answer: ['コーヒー'], points: 3 },
    { kind: 'cb', text: 'Chọn các chữ katakana:', options: ['ア', 'あ', 'カ', 'き'], answer: [0, 2], points: 3 },
  ],
  giua_khoa_n5: [
    { kind: 'mc', text: 'わたしは まいあさ コーヒーを ＿＿＿。', options: ['のみます', 'たべます', 'ねます', 'いきます'], answer: 0, points: 1 },
    { kind: 'mc', text: '「これは なんですか」 nghĩa là gì?', options: ['Đây là cái gì?', 'Kia là ai?', 'Ở đâu?', 'Bao nhiêu tiền?'], answer: 0, points: 1 },
    { kind: 'mc', text: 'つくえの うえに ほんが ＿＿＿。', options: ['あります', 'います', 'です', 'します'], answer: 0, points: 1 },
    { kind: 'dd', text: 'いま ＿＿＿ じですか。 (Bây giờ là mấy giờ?)', options: ['なん', 'なに', 'どこ', 'だれ'], answer: 0, points: 1 },
    { kind: 'cb', text: 'Chọn các tính từ な:', options: ['きれい', 'たかい', 'しずか', 'あつい'], answer: [0, 2], points: 2 },
    { kind: 'short', text: 'Đọc số 「よんじゅう」 là bao nhiêu? (viết bằng số)', options: [], answer: ['40'], points: 1 },
    { kind: 'para', text: 'Viết đoạn 3 câu giới thiệu bản thân bằng tiếng Nhật.', options: [], answer: null, points: 3 },
  ],
  so_sanh: [
    { kind: 'mc', text: 'ハノイ ＿＿＿ ホーチミンの ほうが あついです。', options: ['より', 'から', 'まで', 'で'], answer: 0, points: 2 },
    { kind: 'short', text: 'Hoàn thành: くだもので なにが いちばん ＿＿＿ ですか。 (thích)', options: [], answer: ['すき'], points: 2 },
    { kind: 'para', text: 'So sánh hai mùa trong năm mà em thích, viết 2 câu.', options: [], answer: null, points: 4 },
  ],
  the_te: [
    { kind: 'mc', text: 'Thể て của 「かきます」 là gì?', options: ['かいて', 'かって', 'かきて', 'かんで'], answer: 0, points: 2 },
    { kind: 'mc', text: 'Thể て của 「のみます」 là gì?', options: ['のんで', 'のみて', 'のって', 'のいて'], answer: 0, points: 2 },
    { kind: 'short', text: 'Thể て của 「いきます」 (viết hiragana).', options: [], answer: ['いって'], points: 2 },
    { kind: 'para', text: 'Viết 2 câu nhờ vả lịch sự dùng 〜てください。', options: [], answer: null, points: 4 },
  ],
  tu_vung_n4: [
    { kind: 'mc', text: '「けいけん」 nghĩa là gì?', options: ['Kinh nghiệm', 'Kinh tế', 'Cảnh sát', 'Kế hoạch'], answer: 0, points: 2 },
    { kind: 'mc', text: '「よやく」 nghĩa là gì?', options: ['Đặt trước', 'Dịch', 'Hẹn hò', 'Thuốc'], answer: 0, points: 2 },
    { kind: 'dd', text: 'Chọn cách đọc của 「旅行」:', options: ['りょこう', 'りょうこう', 'りょこ', 'たびこう'], answer: 0, points: 2 },
    { kind: 'cb', text: 'Chọn các từ chỉ thời tiết:', options: ['あめ', 'ゆき', 'いす', 'くもり'], answer: [0, 1, 3], points: 4 },
  ],
  cuoi_khoa_n4: [
    { kind: 'mc', text: 'あめが ＿＿＿、しあいは ちゅうしです。', options: ['ふったら', 'ふって', 'ふる', 'ふらない'], answer: 0, points: 2 },
    { kind: 'mc', text: 'せんせいに しゅくだいを ＿＿＿。', options: ['ほめられました', 'ほめました', 'ほめさせました', 'ほめて'], answer: 0, points: 2 },
    { kind: 'dd', text: 'しゃちょうは もう お＿＿＿に なりました。', options: ['かえり', 'かえる', 'かえって', 'かえた'], answer: 0, points: 2 },
    { kind: 'short', text: 'Thể khả năng của 「よみます」 (thể ます, hiragana).', options: [], answer: ['よめます'], points: 2 },
    { kind: 'para', text: 'Viết đoạn 4 câu kể về một chuyến đi, dùng ít nhất một câu điều kiện.', options: [], answer: null, points: 2 },
  ],
};
// Tên lớp theo mẫu N[cấp độ]K[số], ví dụ N5K12 (cấp độ N5, lớp thứ 12 của cấp độ này)
const className = (level, no) => String(level || '').replace(/\s+/g, '') + 'K' + String(no).padStart(2, '0');
const nextClassNo = (db, level) => Math.max(0, ...db.courses.filter((c) => c.level === level).map((c) => Number(c.no) || 0)) + 1;
// Đường dẫn Google Form mô phỏng của dữ liệu mẫu; dán link Google Form thật thì trang nhúng form thật
const demoFormUrl = (key) => 'https://docs.google.com/forms/d/e/DEMO-' + key + '/viewform';
const fmt10 = (n) => (n == null ? '(chưa có)' : String(n).replace('.', ','));

// Đường dẫn Google Form: kiểm tra, chuẩn hóa về link làm bài (viewform), tạo link nhúng
const FormLink = {
  BAD: 'Đường dẫn chưa đúng. Dán link Google Form, ví dụ https://forms.gle/... hoặc https://docs.google.com/forms/d/e/.../viewform',
  demoKey(url) { const m = /\/forms\/d\/e\/DEMO-(\w+)\/viewform/.exec(url || ''); return m && QSET[m[1]] ? m[1] : null; },
  parse(raw) {
    const s = String(raw || '').trim();
    if (!s) return { ok: false, msg: 'Dán đường dẫn Google Form của bài.' };
    let u; try { u = new URL(s); } catch (e) { return { ok: false, msg: FormLink.BAD }; }
    if (u.protocol !== 'https:') return { ok: false, msg: 'Đường dẫn cần bắt đầu bằng https://' };
    if (u.hostname === 'forms.gle') return /^\/[\w-]+\/?$/.test(u.pathname) ? { ok: true, url: s, short: true } : { ok: false, msg: FormLink.BAD };
    if (u.hostname !== 'docs.google.com') return { ok: false, msg: 'Chỉ nhận đường dẫn Google Form (docs.google.com/forms hoặc forms.gle).' };
    const m = /^\/forms(?:\/u\/\d+)?\/d\/(e\/)?([\w-]{10,})(?:\/(viewform|edit|formResponse|prefill))?\/?$/.exec(u.pathname);
    if (!m) return { ok: false, msg: FormLink.BAD };
    const edit = m[3] === 'edit' || m[3] === 'prefill';
    const q = new URLSearchParams(u.search); ['embedded', 'edit_requested'].forEach((k) => q.delete(k)); if (edit) q.delete('usp');
    const url = 'https://docs.google.com/forms/d/' + (m[1] ? 'e/' : '') + m[2] + '/viewform' + (q.toString() ? '?' + q.toString() : '');
    return { ok: true, url, edit, demo: FormLink.demoKey(url) };
  },
  // link nhúng cho một học sinh: thêm embedded=true (plain: link mở ở tab mới), tự điền mã học viên nếu bài có mã ô
  embed(a, u, plain) {
    const fi = FormLink.parse(a.formUrl); if (!fi.ok) return '';
    if (fi.short) return fi.url;
    const x = new URL(fi.url); if (!plain) x.searchParams.set('embedded', 'true');
    if (a.codeEntry && u && u.code) { x.searchParams.set('usp', 'pp_url'); x.searchParams.set(a.codeEntry, u.code); }
    return x.toString();
  },
};

// ------------------------------------------------------------------ dữ liệu khởi tạo
// Chỉ 5 tài khoản đăng nhập được: Hồ An, Giáo viên A, Trợ giảng B, Học sinh C, Phụ huynh D.
// Các học sinh khác là dữ liệu minh họa (loginable: false) để lớp có số liệu điểm danh, điểm, báo cáo.
const LOGIN_IDS = ['u_hoan', 'u_gva', 'u_tgb', 'u_hsc', 'u_phd'];

// Nội dung chi tiết 13 buổi đầu của Sơ cấp N5: [mục tiêu, nội dung, tệp từ vựng]
const N5_DETAIL = [
  ['Đọc, viết đúng 25 chữ hàng あ đến さ.', 'Khởi động (10 phút)\n- Làm quen lớp, giới thiệu ba bảng chữ tiếng Nhật.\nNội dung chính (60 phút)\n- Hàng あ, か, さ: cách đọc, thứ tự nét, chữ dễ nhầm (さ - ち).\n- Âm dài cơ bản: ああ, いい.\nLuyện tập (20 phút)\n- Đọc to theo cặp, viết chính tả 10 chữ.', 'あ a\nい i\nう u\nえ e\nお o\nか ka\nき ki\nく ku\nけ ke\nこ ko\nさ sa\nし shi\nす su\nせ se\nそ so'],
  ['Đọc, viết đúng hàng た đến は.', 'Ôn tập (10 phút)\n- Chính tả hàng あ đến さ.\nNội dung chính (60 phút)\n- Hàng た, な, は; chữ đặc biệt ち, つ, ふ.\n- Phân biệt ぬ - め, は - ほ.\nLuyện tập (20 phút)\n- Trò chơi ghép thẻ chữ, đọc từ ngắn: たこ, なつ, はな.', 'た ta\nち chi\nつ tsu\nて te\nと to\nな na\nに ni\nぬ nu\nね ne\nの no\nは ha\nひ hi\nふ fu\nへ he\nほ ho'],
  ['Hoàn thành bảng Hiragana, đọc âm đục, âm ghép.', 'Nội dung chính\n- Hàng ま, や, ら, わ, ん.\n- Âm đục, bán đục: が, ざ, だ, ば, ぱ.\n- Âm ghép: きゃ, しゅ, ちょ.\nLuyện tập\n- Đọc 20 từ thông dụng, viết tên mình bằng Hiragana.', 'ま ma\nみ mi\nむ mu\nめ me\nも mo\nや ya\nゆ yu\nよ yo\nら ra\nり ri\nる ru\nれ re\nろ ro\nわ wa\nを wo\nん n'],
  ['Đọc được Katakana cơ bản và từ mượn thông dụng.', 'Nội dung chính\n- 46 chữ Katakana, so sánh với Hiragana.\n- Trường âm ー, âm ngắt ッ trong từ mượn.\nLuyện tập\n- Đọc thực đơn quán cà phê: コーヒー, ジュース, ケーキ.\n- Test nhanh Katakana cuối buổi.', 'コーヒー cà phê\nテレビ ti vi\nパン bánh mì\nカメラ máy ảnh\nノート vở'],
  ['Tự giới thiệu bản thân và chào hỏi đúng tình huống.', 'Mẫu câu\n- わたしは ～です。\n- ～じゃ ありません。\n- はじめまして。どうぞ よろしく おねがいします。\nHội thoại\n- Chào buổi sáng, trưa, tối; chào khi gặp lần đầu.\nLuyện tập\n- Đóng vai giới thiệu bản thân 30 giây.', 'わたし tôi\nがくせい học sinh\nせんせい giáo viên\nかいしゃいん nhân viên công ty\nベトナムじん người Việt Nam'],
  ['Hỏi, trả lời về đồ vật xung quanh.', 'Mẫu câu\n- これ / それ / あれ は ～です。\n- これは なんですか。\n- この / その / あの + danh từ.\nLuyện tập\n- Hỏi đáp về đồ vật trong lớp, chơi trò đoán đồ vật.', 'ほん sách\nかばん cặp\nかさ ô\nとけい đồng hồ\nつくえ bàn'],
  ['Đọc số đến 10.000, nói giờ, hỏi giờ.', 'Nội dung chính\n- Số đếm 1 đến 10.000; cách đọc đặc biệt 4, 7, 9.\n- いま なんじですか。～じ ～ふんです。\nLuyện tập\n- Nghe giờ và vẽ kim đồng hồ; hỏi giá đồ vật.', 'いち 1\nに 2\nさん 3\nよん 4\nなな 7\nきゅう 9\nじゅう 10\nひゃく 100\nせん 1.000\nまん 10.000'],
  ['Dùng động từ di chuyển với trợ từ へ, で, と.', 'Mẫu câu\n- ～へ いきます / きます / かえります。\n- でんしゃで いきます。ともだちと いきます。\nLuyện tập\n- Kể lịch trình cuối tuần, hỏi bạn đi đâu bằng gì.', 'いきます đi\nきます đến\nかえります về\nでんしゃ tàu điện\nバス xe buýt'],
  ['Dùng động từ thể ます với trợ từ を.', 'Mẫu câu\n- ～を たべます / のみます / みます。\n- いっしょに ～ませんか。\nLuyện tập\n- Mời bạn đi ăn, xem phim; bài tập về nhà: Động từ thể ます.', 'たべます ăn\nのみます uống\nみます xem\nよみます đọc\nかきます viết'],
  ['Phân biệt tính từ い và な, dùng để mô tả.', 'Mẫu câu\n- ～は おおきいです。～は しずかです。\n- Phủ định: おおきくないです、しずかじゃ ありません。\nLuyện tập\n- Mô tả căn phòng, thành phố của em; bài tập về nhà: Tính từ い và な.', 'おおきい to\nちいさい nhỏ\nたかい đắt, cao\nやすい rẻ\nしずか yên tĩnh\nきれい đẹp'],
  ['Nói vị trí người, vật với あります, います.', 'Mẫu câu\n- つくえの うえに ほんが あります。\n- きょうしつに せんせいが います。\n- Từ chỉ vị trí: うえ, した, なか, となり.\nLuyện tập\n- Mô tả tranh căn phòng, tìm đồ vật theo chỉ dẫn.', 'うえ trên\nした dưới\nなか trong\nとなり bên cạnh\nまえ trước\nうしろ sau'],
  ['Ôn tập bài 1 đến 11, làm kiểm tra giữa kỳ.', 'Ôn tập (40 phút)\n- Tổng hợp mẫu câu bài 5 đến 11, giải đáp thắc mắc.\nKiểm tra giữa kỳ (30 phút)\n- Làm trên Google Form nhúng trong hệ thống, một lần.\n- Điểm công bố sau khi giáo viên xem xét.', ''],
  ['So sánh hơn, nhất với より, いちばん.', 'Mẫu câu\n- A は B より ～です。\n- A と B と どちらが ～ですか。\n- ～の なかで なにが いちばん ～ですか。\nLuyện tập\n- So sánh hai thành phố, chọn món ăn yêu thích nhất lớp.', 'より hơn\nいちばん nhất\nどちら cái nào (trong hai)\nほう phía, bên'],
];

function lessonsFor(titles, detail, generic) {
  return titles.map((t, i) => {
    const d = detail && detail[i];
    return { title: t, goal: d ? d[0] : 'Nắm từ vựng, mẫu câu chính của bài; luyện nghe nói trong lớp.',
      content: d ? d[1] : generic === false ? '' : '- Từ vựng và mẫu câu của bài.\n- Luyện nghe, nói theo cặp.\n- Bài tập củng cố cuối buổi.', note: '', materials: [] };
  });
}

function seed() {
  const today = startOfDay(new Date());
  const T = (n) => ymd(addDays(today, n));
  const r = rng(20261021);
  const db = {
    version: DB_VERSION, rev: 0, seededAt: nowIso(),
    users: [], programs: [], courses: [], sessions: [], materials: [], assignments: [],
    submissions: [], qna: [], requests: [], logs: [], loginFails: {},
    config: {
      centerName: 'Hồ An Nihongo',
      levels: ['N5', 'N4', 'N3', 'N2', 'N1'],
      holidays: [{ date: T(16), name: 'Trung tâm nghỉ bảo trì phòng học (minh họa)' }, { date: '2027-01-01', name: 'Tết Dương lịch' }],
      params: Object.fromEntries(PARAMS.map((p) => [p[0], p[2]])),
      templates: COMMENT_TEMPLATES.slice(),
    },
  };
  const ALL_ADM = ADM_LIST.map((a) => a[0]);
  const U = (o) => {
    const u = Object.assign({ status: 'active', adm: [], superAdmin: false, phMode: false, parentIds: [], childIds: [], loginable: false,
      password: '123456', phone: '', mustChangePw: false, createdAt: T(-160) + 'T08:00:00.000Z' }, o);
    db.users.push(u); return u;
  };
  U({ id: 'u_hoan', code: 'GV-0001', name: 'Hồ An', role: 'gv', email: 'hoan@demo.vn', phone: '0900000001', superAdmin: true, adm: ALL_ADM, loginable: true });
  U({ id: 'u_gva', code: 'GV-0002', name: 'Giáo viên A', role: 'gv', email: 'giaovien.a@demo.vn', phone: '0900000002', adm: ['ADM-11'], loginable: true });
  U({ id: 'u_tgb', code: 'TG-0001', name: 'Trợ giảng B', role: 'tg', email: 'trogiang.b@demo.vn', phone: '0900000003', loginable: true });
  U({ id: 'u_hsc', code: 'HV-0001', name: 'Học sinh C', role: 'hs', email: 'hocsinh.c@demo.vn', phone: '0910000001', loginable: true });
  U({ id: 'u_phd', code: '', name: 'Phụ huynh D', role: 'ph', email: 'phuhuynh.d@demo.vn', phone: '0920000001', childIds: ['u_hsc'], loginable: true });
  const skill = { u_hsc: 0.8 };
  const DATA_HS = [
    ['u_s1', 'Đỗ Ngọc Ánh', 0.9], ['u_s2', 'Vũ Đức Anh', 0.55], ['u_s3', 'Lê Khánh Linh', 0.86], ['u_s4', 'Trịnh Minh Quân', 0.7], ['u_s5', 'Nguyễn Bảo Nhi', 0.78, true],
    ['u_s6', 'Phạm Gia Linh', 0.88], ['u_s7', 'Hoàng Anh Tuấn', 0.72], ['u_s8', 'Ngô Phương Thảo', 0.92], ['u_s9', 'Bùi Hải Đăng', 0.64], ['u_s10', 'Đặng Thu Hà', 0.8],
    ['u_s11', 'Cao Minh Khoa', 0.77], ['u_s12', 'Lý Thanh Vân', 0.85], ['u_s13', 'Đinh Gia Bảo', 0.6], ['u_s14', 'Tô Minh Châu', 0.82], ['u_s15', 'Hà Quang Vinh', 0.7],
    ['u_s16', 'Lâm Gia Hân', 0.9], ['u_s17', 'Kiều Anh Dũng', 0.66], ['u_s18', 'Mạc Thùy Linh', 0.8], ['u_s19', 'Phùng Đức Toàn', 0.74],
    ['u_s20', 'Phan Nhật Nam', 0.8], ['u_s21', 'Mai Anh Thư', 0.85],
  ];
  DATA_HS.forEach(([id, name, s, ph], i) => { skill[id] = s; U({ id, code: 'HV-' + String(i + 2).padStart(4, '0'), name, role: 'hs', email: id.slice(2) + '@hocsinh.minhhoa', phone: '0911' + String(100000 + i), phMode: !!ph }); });
  U({ id: 'u_ph2', code: '', name: 'Đỗ Thị Hương', role: 'ph', email: 'huong@phuhuynh.minhhoa', phone: '0921000002', childIds: ['u_s1'] });
  db.users.forEach((u) => { if (u.role === 'ph') u.childIds.forEach((c) => db.users.find((x) => x.id === c).parentIds.push(u.id)); });
  U({ id: 'u_cu', code: 'HV-0099', name: 'Trương Văn Cũ', role: 'hs', email: 'cu@hocsinh.minhhoa', status: 'locked', lockReason: 'Tạm dừng học (minh họa)' });

  // Chương trình học: Sơ cấp N5 có nội dung chi tiết và học liệu cho 13 buổi đầu
  const W = { bai_tap: 20, test: 20, giua_khoa: 25, cuoi_khoa: 35 };
  const n5 = lessonsFor(N5_LESSONS, N5_DETAIL, false);
  const seedFiles = [];
  n5.forEach((l, i) => {
    const d = N5_DETAIL[i];
    if (!d) return;
    if (d[2]) {
      const fid = 'f_seed_n5_' + (i + 1);
      const text = 'Hồ An Nihongo - Sơ cấp N5 - Buổi ' + (i + 1) + ': ' + l.title + '\n(Tài liệu minh họa)\n\n' + d[2] + '\n';
      seedFiles.push({ id: fid, name: 'tu_vung_buoi_' + (i + 1) + '.txt', text });
      l.materials.push({ id: 'm_n5_f' + (i + 1), kind: 'file', name: 'Từ vựng buổi ' + (i + 1) + '.txt', fileId: fid, size: new Blob([text]).size, type: 'text/plain', by: 'u_hoan', at: T(-70) + 'T09:00:00.000Z' });
    }
    if (i < 4) l.materials.push({ id: 'm_n5_l' + (i + 1), kind: 'link', name: 'Video hướng dẫn viết chữ (minh họa)', url: 'https://example.com/n5/buoi-' + (i + 1), by: 'u_hoan', at: T(-70) + 'T09:00:00.000Z' });
  });
  n5[11].note = 'Nhắc học sinh sạc pin điện thoại hoặc mang laptop để làm bài kiểm tra.';
  db.programs.push(
    { id: 'p_n5', name: 'Sơ cấp N5', level: 'N5', nSessions: 24, minutes: 90, status: 'ap_dung', version: 2, weights: W,
      desc: 'Làm quen bảng chữ, ngữ pháp và từ vựng nền tảng, đủ để thi JLPT N5.', goal: 'Đọc viết thành thạo Hiragana, Katakana; khoảng 800 từ vựng; giao tiếp cơ bản.',
      lessons: n5, suggestions: [], createdBy: 'u_hoan', updatedAt: T(-60) + 'T09:00:00.000Z' },
    { id: 'p_n4', name: 'Sơ cấp N4', level: 'N4', nSessions: 30, minutes: 90, status: 'ap_dung', version: 1, weights: W,
      desc: 'Hoàn thiện ngữ pháp sơ cấp, kính ngữ cơ bản, luyện đọc nghe theo dạng đề N4.', goal: 'Khoảng 1.500 từ vựng, 300 chữ Hán; đọc hiểu đoạn trung bình.',
      lessons: lessonsFor(N4_LESSONS), suggestions: [], createdBy: 'u_hoan', updatedAt: T(-140) + 'T09:00:00.000Z' },
    { id: 'p_n3', name: 'Trung cấp N3', level: 'N3', nSessions: 36, minutes: 120, status: 'sap_ra_mat', version: 1, weights: W,
      desc: 'Chương trình đang soạn cho lớp trung cấp đầu tiên.', goal: 'Đọc báo đơn giản, nghe hội thoại tự nhiên.',
      lessons: lessonsFor(N3_LESSONS, null, false), suggestions: [], createdBy: 'u_gva', updatedAt: T(-3) + 'T09:00:00.000Z' },
  );
  // tệp học liệu giáo viên bổ sung cho lớp (dùng cho đề xuất mẫu bên dưới)
  const extraText = 'Bảng luyện viết Katakana - lớp N5K12\n(Tài liệu minh họa do Giáo viên A soạn thêm)\n\nア イ ウ エ オ\nカ キ ク ケ コ\nサ シ ス セ ソ\n';
  seedFiles.push({ id: 'f_seed_extra_1', name: 'luyen_viet_katakana.txt', text: extraText });
  if (typeof Files !== 'undefined') Files.seed(seedFiles);

  // Lớp học
  const d0 = today.getDay();
  const prog = (id) => db.programs.find((p) => p.id === id);
  function mkCourse(o, pastCount, startOverride) {
    const p = prog(o.programId);
    const c = Object.assign({ programVersion: p.version, level: p.level, nSessions: p.nSessions, zoom: '', room: '',
      createdAt: T(-160) + 'T08:00:00.000Z', lessons: JSON.parse(JSON.stringify(p.lessons)), report: null }, o);
    c.name = className(c.level, c.no);
    c.days.sort((a, b) => a - b);
    if (startOverride) c.startDate = startOverride;
    else {
      let d = addDays(today, -1); let n = 0;
      while (true) { if (c.days.includes(d.getDay())) { n++; if (n === pastCount) break; } d = addDays(d, -1); }
      c.startDate = ymd(d);
    }
    c.members = (o.memberIds || []).map((uid) => ({ uid, joinedAt: c.startDate + 'T00:00:00.000Z', leftAt: null, reason: '' }));
    delete c.memberIds;
    db.courses.push(c);
    if (c.status !== 'nhap' && c.status !== 'cho') generateSessions(db, c);
    return c;
  }
  const C1 = mkCourse({ id: 'c_n5k12', no: 12, programId: 'p_n5', mode: 'online', zoom: 'https://zoom.us/j/0000000012',
    days: [d0, (d0 + 2) % 7, (d0 + 4) % 7], start: '19:00', end: '20:30', status: 'dang_hoc', teacherId: 'u_gva',
    staffIds: ['u_gva', 'u_tgb'], memberIds: ['u_hsc', 'u_s1', 'u_s2', 'u_s3', 'u_s4', 'u_s5'] }, 12);
  const C2 = mkCourse({ id: 'c_n4k08', no: 8, programId: 'p_n4', mode: 'offline', room: 'Phòng 201',
    days: [(d0 + 1) % 7, (d0 + 4) % 7], start: '09:00', end: '10:30', status: 'dang_hoc', teacherId: 'u_hoan',
    staffIds: ['u_hoan', 'u_tgb'], memberIds: ['u_s6', 'u_s7', 'u_s8', 'u_s9', 'u_s10'] }, 10);
  const C3 = mkCourse({ id: 'c_n5k11', no: 11, programId: 'p_n5', mode: 'offline', room: 'Phòng 101',
    days: [2, 4], start: '08:30', end: '10:00', status: 'ket_thuc', teacherId: 'u_hoan', staffIds: ['u_hoan'],
    memberIds: ['u_s11', 'u_s12', 'u_s13', 'u_s14', 'u_s15'] }, 0, T(-130));
  const C4 = mkCourse({ id: 'c_n4k07', no: 7, programId: 'p_n4', mode: 'ket_hop', room: 'Phòng 102', zoom: 'https://zoom.us/j/0000000007',
    days: [1, 3], start: '18:00', end: '19:30', status: 'ket_thuc', teacherId: 'u_gva', staffIds: ['u_gva'],
    memberIds: ['u_s16', 'u_s17', 'u_s18', 'u_s19'] }, 0, T(-155));
  mkCourse({ id: 'c_n5k13', no: 13, programId: 'p_n5', mode: 'offline', room: 'Phòng 101',
    days: [2, 4], start: '08:30', end: '10:00', status: 'cho', teacherId: 'u_gva', staffIds: ['u_gva'], memberIds: [] }, 0, T(6));
  mkCourse({ id: 'c_n4k09', no: 9, programId: 'p_n4', mode: 'online', zoom: '',
    days: [1, 3], start: '20:00', end: '21:30', status: 'nhap', teacherId: '', staffIds: [], memberIds: [] }, 0, T(30));

  // học liệu Giáo viên A bổ sung cho lớp N5K12: nằm ở buổi của lớp, đồng thời vào kho đề xuất của chương trình
  const extra = [
    [3, { id: 'm_x1', kind: 'file', name: 'Bảng luyện viết Katakana.txt', fileId: 'f_seed_extra_1', size: new Blob([extraText]).size, type: 'text/plain' }, T(-20), 'cho'],
    [6, { id: 'm_x2', kind: 'link', name: 'Bài hát số đếm tiếng Nhật (minh họa)', url: 'https://example.com/n5/bai-hat-so-dem' }, T(-14), 'cho'],
    [4, { id: 'm_x3', kind: 'link', name: 'Phiếu luyện chào hỏi theo tình huống (minh họa)', url: 'https://example.com/n5/chao-hoi' }, T(-40), 'da_them'],
  ];
  extra.forEach(([idx, m, d, st], k) => {
    const mat = Object.assign({ by: 'u_gva', at: d + 'T20:45:00.000Z', origin: 'lop' }, m);
    C1.lessons[idx].materials.push(mat);
    prog('p_n5').suggestions.push({ id: 'sg_' + (k + 1), idx, material: Object.assign({}, mat), courseId: C1.id, by: 'u_gva', at: mat.at, status: st,
      note: st === 'cho' ? '' : 'Phiếu dùng tốt, bổ sung cho các lớp sau.', handledBy: st === 'cho' ? null : 'u_hoan', handledAt: st === 'cho' ? null : T(-38) + 'T09:00:00.000Z' });
    if (st === 'da_them') prog('p_n5').lessons[idx].materials.push(Object.assign({}, mat, { id: 'm_x3p', origin: 'ct', fromSuggestion: 'sg_' + (k + 1) }));
  });

  // Điểm danh, báo cáo của các buổi đã qua
  const sessOf = (c) => db.sessions.filter((s) => s.courseId === c.id).sort((a, b) => a.idx - b.idx);
  const past = (c) => sessOf(c).filter((s) => s.date < T(0));
  [C1, C2, C3, C4].forEach((c) => {
    const ps = past(c);
    ps.forEach((s, k) => {
      const rec = {};
      c.members.forEach((m) => {
        const x = r(); const weak = (skill[m.uid] || 0.75) < 0.65 ? 0.06 : 0;
        const st = x < 0.84 - weak ? 'co_mat' : x < 0.91 - weak ? 'di_muon' : x < 0.955 - weak / 2 ? 'vang_cp' : 'vang_kp';
        rec[m.uid] = { st, via: st.startsWith('vang') ? 'tay' : (r() < 0.6 ? 'qr' : 'web'), at: s.date + 'T' + s.start + ':00' };
      });
      s.attendance = { open: false, methods: { qr: true, web: true }, closed: true, closedAt: s.date + 'T' + s.end + ':30', records: rec, excused: [], edits: [] };
      const isLastC1 = c === C1 && k === ps.length - 1;
      const per = {};
      c.members.slice(k % 3, (k % 3) + 2).forEach((m, j) => { per[m.uid] = COMMENT_TEMPLATES[3 + ((k + j) % 2)]; });
      s.report = isLastC1 ? { status: 'nhap', general: '', perStudent: {}, publishedAt: null, publishedBy: null }
        : { status: 'cong_bo', general: COMMENT_TEMPLATES[k % 3], perStudent: per, publishedAt: s.date + 'T21:30:00', publishedBy: c.teacherId };
    });
  });
  past(C1).slice(-2).forEach((s) => { s.attendance.records.u_s2 = { st: 'vang_kp', via: 'tay', at: s.date + 'T' + s.end + ':30' }; });
  const cLeave = past(C1)[5];
  cLeave.attendance.records.u_hsc = { st: 'vang_cp', via: 'don', at: cLeave.date + 'T' + cLeave.start + ':00' };
  past(C1).slice(-4).forEach((s) => { s.attendance.records.u_hsc = { st: 'co_mat', via: 'web', at: s.date + 'T' + s.start + ':00' }; });
  past(C1).slice(-4, -1).forEach((s) => { s.report.perStudent.u_hsc = 'Em phát biểu tích cực, phát âm chuẩn hơn. Cần luyện viết Katakana đều tay.'; });
  db.requests.push({ id: 'r_seed1', kind: 'hs_nghi', userId: 'u_hsc', courseId: C1.id, sessionId: cLeave.id, reason: 'Em bị sốt, xin nghỉ một buổi.',
    late: false, status: 'duyet', createdAt: addDays(parseYmd(cLeave.date), -1).toISOString(), handledBy: 'u_tgb', handledAt: cLeave.date + 'T08:00:00', note: 'Em nhớ xem lại học liệu nhé.' });

  // Bài tập, kiểm tra: mỗi bài là một Google Form nhúng. Dữ liệu mẫu dùng form mô phỏng (DEMO-...), không tải gì từ Google.
  function mkAsg(c, sIdx, o, qsetName, submitters, mode) {
    const s = sessOf(c)[sIdx];
    const a = Object.assign({ id: newId('a'), courseId: c.id, sessionId: s ? s.id : null, desc: '', timeLimit: 0,
      allowLate: true, review: false, status: 'da_giao', createdBy: c.teacherId, createdAt: (s ? s.date : T(0)) + 'T21:00:00',
      openAt: (s ? s.date : T(0)) + 'T21:00', extensions: {}, formUrl: demoFormUrl(qsetName), codeEntry: '' }, o);
    db.assignments.push(a);
    (submitters || []).forEach((uid) => {
      const sk = skill[uid] || 0.75;
      const due = new Date(a.dueAt); const subAt = new Date(Math.min(due.getTime() - (2 + r() * 40) * 3600e3, Date.now() - (1 + r() * 30) * 3600e3));
      const sub = { id: newId('sb'), assignmentId: a.id, studentId: uid, submittedAt: subAt.toISOString(), late: false, source: 'form',
        score: null, fb: '', status: 'da_nop', returnedAt: null };
      if (mode === 'graded' || mode === 'returned') {
        sub.score = Math.max(1, Math.min(10, Math.round((sk * 10 + (r() - 0.5) * 2.4) * 2) / 2));
        sub.fb = sk > 0.8 ? 'Làm bài chắc, trình bày rõ.' : sk < 0.65 ? 'Cần ôn lại mẫu câu của bài, hỏi giáo viên nếu chưa rõ.' : '';
        sub.status = mode === 'returned' ? 'da_tra' : 'da_cham';
        if (mode === 'returned') sub.returnedAt = new Date(subAt.getTime() + 30 * 3600e3).toISOString();
      }
      db.submissions.push(sub);
    });
    return a;
  }
  const dueOf = (c, idx, plusDays, hm) => { const s = sessOf(c)[idx]; return ymd(addDays(parseYmd(s.date), plusDays)) + 'T' + (hm || '23:59'); };
  const mem = (c) => c.members.map((m) => m.uid);
  const c1s = sessOf(C1);
  mkAsg(C1, 3, { type: 'test', title: 'Test nhanh: Katakana', dueAt: dueOf(C1, 3, 2) }, 'katakana', mem(C1), 'returned');
  const a1 = mkAsg(C1, 8, { type: 'bai_tap', title: 'Bài tập: Động từ thể ます', dueAt: dueOf(C1, 8, 3) }, 'dong_tu', mem(C1).filter((x) => x !== 'u_s2'), 'returned');
  mkAsg(C1, 9, { type: 'bai_tap', title: 'Bài tập: Tính từ い và な', dueAt: T(1) + 'T23:59', desc: 'Làm sau buổi học, nộp trước hạn.' }, 'tinh_tu', ['u_s1', 'u_s3', 'u_s4'], 'submitted');
  mkAsg(C1, 11, { type: 'giua_khoa', title: 'Kiểm tra giữa kỳ', dueAt: dueOf(C1, 11, 0, '21:00'), openAt: c1s[11].date + 'T19:30', timeLimit: 30, allowLate: false, review: true,
    desc: 'Làm một lần, 30 phút. Điểm công bố sau khi giáo viên xem xét.' }, 'giua_khoa_n5', mem(C1).filter((x) => x !== 'u_s2'), 'graded');
  mkAsg(C1, 12, { type: 'bai_tap', title: 'Bài tập: So sánh hơn, nhất', dueAt: T(3) + 'T23:59', status: 'nhap', openAt: T(0) + 'T20:30' }, 'so_sanh', [], null);
  const b1 = mkAsg(C2, 7, { type: 'bai_tap', title: 'Bài tập: Cho và nhận với thể て', dueAt: dueOf(C2, 7, 3), createdBy: 'u_hoan' }, 'the_te', mem(C2), 'returned');
  mkAsg(C2, 9, { type: 'test', title: 'Test từ vựng tuần 5', dueAt: T(2) + 'T23:59', createdBy: 'u_hoan' }, 'tu_vung_n4', ['u_s7', 'u_s8'], 'returned');
  mkAsg(C3, 3, { type: 'test', title: 'Test nhanh: Katakana', dueAt: dueOf(C3, 3, 2) }, 'katakana', mem(C3), 'returned');
  mkAsg(C3, 9, { type: 'bai_tap', title: 'Bài tập: Tính từ い và な', dueAt: dueOf(C3, 9, 3) }, 'tinh_tu', mem(C3), 'returned');
  mkAsg(C3, 11, { type: 'giua_khoa', title: 'Kiểm tra giữa kỳ', dueAt: dueOf(C3, 11, 0, '10:00'), timeLimit: 30, review: true, allowLate: false }, 'giua_khoa_n5', mem(C3), 'returned');
  mkAsg(C3, 23, { type: 'cuoi_khoa', title: 'Kiểm tra cuối kỳ', dueAt: dueOf(C3, 23, 0, '10:00'), timeLimit: 45, review: true, allowLate: false }, 'giua_khoa_n5', mem(C3), 'returned');
  mkAsg(C4, 9, { type: 'bai_tap', title: 'Bài tập: Thể bị động', dueAt: dueOf(C4, 9, 3) }, 'the_te', mem(C4), 'returned');
  mkAsg(C4, 14, { type: 'giua_khoa', title: 'Kiểm tra giữa kỳ', dueAt: dueOf(C4, 14, 0, '19:30'), timeLimit: 45, review: true, allowLate: false }, 'tu_vung_n4', mem(C4), 'returned');
  mkAsg(C4, 29, { type: 'cuoi_khoa', title: 'Kiểm tra cuối kỳ', dueAt: dueOf(C4, 29, 0, '19:30'), timeLimit: 60, review: true, allowLate: false }, 'cuoi_khoa_n4', mem(C4), 'returned');
  C3.report = { status: 'cong_bo', general: 'Lớp hoàn thành đủ 24 buổi, nắm chắc bảng chữ và ngữ pháp N5. Đa số đủ điều kiện học tiếp N4.', publishedAt: T(-40) + 'T10:00:00', publishedBy: 'u_hoan' };
  C4.report = { status: 'cong_bo', general: 'Lớp hoàn thành đủ 30 buổi. Chuyên cần tốt; nên ôn thêm kính ngữ trước kỳ thi N4.', publishedAt: T(-40) + 'T10:00:00', publishedBy: 'u_gva' };

  // Hỏi đáp theo bài test: mỗi học sinh một cuộc trò chuyện cho mỗi bài
  const subOf = (aid, uid) => db.submissions.find((s) => s.assignmentId === aid && s.studentId === uid);
  // mỗi câu hỏi là một cuộc trò chuyện: messages [{by, text, at}], readAt[người] = lần đọc gần nhất
  const M = (by, text, at) => ({ by, text, at });
  db.qna.push(
    { id: 'qa1', submissionId: subOf(a1.id, 'u_s1').id, assignmentId: a1.id, studentId: 'u_s1', readAt: {}, messages: [
      M('u_s1', 'Cô ơi, câu này em viết 「ごはんを しちじに たべます」 có được không ạ?', T(-1) + 'T20:15:00'),
      M('u_s1', 'Em thấy đáp án gợi ý đặt しちじに lên trước nên hơi phân vân.', T(-1) + 'T20:16:00')] },
    { id: 'qa2', submissionId: subOf(a1.id, 'u_hsc').id, assignmentId: a1.id, studentId: 'u_hsc', readAt: { u_hsc: T(-3) + 'T08:00:00' }, messages: [
      M('u_hsc', 'Vì sao không viết là みづ ạ?', T(-4) + 'T19:00:00'),
      M('u_tgb', 'Trong cách viết hiện đại, "nước" viết là みず. みづ là cách viết cổ (kana lịch sử).', T(-4) + 'T21:00:00'),
      M('u_hsc', 'Vậy khi đọc sách cũ em có thể gặp みづ phải không ạ?', T(-4) + 'T21:10:00'),
      M('u_tgb', 'Đúng rồi em. Bài thi JLPT chỉ dùng cách viết hiện đại nên em cứ viết みず nhé.', T(-4) + 'T21:25:00')] },
    { id: 'qa3', submissionId: subOf(b1.id, 'u_s7').id, assignmentId: b1.id, studentId: 'u_s7', readAt: {}, messages: [
      M('u_s7', 'Thầy ơi em chưa hiểu vì sao のみます thành のんで chứ không phải のみて ạ?', T(-2) + 'T10:40:00')] },
  );

  // Đơn đang chờ
  const c1Next = sessOf(C1).filter((s) => s.date > T(0))[0];
  const c2Next = sessOf(C2).filter((s) => s.date > T(0))[0];
  const c1Later = sessOf(C1).filter((s) => s.date > T(2))[1];
  db.requests.push(
    { id: 'r_seed2', kind: 'hs_nghi', userId: 'u_s1', courseId: C1.id, sessionId: c1Next.id, reason: 'Em có lịch khám răng định kỳ vào chiều tối hôm đó, xin nghỉ buổi này ạ. Em sẽ tự xem lại học liệu.', late: false, status: 'cho', createdAt: T(0) + 'T07:30:00', handledBy: null, handledAt: null, note: '' },
    { id: 'r_seed5', kind: 'nop_muon', userId: 'u_s2', courseId: C1.id, assignmentId: a1.id, reason: 'Tuần trước em ốm nên chưa làm được bài, xin cô cho em nộp muộn.', late: false, status: 'cho', createdAt: T(0) + 'T06:50:00', handledBy: null, handledAt: null, note: '' },
    { id: 'r_seed3', kind: 'gv_nghi', userId: 'u_tgb', courseId: C2.id, sessionId: c2Next.id, reason: 'Việc gia đình, xin nghỉ hỗ trợ buổi này.', proposal: 'khong_thay', substituteId: '', late: false, status: 'cho', createdAt: T(0) + 'T08:10:00', handledBy: null, handledAt: null, note: '' },
    { id: 'r_seed4', kind: 'gv_nghi', userId: 'u_gva', courseId: C1.id, sessionId: c1Later.id, reason: 'Đi tập huấn giáo viên do Quỹ Giao lưu tổ chức (minh họa).', proposal: 'nguoi_thay', substituteId: 'u_hoan', late: false, status: 'cho', createdAt: T(-1) + 'T16:00:00', handledBy: null, handledAt: null, note: '' },
  );
  const l = (d, uid, action, target, oldV, newV) => db.logs.push({ id: newId('lg'), at: d, userId: uid, action, target, oldV: oldV || '', newV: newV || '' });
  l(T(-160) + 'T08:00:00', 'u_hoan', 'Tạo lớp học', C4.name, '', 'Nháp');
  l(T(-38) + 'T09:00:00', 'u_hoan', 'Thêm học liệu đề xuất vào chương trình', 'Sơ cấp N5 - Buổi 5', '', 'Phiếu luyện chào hỏi theo tình huống (minh họa), từ lớp ' + C1.name);
  l(T(-60) + 'T09:00:00', 'u_hoan', 'Sửa chương trình học', 'Sơ cấp N5', 'Phiên bản 1', 'Phiên bản 2');
  l(T(-40) + 'T10:00:00', 'u_hoan', 'Gán quyền Admin', 'Giáo viên A', '', 'Xem báo cáo mọi lớp');
  l(C1.startDate + 'T08:00:00', 'u_hoan', 'Bắt đầu lớp', C1.name, 'Chờ khai giảng', 'Đang học');
  l(C2.startDate + 'T08:00:00', 'u_hoan', 'Bắt đầu lớp', C2.name, 'Chờ khai giảng', 'Đang học');
  l(T(-41) + 'T09:00:00', 'u_hoan', 'Kết thúc lớp', C3.name, 'Đang học', 'Đã kết thúc');
  l(T(-10) + 'T11:00:00', 'u_hoan', 'Khóa tài khoản', 'Trương Văn Cũ', 'Hoạt động', 'Đã khóa: Tạm dừng học (minh họa)');
  db.logs.sort((a, b) => (a.at < b.at ? 1 : -1));
  return db;
}


function generateSessions(db, c) {
  const hol = new Set(db.config.holidays.map((h) => h.date));
  let d = parseYmd(c.startDate); let idx = 0; let guard = 0;
  while (idx < c.nSessions && guard++ < 1000) {
    if (c.days.includes(d.getDay()) && !hol.has(ymd(d))) {
      const lesson = c.lessons[idx] || { title: 'Buổi ' + (idx + 1) };
      db.sessions.push({ id: c.id + '_s' + (idx + 1), courseId: c.id, idx, date: ymd(d), start: c.start, end: c.end,
        title: lesson.title, teacherId: c.teacherId, mode: c.mode, zoom: c.zoom, room: c.room, status: 'binh_thuong', note: '',
        attendance: { open: false, methods: { qr: true, web: true }, closed: false, closedAt: null, records: {}, excused: [], edits: [] },
        report: null, absentStaff: [] });
      idx++;
    }
    d = addDays(d, 1);
  }
}

// ------------------------------------------------------------------ kho
const Store = {
  db: null,
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) { const d = JSON.parse(raw); if (d && d.version === DB_VERSION) { this.db = d; return; } }
    } catch (e) { /* dữ liệu hỏng: tạo lại */ }
    this.db = seed(); this.write();
  },
  write() { this.db.rev = (this.db.rev || 0) + 1; this.db.writtenBy = Store.tabId; localStorage.setItem(DB_KEY, JSON.stringify(this.db)); },
  // Mọi thay đổi đi qua tx: đọc bản mới nhất (tab khác có thể vừa ghi), áp thay đổi, ghi lại.
  tx(fn) {
    try { const raw = localStorage.getItem(DB_KEY); if (raw) { const d = JSON.parse(raw); if (d.version === DB_VERSION) this.db = d; } } catch (e) { /* giữ bản trong bộ nhớ */ }
    const res = fn(this.db);
    this.write();
    return res;
  },
  reset() { this.db = seed(); this.write(); },
  tabId: Math.random().toString(36).slice(2),
};

const Q = {
  user: (id) => Store.db.users.find((u) => u.id === id),
  course: (id) => Store.db.courses.find((c) => c.id === id),
  session: (id) => Store.db.sessions.find((s) => s.id === id),
  program: (id) => Store.db.programs.find((p) => p.id === id),
  asg: (id) => Store.db.assignments.find((a) => a.id === id),
  sub: (id) => Store.db.submissions.find((s) => s.id === id),
  req: (id) => Store.db.requests.find((r) => r.id === id),
  param: (k) => Store.db.config.params[k],
  sessionsOf: (cid) => Store.db.sessions.filter((s) => s.courseId === cid).sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1)),
  activeMembers: (c) => c.members.filter((m) => !m.leftAt),
  // học sinh có mặt trong danh sách của buổi: đã vào lớp trước giờ học và chưa rút
  rosterOf: (s) => {
    const c = Q.course(s.courseId); const st = at(s.date, s.start).getTime();
    return c.members.filter((m) => new Date(m.joinedAt).getTime() <= st && (!m.leftAt || new Date(m.leftAt).getTime() > st)).map((m) => Q.user(m.uid));
  },
  coursesOfStudent: (uid) => Store.db.courses.filter((c) => c.members.some((m) => m.uid === uid && !m.leftAt) && !['nhap', 'da_xoa'].includes(c.status)),
  subOf: (aid, uid) => Store.db.submissions.find((s) => s.assignmentId === aid && s.studentId === uid),
  sessionEnded: (s) => at(s.date, s.end).getTime() < Date.now(),
  sessionStarted: (s) => at(s.date, s.start).getTime() <= Date.now(),
  dueOf: (a, uid) => (uid && a.extensions && a.extensions[uid]) || a.dueAt,
};

// ------------------------------------------------------------------ cuộc hỏi đáp
const Thread = {
  last: (q) => q.messages[q.messages.length - 1],
  waiting: (q) => Thread.last(q).by === q.studentId, // tin cuối của học sinh: chờ nhân sự trả lời
  unread: (q, uid) => q.messages.some((m) => m.by !== uid && (!q.readAt || !q.readAt[uid] || new Date(m.at) > new Date(q.readAt[uid]))),
};

// ------------------------------------------------------------------ phân quyền (QT-01..QT-03)
const P = {
  isStaff: (u) => !!u && (u.role === 'gv' || u.role === 'tg'),
  isStudent: (u) => !!u && u.role === 'hs',
  adm: (u, code) => P.isStaff(u) && (u.superAdmin || u.adm.includes(code)),
  anyAdm: (u) => P.isStaff(u) && (u.superAdmin || u.adm.length > 0),
  assigned: (u, c) => !!c && c.staffIds.includes(u.id),
  operate: (u, c) => P.assigned(u, c) && ['dang_hoc', 'cho', 'nhap'].includes(c.status),
  courseAdmin: (u) => ['ADM-05', 'ADM-06', 'ADM-07', 'ADM-08', 'ADM-09'].some((x) => P.adm(u, x)),
  // nhân sự xem được lớp: phụ trách, có quyền quản trị lớp/ADM-11, hoặc lớp cùng cấp độ (chỉ đọc báo cáo)
  viewCourse: (u, c) => {
    if (!P.isStaff(u) || !c || c.status === 'da_xoa') return false;
    if (P.assigned(u, c) || P.adm(u, 'ADM-11') || P.courseAdmin(u)) return true;
    const myLevels = new Set(Store.db.courses.filter((x) => P.assigned(u, x)).map((x) => x.level));
    return myLevels.has(c.level);
  },
  readOnlyCourse: (u, c) => !P.assigned(u, c),
  editProgram: (u) => P.isStaff(u) && (u.role === 'gv' || P.adm(u, 'ADM-13')),
  approveStaff: (u) => !!u && u.superAdmin,
  accounts: (u) => ['ADM-01', 'ADM-02', 'ADM-03', 'ADM-04'].some((x) => P.adm(u, x)),
  logs: (u) => !!u && (u.superAdmin || P.adm(u, 'ADM-04')),
  // học sinh / Học sinh (PH) / phụ huynh xem dữ liệu của một học sinh (QT-02)
  seeStudent: (u, sid) => !!u && (u.id === sid || (u.role === 'ph' && u.childIds.includes(sid))),
};

function roleLabel(u) {
  if (!u) return '';
  if (u.role === 'hs' && u.phMode) return 'Học sinh (PH)';
  let s = ROLE_NAME[u.role];
  if (u.superAdmin) s += ' · Super Admin';
  else if (P.anyAdm(u)) s += ' · Admin';
  return s;
}

// ------------------------------------------------------------------ tính toán
const Calc = {
  // Bài làm trên Google Form: điểm (thang 10) do Google Form tự chấm hoặc giáo viên nhập; chưa có điểm là "cần nhập điểm"
  needsManual(a, sub) { return sub.score == null; },
  score10(a, sub) { return sub.score == null ? 0 : Number(sub.score); },
  // chấm form mô phỏng: câu tự luận (Đoạn) chưa có điểm thì trả null để giáo viên nhập
  mockScore(key, answers) {
    const qs = QSET[key]; if (!qs) return null;
    let got = 0; let max = 0; let open = false;
    qs.forEach((q, i) => {
      max += q.points; const v = answers[i];
      if (q.kind === 'para') { open = true; return; }
      let ok = false;
      if (q.kind === 'mc' || q.kind === 'dd') ok = Number(v) === q.answer;
      else if (q.kind === 'cb') ok = Array.isArray(v) && v.length === q.answer.length && q.answer.every((x) => v.map(Number).includes(x));
      else if (q.kind === 'short') ok = typeof v === 'string' && q.answer.some((x) => x.trim().toLowerCase() === v.trim().toLowerCase());
      if (ok) got += q.points;
    });
    return { auto: got, max, open, score10: open ? null : Math.round((got / max) * 100) / 10 };
  },
  attendanceOf(uid, courseId) {
    let held = 0; let ok = 0; let kp = 0; let cp = 0; let late = 0;
    const c = Q.course(courseId); const m = c.members.find((x) => x.uid === uid);
    Q.sessionsOf(courseId).forEach((s) => {
      if (s.status === 'huy' || !s.attendance.closed) return;
      if (m && new Date(m.joinedAt).getTime() > at(s.date, s.start).getTime()) return;
      const r = s.attendance.records[uid]; if (!r) return;
      held++;
      if (r.st === 'co_mat' || r.st === 'di_muon') ok++;
      if (r.st === 'di_muon') late++;
      if (r.st === 'vang_kp') kp++;
      if (r.st === 'vang_cp') cp++;
    });
    return { held, ok, kp, cp, late, rate: held ? Math.round((ok / held) * 100) : null };
  },
  consecutiveAbsent(uid, courseId) {
    const ss = Q.sessionsOf(courseId).filter((s) => s.attendance.closed && s.status !== 'huy' && s.attendance.records[uid]);
    let n = 0;
    for (let i = ss.length - 1; i >= 0; i--) { const st = ss[i].attendance.records[uid].st; if (st === 'vang_kp' || st === 'vang_cp') n++; else break; }
    return n;
  },
  // điểm tổng kết theo trọng số loại bài (GD-12), chỉ tính bài đã trả kết quả
  grades(uid, courseId) {
    const c = Q.course(courseId); const p = Q.program(c.programId); const w = p.weights;
    const byType = {};
    Store.db.assignments.filter((a) => a.courseId === courseId && a.status === 'da_giao').forEach((a) => {
      const sub = Q.subOf(a.id, uid);
      if (sub && sub.status === 'da_tra') (byType[a.type] = byType[a.type] || []).push(Calc.score10(a, sub));
      else if (!sub && new Date(Q.dueOf(a, uid)).getTime() < Date.now()) (byType[a.type] = byType[a.type] || []).push(0);
    });
    const avg = {}; let tw = 0; let tot = 0;
    Object.keys(ASG_TYPE).forEach((t) => {
      if (byType[t] && byType[t].length) { avg[t] = Math.round((byType[t].reduce((x, y) => x + y, 0) / byType[t].length) * 10) / 10; tw += w[t]; tot += avg[t] * w[t]; }
    });
    return { avg, total: tw ? Math.round((tot / tw) * 10) / 10 : null };
  },
};

// ------------------------------------------------------------------ thao tác nghiệp vụ
function log(db, uid, action, target, oldV, newV) {
  db.logs.unshift({ id: newId('lg'), at: nowIso(), userId: uid, action, target, oldV: oldV || '', newV: newV || '' });
}
const userName = (db, id) => (db.users.find((u) => u.id === id) || {}).name || '';

const A = {
  login(idOrEmail, pw) {
    const key = String(idOrEmail || '').trim().toLowerCase();
    return Store.tx((db) => {
      const u = db.users.find((x) => x.email.toLowerCase() === key || (x.phone && x.phone === key));
      if (!u) return { ok: false, msg: 'Email hoặc số điện thoại chưa đúng.' };
      const f = db.loginFails[u.id];
      if (f && f.until && new Date(f.until).getTime() > Date.now()) return { ok: false, msg: 'Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau 15 phút.' };
      if (!u.loginable) return { ok: false, msg: 'Đây là học sinh minh họa, không dùng để đăng nhập trong bản demo.' };
      if (u.status === 'locked') return { ok: false, msg: 'Tài khoản đang bị khóa. Liên hệ trung tâm.' };
      if (u.status === 'deleted') return { ok: false, msg: 'Tài khoản không còn hoạt động.' };
      if (u.password !== pw) {
        const n = ((f && f.n) || 0) + 1;
        db.loginFails[u.id] = { n, until: n >= 5 ? new Date(Date.now() + 15 * 60e3).toISOString() : null };
        return { ok: false, msg: n >= 5 ? 'Sai 5 lần liên tiếp: tài khoản tạm khóa 15 phút.' : 'Mật khẩu chưa đúng (lần ' + n + '/5).' };
      }
      delete db.loginFails[u.id];
      return { ok: true, user: u };
    });
  },

  // ---- tài khoản
  createUser(me, o) {
    return Store.tx((db) => {
      const key = (o.email || '').trim().toLowerCase();
      if (!o.name || !o.role || (!key && !o.phone)) return { ok: false, msg: 'Cần họ tên, vai trò và email hoặc số điện thoại.' };
      if (db.users.some((u) => u.status !== 'deleted' && ((key && u.email.toLowerCase() === key) || (o.phone && u.phone === o.phone)))) return { ok: false, msg: 'Email hoặc số điện thoại đã có tài khoản đang hoạt động.' };
      const prefix = o.role === 'hs' ? 'HV-' : o.role === 'gv' ? 'GV-' : o.role === 'tg' ? 'TG-' : '';
      const n = db.users.filter((u) => u.code && u.code.startsWith(prefix)).length + 1;
      const u = { id: newId('u'), code: prefix ? prefix + String(n).padStart(4, '0') : '', name: o.name.trim(), role: o.role, email: key, phone: o.phone || '',
        status: 'active', adm: [], superAdmin: false, phMode: o.role === 'hs' && !!o.phMode, parentIds: [], childIds: [], password: '123456', mustChangePw: true, loginable: true, createdAt: nowIso() };
      db.users.push(u);
      if (o.parentId && o.role === 'hs') { const p = db.users.find((x) => x.id === o.parentId); if (p) { p.childIds.push(u.id); u.parentIds.push(p.id); } }
      if (o.courseId && o.role === 'hs') { const c = db.courses.find((x) => x.id === o.courseId); if (c) c.members.push({ uid: u.id, joinedAt: nowIso(), leftAt: null, reason: '' }); }
      log(db, me.id, 'Tạo tài khoản', u.name, '', ROLE_NAME[u.role]);
      return { ok: true, user: u };
    });
  },
  updateUser(me, id, o) {
    return Store.tx((db) => {
      const u = db.users.find((x) => x.id === id);
      if (u.superAdmin && me.id !== u.id) return { ok: false, msg: 'Không sửa được tài khoản của Hồ An.' };
      const changes = [];
      ['name', 'email', 'phone'].forEach((k) => { if (o[k] !== undefined && o[k] !== u[k]) { changes.push(k + ': ' + u[k] + ' -> ' + o[k]); u[k] = o[k]; } });
      if (u.role === 'hs' && o.phMode !== undefined && !!o.phMode !== u.phMode) { u.phMode = !!o.phMode; changes.push('Học sinh (PH): ' + (u.phMode ? 'bật' : 'tắt')); }
      if (changes.length) log(db, me.id, 'Sửa tài khoản', u.name, '', changes.join('; '));
      return { ok: true };
    });
  },
  setStatus(me, id, status, reason) {
    return Store.tx((db) => {
      const u = db.users.find((x) => x.id === id);
      if (u.superAdmin) return { ok: false, msg: 'Không khóa, xóa được tài khoản của Hồ An.' };
      if (u.id === me.id) return { ok: false, msg: 'Không tự khóa hoặc xóa tài khoản của mình.' };
      if (status === 'deleted') {
        const only = db.courses.find((c) => c.status === 'dang_hoc' && c.staffIds.length === 1 && c.staffIds[0] === u.id);
        if (only) return { ok: false, msg: 'Đang là người phụ trách duy nhất của lớp ' + only.name + '. Phân công người khác trước.' };
      }
      const old = u.status; u.status = status; u.lockReason = reason || '';
      const names = { active: 'Hoạt động', locked: 'Đã khóa', deleted: 'Đã xóa' };
      log(db, me.id, status === 'active' ? (old === 'deleted' ? 'Khôi phục tài khoản' : 'Mở khóa tài khoản') : status === 'locked' ? 'Khóa tài khoản' : 'Xóa (mềm) tài khoản', u.name, names[old], names[status] + (reason ? ': ' + reason : ''));
      return { ok: true };
    });
  },
  setAdm(me, id, codes) {
    return Store.tx((db) => {
      if (!me.superAdmin) return { ok: false, msg: 'Chỉ Hồ An gán quyền Admin.' };
      const u = db.users.find((x) => x.id === id);
      if (!P.isStaff(u) || u.superAdmin) return { ok: false, msg: 'Chỉ gán quyền Admin cho Giáo viên, Trợ giảng.' };
      const allowed = ADM_LIST.filter((a) => a[2]).map((a) => a[0]);
      const next = codes.filter((c) => allowed.includes(c));
      const nm = (arr) => arr.map((c) => ADM_LIST.find((a) => a[0] === c)[1]).join('; ') || '(không có)';
      log(db, me.id, 'Gán quyền Admin', u.name, nm(u.adm), nm(next));
      u.adm = next;
      return { ok: true };
    });
  },
  linkParent(me, studentId, parentId, on) {
    return Store.tx((db) => {
      const s = db.users.find((x) => x.id === studentId); const p = db.users.find((x) => x.id === parentId);
      if (on) {
        if (s.parentIds.length >= 2) return { ok: false, msg: 'Mỗi học sinh liên kết tối đa 2 phụ huynh.' };
        if (!s.parentIds.includes(p.id)) { s.parentIds.push(p.id); p.childIds.push(s.id); }
        log(db, me.id, 'Liên kết phụ huynh', s.name, '', p.name);
      } else {
        s.parentIds = s.parentIds.filter((x) => x !== p.id); p.childIds = p.childIds.filter((x) => x !== s.id);
        log(db, me.id, 'Gỡ liên kết phụ huynh', s.name, p.name, '');
      }
      return { ok: true };
    });
  },
  changePassword(me, oldPw, newPw) {
    return Store.tx((db) => {
      const u = db.users.find((x) => x.id === me.id);
      if (u.password !== oldPw) return { ok: false, msg: 'Mật khẩu hiện tại chưa đúng.' };
      if (!newPw || newPw.length < 6) return { ok: false, msg: 'Mật khẩu mới cần ít nhất 6 ký tự.' };
      u.password = newPw; u.mustChangePw = false; return { ok: true };
    });
  },

  // ---- chương trình học
  saveProgram(me, id, o) {
    return Store.tx((db) => {
      let p = id && db.programs.find((x) => x.id === id);
      if (!p) {
        const src = o.copyFrom && db.programs.find((x) => x.id === o.copyFrom);
        p = { id: newId('p'), name: o.name, level: o.level, nSessions: src ? src.nSessions : Number(o.nSessions) || 12, minutes: Number(o.minutes) || 90,
          status: 'sap_ra_mat', version: 1, weights: src ? Object.assign({}, src.weights) : { bai_tap: 20, test: 20, giua_khoa: 25, cuoi_khoa: 35 },
          desc: o.desc || '', goal: o.goal || '', lessons: src ? JSON.parse(JSON.stringify(src.lessons)) : Array.from({ length: Number(o.nSessions) || 12 }, (_, i) => ({ title: 'Buổi ' + (i + 1), goal: '', content: '', note: '', materials: [] })),
          suggestions: [], createdBy: me.id, updatedAt: nowIso() };
        p.nSessions = p.lessons.length;
        db.programs.push(p);
        log(db, me.id, 'Tạo chương trình học', p.name, '', src ? 'Sao chép từ ' + src.name : PROG_STATUS.sap_ra_mat);
        return { ok: true, id: p.id };
      }
      const wasApplied = p.status === 'ap_dung';
      Object.assign(p, { name: o.name, desc: o.desc, goal: o.goal, minutes: Number(o.minutes) || p.minutes, lessons: o.lessons, updatedAt: nowIso() });
      p.nSessions = p.lessons.length;
      if (wasApplied) p.version += 1;
      log(db, me.id, 'Sửa chương trình học', p.name, wasApplied ? 'Phiên bản ' + (p.version - 1) : '', wasApplied ? 'Phiên bản ' + p.version + ' (lớp đang học giữ bản cũ)' : 'Cập nhật bản sắp ra mắt');
      return { ok: true, id: p.id };
    });
  },
  setProgramStatus(me, id, st) {
    return Store.tx((db) => {
      const p = db.programs.find((x) => x.id === id);
      log(db, me.id, 'Đổi trạng thái chương trình', p.name, PROG_STATUS[p.status], PROG_STATUS[st]); p.status = st; return { ok: true };
    });
  },
  // Hồ An quyết định học liệu giáo viên bổ sung (kho đề xuất của chương trình) có vào chương trình không
  reviewSuggestion(me, pid, sgId, accept, note) {
    return Store.tx((db) => {
      if (!me.superAdmin) return { ok: false, msg: 'Chỉ Hồ An quyết định bổ sung học liệu vào chương trình.' };
      const p = db.programs.find((x) => x.id === pid); const sg = (p.suggestions || []).find((x) => x.id === sgId);
      if (!sg || sg.status !== 'cho') return { ok: false, msg: 'Đề xuất đã được xử lý.' };
      sg.status = accept ? 'da_them' : 'bo_qua'; sg.handledBy = me.id; sg.handledAt = nowIso(); sg.note = note || '';
      const l = p.lessons[sg.idx];
      if (accept && l) { l.materials = l.materials || []; l.materials.push(Object.assign({}, sg.material, { id: newId('m'), origin: 'ct', fromSuggestion: sg.id })); p.updatedAt = nowIso(); }
      const cname = (db.courses.find((c) => c.id === sg.courseId) || {}).name || '';
      log(db, me.id, accept ? 'Thêm học liệu đề xuất vào chương trình' : 'Không thêm học liệu đề xuất', p.name + ' - Buổi ' + (sg.idx + 1), '', sg.material.name + ', từ lớp ' + cname + (note ? '. ' + note : ''));
      return { ok: true };
    });
  },

  // sửa một buổi (tên, mục tiêu, nội dung chi tiết, ghi chú, học liệu) của chương trình hoặc của lớp
  updateLesson(me, kind, id, idx, patch, silent) {
    return Store.tx((db) => {
      const owner = kind === 'program' ? db.programs.find((x) => x.id === id) : db.courses.find((x) => x.id === id);
      const l = owner.lessons[idx];
      Object.assign(l, patch);
      if (kind === 'program') { owner.updatedAt = nowIso(); }
      else db.sessions.filter((s) => s.courseId === id && s.idx === idx && !Q.sessionStarted(s) && s.status !== 'day_bu').forEach((s) => { s.title = l.title; });
      if (!silent) log(db, me.id, kind === 'program' ? 'Sửa nội dung chương trình' : 'Sửa phân phối chương trình', owner.name + ' - Buổi ' + (idx + 1), '', Object.keys(patch).join(', '));
      return { ok: true };
    });
  },
  // Học liệu thêm vào chương trình là nền cho lớp tạo sau. Học liệu thêm vào buổi của lớp: hiện ngay cho lớp đó
  // và được lưu vào kho đề xuất của chương trình (suggestions) để Hồ An quyết định có bổ sung vào chương trình không.
  addLessonMaterial(me, kind, id, idx, m) {
    return Store.tx((db) => {
      const owner = kind === 'program' ? db.programs.find((x) => x.id === id) : db.courses.find((x) => x.id === id);
      const l = owner.lessons[idx]; l.materials = l.materials || [];
      const mat = Object.assign({ id: newId('m'), by: me.id, at: nowIso(), origin: kind === 'program' ? 'ct' : 'lop' }, m);
      l.materials.push(mat);
      if (kind === 'course') {
        const p = db.programs.find((x) => x.id === owner.programId);
        if (p) { p.suggestions = p.suggestions || []; p.suggestions.push({ id: newId('sg'), idx, material: Object.assign({}, mat), courseId: owner.id, by: me.id, at: mat.at, status: 'cho', note: '', handledBy: null, handledAt: null }); }
      }
      log(db, me.id, 'Thêm học liệu', owner.name + ' - Buổi ' + (idx + 1), '', m.name + (kind === 'course' ? ' (lưu vào kho đề xuất của chương trình)' : ''));
      return { ok: true };
    });
  },
  removeLessonMaterial(me, kind, id, idx, mid) {
    return Store.tx((db) => {
      const owner = kind === 'program' ? db.programs.find((x) => x.id === id) : db.courses.find((x) => x.id === id);
      const l = owner.lessons[idx]; const m = l.materials.find((x) => x.id === mid);
      if (kind === 'course' && m && m.origin !== 'lop') return { ok: false, msg: 'Học liệu của chương trình là nền của lớp, không gỡ ở lớp.' };
      l.materials = l.materials.filter((x) => x.id !== mid);
      log(db, me.id, 'Gỡ học liệu', owner.name + ' - Buổi ' + (idx + 1), m ? m.name : '', kind === 'course' ? 'Chỉ gỡ khỏi lớp; bản trong kho đề xuất của chương trình vẫn giữ' : '');
      return { ok: true };
    });
  },
  // thêm, đổi chỗ, xóa buổi của chương trình; gợi ý học liệu đi theo buổi
  addLesson(me, id, at) {
    return Store.tx((db) => { const p = db.programs.find((x) => x.id === id); p.lessons.splice(at, 0, { title: 'Buổi mới', goal: '', content: '', note: '', materials: [] }); (p.suggestions || []).forEach((s) => { if (s.idx >= at) s.idx++; }); p.nSessions = p.lessons.length; p.updatedAt = nowIso(); return { ok: true }; });
  },
  moveLesson(me, id, i, j) {
    return Store.tx((db) => { const p = db.programs.find((x) => x.id === id); const L = p.lessons; if (j < 0 || j >= L.length) return { ok: false }; [L[i], L[j]] = [L[j], L[i]]; (p.suggestions || []).forEach((s) => { if (s.idx === i) s.idx = j; else if (s.idx === j) s.idx = i; }); p.updatedAt = nowIso(); return { ok: true }; });
  },
  removeLesson(me, id, i) {
    return Store.tx((db) => { const p = db.programs.find((x) => x.id === id); if (p.lessons.length <= 1) return { ok: false, msg: 'Chương trình cần ít nhất 1 buổi.' }; p.lessons.splice(i, 1); (p.suggestions || []).forEach((s) => { if (s.idx > i) s.idx--; else if (s.idx === i) s.idx = Math.max(0, i - 1); }); p.nSessions = p.lessons.length; p.updatedAt = nowIso(); return { ok: true }; });
  },
  // sửa chương trình đang áp dụng: tạo phiên bản mới (lớp đang học giữ bản cũ)
  publishProgramVersion(me, id) {
    return Store.tx((db) => { const p = db.programs.find((x) => x.id === id); p.version += 1; p.updatedAt = nowIso(); log(db, me.id, 'Công bố phiên bản chương trình', p.name, 'Phiên bản ' + (p.version - 1), 'Phiên bản ' + p.version + ' (lớp đang học giữ bản cũ)'); return { ok: true }; });
  },

  // ---- lớp học
  createCourse(me, o) {
    return Store.tx((db) => {
      const p = db.programs.find((x) => x.id === o.programId);
      if (!p) return { ok: false, msg: 'Mỗi lớp phải chọn một chương trình học làm nền.' };
      const no = Number(o.no) || nextClassNo(db, p.level);
      if (no < 1 || no > 999) return { ok: false, msg: 'Số thứ tự lớp từ 1 đến 999.' };
      const name = className(p.level, no);
      if (db.courses.some((c) => c.name === name && c.status !== 'da_xoa')) return { ok: false, msg: 'Đã có lớp ' + name + '. Chọn số thứ tự khác.' };
      if (!o.days.length) return { ok: false, msg: 'Chọn ít nhất một ngày học trong tuần.' };
      const c = { id: newId('c'), no, name, programId: p.id, programVersion: p.version, level: p.level, nSessions: p.nSessions, mode: o.mode,
        zoom: o.zoom || '', room: o.room || '', days: o.days.map(Number).sort(), start: o.start, end: o.end, startDate: o.startDate, status: 'nhap',
        teacherId: o.teacherId || '', staffIds: [o.teacherId, ...(o.taIds || [])].filter(Boolean), members: [], createdAt: nowIso(),
        lessons: JSON.parse(JSON.stringify(p.lessons)), report: null };
      db.courses.push(c);
      log(db, me.id, 'Tạo lớp học', c.name, '', 'Nháp, từ chương trình ' + p.name);
      return { ok: true, id: c.id };
    });
  },
  updateCourse(me, id, o) {
    return Store.tx((db) => {
      const c = db.courses.find((x) => x.id === id);
      const fields = ['mode', 'zoom', 'room', 'start', 'end', 'startDate'];
      const ch = [];
      fields.forEach((k) => { if (o[k] !== undefined && o[k] !== c[k]) { ch.push(k); c[k] = o[k]; } });
      if (o.days) { c.days = o.days.map(Number).sort(); ch.push('lịch tuần'); }
      if (c.status === 'dang_hoc') { // chỉ áp cho buổi chưa diễn ra
        db.sessions.filter((s) => s.courseId === c.id && !Q.sessionStarted(s) && s.status === 'binh_thuong').forEach((s) => { s.mode = c.mode; s.zoom = c.zoom; s.room = c.room; s.start = c.start; s.end = c.end; });
      }
      log(db, me.id, 'Sửa thông tin lớp học', c.name, '', ch.join(', ') || 'không đổi');
      return { ok: true };
    });
  },
  assignStaff(me, id, teacherId, taIds) {
    return Store.tx((db) => {
      const c = db.courses.find((x) => x.id === id);
      const old = c.staffIds.map((x) => userName(db, x)).join(', ');
      c.teacherId = teacherId; c.staffIds = [teacherId, ...taIds.filter((x) => x !== teacherId)].filter(Boolean);
      db.sessions.filter((s) => s.courseId === c.id && !Q.sessionStarted(s) && s.status === 'binh_thuong').forEach((s) => { s.teacherId = teacherId; });
      log(db, me.id, 'Phân công phụ trách', c.name, old, c.staffIds.map((x) => userName(db, x)).join(', '));
      return { ok: true };
    });
  },
  setCourseStatus(me, id, st, reason) {
    return Store.tx((db) => {
      const c = db.courses.find((x) => x.id === id);
      if (st === 'cho' && !c.teacherId) return { ok: false, msg: 'Cần phân công Giáo viên chính trước khi chuyển Chờ khai giảng.' };
      if (st === 'dang_hoc' && c.status === 'cho') {
        if (!c.members.some((m) => !m.leftAt)) return { ok: false, msg: 'Lớp chưa có học sinh nào. Thêm ít nhất 1 học sinh để bắt đầu.' };
        if (!db.sessions.some((s) => s.courseId === c.id)) generateSessions(db, c);
      }
      const old = COURSE_STATUS[c.status][0];
      c.prevStatus = c.status; c.status = st;
      log(db, me.id, st === 'dang_hoc' && old === 'Chờ khai giảng' ? 'Bắt đầu lớp' : 'Đổi trạng thái lớp', c.name, old, COURSE_STATUS[st][0] + (reason ? ': ' + reason : ''));
      return { ok: true };
    });
  },
  addMembers(me, id, uids) {
    return Store.tx((db) => {
      const c = db.courses.find((x) => x.id === id);
      const warn = [];
      uids.forEach((uid) => {
        if (c.members.some((m) => m.uid === uid && !m.leftAt)) return;
        const clash = db.courses.find((o) => o.id !== c.id && o.status === 'dang_hoc' && o.members.some((m) => m.uid === uid && !m.leftAt) && o.days.some((d) => c.days.includes(d)) && o.start < c.end && c.start < o.end);
        if (clash) warn.push(userName(db, uid) + ' trùng lịch với ' + clash.name);
        c.members.push({ uid, joinedAt: nowIso(), leftAt: null, reason: '' });
      });
      log(db, me.id, 'Thêm học sinh vào lớp', c.name, '', uids.map((x) => userName(db, x)).join(', '));
      return { ok: true, warn };
    });
  },
  removeMember(me, id, uid, reason, toCourseId) {
    return Store.tx((db) => {
      const c = db.courses.find((x) => x.id === id); const m = c.members.find((x) => x.uid === uid && !x.leftAt);
      m.leftAt = nowIso(); m.reason = reason;
      if (toCourseId) { const t = db.courses.find((x) => x.id === toCourseId); t.members.push({ uid, joinedAt: nowIso(), leftAt: null, reason: '' }); }
      log(db, me.id, toCourseId ? 'Chuyển lớp' : 'Rút học sinh khỏi lớp', userName(db, uid), c.name, (toCourseId ? 'Sang ' + db.courses.find((x) => x.id === toCourseId).name + '. ' : '') + 'Lý do: ' + reason);
      return { ok: true };
    });
  },
  saveCourseReport(me, id, general, publish) {
    return Store.tx((db) => {
      const c = db.courses.find((x) => x.id === id);
      c.report = { status: publish ? 'cong_bo' : 'nhap', general, publishedAt: publish ? nowIso() : null, publishedBy: publish ? me.id : null };
      return { ok: true };
    });
  },
  saveLessons(me, id, lessons) {
    return Store.tx((db) => {
      const c = db.courses.find((x) => x.id === id);
      c.lessons = lessons;
      db.sessions.filter((s) => s.courseId === c.id && !Q.sessionStarted(s)).forEach((s) => { if (lessons[s.idx]) s.title = lessons[s.idx].title; });
      log(db, me.id, 'Điều chỉnh phân phối chương trình', c.name, '', lessons.length + ' buổi');
      return { ok: true };
    });
  },

  // ---- buổi học
  reschedule(me, sid, o) {
    return Store.tx((db) => {
      const s = db.sessions.find((x) => x.id === sid);
      if (o.start >= o.end) return { ok: false, msg: 'Giờ kết thúc phải sau giờ bắt đầu.' };
      const clash = db.sessions.find((x) => x.id !== s.id && x.status !== 'huy' && x.date === o.date && x.teacherId === s.teacherId && x.start < o.end && o.start < x.end);
      if (clash) return { ok: false, msg: 'Trùng lịch người dạy với buổi ' + db.courses.find((c) => c.id === clash.courseId).name + ' (' + clash.start + '-' + clash.end + ').' };
      if (o.room && o.mode !== 'online') {
        const rc = db.sessions.find((x) => x.id !== s.id && x.status !== 'huy' && x.date === o.date && x.room === o.room && x.mode !== 'online' && x.start < o.end && o.start < x.end);
        if (rc) return { ok: false, msg: 'Phòng ' + o.room + ' đã có lớp vào giờ này.' };
      }
      const old = s.date + ' ' + s.start + '-' + s.end + ' ' + MODE_NAME[s.mode];
      Object.assign(s, { date: o.date, start: o.start, end: o.end, mode: o.mode, zoom: o.zoom, room: o.room, status: s.status === 'day_bu' ? 'day_bu' : 'doi_lich', note: o.reason });
      log(db, me.id, 'Đổi lịch buổi học', db.courses.find((c) => c.id === s.courseId).name + ' - ' + s.title, old, o.date + ' ' + o.start + '-' + o.end + ' ' + MODE_NAME[o.mode] + '. Lý do: ' + o.reason);
      return { ok: true };
    });
  },
  openAttendance(me, sid, methods) {
    return Store.tx((db) => {
      const s = db.sessions.find((x) => x.id === sid);
      if (s.attendance.closed) return { ok: false, msg: 'Điểm danh đã chốt.' };
      s.attendance.open = true; s.attendance.methods = methods; s.attendance.openedAt = nowIso(); s.attendance.openedBy = me.id;
      return { ok: true };
    });
  },
  closeAttendanceWindow(me, sid) { return Store.tx((db) => { db.sessions.find((x) => x.id === sid).attendance.open = false; return { ok: true }; }); },
  selfCheckin(me, sid, via, code) {
    return Store.tx((db) => {
      const s = db.sessions.find((x) => x.id === sid);
      if (!s.attendance.open || s.attendance.closed) return { ok: false, msg: 'Điểm danh của buổi này chưa mở hoặc đã đóng.' };
      if (!s.attendance.methods[via]) return { ok: false, msg: via === 'qr' ? 'Buổi này không dùng mã QR, hãy bấm Điểm danh trên web.' : 'Buổi này chỉ điểm danh bằng mã QR.' };
      if (via === 'qr' && !QR.valid(sid, code, db.config.params.qrDoiMoi)) return { ok: false, msg: 'Mã đã hết hạn hoặc chưa đúng. Quét lại mã mới trên màn hình.' };
      const c = db.courses.find((x) => x.id === s.courseId);
      if (!c.members.some((m) => m.uid === me.id && !m.leftAt)) return { ok: false, msg: 'Bạn không thuộc lớp này.' };
      if (s.attendance.records[me.id]) return { ok: true, already: true, st: s.attendance.records[me.id].st };
      const lateAfter = at(s.date, s.start).getTime() + db.config.params.diMuonSau * 60e3;
      const st = Date.now() > lateAfter ? 'di_muon' : 'co_mat';
      s.attendance.records[me.id] = { st, via, at: nowIso() };
      return { ok: true, st };
    });
  },
  markAttendance(me, sid, marks, reason) {
    return Store.tx((db) => {
      const s = db.sessions.find((x) => x.id === sid);
      Object.entries(marks).forEach(([uid, st]) => {
        const cur = s.attendance.records[uid];
        if (cur && cur.st === st) return;
        if (s.attendance.closed) {
          s.attendance.edits.push({ at: nowIso(), by: me.id, uid, from: cur ? cur.st : '', to: st, reason });
          log(db, me.id, 'Sửa điểm danh sau chốt', userName(db, uid) + ' - ' + s.title, cur ? ATT[cur.st][0] : '', ATT[st][0] + '. Lý do: ' + reason);
        }
        s.attendance.records[uid] = { st, via: 'tay', at: nowIso(), by: me.id };
      });
      return { ok: true };
    });
  },
  closeAttendance(me, sid) {
    return Store.tx((db) => {
      const s = db.sessions.find((x) => x.id === sid);
      Q.rosterOf(s).forEach((u) => { if (!s.attendance.records[u.id]) s.attendance.records[u.id] = { st: s.attendance.excused.includes(u.id) ? 'vang_cp' : 'vang_kp', via: 'chot', at: nowIso() }; });
      s.attendance.open = false; s.attendance.closed = true; s.attendance.closedAt = nowIso();
      if (!s.report) s.report = { status: 'nhap', general: '', perStudent: {}, publishedAt: null, publishedBy: null };
      return { ok: true };
    });
  },
  saveReport(me, sid, general, perStudent, publish) {
    return Store.tx((db) => {
      const s = db.sessions.find((x) => x.id === sid);
      s.report = { status: publish ? 'cong_bo' : 'nhap', general, perStudent, publishedAt: publish ? nowIso() : (s.report && s.report.publishedAt), publishedBy: publish ? me.id : null };
      return { ok: true };
    });
  },

  // ---- đơn
  createRequest(me, o) {
    return Store.tx((db) => {
      const r = Object.assign({ id: newId('r'), userId: me.id, status: 'cho', createdAt: nowIso(), handledBy: null, handledAt: null, note: '', late: false }, o);
      if (!r.reason) return { ok: false, msg: 'Nhập lý do.' };
      if (r.kind === 'hs_nghi') {
        const s = db.sessions.find((x) => x.id === r.sessionId);
        if (!s) return { ok: false, msg: 'Chọn buổi học.' };
        if (db.requests.some((x) => x.kind === 'hs_nghi' && x.userId === me.id && x.sessionId === s.id && x.status !== 'huy' && x.status !== 'tu_choi')) return { ok: false, msg: 'Đã có đơn cho buổi này.' };
        r.courseId = s.courseId;
        r.late = at(s.date, s.start).getTime() - Date.now() < db.config.params.baoMuon * 3600e3;
      }
      if (r.kind === 'gv_nghi' || r.kind === 'day_bu') { const s = db.sessions.find((x) => x.id === r.sessionId); r.courseId = s.courseId; }
      if (r.kind === 'nop_muon') { const a = db.assignments.find((x) => x.id === r.assignmentId); r.courseId = a.courseId; }
      db.requests.push(r);
      return { ok: true, id: r.id };
    });
  },
  cancelRequest(me, id) { return Store.tx((db) => { const r = db.requests.find((x) => x.id === id); if (r.userId !== me.id || r.status !== 'cho') return { ok: false, msg: 'Không hủy được đơn này.' }; r.status = 'huy'; return { ok: true }; }); },
  handleRequest(me, id, accept, note, extra) {
    return Store.tx((db) => {
      const r = db.requests.find((x) => x.id === id);
      if (r.status !== 'cho') return { ok: false, msg: 'Đơn đã được xử lý.' };
      if ((r.kind === 'gv_nghi' || r.kind === 'day_bu') && !me.superAdmin) return { ok: false, msg: 'Chỉ Hồ An duyệt nghỉ, dạy bù của nhân sự.' };
      r.status = accept ? 'duyet' : 'tu_choi'; r.handledBy = me.id; r.handledAt = nowIso(); r.note = note || '';
      const s = r.sessionId && db.sessions.find((x) => x.id === r.sessionId);
      const cname = db.courses.find((c) => c.id === r.courseId).name;
      if (accept && r.kind === 'hs_nghi') {
        if (!s.attendance.excused.includes(r.userId)) s.attendance.excused.push(r.userId);
        if (s.attendance.closed) s.attendance.records[r.userId] = { st: 'vang_cp', via: 'don', at: nowIso() };
      }
      if (accept && r.kind === 'nop_muon') {
        const a = db.assignments.find((x) => x.id === r.assignmentId);
        a.extensions[r.userId] = (extra && extra.newDue) || ymd(addDays(new Date(), 2)) + 'T23:59';
        r.newDue = a.extensions[r.userId];
      }
      if (accept && r.kind === 'gv_nghi') {
        const u = db.users.find((x) => x.id === r.userId);
        if (r.proposal === 'nguoi_thay' && r.substituteId) s.teacherId = r.substituteId;
        else if (r.proposal === 'huy_buoi') s.status = 'huy';
        else if (u.role === 'tg') s.absentStaff.push(u.id);
      }
      if (accept && r.kind === 'day_bu') {
        const src = s; const c = db.courses.find((x) => x.id === src.courseId);
        db.sessions.push({ id: newId('s'), courseId: c.id, idx: src.idx, date: r.date, start: r.start, end: r.end, title: src.title + ' (dạy bù)', teacherId: src.teacherId,
          mode: r.mode || src.mode, zoom: c.zoom, room: c.room, status: 'day_bu', note: 'Dạy bù cho buổi ' + src.date, makeupOf: src.id,
          attendance: { open: false, methods: { qr: true, web: true }, closed: false, closedAt: null, records: {}, excused: [], edits: [] }, report: null, absentStaff: [] });
      }
      if (r.kind === 'gv_nghi' || r.kind === 'day_bu') log(db, me.id, accept ? 'Duyệt ' + REQ_KIND[r.kind].toLowerCase() : 'Từ chối ' + REQ_KIND[r.kind].toLowerCase(), userName(db, r.userId) + ' - ' + cname, '', note || '');
      return { ok: true };
    });
  },

  // ---- học liệu, bài
  addMaterial(me, o) { return Store.tx((db) => { db.materials.push(Object.assign({ id: newId('m'), by: me.id, at: nowIso() }, o)); return { ok: true }; }); },
  // Bài lấy từ Google Form: người phụ trách dán đường dẫn form, hệ thống nhúng form vào trang làm bài
  saveAssignment(me, a, giao) {
    return Store.tx((db) => {
      if (!a.title) return { ok: false, msg: 'Nhập tiêu đề bài.' };
      const fi = FormLink.parse(a.formUrl);
      if (!fi.ok) return { ok: false, msg: fi.msg };
      if (a.codeEntry && !/^entry\.\d+$/.test(a.codeEntry)) return { ok: false, msg: 'Mã ô "Mã học viên" có dạng entry.123456789.' };
      if (a.openAt && a.dueAt && a.dueAt <= a.openAt) return { ok: false, msg: 'Hạn nộp phải sau giờ mở bài.' };
      a.formUrl = fi.url;
      let x = db.assignments.find((y) => y.id === a.id);
      if (!x) { x = Object.assign({ createdBy: me.id, createdAt: nowIso(), extensions: {} }, a, { id: a.id || newId('a') }); db.assignments.push(x); }
      else Object.assign(x, a);
      if (giao) { x.status = 'da_giao'; x.openAt = x.openAt || nowIso().slice(0, 16); }
      return { ok: true, id: x.id };
    });
  },
  // Học sinh báo đã nộp form. Form mô phỏng gửi kèm điểm tự chấm; form thật: giáo viên nhập điểm (bản đầy đủ: đồng bộ từ Google Sheet).
  submit(me, aid, info) {
    return Store.tx((db) => {
      info = info || {};
      const a = db.assignments.find((x) => x.id === aid);
      if (db.submissions.some((s) => s.assignmentId === aid && s.studentId === me.id)) return { ok: false, msg: 'Bạn đã nộp bài này.' };
      const due = new Date((a.extensions && a.extensions[me.id]) || a.dueAt).getTime();
      const late = Date.now() > due;
      if (late && !a.allowLate && !(a.extensions && a.extensions[me.id])) return { ok: false, msg: 'Đã quá hạn nộp. Gửi đơn xin nộp muộn.' };
      const score = info.score == null ? null : Number(info.score);
      const sub = { id: newId('sb'), assignmentId: aid, studentId: me.id, submittedAt: nowIso(), late, source: info.mock ? 'form' : 'tu_bao', score, fb: '', status: 'da_nop', returnedAt: null };
      if (score != null) sub.status = a.review ? 'da_cham' : 'da_tra';
      if (sub.status === 'da_tra') sub.returnedAt = nowIso();
      db.submissions.push(sub);
      return { ok: true, id: sub.id, returned: sub.status === 'da_tra' };
    });
  },
  grade(me, subId, score, fb, release) {
    return Store.tx((db) => {
      const sub = db.submissions.find((x) => x.id === subId); const a = db.assignments.find((x) => x.id === sub.assignmentId);
      const wasReturned = sub.status === 'da_tra'; const old = sub.score;
      sub.score = score; sub.fb = fb;
      if (wasReturned && old !== score) log(db, me.id, 'Sửa điểm sau khi trả kết quả', userName(db, sub.studentId) + ' - ' + a.title, fmt10(old), fmt10(score));
      if (release) { if (score == null) return { ok: false, msg: 'Nhập điểm trước khi trả kết quả.' }; sub.status = 'da_tra'; sub.returnedAt = nowIso(); }
      else if (!wasReturned) sub.status = score == null ? 'da_nop' : 'da_cham';
      return { ok: true };
    });
  },
  // nhập điểm nhiều học sinh một lần (gõ tay hoặc dán từ bảng phản hồi Google Form). Học sinh chưa báo nộp được tạo bài làm.
  setScores(me, aid, rows, release) {
    return Store.tx((db) => {
      const a = db.assignments.find((x) => x.id === aid); let n = 0;
      rows.forEach((r) => {
        let sub = db.submissions.find((s) => s.assignmentId === aid && s.studentId === r.uid);
        if (r.score == null && !sub) return;
        if (!sub) { sub = { id: newId('sb'), assignmentId: aid, studentId: r.uid, submittedAt: nowIso(), late: Date.now() > new Date(Q.dueOf(a, r.uid)).getTime(), source: 'nhap', score: null, fb: '', status: 'da_nop', returnedAt: null }; db.submissions.push(sub); }
        const changed = sub.score !== r.score || (r.fb != null && sub.fb !== r.fb);
        if (sub.status === 'da_tra' && sub.score !== r.score) log(db, me.id, 'Sửa điểm sau khi trả kết quả', userName(db, r.uid) + ' - ' + a.title, fmt10(sub.score), fmt10(r.score));
        sub.score = r.score; if (r.fb != null) sub.fb = r.fb;
        if (release && sub.score != null) { if (sub.status !== 'da_tra') { sub.status = 'da_tra'; sub.returnedAt = nowIso(); } }
        else if (sub.status !== 'da_tra') sub.status = sub.score == null ? 'da_nop' : 'da_cham';
        if (changed) n++;
      });
      return { ok: true, n };
    });
  },
  releaseAll(me, aid) {
    return Store.tx((db) => {
      let n = 0;
      db.submissions.filter((s) => s.assignmentId === aid && s.status !== 'da_tra' && s.score != null).forEach((s) => { s.status = 'da_tra'; s.returnedAt = nowIso(); n++; });
      return { ok: true, n };
    });
  },
  // học sinh nhắn giáo viên về một bài test: mỗi (học sinh, bài) chỉ một cuộc trò chuyện, nhắn tiếp vào cuộc đã có
  ask(me, aid, text) {
    return Store.tx((db) => {
      const old = db.qna.find((x) => x.assignmentId === aid && x.studentId === me.id);
      if (old) { old.messages.push({ by: me.id, text, at: nowIso() }); old.readAt = old.readAt || {}; old.readAt[me.id] = nowIso(); return { ok: true, id: old.id }; }
      const sub = db.submissions.find((x) => x.assignmentId === aid && x.studentId === me.id);
      const id = newId('qa');
      db.qna.push({ id, submissionId: sub ? sub.id : null, assignmentId: aid, studentId: me.id, readAt: { [me.id]: nowIso() }, messages: [{ by: me.id, text, at: nowIso() }] });
      return { ok: true, id };
    });
  },
  // gửi tin trong cuộc hỏi đáp (học sinh hỏi tiếp hoặc nhân sự trả lời)
  reply(me, id, text) { return Store.tx((db) => { const q = db.qna.find((x) => x.id === id); q.messages.push({ by: me.id, text, at: nowIso() }); q.readAt = q.readAt || {}; q.readAt[me.id] = nowIso(); return { ok: true }; }); },
  markRead(me, id) { const q = Store.db.qna.find((x) => x.id === id); if (!q || !Thread.unread(q, me.id)) return; Store.tx((db) => { const x = db.qna.find((y) => y.id === id); x.readAt = x.readAt || {}; x.readAt[me.id] = nowIso(); }); },

  // ---- cấu hình
  saveConfig(me, o) {
    return Store.tx((db) => {
      const old = JSON.stringify(db.config.params);
      Object.assign(db.config, o);
      log(db, me.id, 'Sửa cấu hình chung', 'Tham số vận hành, ngày nghỉ, mẫu nhận xét', old === JSON.stringify(db.config.params) ? '' : 'Đã đổi tham số', '');
      return { ok: true };
    });
  },
  // tự chốt điểm danh khi đã quá giờ kết thúc + thời gian chốt (FR-M04-04)
  housekeeping() {
    const need = Store.db.sessions.some((s) => !s.attendance.closed && s.status !== 'huy' && at(s.date, s.end).getTime() + Store.db.config.params.chotSau * 60e3 < Date.now() && s.date >= ymd(addDays(new Date(), -3)));
    if (!need) return;
    Store.tx((db) => {
      db.sessions.forEach((s) => {
        if (s.attendance.closed || s.status === 'huy') return;
        if (at(s.date, s.end).getTime() + db.config.params.chotSau * 60e3 >= Date.now() || s.date < ymd(addDays(new Date(), -3))) return;
        Q.rosterOf(s).forEach((u) => { if (!s.attendance.records[u.id]) s.attendance.records[u.id] = { st: s.attendance.excused.includes(u.id) ? 'vang_cp' : 'vang_kp', via: 'chot', at: nowIso() }; });
        s.attendance.open = false; s.attendance.closed = true; s.attendance.closedAt = nowIso();
        if (!s.report) s.report = { status: 'nhap', general: '', perStudent: {}, publishedAt: null, publishedBy: null };
      });
    });
  },
};

// ------------------------------------------------------------------ mã QR động (mô phỏng, không cần thư viện)
const QR = {
  code(sid, period, t) {
    const slot = Math.floor((t || Date.now()) / (period * 1000));
    let h = 2166136261;
    const str = sid + ':' + slot;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return String((h >>> 0) % 1000000).padStart(6, '0');
  },
  valid(sid, code, period) { // chấp nhận mã hiện tại và mã ngay trước (đang chuyển)
    const now = Date.now();
    return [now, now - period * 1000].some((t) => QR.code(sid, period, t) === String(code).trim());
  },
};
