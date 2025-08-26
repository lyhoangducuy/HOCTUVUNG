import "./DangNhap.css";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

export default function DangNhap() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  const { register, handleSubmit } = useForm();

  const onSubmit = async (form) => {
    setLoginError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.matkhau);
      const snap = await getDoc(doc(db, "nguoiDung", cred.user.uid));
      if (!snap.exists()) throw new Error("Không tìm thấy hồ sơ người dùng!");

      const profile = snap.data();
      // Tùy bạn: nếu các phần khác vẫn đọc sessionStorage thì giữ lại mini-session cho tương thích
      sessionStorage.setItem(
        "session",
        JSON.stringify({ idNguoiDung: cred.user.uid, vaiTro: profile?.vaiTro || "HOC_VIEN" })
      );

      if (profile?.vaiTro === "ADMIN") navigate("/admin");
      else navigate("/trangchu");
    } catch (e) {
      setLoginError(e?.message || "Email hoặc mật khẩu không đúng.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <img src="/src/assets/image/logo.jpg" alt="imgloginform" />
        </div>
        <div className="login-right">
          <div className="login-tabs">
            <span onClick={() => navigate("/dang-ky")} style={{ cursor: "pointer" }}>Đăng ký</span>
            <span className="active" style={{ cursor: "pointer" }}>Đăng nhập</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <label>Email</label>
            <input type="text" {...register("email")} />

            <label>Mật khẩu</label>
            <input type="password" {...register("matkhau")} />

            {loginError && <span className="error">{loginError}</span>}

            <div className="forgot">
              <Link to="/quen-mat-khau">Quên mật khẩu</Link>
            </div>

            <button type="submit" className="login-btn submit">Đăng Nhập</button>
          </form>
        </div>
      </div>
    </div>
  );
}
