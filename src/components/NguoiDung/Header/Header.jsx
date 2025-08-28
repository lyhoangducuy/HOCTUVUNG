// src/components/Header/Header.jsx  (đường dẫn của bạn)
import "./header.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import SearchBox from "./components/SearchBox";
import PlusMenu from "./components/PlusMenu";
import AccountMenu from "./components/AccountMenu";

import { auth, db } from "../../../../lib/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";

/* ===== Helpers riêng của Header ===== */
const userRef = (id) => doc(db, "nguoiDung", String(id));
const subCol = () => collection(db, "goiTraPhiCuaNguoiDung");

const isCanceled = (s) => {
  const t = String(s || "").toLowerCase();
  const noAccent = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t === "đã hủy" || noAccent === "da huy") return true;
  return (
    t.includes("hủy") ||
    t.includes("huỷ") ||
    noAccent.includes("huy") ||
    /cancel|canceled|cancelled/.test(noAccent)
  );
};
const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "string") {
    const [d, m, y] = v.split("/").map(Number);
    if (y) return new Date(y, (m || 1) - 1, d || 1);
    const dISO = new Date(v);
    return isNaN(dISO) ? null : dISO;
  }
  return null;
};
const formatVND = (val) => `${Number(val || 0).toLocaleString("vi-VN")}đ`;

export default function Header() {
  const navigate = useNavigate();

  const unsubSubRef = useRef(null);
  const unsubUserRef = useRef(null);

  const [user, setUser] = useState(null);
  const [primeActive, setPrimeActive] = useState(false);

  // Realtime user (kéo số dư) + prime
  useEffect(() => {
    let unsubUser = null;
    let unsubSub = null;

    const init = async () => {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      const uid = auth.currentUser?.uid || ss?.idNguoiDung;
      if (!uid) { setUser(null); setPrimeActive(false); return; }

      // user
      unsubUser = onSnapshot(
        userRef(uid),
        (snap) => {
          if (snap.exists()) setUser({ idNguoiDung: uid, ...snap.data() });
          else setUser({ idNguoiDung: uid, tenNguoiDung: "Người dùng", soDu: 0 });
        },
        () => setUser({ idNguoiDung: uid, tenNguoiDung: "Người dùng", soDu: 0 })
      );
      unsubUserRef.current = unsubUser;

      // prime
      const qSubs = query(subCol(), where("idNguoiDung", "==", String(uid)));
      unsubSub = onSnapshot(
        qSubs,
        (ssnap) => {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const hasActive = ssnap.docs.some((d) => {
            const row = d.data();
            if (isCanceled(row?.status)) return false;
            const end = toDateFlexible(row?.NgayKetThuc);
            if (!(end instanceof Date) || isNaN(end)) return false;
            end.setHours(0, 0, 0, 0);
            return end >= today;
          });
          setPrimeActive(hasActive);
        },
        () => setPrimeActive(false)
      );
      unsubSubRef.current = unsubSub;
    };

    init();
    return () => {
      unsubUser?.(); unsubSub?.();
      unsubUserRef.current = null; unsubSubRef.current = null;
    };
  }, []);

  // Sync logout đa tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "auth:logout") {
        sessionStorage.removeItem("session");
        unsubSubRef.current?.(); unsubSubRef.current = null;
        unsubUserRef.current?.(); unsubUserRef.current = null;
        setUser(null); setPrimeActive(false);
        navigate("/dang-nhap", { replace: true });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate]);

  const logout = async () => {
    try { await signOut(auth); }
    finally {
      sessionStorage.removeItem("session");
      localStorage.setItem("auth:logout", String(Date.now()));
      navigate("/dang-nhap", { replace: true });
    }
  };

  const role = String(user?.vaiTro || "").toUpperCase();      // "GIANG_VIEN" | "HOC_VIEN" | ...
  const isTeacher = role === "GIANG_VIEN";
  const isStudent = role === "HOC_VIEN";

  // === QUY TẮC HIỂN THỊ THEO YÊU CẦU ===
  // Giảng viên: luôn hiện nút nâng cấp; KHÔNG hiện sao (kể cả đã nâng cấp)
  // Học viên:   nếu chưa nâng cấp -> hiện nút; nếu đã nâng cấp -> ẩn nút + hiện sao
  const showUpgradeButton = isTeacher ? true : !primeActive;
  const showPrimeBadge   = isTeacher ? false : !!primeActive;

  const balanceText = formatVND(user?.soDu);

  return (
    <div className="header-container">
      {/* Left */}
      <div className="left-section">
        <img src="src/assets/image/logo.jpg" alt="Logo" style={{ height: "60px" }} />
      </div>

      {/* Search */}
      <SearchBox navigate={navigate} />

      {/* Right */}
      <div className="right-section">
        <PlusMenu role={user?.vaiTro} navigate={navigate} />

        {showUpgradeButton && (
          <button className="btn-upgrade" onClick={() => navigate("/tra-phi")}>
            Nâng cấp tài khoản
          </button>
        )}

        <AccountMenu
          user={user}
          // Truyền prime = showPrimeBadge để điều khiển hiển thị sao đúng theo role
          prime={showPrimeBadge}
          balanceText={balanceText}
          onLogout={logout}
          navigate={navigate}
        />
      </div>
    </div>
  );
}
