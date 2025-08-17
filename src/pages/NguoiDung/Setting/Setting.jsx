import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Setting.css";

import TruongChiDoc from "./chucNang/chiDoc";
import TruongChinhSua from "./chucNang/chinhSua";
import ChonAnhDaiDien from "./chucNang/chonAnhDaiDien";

const TRUONG_KHONG_CHO_DOI = ["idNguoiDung", "tenNguoiDung", "ngayTaoTaiKhoan", "vaiTro"];

export default function Setting() {
  const dieuHuong = useNavigate();

  const [nguoiDung, setNguoiDung] = useState(null);

  // Nạp người dùng theo session
  useEffect(() => {
    try {
      const phien = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!phien?.idNguoiDung) return dieuHuong("/");

      const danhSach = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
      const timThay = danhSach.find(u => u.idNguoiDung === phien.idNguoiDung);
      if (!timThay) return dieuHuong("/");

      setNguoiDung(timThay);
    } catch {
      dieuHuong("/");
    }
  }, [dieuHuong]);

  // Cập nhật người dùng vào localStorage (chặn field không cho đổi)
  const capNhatNguoiDung = (banVa) => {
    const banSao = { ...banVa };
    TRUONG_KHONG_CHO_DOI.forEach(k => delete banSao[k]);

    setNguoiDung(prev => {
      if (!prev) return prev;
      const moi = { ...prev, ...banSao };

      const danhSach = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
      const vt = danhSach.findIndex(u => u.idNguoiDung === prev.idNguoiDung);
      if (vt !== -1) {
        danhSach[vt] = moi;
        localStorage.setItem("nguoiDung", JSON.stringify(danhSach));
      }
      return moi;
    });
  };

  // Kiểm tra email trùng
  const kiemTraEmailTrung = (emailMoi) => {
    const danhSach = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    const trung = danhSach.find(
      u => u.email?.toLowerCase() === emailMoi.toLowerCase() &&
           u.idNguoiDung !== nguoiDung.idNguoiDung
    );
    return !trung || "Email đã được sử dụng";
  };

  if (!nguoiDung) return null;

  return (
    <div className="settings-container">
      <h1>Cài đặt</h1>

      <section className="personal-info">
        <h2>Thông tin cá nhân</h2>

        <div className="card personal-info-card">
          {/* Ảnh đại diện */}
          <div className="profile-header">
            <ChonAnhDaiDien
              giaTri={nguoiDung.anhDaiDien || ""}
              onLuu={(url) => capNhatNguoiDung({ anhDaiDien: url })}
            />
          </div>

          <div className="info-list">
            {/* Chỉ đọc */}
            <TruongChiDoc nhan="Tên người dùng" giaTri={nguoiDung.tenNguoiDung} />
            <TruongChiDoc
              nhan="Ngày tạo"
              giaTri={new Date(nguoiDung.ngayTaoTaiKhoan).toLocaleString()}
            />
            <TruongChiDoc nhan="Vai trò" giaTri={nguoiDung.vaiTro} />

            {/* Cho phép chỉnh sửa */}
            <TruongChinhSua
              nhan="Họ tên"
              giaTriBanDau={nguoiDung.hoten || ""}
              goiY="Nhập họ tên"
              onLuu={(v) => capNhatNguoiDung({ hoten: v })}
              xacThuc={(v) => v.trim().length > 0 || "Họ tên không được trống"}
            />

            <TruongChinhSua
              nhan="Email"
              loai="email"
              giaTriBanDau={nguoiDung.email || ""}
              goiY="name@example.com"
              onLuu={(v) => capNhatNguoiDung({ email: v })}
              xacThuc={(v) => {
                if (!/^\S+@\S+\.\S+$/.test(v)) return "Email không hợp lệ";
                const duyNhat = kiemTraEmailTrung(v);
                return duyNhat === true ? true : duyNhat;
              }}
            />

            <TruongChinhSua
              nhan="Mật khẩu"
              loai="password"
              giaTriBanDau=""               // không hiển thị mật khẩu thật
              hienThiGiaTri="********"      // hiển thị dạng ẩn
              laMatKhau
              goiY="Nhập mật khẩu mới"
              onLuu={(v) => capNhatNguoiDung({ matkhau: v })}
              xacThuc={(v) => (v?.length ?? 0) >= 6 || "Mật khẩu tối thiểu 6 ký tự"}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
