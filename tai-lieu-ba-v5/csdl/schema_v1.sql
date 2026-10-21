-- Lược đồ cơ sở dữ liệu bản 1 - Hệ thống quản lý giáo vụ và học tập Hồ An Nihongo
-- Nền tảng: PostgreSQL 15 trên Supabase (Auth, Storage, Realtime, Edge Functions).
-- Phụ lục kỹ thuật của tài liệu 12_Phuong_an_trien_khai_CSDL_v5.docx. Chưa chạy trên dự án thật.
-- Quy ước: tên bảng, cột tiếng Việt không dấu; khóa chính uuid; thời gian timestamptz (hiển thị giờ Việt Nam);
--          xóa mềm bằng cột da_xoa_luc; danh mục dùng text + check để dễ mở rộng.
-- Khác ERD v5 (tài liệu 06): "khóa học" đổi thành "lớp"; bài lấy từ Google Form nên bỏ phần, câu hỏi,
--          phương án, phông chữ, câu trả lời; thêm gợi ý học liệu, lượt xem học liệu, tin nhắn hỏi đáp, đồng bộ điểm form.

create extension if not exists pgcrypto;

-- =====================================================================  1. tài khoản, phân quyền, cấu hình
create table cap_do (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique,                      -- N5, N4, ... hoặc cấp độ riêng
  thu_tu int not null default 0,
  an boolean not null default false
);

create table tai_khoan (
  id uuid primary key references auth.users(id), -- mật khẩu, khóa tạm khi sai 5 lần do Supabase Auth quản lý
  ma_hien_thi text unique,                       -- HV-0001, GV-0002, TG-0001; phụ huynh để trống
  ho_ten text not null,
  vai_tro text not null check (vai_tro in ('GiaoVien','TroGiang','HocSinh','PhuHuynh')),
  la_super_admin boolean not null default false, -- chỉ Hồ An
  email text,
  dien_thoai text,
  trang_thai text not null default 'HoatDong' check (trang_thai in ('ChoKichHoat','HoatDong','DaKhoa','DaXoa')),
  la_hs_ph boolean not null default false,       -- Học sinh (PH): phụ huynh dùng tài khoản của con
  ngay_sinh date,
  cap_do_id uuid references cap_do(id),
  ly_do_trang_thai text,
  dong_y_du_lieu_luc timestamptz,                -- Nghị định 13/2023/NĐ-CP
  ngay_tao timestamptz not null default now(),
  ngay_cap_nhat timestamptz not null default now(),
  check (email is not null or dien_thoai is not null)
);
create unique index tai_khoan_email_uq on tai_khoan (lower(email)) where trang_thai <> 'DaXoa' and email is not null;
create unique index tai_khoan_dt_uq on tai_khoan (dien_thoai) where trang_thai <> 'DaXoa' and dien_thoai is not null;

create table quyen_admin (
  id uuid primary key default gen_random_uuid(),
  tai_khoan_id uuid not null references tai_khoan(id),
  ma_quyen text not null check (ma_quyen ~ '^ADM-(0[0-9]|1[0-3])$'),
  nguoi_gan uuid not null references tai_khoan(id),
  thoi_diem timestamptz not null default now(),
  unique (tai_khoan_id, ma_quyen)
);

create table lien_ket_phu_huynh (
  id uuid primary key default gen_random_uuid(),
  phu_huynh_id uuid not null references tai_khoan(id),
  hoc_sinh_id uuid not null references tai_khoan(id),
  quan_he text not null default 'Khac' check (quan_he in ('Bo','Me','NguoiGiamHo','Khac')),
  unique (phu_huynh_id, hoc_sinh_id)
);

create table nhat_ky (                           -- chỉ thêm, không sửa, không xóa (NFR-05)
  id bigint generated always as identity primary key,
  tai_khoan_id uuid references tai_khoan(id),
  thoi_diem timestamptz not null default now(),
  thao_tac text not null,
  loai_doi_tuong text not null,
  doi_tuong_id uuid,
  gia_tri_cu jsonb,
  gia_tri_moi jsonb,
  ly_do text
);
create index nhat_ky_thoi_diem on nhat_ky (thoi_diem desc);
create index nhat_ky_doi_tuong on nhat_ky (doi_tuong_id);

