// src/components/Setting/Setting.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Setting.css";

import TruongChiDoc from "./chucNang/chiDoc";
import TruongChinhSua from "./chucNang/chinhSua";
import ChonAnhDaiDien from "./chucNang/chonAnhDaiDien";

import { auth, db } from "../../../../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { updateEmail, updatePassword } from "firebase/auth";

const TRUONG_KHONG_CHO_DOI = ["idNguoiDung", "tenNguoiDung", "ngayTaoTaiKhoan", "vaiTro"];
const usersCol = () => collection(db, "nguoiDung");

function formatNgayTao(val) {
  try {
    if (val?.toDate) return val.toDate().toLocaleString();
    const d = new Date(val);
    return isNaN(d) ? "" : d.toLocaleString();
  } catch {
    return "";
  }
}

export default function Setting() {
  const dieuHuong = useNavigate();
  const [nguoiDung, setNguoiDung] = useState(null);

  // ===== 1) Nạp người dùng từ Auth/Session + lắng nghe realtime hồ sơ Firestore
  useEffect(() => {
    const ss = JSON.parse(sessionStorage.getItem("session") || "null");
    const uid = auth.currentUser?.uid || ss?.idNguoiDung;

    if (!uid) {
      dieuHuong("/");
      return;
    }

    const ref = doc(db, "nguoiDung", String(uid));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          dieuHuong("/");
          return;
        }
        setNguoiDung({ idNguoiDung: uid, ...snap.data() });
      },
      () => dieuHuong("/")
    );

    return () => unsub();
  }, [dieuHuong]);

  // ===== 2) Cập nhật các trường cho phép
  const capNhatNguoiDung = async (banVa) => {
    if (!nguoiDung?.idNguoiDung) return;
    const patch = { ...banVa };
    TRUONG_KHONG_CHO_DOI.forEach((k) => delete patch[k]);
    if (Object.keys(patch).length === 0) return;

    try {
      await updateDoc(doc(db, "nguoiDung", String(nguoiDung.idNguoiDung)), patch);
      // onSnapshot sẽ tự cập nhật UI
    } catch (e) {
      alert("Không thể cập nhật thông tin. Vui lòng thử lại.");
    }
  };

  // ===== 3) Đổi email: kiểm tra hợp lệ + trùng + update Auth + Firestore
  const doiEmail = async (emailMoi) => {
    if (!nguoiDung?.idNguoiDung) return;
    const email = String(emailMoi || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      alert("Email không hợp lệ");
      return;
    }

    // kiểm tra trùng email trong Firestore
    try {
      const q = query(usersCol(), where("email", "==", email), limit(1));
      const snap = await getDocs(q);
      const daTonTaiKhac =
        !snap.empty && snap.docs[0].id !== String(nguoiDung.idNguoiDung);
      if (daTonTaiKhac) {
        alert("Email đã được sử dụng");
        return;
      }
    } catch {
      // bỏ qua nếu lỗi mạng tạm thời
    }

    try {
      if (!auth.currentUser) throw new Error("auth-missing");

      // cập nhật trong Firebase Auth (có thể yêu cầu đăng nhập lại)
      await updateEmail(auth.currentUser, email);

      // ghi lại vào Firestore
      await updateDoc(doc(db, "nguoiDung", String(nguoiDung.idNguoiDung)), {
        email,
      });

      alert("Đã cập nhật email.");
    } catch (e) {
      const code = e?.code || "";
      if (code === "auth/requires-recent-login") {
        alert("Bạn cần đăng nhập lại gần đây để đổi email. Vui lòng đăng xuất và đăng nhập lại rồi thử lại.");
      } else if (code === "auth/invalid-email") {
        alert("Email không hợp lệ.");
      } else {
        alert("Không thể đổi email. Vui lòng thử lại.");
      }
    }
  };

  // ===== 4) Đổi mật khẩu trong Firebase Auth
  const doiMatKhau = async (mkMoi) => {
    if (!auth.currentUser) {
      alert("Bạn cần đăng nhập lại.");
      return;
    }
    if ((mkMoi?.length ?? 0) < 6) {
      alert("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    try {
      await updatePassword(auth.currentUser, mkMoi);
      alert("Đã đổi mật khẩu.");
    } catch (e) {
      const code = e?.code || "";
      if (code === "auth/requires-recent-login") {
        alert("Bạn cần đăng nhập lại gần đây để đổi mật khẩu. Vui lòng đăng xuất và đăng nhập lại rồi thử lại.");
      } else {
        alert("Không thể đổi mật khẩu. Vui lòng thử lại.");
      }
    }
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
            <TruongChiDoc nhan="Ngày tạo" giaTri={formatNgayTao(nguoiDung.ngayTaoTaiKhoan)} />
            <TruongChiDoc nhan="Vai trò" giaTri={nguoiDung.vaiTro} />

            {/* Cho phép chỉnh sửa */}
            <TruongChinhSua
              nhan="Họ tên"
              giaTriBanDau={nguoiDung.hoten || ""}
              goiY="Nhập họ tên"
              onLuu={(v) => {
                if (!String(v || "").trim()) {
                  alert("Họ tên không được trống");
                  return;
                }
                capNhatNguoiDung({ hoten: v.trim() });
              }}
            />

            <TruongChinhSua
              nhan="Email"
              loai="email"
              giaTriBanDau={nguoiDung.email || ""}
              goiY="name@example.com"
              onLuu={(v) => doiEmail(v)}
            />

            <TruongChinhSua
              nhan="Mật khẩu"
              loai="password"
              giaTriBanDau=""
              hienThiGiaTri="********"
              laMatKhau
              goiY="Nhập mật khẩu mới"
              onLuu={(v) => doiMatKhau(v)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
