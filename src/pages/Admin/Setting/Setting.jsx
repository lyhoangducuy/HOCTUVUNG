import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Setting.css";

import TruongChiDoc from "./chucNang/chiDoc";
import TruongChinhSua from "./chucNang/chinhSua";
import ChonAnhDaiDien from "./chucNang/chonAnhDaiDien";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const TRUONG_KHONG_CHO_DOI = ["idNguoiDung", "tenNguoiDung", "ngayTaoTaiKhoan", "vaiTro"];

export default function SettingAdmin() {
  const dieuHuong = useNavigate();
  const [nguoiDung, setNguoiDung] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Nạp người dùng theo session
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const phien = JSON.parse(sessionStorage.getItem("session") || "null");
        if (!phien?.idNguoiDung) {
          dieuHuong("/dang-nhap");
          return;
        }

        const ref = doc(db, "nguoiDung", phien.idNguoiDung);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Không tìm thấy người dùng trong Firestore.");
          setLoading(false);
          return;
        }
        if (!isMounted) return;
        setNguoiDung({ idNguoiDung: phien.idNguoiDung, ...snap.data() });
        setLoading(false);
      } catch {
        if (!isMounted) return;
        setError("Có lỗi khi nạp dữ liệu người dùng.");
        setLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [dieuHuong]);

  // Cập nhật người dùng vào Firestore (chặn field không cho đổi)
  const capNhatNguoiDung = (banVa) => {
    const banSao = { ...banVa };
    TRUONG_KHONG_CHO_DOI.forEach(k => delete banSao[k]);

    setNguoiDung(prev => {
      if (!prev) return prev;
      const moi = { ...prev, ...banSao };
      // cập nhật Firestore nền
      updateDoc(doc(db, "nguoiDung", prev.idNguoiDung), banSao).catch(() => {});
      return moi;
    });
  };

  // Kiểm tra email trùng
  const kiemTraEmailTrung = () => {
    // Bỏ kiểm tra trên localStorage; chỉ kiểm tra định dạng cơ bản ở phần xacThuc
    return true;
  };

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 16, color: "#d33" }}>{error}</div>;
  if (!nguoiDung) return <div style={{ padding: 16 }}>Không có dữ liệu người dùng.</div>;

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