create table ngay_nghi (id uuid primary key default gen_random_uuid(), ngay date not null unique, ten text not null);
create table tham_so (ma text primary key, gia_tri numeric not null, nguoi_sua uuid references tai_khoan(id), thoi_diem timestamptz not null default now());
create table mau_nhan_xet (id uuid primary key default gen_random_uuid(), cap_do_id uuid references cap_do(id), noi_dung text not null, an boolean not null default false);

-- =====================================================================  2. chương trình, lớp, buổi học
create table chuong_trinh (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  cap_do_id uuid not null references cap_do(id),
  mo_ta text, muc_tieu text,
  thoi_luong_phut int not null default 90 check (thoi_luong_phut between 30 and 240),
  trong_so jsonb not null default '{"BaiTap":20,"Test":20,"GiuaKy":25,"CuoiKy":35}',
  phien_ban int not null default 1,
  trang_thai text not null default 'SapRaMat' check (trang_thai in ('SapRaMat','DangApDung','NgungDung')),
  nguoi_tao uuid not null references tai_khoan(id),
  ngay_tao timestamptz not null default now(),
  ngay_cap_nhat timestamptz not null default now(),
  da_xoa_luc timestamptz
);

create table buoi_chuong_trinh (
  id uuid primary key default gen_random_uuid(),
  chuong_trinh_id uuid not null references chuong_trinh(id),
  phien_ban int not null,
  thu_tu int not null,
  ten_bai text not null,
  muc_tieu text, noi_dung text, ghi_chu_gv text,
  unique (chuong_trinh_id, phien_ban, thu_tu)
);

create table lop (
  id uuid primary key default gen_random_uuid(),
  cap_do_id uuid not null references cap_do(id),
  so_thu_tu int not null check (so_thu_tu between 1 and 999),
  ten text not null,                             -- N[cấp độ]K[số], ví dụ N5K12; trigger dat_ten_lop đặt, không sửa
  chuong_trinh_id uuid not null references chuong_trinh(id),
  phien_ban_ct int not null,
  hinh_thuc text not null check (hinh_thuc in ('Online','Offline','KetHop')),
  thu_trong_tuan int[] not null,                 -- 0 = Chủ nhật
  gio_bat_dau time not null, gio_ket_thuc time not null check (gio_ket_thuc > gio_bat_dau),
  ngay_khai_giang date not null,
  so_buoi int not null,
  duong_dan_zoom text, phong_hoc text,
  trong_so jsonb not null,
  trang_thai text not null default 'Nhap' check (trang_thai in ('Nhap','ChoKhaiGiang','DangHoc','DaKetThuc','TamKhoa','DaHuy','DaXoa')),
  trang_thai_truoc text,
  ngay_tao timestamptz not null default now(),
  unique (cap_do_id, so_thu_tu)
);
create unique index lop_ten_uq on lop (ten) where trang_thai <> 'DaXoa';

create or replace function dat_ten_lop() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and (new.cap_do_id <> old.cap_do_id or new.so_thu_tu <> old.so_thu_tu) then
    raise exception 'Không đổi cấp độ, số thứ tự của lớp đã tạo';
  end if;
  new.ten := (select replace(ten, ' ', '') from cap_do where id = new.cap_do_id) || 'K' || lpad(new.so_thu_tu::text, 2, '0');
  return new;
end $$;
create trigger lop_dat_ten before insert or update on lop for each row execute function dat_ten_lop();

-- số K kế tiếp của một cấp độ (giao diện đề xuất khi tạo lớp)
create or replace function so_lop_ke_tiep(p_cap_do uuid) returns int language sql stable as $$
  select coalesce(max(so_thu_tu), 0) + 1 from lop where cap_do_id = p_cap_do
