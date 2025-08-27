import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./DangKy.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../../../../lib/firebase"; // giữ nguyên đường dẫn config Firebase của bạn
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const schema = yup.object({
  email: yup
    .string()
    .email("Email không hợp lệ")
    .required("Vui lòng nhập email"),
  username: yup.string().required("Vui lòng nhập tên người dùng"),
  role: yup
    .string()
    .oneOf(["hocvien", "giangvien"], "Vui lòng chọn vai trò")
    .required(),
  password: yup.string().min(6, "Mật khẩu tối thiểu 6 ký tự").required(),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref("password")], "Mật khẩu không khớp")
    .required(),
});

const roleMap = { giangvien: "GIANG_VIEN", hocvien: "HOC_VIEN" };

export default function DangKy() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 1) Tạo tài khoản Auth (email/password)
      const cred = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // 2) Cập nhật displayName trong Auth (tuỳ chọn)
      await updateProfile(cred.user, { displayName: data.username });

      // 3) Lưu hồ sơ vào Firestore (collection: nguoiDung, docId = uid)
      await setDoc(doc(db, "nguoiDung", cred.user.uid), {
        idNguoiDung: cred.user.uid, // dùng luôn uid để đồng bộ với rule
        email: data.email,
        tenNguoiDung: data.username,
        hoten: "",
        anhDaiDien: "",
        vaiTro: roleMap[data.role], // ADMIN sẽ set ở trang quản trị
        ngayTaoTaiKhoan: serverTimestamp(),
      });

      alert("Đăng ký thành công!");
      navigate("/dang-nhap");
    } catch (error) {
      // Thông báo lỗi thân thiện hơn
      const code = error?.code || "";
      let msg = error?.message || "Đăng ký thất bại!";
      if (code === "auth/email-already-in-use") msg = "Email đã được sử dụng.";
      else if (code === "auth/invalid-email") msg = "Email không hợp lệ.";
      else if (code === "auth/weak-password") msg = "Mật khẩu quá yếu.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-left">
          <img src="/src/assets/image/logo.jpg" alt="imgsignupform" />
        </div>

        <div className="signup-right">
          <div className="signup-tabs">
            <span
              className="active"
              onClick={() => navigate("/dang-ky")}
              style={{ cursor: "pointer" }}
            >
              Đăng ký
            </span>
            <span
              onClick={() => navigate("/dang-nhap")}
              style={{ cursor: "pointer" }}
            >
              Đăng nhập
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
            <label>Email</label>
            <input
              type="text"
              {...register("email")}
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="error">{errors.email.message}</span>
            )}

            <label>Tên người dùng</label>
            <input
              type="text"
              {...register("username")}
              className={errors.username ? "error" : ""}
            />
            {errors.username && (
              <span className="error">{errors.username.message}</span>
            )}

            <label>Vai trò</label>
            <select
              {...register("role")}
              className={errors.role ? "error" : ""}
            >
              <option value="">-- Chọn vai trò --</option>
              <option value="giangvien">Giảng viên</option>
              <option value="hocvien">Học viên</option>
            </select>
            {errors.role && (
              <span className="error">{errors.role.message}</span>
            )}

            <label>Mật khẩu</label>
            <input
              type="password"
              {...register("password")}
              className={errors.password ? "error" : ""}
            />
            {errors.password && (
              <span className="error">{errors.password.message}</span>
            )}

            <label>Nhập lại mật khẩu</label>
            <input
              type="password"
              {...register("passwordConfirm")}
              className={errors.passwordConfirm ? "error" : ""}
            />
            {errors.passwordConfirm && (
              <span className="error">{errors.passwordConfirm.message}</span>
            )}

            <button
              type="submit"
              className="signup-btn submit"
              disabled={loading}
            >
              {loading ? "Đang đăng ký..." : "Đăng Ký"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
