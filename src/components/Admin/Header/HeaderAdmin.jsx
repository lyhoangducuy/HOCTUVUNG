// src/components/Admin/HeaderAdmin/HeaderAdmin.jsx
import { FaBars } from "react-icons/fa";
import "./HeaderAdmin.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AIButton from "../AIButton/AIButton";

import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const DEFAULT_AVATAR = "/src/assets/image/formimg.png";

export default function HeaderAdmin({ handleShowSidebar }) {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const [displayName, setDisplayName] = useState("Người dùng");
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Theo dõi trạng thái đăng nhập + nạp profile từ Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Chưa đăng nhập → về login
        sessionStorage.removeItem("session");
        navigate("/dang-nhap", { replace: true });
        return;
      }
      try {
        const snap = await getDoc(doc(db, "nguoiDung", user.uid));
        if (snap.exists()) {
          const p = snap.data();
          setDisplayName(p?.tenNguoiDung || "Người dùng");
          setAvatarSrc(p?.anhDaiDien || DEFAULT_AVATAR);
          // Giữ sessionStorage nếu phần khác còn đọc
          sessionStorage.setItem(
            "session",
            JSON.stringify({
              idNguoiDung: user.uid,
              vaiTro: p?.vaiTro || "HOC_VIEN",
            })
          );
        } else {
          setDisplayName("Người dùng");
          setAvatarSrc(DEFAULT_AVATAR);
        }
      } catch {
        setDisplayName("Người dùng");
        setAvatarSrc(DEFAULT_AVATAR);
      }
    });
    return () => unsub && unsub();
  }, [navigate]);

  // Đăng xuất: Firebase + phát tín hiệu cross-tab
  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      sessionStorage.clear();
      // Cho các tab khác biết là đã logout
      localStorage.setItem("auth:logout", String(Date.now()));
      navigate("/dang-nhap", { replace: true });
    }
  };

  return (
    <div className="header-admin-container">
      <button className="icon-btn" onClick={handleShowSidebar} aria-label="Toggle sidebar">
        <FaBars />
      </button>

      <div className="admin-user-menu" ref={menuRef}>
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

      {/* Nút AI ở góc phải */}
      <AIButton />
    </div>
  );
}
