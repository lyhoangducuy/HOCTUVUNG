// src/pages/Admin/ChiTra/QuanLyChiTra.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./ChiTra.css";
import { db } from "../../../../lib/firebase";

// UI components có sẵn của bạn
import FeeConfig from "../../../components/Admin/ChiTra/FeeConfig";
import StatusFilter from "../../../components/Admin/ChiTra/StatusFilter";
import WithdrawTable from "../../../components/Admin/ChiTra/WithdrawTable";
import useWithdrawRequests from "../../../components/Admin/ChiTra/useWithdrawRequests";

// Firestore
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  documentId,
  serverTimestamp,
  writeBatch,
  increment,
  onSnapshot,
  limit,
} from "firebase/firestore";

/* ===================== Helpers ===================== */
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
// const clamp = (x, a, b) => Math.min(Math.max(num(x), a), b);

/* ===================== (6) useUserMap NHÚNG TRỰC TIẾP ===================== */
function useUserMapInline(db, rows) {
  const [userMap, setUserMap] = React.useState({});

  React.useEffect(() => {
    if (!db) return;
    const ids = Array.from(
      new Set(rows.map((r) => String(r.idNguoiDung || "")).filter(Boolean))
    );
    if (ids.length === 0) {
      setUserMap({});
      return;
    }

    (async () => {
      const map = {};
      for (let i = 0; i < ids.length; i += 10) {
        const chunk = ids.slice(i, i + 10);
        try {
          const rs = await getDocs(
            query(collection(db, "nguoiDung"), where(documentId(), "in", chunk))
          );
          rs.forEach((d) => (map[d.id] = d.data() || {}));
        } catch {}
      }
      setUserMap(map);
    })();
  }, [db, rows]);

  return userMap;
}

/** tìm log giữ tạm (nếu có) theo refRutTienId để xử lý hoàn tiền chuẩn */
async function findHoldEntryForWithdraw(db, rutTienId) {
  try {
    const q = query(
      collection(db, "bienDongCuaVi"),
      where("refRutTienId", "==", String(rutTienId)),
      limit(1)
    );
    const snap = await getDocs(q);
    const doc0 = snap.docs[0];
    if (!doc0) return null;
    return { id: doc0.id, ...(doc0.data() || {}) };
  } catch {
    return null;
  }
}

/** Hoàn tiền khi hủy (nếu trước đó đã trừ ví/giữ tạm) + update log cho đúng */
async function refundOnCancelInline(db, row) {
  const userId = String(row.idNguoiDung || row.idVi || "");
  if (!userId) return;

  const amount = num(row.SoTien);
  if (!(amount > 0)) return;

  const reqRef = doc(db, "rutTien", row.id);
  const walletRef = doc(db, "vi", userId);

  // Kiểm tra có giữ tạm không (cờ hoặc log giữ tạm)
  const holdLog = await findHoldEntryForWithdraw(db, row.id);
  const hadDeduct = !!row.DaTruSoDu || !!holdLog;

  const batch = writeBatch(db);

  if (hadDeduct) {
    // + Cộng lại số dư ví
    batch.set(
      walletRef,
      { soDu: increment(amount), ngayCapNhat: serverTimestamp() },
      { merge: true }
    );

    // + Nếu có log giữ tạm -> chuyển log đó sang canceled
    if (holdLog) {
      const holdRef = doc(db, "bienDongCuaVi", holdLog.id);
      batch.update(holdRef, {
        trangThai: "canceled",
        capNhatLuc: serverTimestamp(),
      });
    }

    // + Ghi log hoàn tiền (credit)
    const refundRef = doc(collection(db, "bienDongCuaVi"));
    batch.set(refundRef, {
      idVi: userId,
      loai: "rut_tien_refund",
      noiDung: "Hoàn trả do huỷ yêu cầu rút tiền",
      soTien: amount,
      trangThai: "done",
      ngayTao: serverTimestamp(),
      refRutTienId: row.id,
    });
  }

  // + đánh dấu đã hoàn
  batch.update(reqRef, {
    DaHoanTien: true,
    CapNhatLuc: serverTimestamp(),
  });

  await batch.commit();
}

/** Cập nhật trạng thái 1 YC; nếu chuyển thành canceled thì hoàn tiền đúng cách */
async function updateWithdrawStatusInline(db, row, next) {
  try {
    const ref = doc(db, "rutTien", row.id);

    if (next === "canceled" && !row.DaHoanTien) {
      await refundOnCancelInline(db, row);
    }

    await updateDoc(ref, {
      TinhTrang: next,
      CapNhatLuc: serverTimestamp(),
      ...(next === "approved" ? { DuyetLuc: serverTimestamp() } : {}),
      ...(next === "paid" ? { ThanhToanLuc: serverTimestamp() } : {}),
      ...(next === "canceled" ? { HuyLuc: serverTimestamp() } : {}),
    });
  } catch (e) {
    console.error(e);
    alert("Không thể cập nhật trạng thái.");
  }
}

export default function QuanLyChiTra() {
  const [feePct, setFeePct] = useState(10);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "cauHinh", "rutTien"), (snap) => {
      const p = Number(snap.data()?.phiPhanTram);
      setFeePct(Number.isFinite(p) ? p : 10);
    });
    return () => unsub();
  }, []);

  // Yêu cầu rút tiền
  const { rows, loading } = useWithdrawRequests(db);

  // Map tên người dùng
  const userMap = useUserMapInline(db, rows);
  const nameById = (id) => {
    const u = userMap[String(id)] || {};
    return u.tenNguoiDung || u.username || u.hoTen || u.email || `ID: ${id}`;
  };

  // Lọc trạng thái
  const [filter, setFilter] = useState("all");
  const data = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => String(r.TinhTrang || "pending") === filter);
  }, [rows, filter]);

  const handleStatus = (row, next) => updateWithdrawStatusInline(db, row, next);

  return (
    <div className="rt-container">
      <h1 className="rt-title">Chi trả (Rút tiền)</h1>

      <div className="rt-config">
        <FeeConfig feePct={feePct} setFeePct={setFeePct} />
        <StatusFilter value={filter} onChange={setFilter} />
      </div>

      <WithdrawTable
        loading={loading}
        rows={data}
        nameById={nameById}
        onApprove={(r) => handleStatus(r, "approved")}
        onPaid={(r) => handleStatus(r, "paid")}
        onCancel={(r) => handleStatus(r, "canceled")}
      />
    </div>
  );
}