$$;

create table phan_cong (
  id uuid primary key default gen_random_uuid(),
  lop_id uuid not null references lop(id),
  tai_khoan_id uuid not null references tai_khoan(id),
  vai_tro_lop text not null check (vai_tro_lop in ('GiaoVienChinh','GiaoVien','TroGiang')),
  ngay_giao timestamptz not null default now(),
  ngay_go timestamptz
);
create index phan_cong_tk on phan_cong (tai_khoan_id) where ngay_go is null;

create table thanh_vien_lop (
  id uuid primary key default gen_random_uuid(),
  lop_id uuid not null references lop(id),
  hoc_sinh_id uuid not null references tai_khoan(id),
  ngay_vao timestamptz not null default now(),
  ngay_roi timestamptz, ly_do_roi text,
  nguoi_them uuid not null references tai_khoan(id)
);
create index tv_lop_hs on thanh_vien_lop (hoc_sinh_id) where ngay_roi is null;
create index tv_lop_lop on thanh_vien_lop (lop_id) where ngay_roi is null;

create table noi_dung_buoi_lop (                -- bản sao nội dung từng buổi từ chương trình, lớp chỉnh riêng được
  id uuid primary key default gen_random_uuid(),
  lop_id uuid not null references lop(id),
  thu_tu int not null,
  ten_bai text not null, muc_tieu text, noi_dung text, ghi_chu_gv text,
  khac_chuong_trinh boolean not null default false,
  unique (lop_id, thu_tu)
);

create table buoi_hoc (
  id uuid primary key default gen_random_uuid(),
  lop_id uuid not null references lop(id),
  noi_dung_id uuid references noi_dung_buoi_lop(id),
  bat_dau timestamptz not null, ket_thuc timestamptz not null check (ket_thuc > bat_dau),
  hinh_thuc text not null, duong_dan_zoom text, phong_hoc text,
  nguoi_day uuid not null references tai_khoan(id),
  trang_thai text not null default 'DaLenLich' check (trang_thai in ('DaLenLich','DaDoiLich','DaHuy','DayBu')),
  buoi_goc_id uuid references buoi_hoc(id),
  ly_do_doi text
);
create index buoi_hoc_lop on buoi_hoc (lop_id, bat_dau);
create index buoi_hoc_nguoi_day on buoi_hoc (nguoi_day, bat_dau);

-- =====================================================================  3. đơn, điểm danh, nhận xét, báo cáo
create table don (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (loai in ('NghiHoc','NopMuon','NghiDay','DayBu')),
  nguoi_gui uuid not null references tai_khoan(id),
  lop_id uuid not null references lop(id),
  buoi_id uuid references buoi_hoc(id),
  bai_id uuid,                                   -- khóa ngoại thêm sau khi tạo bảng bai
  ly_do text not null,
  phuong_an text check (phuong_an in ('KhongThay','NguoiThay','HuyVaDayBu')),
  nguoi_day_thay uuid references tai_khoan(id),
  lich_day_bu jsonb,                             -- ngày, giờ, hình thức đề xuất
  han_moi timestamptz,
  bao_muon boolean not null default false,
  trang_thai text not null default 'ChoDuyet' check (trang_thai in ('ChoDuyet','DaDuyet','TuChoi','DaHuy')),
  nguoi_xu_ly uuid references tai_khoan(id), thoi_diem_xu_ly timestamptz, ghi_chu text,
  ngay_tao timestamptz not null default now()
);
create index don_cho on don (lop_id) where trang_thai = 'ChoDuyet';

create table phien_diem_danh (
  id uuid primary key default gen_random_uuid(),
  buoi_id uuid not null unique references buoi_hoc(id),
  trang_thai text not null default 'ChuaMo' check (trang_thai in ('ChuaMo','DangMo','DaDong','DaChot')),
  cho_phep_qr boolean not null default true,
  cho_phep_web boolean not null default true,
  khoa_sinh_ma text not null default encode(gen_random_bytes(16), 'hex'), -- bí mật sinh mã QR động, không trả về giao diện
  nguoi_mo uuid references tai_khoan(id), gio_mo timestamptz, gio_chot timestamptz
);
revoke select (khoa_sinh_ma) on phien_diem_danh from authenticated, anon;

