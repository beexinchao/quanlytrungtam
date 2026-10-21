# Hồ An Nihongo - Bộ tài liệu BA v5

Hệ thống quản lý giáo vụ và học tập cho trung tâm tiếng Nhật Hồ An Nihongo. Phiên bản 5.3, đã duyệt ngày 2026-10-21.

Phạm vi: tài khoản và phân quyền; chương trình học và khóa học; thời khóa biểu và lịch dạy; điểm danh (QR, web, thủ công); học liệu, bài tập và kiểm tra (trình tạo bài kiểu Google Form, nhập từ tệp mẫu, phông chữ tiếng Nhật); nhận xét, báo cáo và việc cần xử lý; cổng học sinh và phụ huynh; cấu hình chung. Không gồm học phí, tuyển sinh.

Vai trò: Admin (đính kèm Giáo viên, Trợ giảng), Giáo viên, Trợ giảng, Học sinh và Học sinh (PH), Phụ huynh.

## Bản demo v3 (21/10/2026)

Chạy ngay trên web: **https://beexinchao.github.io/quanlytrungtam/demo-v3/** (dữ liệu giả, lưu trong trình duyệt; mật khẩu chung 123456). Mã nguồn và hướng dẫn: [demo-v3/](demo-v3/README.md).

Điều chỉnh theo góp ý ngày 21/10/2026: bài tập, kiểm tra nhúng từ Google Form (dán link là hiện bài); hỏi đáp kiểu Messenger, mỗi bài test một đoạn chat; chương trình đang soạn gọi là "Sắp ra mắt"; gọi là lớp thay vì khóa học, tên lớp N[cấp độ]K[số] (N5K12); học liệu giáo viên bổ sung cho lớp được lưu vào gợi ý của chương trình để Hồ An duyệt; giáo viên, học sinh, phụ huynh chỉ xem học liệu, không tải về; Tổng quan thiết kế lại theo mức ưu tiên, thêm chỉ số. Các thay đổi này chưa cập nhật vào tài liệu 01-11 (xem mục 16 của tài liệu 12).

## Tài liệu

| Tệp | Nội dung |
|---|---|
| [01_BRD_v5.docx](tai-lieu-ba-v5/01_BRD_v5.docx) | Yêu cầu nghiệp vụ: bối cảnh, mục tiêu, phạm vi, bên liên quan, vai trò, quy trình, 32 BR |
| [02_SRS_v5.docx](tai-lieu-ba-v5/02_SRS_v5.docx) | Đặc tả yêu cầu phần mềm: phân quyền, 66 FR, tham số, trạng thái, NFR |
| [03_Actor_UseCase_v5.docx](tai-lieu-ba-v5/03_Actor_UseCase_v5.docx) | Tác nhân, 34 use case |
| [04_UserStory_AC_v5.docx](tai-lieu-ba-v5/04_UserStory_AC_v5.docx) | 34 user story, 115 tiêu chí chấp nhận |
| [05_Quy_trinh_nghiep_vu_v5.docx](tai-lieu-ba-v5/05_Quy_trinh_nghiep_vu_v5.docx) | 7 quy trình có sơ đồ làn bơi |
| [06_ERD_Tu_dien_du_lieu_v5.docx](tai-lieu-ba-v5/06_ERD_Tu_dien_du_lieu_v5.docx) | ERD, từ điển dữ liệu 30 thực thể |
| [07_Dac_ta_API_v5.docx](tai-lieu-ba-v5/07_Dac_ta_API_v5.docx) | 66 API, mã lỗi |
| [08_Yeu_cau_phi_chuc_nang_v5.docx](tai-lieu-ba-v5/08_Yeu_cau_phi_chuc_nang_v5.docx) | 14 yêu cầu phi chức năng, ma trận phân quyền |
| [09_Dac_ta_man_hinh_v5.docx](tai-lieu-ba-v5/09_Dac_ta_man_hinh_v5.docx) | 30 màn hình laptop và điện thoại |
| [10_Ma_tran_truy_vet_v5.docx](tai-lieu-ba-v5/10_Ma_tran_truy_vet_v5.docx) | Truy vết BR, FR, UC, US, màn hình, API, test case |
| [11_Test_case_v5.docx](tai-lieu-ba-v5/11_Test_case_v5.docx) | 149 test case |
| [12_Phuong_an_trien_khai_CSDL_v5.docx](tai-lieu-ba-v5/12_Phuong_an_trien_khai_CSDL_v5.docx) | Phương án triển khai cơ sở dữ liệu: Supabase (PostgreSQL), phân quyền RLS, lưu học liệu không tải về, tích hợp Google Form, sao lưu, kế hoạch, chi phí. Lược đồ SQL: [csdl/schema_v1.sql](tai-lieu-ba-v5/csdl/schema_v1.sql) |

Số liệu chỉ tiêu, tham số và ví dụ trong tài liệu là đề xuất hoặc dữ liệu minh họa.
