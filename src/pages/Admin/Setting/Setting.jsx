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

  // Nạp thông tin người dùng từ Firebase
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const phien = JSON.parse(sessionStorage.getItem("session") || "null");
        if (!phien?.idNguoiDung) return dieuHuong("/dang-nhap");

        const snap = await getDoc(doc(db, "nguoiDung", phien.idNguoiDung));
        if (!snap.exists()) return dieuHuong("/dang-nhap");

        setNguoiDung({ idNguoiDung: phien.idNguoiDung, ...snap.data() });
      } catch (err) {
        console.error("Lỗi load user:", err);
        dieuHuong("/dang-nhap");
      }
    };

    fetchUser();
  }, [dieuHuong]);

  // Hàm cập nhật Firestore
  const capNhatNguoiDung = async (banVa) => {
    if (!nguoiDung?.idNguoiDung) return;

    try {
      const banSao = { ...banVa };
      TRUONG_KHONG_CHO_DOI.forEach((k) => delete banSao[k]);

      await updateDoc(doc(db, "nguoiDung", nguoiDung.idNguoiDung), banSao);

      setNguoiDung((prev) => ({ ...prev, ...banSao }));
    } catch (err) {
      console.error("Lỗi cập nhật user:", err);
    }
  };

  // Kiểm tra email trùng (tìm trong Firestore)
  const kiemTraEmailTrung = async (emailMoi) => {
    try {
      // TODO: Nếu bạn có collection nguoiDung nhiều record,
      // nên query để kiểm tra email trùng.
      // Tạm thời chỉ return true.
      return true;
    } catch {
      return "Lỗi kiểm tra email";
    }
  };

  if (!nguoiDung) return <p>Đang tải...</p>;

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
              xacThuc={async (v) => {
                if (!/^\S+@\S+\.\S+$/.test(v)) return "Email không hợp lệ";
                const duyNhat = await kiemTraEmailTrung(v);
                return duyNhat === true ? true : duyNhat;
              }}
            />

            <TruongChinhSua
              nhan="Mật khẩu"
              loai="password"
              giaTriBanDau="" // không hiển thị mật khẩu thật
              hienThiGiaTri="********" // hiển thị dạng ẩn
              laMatKhau
              goiY="Nhập mật khẩu mới"
              onLuu={(v) => capNhatNguoiDung({ matkhau: v })}
              xacThuc={(v) =>
                (v?.length ?? 0) >= 6 || "Mật khẩu tối thiểu 6 ký tự"
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
