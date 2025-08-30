// router/phanQuyenTraPhi.jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

/* ===== Utils giống Header (bỏ dấu & check hủy) ===== */
const removeAccentLower = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isCanceled = (s) => {
  const t = String(s || "").toLowerCase();
  const na = removeAccentLower(s);
  return (
    t === "đã hủy" ||
    na === "da huy" ||
    t.includes("hủy") ||
    t.includes("huỷ") ||
    na.includes("huy") ||
    /cancel|canceled|cancelled/.test(na)
  );
};

/* Hỗ trợ Timestamp, "dd/MM/yyyy", ISO Date */
const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (typeof v === "string") {
    const parts = v.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts.map(Number);
      if (y) return new Date(y, (m || 1) - 1, d || 1);
    }
    const dISO = new Date(v);
    return isNaN(dISO) ? null : dISO;
  }
  return null;
};

export default function YeuCauTraPhi() {
  const location = useLocation();

  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState(null);
  const [prime, setPrime] = useState(null); // null = đang kiểm tra

  // 1) Nghe trạng thái đăng nhập Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // 2) Realtime kiểm tra gói theo uid
  useEffect(() => {
    if (!uid) {
      setPrime(false);
      return;
    }
    const qSubs = query(
      collection(db, "goiTraPhiCuaNguoiDung"),
      where("idNguoiDung", "==", String(uid))
    );
    const unsub = onSnapshot(
      qSubs,
      (snap) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const hasActive = snap.docs.some((d) => {
          const row = d.data();
          if (isCanceled(row?.status)) return false;
          const end = toDateFlexible(row?.NgayKetThuc);
          if (!(end instanceof Date) || isNaN(end)) return false;
          end.setHours(0, 0, 0, 0);
          return end >= today;
        });

        setPrime(hasActive);
      },
      () => setPrime(false)
    );
    return () => unsub();
  }, [uid]);

  // Chưa biết auth → chờ (có thể return null hoặc skeleton tuỳ bạn)
  if (!authReady) return null;

  // Chưa đăng nhập → điều hướng đăng nhập
  if (!uid) {
    return <Navigate to="/dang-nhap" replace state={{ from: location }} />;
  }

  // Đang kiểm tra gói → chờ
  if (prime === null) return null;

  // Không có gói còn hiệu lực → sang trang trả phí
  if (!prime) {
    return (
      <Navigate
        to="/tra-phi"
        replace
        state={{ from: location, reason: "no_active_sub" }}
      />
    );
  }

  // Có gói → cho vào route con
  return <Outlet />;
}
