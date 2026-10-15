// Sinh tự động từ _source/registry.json bởi _tools/gen_nfr.js. Không sửa tay.
// Giá trị mỗi hành động: day_du, gioi_han (theo phạm vi được giao), khong. Module hiển thị khi có ít nhất một hành động khác khong.
window.PERMISSIONS = {
  "mo_ta": "Ma trận phân quyền 7 vai trò x 10 module. Sinh tự động từ registry, cùng nguồn với 08_Yeu_cau_phi_chuc_nang.docx. Không sửa tay.",
  "hanh_dong": [
    "xem",
    "tao",
    "sua",
    "xoa",
    "duyet"
  ],
  "gia_tri": {
    "day_du": "Đủ",
    "gioi_han": "Giới hạn",
    "khong": "Không"
  },
  "roles": [
    {
      "id": "chu_trung_tam",
      "ten": "Chủ trung tâm"
    },
    {
      "id": "quan_ly",
      "ten": "Quản lý"
    },
    {
      "id": "ke_toan",
      "ten": "Kế toán"
    },
    {
      "id": "giao_vien",
      "ten": "Giáo viên"
    },
    {
      "id": "tro_giang",
      "ten": "Trợ giảng"
    },
    {
      "id": "hoc_vien",
      "ten": "Học viên"
    },
    {
      "id": "phu_huynh",
      "ten": "Phụ huynh"
    }
  ],
  "modules": [
    {
      "id": "M01",
      "ten": "Quản lý học viên, giáo viên, phụ huynh"
    },
    {
      "id": "M02",
      "ten": "Quản lý lớp học, khóa học, thời khóa biểu"
    },
    {
      "id": "M03",
      "ten": "Điểm danh"
    },
    {
      "id": "M04",
      "ten": "Học phí, thu chi, công nợ"
    },
    {
      "id": "M05",
      "ten": "Báo cáo"
    },
    {
      "id": "M06",
      "ten": "Bài tập, điểm số, nhận xét"
    },
    {
      "id": "M07",
      "ten": "Thông báo (Zalo, SMS, email)"
    },
    {
      "id": "M08",
      "ten": "Cổng học viên và phụ huynh trên điện thoại"
    },
    {
      "id": "M09",
      "ten": "Lương giáo viên"
    },
    {
      "id": "M10",
      "ten": "Tuyển sinh và quản lý khách tiềm năng"
    }
  ],
  "matrix": {
    "chu_trung_tam": {
      "M01": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "day_du",
        "duyet": "day_du",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M02": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "day_du",
        "duyet": "day_du",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M03": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "khong",
        "duyet": "day_du",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M04": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "day_du",
        "duyet": "day_du",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M05": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M06": {
        "xem": "day_du",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "day_du",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M07": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "khong",
        "duyet": "day_du",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M08": {
        "xem": "day_du",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M09": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "day_du",
        "duyet": "day_du",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M10": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "day_du",
        "duyet": "day_du",
        "ghi_chu": "Không có giới hạn bổ sung."
      }
    },
    "quan_ly": {
      "M01": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "gioi_han",
        "duyet": "day_du",
        "ghi_chu": "Xóa: chỉ hồ sơ chưa phát sinh điểm danh, học phí hoặc điểm; hồ sơ khác chỉ chuyển trạng thái."
      },
      "M02": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "gioi_han",
        "duyet": "day_du",
        "ghi_chu": "Xóa: chỉ lớp chưa có học viên ghi danh."
      },
      "M03": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "khong",
        "duyet": "day_du",
        "ghi_chu": "Duyệt: sửa điểm danh quá thời hạn cho phép; không xóa buổi đã điểm danh."
      },
      "M04": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "khong",
        "duyet": "gioi_han",
        "ghi_chu": "Duyệt: miễn giảm trong hạn mức do chủ trung tâm đặt; không xóa chứng từ."
      },
      "M05": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M06": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "gioi_han",
        "duyet": "day_du",
        "ghi_chu": "Xóa: chỉ bài tập chưa có bài nộp."
      },
      "M07": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "gioi_han",
        "duyet": "day_du",
        "ghi_chu": "Xóa: chỉ mẫu thông báo chưa dùng; thông báo đã gửi chỉ xem lịch sử."
      },
      "M08": {
        "xem": "day_du",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M09": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Xem: tổng hợp chi phí lương theo lớp, không xem lương từng cá nhân."
      },
      "M10": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "gioi_han",
        "duyet": "day_du",
        "ghi_chu": "Xóa: chỉ khách tiềm năng chưa chuyển thành học viên."
      }
    },
    "ke_toan": {
      "M01": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Xem: thông tin liên hệ và tình trạng công nợ, không xem nhận xét học tập."
      },
      "M02": {
        "xem": "day_du",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M03": {
        "xem": "day_du",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M04": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "gioi_han",
        "duyet": "khong",
        "ghi_chu": "Xóa: chỉ hủy phiếu thu kèm lý do và để lại bản ghi điều chỉnh; không duyệt miễn giảm vượt hạn mức."
      },
      "M05": {
        "xem": "gioi_han",
        "tao": "gioi_han",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Xem và lập: chỉ báo cáo tài chính và công nợ."
      },
      "M06": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M07": {
        "xem": "gioi_han",
        "tao": "gioi_han",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Xem và tạo: chỉ thông báo nhắc nộp học phí và lịch sử gửi liên quan."
      },
      "M08": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M09": {
        "xem": "day_du",
        "tao": "day_du",
        "sua": "day_du",
        "xoa": "gioi_han",
        "duyet": "khong",
        "ghi_chu": "Xóa: chỉ bản nháp bảng lương chưa duyệt; duyệt bảng lương do chủ trung tâm thực hiện."
      },
      "M10": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Xem: khách tiềm năng đã đăng ký để lập khoản phải thu."
      }
    },
    "giao_vien": {
      "M01": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công."
      },
      "M02": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công."
      },
      "M03": {
        "xem": "gioi_han",
        "tao": "gioi_han",
        "sua": "gioi_han",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công. Tạo và sửa: điểm danh lớp được phân công trong thời hạn cho phép."
      },
      "M04": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M05": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công. Xem: báo cáo chuyên cần và điểm của lớp được phân công."
      },
      "M06": {
        "xem": "gioi_han",
        "tao": "gioi_han",
        "sua": "gioi_han",
        "xoa": "gioi_han",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công. Xóa: chỉ bài tập mình giao chưa có bài nộp."
      },
      "M07": {
        "xem": "gioi_han",
        "tao": "gioi_han",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công."
      },
      "M08": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M09": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công. Xem: bảng lương của chính mình."
      },
      "M10": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công."
      }
    },
    "tro_giang": {
      "M01": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công và theo quyền giáo viên cấp."
      },
      "M02": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công và theo quyền giáo viên cấp."
      },
      "M03": {
        "xem": "gioi_han",
        "tao": "gioi_han",
        "sua": "gioi_han",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công và theo quyền giáo viên cấp. Tạo và sửa: điểm danh lớp được phân công trong thời hạn cho phép."
      },
      "M04": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M05": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công. Xem: màn hình Việc hôm nay và báo cáo chuyên cần của lớp được phân công."
      },
      "M06": {
        "xem": "gioi_han",
        "tao": "gioi_han",
        "sua": "gioi_han",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công và theo quyền giáo viên cấp."
      },
      "M07": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công và theo quyền giáo viên cấp."
      },
      "M08": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M09": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: lớp được phân công và theo quyền giáo viên cấp. Xem: phụ cấp và bảng lương của chính mình."
      },
      "M10": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      }
    },
    "hoc_vien": {
      "M01": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "gioi_han",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của chính học viên. Sửa: thông tin liên hệ của mình."
      },
      "M02": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của chính học viên."
      },
      "M03": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của chính học viên."
      },
      "M04": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của chính học viên."
      },
      "M05": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M06": {
        "xem": "gioi_han",
        "tao": "gioi_han",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của chính học viên. Xem điểm và nhận xét của mình; Tạo: nộp bài của mình."
      },
      "M07": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của chính học viên."
      },
      "M08": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "gioi_han",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của chính học viên. Sửa: thông tin liên hệ của mình."
      },
      "M09": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M10": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      }
    },
    "phu_huynh": {
      "M01": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "gioi_han",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của con mình. Sửa: thông tin liên hệ của mình."
      },
      "M02": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của con mình."
      },
      "M03": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của con mình."
      },
      "M04": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của con mình."
      },
      "M05": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M06": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của con mình."
      },
      "M07": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của con mình."
      },
      "M08": {
        "xem": "gioi_han",
        "tao": "khong",
        "sua": "gioi_han",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Giới hạn: dữ liệu của con mình. Sửa: thông tin liên hệ của mình."
      },
      "M09": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      },
      "M10": {
        "xem": "khong",
        "tao": "khong",
        "sua": "khong",
        "xoa": "khong",
        "duyet": "khong",
        "ghi_chu": "Không có giới hạn bổ sung."
      }
    }
  }
};
