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
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

/* ===== Helpers giống Sidebar ===== */
const parseVNDate = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(dt.getTime()) ? null : dt;
};
const today0 = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};
const toDateFlexible = (val) => {
  if (val?.toDate) return val.toDate();             // Firestore Timestamp
  if (typeof val === "string" && val.includes("-")) {
    const d = new Date(val);                         // ISO
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === "string" && val.includes("/"))  // dd/mm/yyyy
    return parseVNDate(val);
  return null;
};

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

  // 2) Theo dõi gói trả phí realtime (giống Sidebar)
  useEffect(() => {
    unsubRef.current?.();           // huỷ trước nếu đang lắng nghe
    setPrime(false);

    if (!user?.uid) return;
    const q = query(
      collection(db, "goiTraPhiCuaNguoiDung"),
      where("idNguoiDung", "==", user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const now0 = today0();
        const active = snap.docs.some((docSnap) => {
          const s = docSnap.data();
          if (s.status === "Đã hủy") return false;
          const end = toDateFlexible(s.NgayKetThuc);
          if (!end) return false;
          end.setHours(0, 0, 0, 0);
          return end >= now0;
        });
        setPrime(active);
      },
      () => setPrime(false)
    );

    unsubRef.current = unsub;
    return () => unsubRef.current?.();
  }, [user?.uid]);

  /* 3) Nút AI khi chưa prime (giống style trước) */
  const AILockedButton = () => {
    const onLockedClick = () => {
      alert("Tính năng AI chỉ dành cho tài khoản trả phí. Vui lòng nâng cấp để sử dụng.");
      navigate("/traphi"); // đồng bộ với Sidebar
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

        {/* Y hệt Sidebar: prime -> dùng AIButton; chưa prime -> nút khoá + dẫn /traphi */}
        {prime ? <AIButton /> : <AILockedButton />}
      </div>
      <Footer />
    </div>
  );
}
