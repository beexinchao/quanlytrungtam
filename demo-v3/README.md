# Bản demo v3: Hồ An Nihongo

Website quản lý giáo vụ và học tập theo bộ tài liệu v5.3, điều chỉnh theo góp ý của Sếp ngày 21/10/2026. Dữ liệu giả, lưu trong trình duyệt; không có máy chủ dữ liệu. Bản v2 giữ nguyên ở `../demo_v2/` (cổng 8687), bản v1 ở `../demo/`.

## Cách chạy

- Bấm đúp `CHAY_DEMO.bat`: trình duyệt mở `http://localhost:8688`.
- Hoặc trong thư mục này chạy `node server.js 8688`.
- Không có Node.js: mở thẳng `index.html` bằng Chrome hoặc Edge.

## 5 tài khoản đăng nhập (mật khẩu chung 123456)

| Tên | Vai trò | Đăng nhập |
|---|---|---|
| Hồ An | Giáo viên, Super Admin | hoan@demo.vn |
| Giáo viên A | Giáo viên chính lớp N5K12 (Admin: xem báo cáo mọi lớp) | giaovien.a@demo.vn |
| Trợ giảng B | Trợ giảng lớp N5K12 và N4K08 | trogiang.b@demo.vn |
| Học sinh C | Học sinh lớp N5K12 | hocsinh.c@demo.vn |
| Phụ huynh D | Phụ huynh của Học sinh C | phuhuynh.d@demo.vn |

## Thay đổi so với bản v2

1. **Bài tập, kiểm tra nhúng từ Google Form.** Bỏ trình soạn câu hỏi trong web. Người phụ trách bấm "Giao bài từ Google Form", dán link (forms.gle, link làm bài hoặc link chỉnh sửa đều nhận; link chỉnh sửa tự đổi sang link làm bài), khung bên trái hiện bài ngay. Học sinh làm bài trên form nhúng trong trang.
   - Điểm thang 10: người phụ trách nhập tay ở tab Nhập điểm hoặc dán hai cột mã học viên và điểm từ bảng câu trả lời của form (nhận dạng "8 / 10"). Tùy chọn "Tự điền mã học viên" (mã entry của câu "Mã học viên" trong form) để khớp điểm.
   - Dữ liệu mẫu dùng form mô phỏng (đường dẫn `DEMO-...`), chạy tại chỗ, không tải gì từ Google: bấm Gửi là nộp, phần trắc nghiệm tự chấm. Dán link Google Form thật thì trang nhúng form thật (cần mạng).
   - Hỏi đáp theo từng bài test, không chia theo câu: mỗi học sinh một đoạn chat với giáo viên, trợ giảng cho mỗi bài. Giao diện kiểu Messenger: danh sách đoạn chat có ảnh đại diện, tin cuối, chấm tin mới; bong bóng xanh (mình) và xám (người kia), gộp tin liên tiếp, mốc giờ, "Đã xem"; ô nhập bo tròn, Enter để gửi. Học sinh mở đoạn chat từ nút bút (Tin nhắn mới), trang Làm bài hoặc Kết quả.