create table diem_danh (
  id uuid primary key default gen_random_uuid(),
  buoi_id uuid not null references buoi_hoc(id),
  hoc_sinh_id uuid not null references tai_khoan(id),
  trang_thai text not null check (trang_thai in ('CoMat','DiMuon','VangCoPhep','VangKhongPhep')),
  cach_ghi_nhan text not null check (cach_ghi_nhan in ('QR','Web','ThuCong','TheoDon','TuDongKhiChot')),
  thoi_diem timestamptz not null default now(),
  nguoi_ghi uuid references tai_khoan(id),
  unique (buoi_id, hoc_sinh_id)
);

create table nhan_xet_buoi (
  id uuid primary key default gen_random_uuid(),
  buoi_id uuid not null references buoi_hoc(id),
  hoc_sinh_id uuid references tai_khoan(id),     -- rỗng = nhận xét chung cho lớp
  noi_dung text not null,
  nguoi_viet uuid not null references tai_khoan(id),
  ngay_cap_nhat timestamptz not null default now()
);

create table bao_cao (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (loai in ('Buoi','Lop')),
  doi_tuong_id uuid not null,                    -- buổi học hoặc lớp
  nhan_xet_chung text,
  trang_thai text not null default 'Nhap' check (trang_thai in ('Nhap','DaCongBo')),
  cong_bo_luc timestamptz, nguoi_cong_bo uuid references tai_khoan(id),
  unique (loai, doi_tuong_id)
);

-- =====================================================================  4. học liệu, gợi ý học liệu
create table hoc_lieu (
  id uuid primary key default gen_random_uuid(),
  pham_vi text not null check (pham_vi in ('ChuongTrinh','Lop')),
  buoi_chuong_trinh_id uuid references buoi_chuong_trinh(id),
  noi_dung_buoi_lop_id uuid references noi_dung_buoi_lop(id),
  ten text not null,
  loai text not null check (loai in ('Tep','DuongDan')),
  duong_dan_tep text,                            -- đường dẫn trong kho riêng tư "hoc-lieu" của Supabase Storage
  duong_dan text,                                -- đường dẫn ngoài (Google Drive chặn tải, YouTube không công khai...)
  kich_thuoc bigint, kieu_tep text,
  nguon text not null check (nguon in ('ChuongTrinh','LopBoSung','TuGoiY')),
  cho_tai_ve boolean not null default false,     -- mặc định không cho tải về
  nguoi_tai uuid not null references tai_khoan(id),
  ngay_tai timestamptz not null default now(),
  da_xoa_luc timestamptz,
  check ((pham_vi = 'ChuongTrinh' and buoi_chuong_trinh_id is not null and noi_dung_buoi_lop_id is null)
      or (pham_vi = 'Lop' and noi_dung_buoi_lop_id is not null and buoi_chuong_trinh_id is null)),
  check ((loai = 'Tep' and duong_dan_tep is not null) or (loai = 'DuongDan' and duong_dan is not null))
);
create index hoc_lieu_ct on hoc_lieu (buoi_chuong_trinh_id) where da_xoa_luc is null;
create index hoc_lieu_lop on hoc_lieu (noi_dung_buoi_lop_id) where da_xoa_luc is null;

