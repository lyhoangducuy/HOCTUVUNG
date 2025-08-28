import React, { useEffect, useRef, useState, Suspense } from "react";
import { FaBars } from "react-icons/fa";
import "./HeaderAdmin.css";
import { useNavigate } from "react-router-dom";

// 🔻 lazy-load để tránh chặn render phần Header
const AIButton = React.lazy(() => import("../AIButton/AIButton"));

import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getDocFromCache } from "firebase/firestore";

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='54%' font-size='28' text-anchor='middle' fill='%239ca3af' font-family='sans-serif'>👤</text></svg>";

export default function HeaderAdmin({ handleShowSidebar }) {
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [displayName, setDisplayName] = useState("Người dùng");
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);
  const [open, setOpen] = useState(false);

  const menuWrapRef = useRef(null);
  const navigate = useNavigate();

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!menuWrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Bootstrap UI từ sessionStorage cho nhanh (không redirect ở đây)
  useEffect(() => {
    try {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      if (ss) {
        if (ss.tenNguoiDung) setDisplayName(ss.tenNguoiDung);
        if (ss.anhDaiDien) setAvatarSrc(ss.anhDaiDien);
        if (ss.vaiTro === "ADMIN") setIsAdmin(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        sessionStorage.removeItem("session");
        if (!cancelled) {
          setIsAdmin(false);
          setVerifying(false);
          navigate("/dang-nhap", { replace: true });
        }
        return;
      }

      setVerifying(true);

      try {
        // 1) Thử cache Firestore trước (hiển thị siêu nhanh nếu đã có)
        let profile = null;
        try {
          const snapLocal = await getDocFromCache(doc(db, "nguoiDung", user.uid));
          if (snapLocal.exists()) profile = snapLocal.data();
        } catch {}

        if (profile) {
          if (profile.tenNguoiDung) setDisplayName(profile.tenNguoiDung);
          setAvatarSrc(profile.anhDaiDien || DEFAULT_AVATAR);
        }

        // 2) Kiểm tra custom claims (nếu có) – rất nhanh, từ token local
        let adminByClaim = false;
        try {
          const idt = await user.getIdTokenResult();
          adminByClaim = Boolean(idt?.claims?.admin);
        } catch {}

        // 3) Fetch server chuẩn hóa vai trò + cập nhật session
        const snap = await getDoc(doc(db, "nguoiDung", user.uid));
        if (!snap.exists()) throw new Error("User profile not found");
        const data = snap.data();
        profile = data;

        const isAdminRole = String(data?.vaiTro || "") === "ADMIN";
        const okAdmin = adminByClaim || isAdminRole;

        // Cập nhật UI ngay khi có server trả về
        setDisplayName(data?.tenNguoiDung || "Người dùng");
        setAvatarSrc(data?.anhDaiDien || DEFAULT_AVATAR);
        setIsAdmin(okAdmin);

        // Đồng bộ session cho lần sau vào app
        sessionStorage.setItem(
          "session",
          JSON.stringify({
            idNguoiDung: user.uid,
            vaiTro: data?.vaiTro,
            tenNguoiDung: data?.tenNguoiDung,
            anhDaiDien: data?.anhDaiDien,
          })
        );

        if (!okAdmin) {
          // Không đủ quyền → logout về đăng nhập
          await signOut(auth);
          sessionStorage.clear();
          if (!cancelled) navigate("/dang-nhap", { replace: true });
        }
      } catch (err) {
        console.error("Admin verification failed:", err);
        sessionStorage.removeItem("session");
        if (!cancelled) navigate("/dang-nhap", { replace: true });
      } finally {
        if (!cancelled) setVerifying(false);
      }
    });

    return () => {
      cancelled = true;
      unsub && unsub();
    };
  }, [navigate]);

  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.clear();
      window.dispatchEvent(new CustomEvent("auth:logout"));
      navigate("/dang-nhap", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Khi đang xác thực: render header skeleton (tránh “mất tiêu”)
  if (verifying) {
    return (
      <div className="header-admin-container">
        <button className="icon-btn" aria-label="Toggle sidebar">
          <FaBars />
        </button>
        <div className="admin-user-menu">
          <div className="avatar skeleton" style={{ width: 36, height: 36, borderRadius: 999 }} />
        </div>
        <Suspense fallback={<div style={{ width: 36, height: 36 }} />}>
          <AIButton />
        </Suspense>
      </div>
    );
  }

  // Không phải admin → không render (router sẽ chuyển hướng rồi)
  if (!isAdmin) return null;

  return (
    <div className="header-admin-container">
      <button className="icon-btn" onClick={handleShowSidebar} aria-label="Toggle sidebar">
        <FaBars />
      </button>

      <div className="admin-user-menu" ref={menuWrapRef}>
        <button className="icon-btn" onClick={() => setOpen((v) => !v)} aria-label="Open user menu">
          <img src={avatarSrc} alt="avatar" className="avatar" />
        </button>

        {open && (
          <div className="admin-user-dropdown">
            <div className="dropdown-infor">
              <img src={avatarSrc} alt="avatar" className="avatar" />
              <h2 className="title">{displayName}</h2>
            </div>

            <div className="dropdown-divider" />

            <div
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                navigate("/admin/setting");
              }}
            >
              <span className="icon">⚙️</span>
              <span style={{ color: "black" }}>Cài đặt</span>
            </div>

            <div className="dropdown-divider" />

            <div className="dropdown-item danger" onClick={logout}>
              Đăng xuất
            </div>
          </div>
        )}
      </div>

      {/* Nút AI lazy-load để không chặn render header */}
      <Suspense fallback={null}>
        <AIButton />
      </Suspense>
    </div>
  );
}
