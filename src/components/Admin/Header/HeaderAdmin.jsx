// src/components/Admin/HeaderAdmin/HeaderAdmin.jsx
import { FaBars } from "react-icons/fa";
import "./HeaderAdmin.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AIButton from "../AIButton/AIButton";

import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const DEFAULT_AVATAR = "";

export default function HeaderAdmin({ handleShowSidebar }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("Người dùng");
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);
  const [open, setOpen] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async (user) => {
      try {
        const snap = await getDoc(doc(db, "nguoiDung", user.uid));
        if (!snap.exists()) {
          throw new Error("User profile not found");
        }

        const profile = snap.data();
        if (profile?.vaiTro !== "ADMIN") {
          throw new Error("Not an admin user");
        }

        setIsAdmin(true);
        setDisplayName(profile?.tenNguoiDung || "Người dùng");
        setAvatarSrc(profile?.anhDaiDien || DEFAULT_AVATAR);

        // Update session
        const session = {
          idNguoiDung: user.uid,
          vaiTro: profile.vaiTro,
        };
        sessionStorage.setItem("session", JSON.stringify(session));
      } catch (error) {
        console.error("Admin verification failed:", error);
        sessionStorage.removeItem("session");
        navigate("/dang-nhap", { replace: true });
      }
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        sessionStorage.removeItem("session");
        navigate("/dang-nhap", { replace: true });
        return;
      }
      checkAdminStatus(user);
    });

    // Check existing session
    const session = JSON.parse(sessionStorage.getItem("session"));
    if (!session || session.vaiTro !== "ADMIN") {
      navigate("/dang-nhap", { replace: true });
    }

    return () => unsub();
  }, [navigate]);

  // Logout handler
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

  // Protect admin routes
  if (!isAdmin) {
    return null; // hoặc có thể return spinner loading
  }

  return (
    <div className="header-admin-container">
      <button
        className="icon-btn"
        onClick={handleShowSidebar}
        aria-label="Toggle sidebar"
      >
        <FaBars />
      </button>

      <div className="admin-user-menu" ref={menuRef}>
        <button
          className="icon-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open user menu"
        >
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
