// src/pages/Auth/DangNhap/DangNhap.jsx
import "./Dangnhap.css";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

export default function DangNhap() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  const { register, handleSubmit } = useForm();

  // Nếu đã đăng nhập (ở tab khác / refresh) thì tự chuyển trang
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "nguoiDung", user.uid));
        const role = snap.exists() ? (snap.data()?.vaiTro || "HOC_VIEN") : "HOC_VIEN";
        // giữ session để các phần cũ còn dùng
        sessionStorage.setItem(
          "session",
          JSON.stringify({ idNguoiDung: user.uid, vaiTro: role })
        );  
        navigate(role === "ADMIN" ? "/admin" : "/trangchu", { replace: true });
      } catch {
        navigate("/trangchu", { replace: true });
      }
    });

    // Nghe tín hiệu login/logout từ tab khác (CustomEvent)
    const onAuthLogin = () => {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      const role = ss?.vaiTro || "HOC_VIEN";
      navigate(role === "ADMIN" ? "/admin" : "/trangchu", { replace: true });
    };
    const onAuthLogout = () => {
      sessionStorage.removeItem("session");
    };
    window.addEventListener("auth:login", onAuthLogin);
    window.addEventListener("auth:logout", onAuthLogout);

    return () => {
      unsub && unsub();
      window.removeEventListener("auth:login", onAuthLogin);
      window.removeEventListener("auth:logout", onAuthLogout);
    };
  }, [navigate]);

  const onSubmit = async (form) => {
  setLoginError("");
  try {
    const cred = await signInWithEmailAndPassword(auth, form.email, form.matkhau);

      // Lấy hồ sơ người dùng để biết vai trò
      console.log(db);
      
      const snap = await getDoc(doc(db, "nguoiDung", cred.user.uid));
      if (!snap.exists()) throw new Error("Không tìm thấy hồ sơ người dùng!");

    const profile = snap.data();
    const role = profile?.vaiTro || "HOC_VIEN";

    // Save session
    const session = { idNguoiDung: cred.user.uid, vaiTro: role };
    sessionStorage.setItem("session", JSON.stringify(session));

    // Notify other tabs using a custom event instead of localStorage
    window.dispatchEvent(new CustomEvent('auth:login', { detail: session }));

    navigate(role === "ADMIN" ? "/admin" : "/trangchu");
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
            <span onClick={() => navigate("/dang-ky")} style={{ cursor: "pointer" }}>
              Đăng ký
            </span>
            <span className="active" style={{ cursor: "pointer" }}>
              Đăng nhập
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <label>Email</label>
            <input type="text" {...register("email")} />

            <label>Mật khẩu</label>
            <input type="password" {...register("matkhau")} />

            {loginError && <span className="error">{"email hoặc mật khẩu sai"}</span>}

            <div className="forgot">
              <Link to="/quen-mat-khau">Quên mật khẩu</Link>
            </div>

            <button type="submit" className="login-btn submit">
              Đăng Nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
