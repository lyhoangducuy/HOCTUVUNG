// src/layouts/NguoiDungLayout/NguoiDungLayout.jsx
import React, { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./NguoiDungLayout.css";
import Header from "../../components/NguoiDung/Header/Header";
import Sidebar from "../../components/NguoiDung/Sidebar/Sidebar";
import Footer from "../../components/Auth/Footer/Footer";
import AuthSync from "../../components/Auth/AuthSync";
import AIButton from "../../components/Admin/AIButton/AIButton";
import { FaRobot } from "react-icons/fa";

// Firebase
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

export default function NguoiDungLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);   // auth user
  const [prime, setPrime] = useState(false);
  const unsubRef = useRef(null);

  // 1) Theo dõi đăng nhập (Auth)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsubAuth();
  }, []);

  // 2) Theo dõi traPhi realtime từ hồ sơ người dùng (nguoiDung/{uid})
  useEffect(() => {
    // huỷ listener cũ nếu có
    if (unsubRef.current) {
      try { unsubRef.current(); } catch {}
      unsubRef.current = null;
    }
    setPrime(false);

    if (!user?.uid) return;

    const unsub = onSnapshot(
      doc(db, "nguoiDung", String(user.uid)),
      (snap) => {
        const data = snap.data() || {};
        setPrime(Boolean(data.traPhi)); // true => đã Prime
      },
      () => setPrime(false)
    );

    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
    };
  }, [user?.uid]);

  /* 3) Nút AI khi chưa prime */
  const AILockedButton = () => {
    const onLockedClick = () => {
      alert("Tính năng AI chỉ dành cho tài khoản trả phí. Vui lòng nâng cấp để sử dụng.");
      navigate("/tra-phi");
    };
    return (
      <div className="ai-locked-container">
        <button
          onClick={onLockedClick}
          title="Nâng cấp để dùng AI"
          aria-label="Nâng cấp để dùng AI"
          className="ai-locked-btn"
        >
          <FaRobot className="ai-locked-icon" />
          <span className="ai-locked-badge">★</span>
        </button>
      </div>
    );
  };

  return (
    <div className="trangchu-layout-container">
      <Header />
      <AuthSync />
      <div className="trangchu-layout-main">
        <div className="trangchu-layout-sidebar">
          <Sidebar />
        </div>
        <div className="trangchu-layout-content">
          <Outlet />
        </div>

        {/* prime -> dùng AIButton; chưa prime -> nút khoá + dẫn /tra-phi */}
        {prime ? <AIButton /> : <AILockedButton />}
      </div>
      <Footer />
    </div>
  );
}