-- học liệu giáo viên bổ sung cho lớp: lưu vào kho của chương trình, Hồ An quyết định có thêm vào chương trình không
create table goi_y_hoc_lieu (
  id uuid primary key default gen_random_uuid(),
  chuong_trinh_id uuid not null references chuong_trinh(id),
  thu_tu_buoi int not null,
  hoc_lieu_lop_id uuid not null references hoc_lieu(id),  -- bản ở lớp (dùng chung tệp, không chép tệp)
  lop_id uuid not null references lop(id),
  nguoi_de_xuat uuid not null references tai_khoan(id),
  thoi_diem timestamptz not null default now(),
  trang_thai text not null default 'ChoDuyet' check (trang_thai in ('ChoDuyet','DaThem','KhongThem')),
  nguoi_duyet uuid references tai_khoan(id), thoi_diem_duyet timestamptz, ghi_chu text,
  hoc_lieu_ct_id uuid references hoc_lieu(id)    -- bản thêm vào chương trình khi duyệt
);
create index goi_y_cho on goi_y_hoc_lieu (chuong_trinh_id) where trang_thai = 'ChoDuyet';

create table luot_xem_hoc_lieu (
  id bigint generated always as identity primary key,
  hoc_lieu_id uuid not null references hoc_lieu(id),
  tai_khoan_id uuid not null references tai_khoan(id),
  thoi_diem timestamptz not null default now(),
  thiet_bi text
);

-- tự tạo gợi ý khi giáo viên thêm học liệu cho lớp
create or replace function tao_goi_y_hoc_lieu() returns trigger language plpgsql security definer set search_path = public as $$
declare v_lop uuid; v_ct uuid; v_tt int;
begin
  if new.pham_vi = 'Lop' and new.nguon = 'LopBoSung' then
    select n.lop_id, l.chuong_trinh_id, n.thu_tu into v_lop, v_ct, v_tt
      from noi_dung_buoi_lop n join lop l on l.id = n.lop_id where n.id = new.noi_dung_buoi_lop_id;
    insert into goi_y_hoc_lieu (chuong_trinh_id, thu_tu_buoi, hoc_lieu_lop_id, lop_id, nguoi_de_xuat)
      values (v_ct, v_tt, new.id, v_lop, new.nguoi_tai);
  end if;
  return new;
end $$;
create trigger hoc_lieu_goi_y after insert on hoc_lieu for each row execute function tao_goi_y_hoc_lieu();

-- =====================================================================  5. bài (Google Form), bài làm, hỏi đáp
create table bai (
  id uuid primary key default gen_random_uuid(),
  lop_id uuid not null references lop(id),
  buoi_id uuid references buoi_hoc(id),
  loai_bai text not null check (loai_bai in ('BaiTap','Test','GiuaKy','CuoiKy')),
  tieu_de text not null, mo_ta text,
  google_form_url text not null check (google_form_url ~ '^https://(docs\.google\.com/forms/|forms\.gle/)'),
  google_form_id text,                           -- mã form, dùng để khớp điểm đồng bộ từ Google Sheet
  o_ma_hoc_vien text check (o_ma_hoc_vien ~ '^entry\.[0-9]+$'), -- ô tự điền mã học viên
  mo_luc timestamptz, han_nop timestamptz not null,
  thoi_gian_phut int, cho_nop_muon boolean not null default true,
  cong_bo_sau_xem_xet boolean not null default false,
  trang_thai text not null default 'Nhap' check (trang_thai in ('Nhap','DaGiao','DaDong')),
  nguoi_tao uuid not null references tai_khoan(id),
  ngay_tao timestamptz not null default now(),
  check (mo_luc is null or han_nop > mo_luc)
);
alter table don add constraint don_bai_fk foreign key (bai_id) references bai(id);

create table gia_han_bai (                      -- hạn riêng từ đơn xin nộp muộn được chấp nhận
  bai_id uuid not null references bai(id), hoc_sinh_id uuid not null references tai_khoan(id),
  han_moi timestamptz not null, don_id uuid references don(id), primary key (bai_id, hoc_sinh_id)
);

