// src/components/Auth/AuthSync.jsx
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../../lib/firebase";

export default function AuthSync() {
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPath = (path) => {
    return path === "/" || path === "/dang-nhap" || path === "/dang-ky" || path === "/quen-mat-khau";
  };

  useEffect(() => {
    // 1) Bắt thay đổi trạng thái Firebase Auth (đăng xuất ở tab nào cũng bắn)
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        sessionStorage.removeItem("session");
        // Chỉ điều hướng khi không ở trang public
        if (!isPublicPath(location.pathname)) {
          navigate("/dang-nhap", { replace: true });
        }
      }
    });

    // 2) Nghe tín hiệu cross-tab qua localStorage
    const onStorage = (e) => {
      if (e.key === "auth:logout") {
        sessionStorage.removeItem("session");
        if (!isPublicPath(location.pathname)) {
          navigate("/dang-nhap", { replace: true });
        }
      }
      if (e.key === "auth:login") {
        // tuỳ bạn muốn làm gì khi tab khác login (chuyển hướng chẳng hạn)
        // ví dụ:
        // const ss = JSON.parse(sessionStorage.getItem("session") || "null");
        // const role = ss?.vaiTro || "HOC_VIEN";
        // navigate(role === "ADMIN" ? "/admin" : "/trangchu", { replace: true });
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      unsub && unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, [navigate, location.pathname]);

  return null; // không render gì
}
