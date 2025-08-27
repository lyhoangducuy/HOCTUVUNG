// src/pages/Home/TrangChu.jsx
import React, { Suspense, lazy, useEffect, useState } from "react";
import "./TrangChu.css";



import { auth, db } from "../../../../lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import HocGanDay from "./Tab/HocGanDay";
import BoThePhoBien from "./Tab/BoThePhoBien";

// Lazy-load để nhẹ bundle
const AIButton = lazy(() => import("../../../components/Admin/AIButton/AIButton"));

export default function TrangChu() {
  const [prime, setPrime] = useState(false);

  // kiểm tra Prime (nếu có bảng gói)
  useEffect(() => {
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    const uid = auth.currentUser?.uid || session?.idNguoiDung || null;
    if (!uid) { setPrime(false); return; }

    const qSub = query(
      collection(db, "goiTraPhiCuaNguoiDung"),
      where("idNguoiDung", "==", String(uid))
    );

    const unsub = onSnapshot(
      qSub,
      (snap) => {
        const today = new Date();
        const active = snap.docs.some((d) => {
          const s = d.data();
          if (s?.status === "Đã hủy") return false;
          const raw = s?.NgayKetThuc; // "dd/mm/yyyy"
          if (typeof raw !== "string") return false;
          const [dd, mm, yyyy] = raw.split("/").map(Number);
          const end = dd && mm && yyyy ? new Date(yyyy, mm - 1, dd) : null;
          return end && end >= today;
        });
        setPrime(active);
      },
      () => setPrime(false)
    );

    return () => unsub();
  }, []);

  return (
    <>
      {prime && (
        <div className="ai-strip">
          <Suspense fallback={null}>
            <AIButton />
          </Suspense>
        </div>
      )}

      {/* Khối 1: Học gần đây */}
      <HocGanDay />

      {/* Khối 2: Bộ thẻ phổ biến */}
      <BoThePhoBien />
    </>
  );
}