create table bai_lam (
  id uuid primary key default gen_random_uuid(),
  bai_id uuid not null references bai(id),
  hoc_sinh_id uuid not null references tai_khoan(id),
  trang_thai text not null default 'DaNop' check (trang_thai in ('DaNop','CoDiem','DaTraKetQua')),
  nop_luc timestamptz not null default now(),
  nop_muon boolean not null default false,
  nguon text not null check (nguon in ('HocSinhBao','DongBoForm','NhapTay')),
  diem numeric(4,2) check (diem between 0 and 10),  -- thang 10
  nhan_xet text,
  tra_ket_qua_luc timestamptz,
  ma_phan_hoi_form text,                         -- mã câu trả lời trong Google Form (khi đồng bộ)
  ngay_cap_nhat timestamptz not null default now(),
  unique (bai_id, hoc_sinh_id)
);

create table dong_bo_diem_form (                -- mỗi lần nhận điểm từ Google Sheet hoặc dán tay
  id uuid primary key default gen_random_uuid(),
  bai_id uuid not null references bai(id),
  thoi_diem timestamptz not null default now(),
  nguon text not null check (nguon in ('AppsScript','DanTay')),
  so_dong int not null, so_khop int not null, so_loi int not null,
  chi_tiet_loi jsonb, nguoi_thuc_hien uuid references tai_khoan(id)
);

create table hoi_dap (
  id uuid primary key default gen_random_uuid(),
  bai_id uuid not null references bai(id),
  bai_lam_id uuid references bai_lam(id),
  hoc_sinh_id uuid not null references tai_khoan(id),
  trang_thai text not null default 'ChoTraLoi' check (trang_thai in ('ChoTraLoi','DaTraLoi','DaDong')),
  hoi_luc timestamptz not null default now(),
  unique (bai_id, hoc_sinh_id)                   -- mỗi học sinh một đoạn chat cho mỗi bài test, không chia theo câu
);
create table tin_nhan_hoi_dap (
  id uuid primary key default gen_random_uuid(),
  hoi_dap_id uuid not null references hoi_dap(id),
  nguoi_gui uuid not null references tai_khoan(id),
  noi_dung text not null,
  thoi_diem timestamptz not null default now()
);
create index tin_nhan_hd on tin_nhan_hoi_dap (hoi_dap_id, thoi_diem);
create table da_doc_hoi_dap (hoi_dap_id uuid references hoi_dap(id), tai_khoan_id uuid references tai_khoan(id), doc_luc timestamptz not null, primary key (hoi_dap_id, tai_khoan_id));

-- =====================================================================  6. hàm kiểm quyền dùng trong chính sách RLS
create or replace function la_super_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select la_super_admin from tai_khoan where id = auth.uid() and trang_thai = 'HoatDong'), false)
$$;
create or replace function la_nhan_su() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from tai_khoan where id = auth.uid() and trang_thai = 'HoatDong' and vai_tro in ('GiaoVien','TroGiang'))
$$;
create or replace function co_quyen(p_ma text) returns boolean language sql stable security definer set search_path = public as $$
  select la_super_admin() or exists (select 1 from quyen_admin q join tai_khoan t on t.id = q.tai_khoan_id
    where q.tai_khoan_id = auth.uid() and q.ma_quyen = p_ma and t.trang_thai = 'HoatDong')
$$;
create or replace function phu_trach_lop(p_lop uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from phan_cong where lop_id = p_lop and tai_khoan_id = auth.uid() and ngay_go is null)
$$;
-- nhân sự xem lớp: phụ trách, có quyền xem báo cáo mọi lớp hoặc quản trị lớp, hoặc lớp cùng cấp độ với lớp mình phụ trách
create or replace function xem_lop(p_lop uuid) returns boolean language sql stable security definer set search_path = public as $$
  select la_nhan_su() and (phu_trach_lop(p_lop) or co_quyen('ADM-11') or co_quyen('ADM-05') or co_quyen('ADM-06')
    or exists (select 1 from lop a join lop b on a.cap_do_id = b.cap_do_id join phan_cong p on p.lop_id = b.id
               where a.id = p_lop and p.tai_khoan_id = auth.uid() and p.ngay_go is null))
$$;
create or replace function hoc_lop(p_lop uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from thanh_vien_lop where lop_id = p_lop and ngay_roi is null and hoc_sinh_id = auth.uid())
      or exists (select 1 from thanh_vien_lop v join lien_ket_phu_huynh k on k.hoc_sinh_id = v.hoc_sinh_id
                 where v.lop_id = p_lop and v.ngay_roi is null and k.phu_huynh_id = auth.uid())