2. **Chương trình đang soạn gọi là "Sắp ra mắt"** (không còn "Nháp").
3. **Gọi là "lớp" thay vì "khóa học"**; cấp độ (N5, N4...) gọi là "cấp độ"; "Kiểm tra giữa kỳ, cuối kỳ"; báo cáo "Theo cấp độ".
4. **Tên lớp N[cấp độ]K[số]**: N5K12, N4K08... Khi tạo lớp, chọn chương trình thì hệ thống đề xuất số K kế tiếp của cấp độ (sửa được, báo trùng). Tên lớp không sửa sau khi tạo.
5. **Học liệu: chương trình là nền, lớp bổ sung, Hồ An duyệt.** Lớp nhận nội dung và học liệu của chương trình. Giáo viên tải thêm học liệu cho lớp theo buổi (tab Nội dung buổi học, kể cả sau buổi học); học liệu đó gắn nhãn "Lớp bổ sung" và được lưu vào gợi ý học liệu của chương trình. Hồ An thấy ô "Gợi ý học liệu chờ duyệt" ở Tổng quan; khi vào sửa chương trình, buổi có gợi ý hiện khung "Gợi ý học liệu từ các lớp" và tab "Gợi ý học liệu". Hồ An bấm "Thêm vào chương trình" (lớp tạo sau nhận học liệu) hoặc "Không thêm" (ghi lý do). Học liệu của chương trình không gỡ được ở lớp.
6. **Học liệu chỉ xem, không tải về.** Giáo viên, trợ giảng, học sinh, phụ huynh xem tệp trong khung xem ngay trên trang (ảnh, PDF ẩn thanh công cụ, văn bản, âm thanh, video không có nút tải), có đóng dấu tên người xem, chặn chuột phải và kéo thả. Chỉ Hồ An có nút tải bản gốc. Lưu ý: trình duyệt không chặn tuyệt đối việc chụp màn hình; bản thật dùng thêm đường dẫn tệp hết hạn nhanh và nhật ký xem (xem tài liệu 12).
7. **Tổng quan thiết kế lại theo mức quan trọng.**
   - Nhân sự: tầng 1 "Ưu tiên hôm nay" (buổi dạy hôm nay, khung Cần làm ngay: đơn sát giờ hoặc báo muộn, báo cáo buổi quá hạn, bài chờ điểm quá 3 ngày, câu hỏi chờ quá 24 giờ); tầng 2 "Việc tồn" (6 ô số liệu là bộ lọc, hộp việc chia đôi); tầng 3 "Tình hình lớp" (chuyên cần, nộp bài đúng hạn, điểm TB, báo cáo đúng hạn 4 tuần gần nhất so với 4 tuần trước; buổi dạy tuần này, lớp đang học, học sinh đang học, đơn xin nghỉ; bảng từng lớp). Người có quyền xem báo cáo mọi lớp thấy số liệu toàn trung tâm.
   - Học sinh và phụ huynh: Hôm nay (buổi học, việc cần làm), Chỉ số học tập so với trung bình lớp (chuyên cần, điểm tổng kết, nộp bài đúng hạn, bài đã làm), Mới cập nhật (kết quả, báo cáo buổi, đơn).

## Kiểm tra đã chạy (21/10/2026)

- Quét 809 lần vẽ trang với 5 tài khoản (mọi trang, mọi tab, mọi việc trong Tổng quan): không lỗi hiển thị, không lỗi console, không có chữ "undefined", "NaN".
- Màn hình 375 px: 14 trang chính không tràn ngang.
- Luồng: học sinh nộp form mô phỏng; giáo viên giao bài bằng link Google Form (kiểm 5 dạng link), nhập điểm, dán điểm "8 / 10" và "6,5", trả kết quả; giáo viên bổ sung học liệu cho lớp, Hồ An thêm vào chương trình, lớp N5K14 tạo sau nhận học liệu đó; khung xem học liệu không có nút tải với học sinh.
- Chưa kiểm: nhúng một Google Form thật đang mở (cần link form của trung tâm và mạng).

## Thử tương tác giữa các vai trò

Trang "Kịch bản thử" (menu tài khoản) có 10 kịch bản, mỗi kịch bản có nút mở sẵn tab đã đăng nhập. Đường dẫn `#/as/<mã tài khoản>/<trang>` mở tab đăng nhập sẵn, ví dụ `http://localhost:8688/#/as/u_gva/viec`. "Đặt lại dữ liệu demo" trong menu tài khoản tạo lại dữ liệu mẫu.

## Giản lược

- Điểm form thật chưa tự đồng bộ: giáo viên nhập hoặc dán. Bản thật: Apps Script gắn vào Google Sheet câu trả lời gửi điểm về hệ thống (tài liệu 12, mục tích hợp Google Form).
- Mã QR là hình mô phỏng; học sinh nhập 6 số dưới mã thay cho quét camera.
- Không gửi email, không mở Zoom thật. Tệp tải lên chỉ nằm trong trình duyệt của máy đã tải.

## Cấu trúc

- `index.html`, `styles.css`: khung trang và hệ thiết kế (phần thêm của v3 ở cuối `styles.css`).
- `js/store.js`: dữ liệu mẫu, phân quyền, quy tắc nghiệp vụ, kiểm tra link Google Form. `js/files.js`: kho tệp (IndexedDB) và khung xem học liệu.
- `js/kit.js`: thành phần giao diện, biểu đồ, định tuyến. `js/shell.js`: khung trang, đăng nhập, kịch bản thử.
- `js/p_*.js`: các trang. `p_inbox.js` Tổng quan nhân sự; `p_assign.js` giao bài Google Form, nhập điểm; `p_program.js` chương trình, gợi ý học liệu; `p_learner.js` học sinh, phụ huynh.
