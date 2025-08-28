// src/components/Sidebar/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faFolderOpen, faBell, faVideo } from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";
import { useNavigate } from "react-router-dom";

// 🔥 Firebase
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase"; // <- chỉnh đường dẫn đúng với dự án của bạn

/* ===== Helpers ===== */
// dd/mm/yyyy -> Date | null
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
  // Firestore Timestamp
  if (val?.toDate) return val.toDate();
  // ISO string
  if (typeof val === "string" && val.includes("-")) {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // dd/mm/yyyy
  if (typeof val === "string" && val.includes("/")) return parseVNDate(val);
  return null;
};

function Sidebar() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(true);
  const [prime, setPrime] = useState(false);
  const [user, setUser] = useState(null);

  const [showNoti, setShowNoti] = useState(false);
  const notiRef = useRef(null);

  // 1) Theo dõi Auth
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsubAuth();
  }, []);

  // 2) Theo dõi gói trả phí của user (realtime)
  useEffect(() => {
    if (!user?.uid) {
      setPrime(false);
      return;
    }
    // Collection “goiTraPhiCuaNguoiDung”: trường cần có
    // - idNguoiDung: string (uid)
    // - status: string (vd: "Đang hoạt động" | "Đã hủy")
    // - NgayKetThuc: Firestore Timestamp | ISO | "dd/mm/yyyy"
    const q = query(
      collection(db, "goiTraPhiCuaNguoiDung"),
      where("idNguoiDung", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const now0 = today0();
      const active = snap.docs.some((doc) => {
        const s = doc.data();
        if (s.status === "Đã hủy") return false;
        const end = toDateFlexible(s.NgayKetThuc);
        if (!end) return false;
        end.setHours(0, 0, 0, 0);
        return end >= now0;
      });
      setPrime(active);
    });
    return () => unsub();
  }, [user?.uid]);

  // 3) Toggle & outside click for notifications
  useEffect(() => {
    const onToggle = () => setOpen((v) => !v);
    const outside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setShowNoti(false);
    };
    window.addEventListener("sidebar:toggle", onToggle);
    document.addEventListener("mousedown", outside);
    return () => {
      window.removeEventListener("sidebar:toggle", onToggle);
      document.removeEventListener("mousedown", outside);
    };
  }, []);

  const gotoVideo = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để dùng chức năng Video.");
      navigate("/dang-nhap");
      return;
    }
    // if (!prime) {
    //   alert("Bạn cần nâng cấp tài khoản để dùng chức năng Video.");
    //   navigate("/tra-phi"); // đồng bộ route trả phí
    //   return;
    // }
    navigate("/video");
  };

  return (
    <div className={`sidebar_container ${open ? "" : "is-closed"}`}>
      <div className="sidebar_top">
        <div onClick={() => navigate("/trangchu")}>
          <FontAwesomeIcon icon={faHouse} className="icon" />
          Trang chủ
        </div>

        <div onClick={() => navigate("/thuviencuatoi")}>
          <FontAwesomeIcon icon={faFolderOpen} className="icon" />
          Thư viện của tôi
        </div>

        <div ref={notiRef} className="noti-wrapper" onClick={() => setShowNoti((v) => !v)}>
          <span className="noti-trigger">
            <FontAwesomeIcon icon={faBell} className="icon" />
            Thông báo
          </span>
          {showNoti && (
            <div className="noti-dropdown">
              <div className="noti-item" onClick={() => setShowNoti(false)}>
                <div className="noti-title">Ví dụ thông báo</div>
                <div className="noti-time">Vừa xong</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="divider" />

      <div className="sidebar_center">
        <div onClick={gotoVideo}>
          <FontAwesomeIcon icon={faVideo} className="icon" />
          Học qua Video
          {!prime && <span className="prime-badge" title="Nâng cấp để mở khóa">★</span>}
        </div>
      </div>

      <div className="divider" />
    </div>
  );
}

export default Sidebar;