$$;
create or replace function xem_hoc_sinh(p_hs uuid) returns boolean language sql stable security definer set search_path = public as $$
  select p_hs = auth.uid()
      or exists (select 1 from lien_ket_phu_huynh where hoc_sinh_id = p_hs and phu_huynh_id = auth.uid())
      or exists (select 1 from thanh_vien_lop v where v.hoc_sinh_id = p_hs and xem_lop(v.lop_id))
$$;

-- =====================================================================  7. bật RLS và chính sách mẫu (đủ bộ viết trong migration)
alter table tai_khoan enable row level security;
alter table lop enable row level security;
alter table diem_danh enable row level security;
alter table bai_lam enable row level security;
alter table hoc_lieu enable row level security;
alter table goi_y_hoc_lieu enable row level security;
alter table nhat_ky enable row level security;

create policy lop_xem on lop for select using (xem_lop(id) or hoc_lop(id));
create policy lop_tao on lop for insert with check (co_quyen('ADM-05'));
create policy lop_sua on lop for update using (co_quyen('ADM-06') or co_quyen('ADM-07'));

create policy dd_xem on diem_danh for select using (xem_hoc_sinh(hoc_sinh_id));
create policy dd_ghi on diem_danh for all using (exists (select 1 from buoi_hoc b where b.id = buoi_id and (phu_trach_lop(b.lop_id) or b.nguoi_day = auth.uid())));
-- học sinh tự điểm danh đi qua hàm diem_danh_qr(...) security definer (kiểm mã động, giờ mở), không ghi trực tiếp

-- học sinh, phụ huynh chỉ thấy điểm khi đã trả kết quả
create policy bl_hs on bai_lam for select using (xem_hoc_sinh(hoc_sinh_id) and (la_nhan_su() or trang_thai = 'DaTraKetQua' or diem is null));
create policy bl_nhan_su on bai_lam for update using (exists (select 1 from bai b where b.id = bai_id and phu_trach_lop(b.lop_id)));

create policy hl_xem on hoc_lieu for select using (
  da_xoa_luc is null and (la_nhan_su()
    or exists (select 1 from noi_dung_buoi_lop n where n.id = noi_dung_buoi_lop_id and hoc_lop(n.lop_id))));
create policy gy_xem on goi_y_hoc_lieu for select using (la_nhan_su());
create policy gy_duyet on goi_y_hoc_lieu for update using (la_super_admin());

create policy nk_xem on nhat_ky for select using (la_super_admin() or co_quyen('ADM-04'));
revoke update, delete on nhat_ky from authenticated, anon;
-- không xóa cứng dữ liệu nghiệp vụ: chỉ cập nhật trạng thái hoặc da_xoa_luc (NFR-13)
revoke delete on tai_khoan, lop, buoi_hoc, diem_danh, bai, bai_lam, hoc_lieu, don from authenticated, anon;

-- =====================================================================  8. khung nhìn báo cáo
create or replace view v_chuyen_can as
  select b.lop_id, d.hoc_sinh_id,
         count(*) as so_buoi,
         count(*) filter (where d.trang_thai in ('CoMat','DiMuon')) as co_mat,
         count(*) filter (where d.trang_thai = 'VangKhongPhep') as vang_khong_phep,
         round(100.0 * count(*) filter (where d.trang_thai in ('CoMat','DiMuon')) / nullif(count(*), 0), 1) as ty_le
  from diem_danh d join buoi_hoc b on b.id = d.buoi_id join phien_diem_danh p on p.buoi_id = b.id
  where p.trang_thai = 'DaChot' and b.trang_thai <> 'DaHuy'
  group by b.lop_id, d.hoc_sinh_id;
alter view v_chuyen_can set (security_invoker = true);  -- khung nhìn tuân theo RLS của người xem
