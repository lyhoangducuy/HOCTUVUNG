// src/pages/NguoiDung/Vi/ViDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViDetail.css";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  limit,
  getDocs,
  documentId,
} from "firebase/firestore";

/* ===== Helpers ===== */
const VN = "vi-VN";
const formatVND = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;
const toDate = (v) => {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const formatDate = (v) => {
  const d = toDate(v);
  return d ? d.toLocaleString(VN) : "";
};

export default function ViDetail() {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.uid) setUid(u.uid);
      else {
        try {
          const ss = JSON.parse(sessionStorage.getItem("session") || "null");
          if (ss?.idNguoiDung) setUid(String(ss.idNguoiDung));
        } catch {}
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authReady && !uid) navigate("/dang-nhap", { replace: true });
  }, [authReady, uid, navigate]);

  /* Ví */
  const [wallet, setWallet] = useState({ soDu: 0, ngayCapNhat: null });
  const [loadingWallet, setLoadingWallet] = useState(true);
  useEffect(() => {
    if (!uid) return;
    setLoadingWallet(true);
    const unsub = onSnapshot(
      doc(db, "vi", String(uid)),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() || {};
          setWallet({
            idVi: snap.id,
            soDu: Number(data.soDu || 0),
            ngayCapNhat: data.ngayCapNhat  || null,
          });
        } else {
          setWallet({ idVi: String(uid), soDu: 0, ngayCapNhat: null });
        }
        setLoadingWallet(false);
      },
      () => setLoadingWallet(false)
    );
    return () => unsub();
  }, [uid]);

  /* Biến động của ví (bienDongCuaVi) */
  const [bdcv, setBdcv] = useState([]);
  const [loadingBdcv, setLoadingBdcv] = useState(true);
  useEffect(() => {
    if (!uid) return;
    setLoadingBdcv(true);
    const qBD = query(
      collection(db, "bienDongCuaVi"),
      where("idVi", "==", String(uid)),
      limit(200)
    );
    const unsub = onSnapshot(
      qBD,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rows.sort((a, b) => {
          const ta = toDate(a.ngayTao)?.getTime() || 0;
          const tb = toDate(b.ngayTao)?.getTime() || 0;
          return tb - ta;
        });
        setBdcv(rows);
        setLoadingBdcv(false);
      },
      () => {
        setBdcv([]);
        setLoadingBdcv(false);
      }
    );
    return () => unsub();
  }, [uid]);

  /* JOIN: bdcv -> hoaDon -> nguoiDung */
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!bdcv.length) { setRows([]); return; }

      // Lấy hóa đơn
      const orderIds = Array.from(new Set(bdcv.map(r => String(r.idHoaDon || "")).filter(Boolean)));
      const orderMap = {};
      for (let i = 0; i < orderIds.length; i += 10) {
        const chunk = orderIds.slice(i, i + 10);
        try {
          const rs = await getDocs(query(collection(db, "hoaDon"), where(documentId(), "in", chunk)));
          rs.forEach(d => (orderMap[d.id] = { id: d.id, ...(d.data() || {}) }));
        } catch {}
      }

      // Lấy người mua
      const buyerIds = Array.from(new Set(Object.values(orderMap).map(o => String(o.idNguoiDung || "")).filter(Boolean)));
      const userMap = {};
      for (let i = 0; i < buyerIds.length; i += 10) {
        const chunk = buyerIds.slice(i, i + 10);
        try {
          const rs = await getDocs(query(collection(db, "nguoiDung"), where(documentId(), "in", chunk)));
          rs.forEach(d => (userMap[d.id] = { id: d.id, ...(d.data() || {}) }));
        } catch {}
      }

      if (cancelled) return;

      const joined = bdcv.map((r) => {
        const od = orderMap[String(r.idHoaDon)] || {};
        const buyer = userMap[String(od.idNguoiDung)] || {};
        const soTien = Number(od.soTienThanhToanThucTe ?? od.soTienThanhToan ?? 0) || 0;
        const st = String(r.trangThai || "").toLowerCase(); // pending | done | canceled
        const sign = st === "done" ? "+" : st === "canceled" ? "" : "+";

        return {
          id: r.id,
          ngayTao: r.ngayTao,
          trangThai: st,
          tenGoi: od.tenGoi || "—", // <-- thêm tên gói từ hóa đơn
          buyerName: buyer.tenNguoiDung || buyer.hoTen || "Người dùng",
          soTien,
          sign,
        };
      });
      setRows(joined);
    })();
    return () => { cancelled = true; };
  }, [bdcv]);

  if (!authReady) {
    return (
      <div className="vi-container">
        <div className="vi-empty">Đang kiểm tra đăng nhập…</div>
      </div>
    );
  }

  return (
    <>
      <div className="vi-back" onClick={() => navigate(-1)}>← Quay lại</div>
      <h1 className="vi-title">Ví của tôi</h1>

      {/* Số dư */}
      <div className="vi-balance-card">
        <div className="vi-balance-label">Số dư hiện tại</div>
        <div className="vi-balance-value">
          {loadingWallet ? "…" : formatVND(wallet.soDu)}
        </div>
        <div className="vi-balance-sub">Cập nhật: {formatDate(wallet.ngayCapNhat)}</div>
        <div className="vi-actions">
          <button
            className="vi-btn-primary"
            onClick={() => navigate("/rut-tien", { state: { soDu: wallet.soDu } })}
          >
            Yêu cầu rút
          </button>
        </div>
      </div>

      {/* Biến động */}
      <div className="vi-table-wrap">
        <div className="vi-table-headline">
          <h2>Biến động của ví</h2>
          <span className="vi-muted">{rows.length} dòng gần nhất</span>
        </div>

        {loadingBdcv ? (
          <div className="vi-empty">Đang tải…</div>
        ) : rows.length === 0 ? (
          <div className="vi-empty">Chưa có đối soát nào.</div>
        ) : (
          <table className="vi-table">
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Người mua</th>
                <th>Số tiền</th>
                <th>Nội dung</th> {/* đổi nhãn cột */}
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const moneyMod =
                  r.trangThai === "done" ? "vi-amount--plus" :
                  r.trangThai === "canceled" ? "vi-amount--minus" : "vi-amount--pending";
                const badgeMod =
                  r.trangThai === "done" ? "vi-badge--plus" :
                  r.trangThai === "canceled" ? "vi-badge--minus" : "vi-badge--pending";

                return (
                  <tr key={r.id}>
                    <td data-label="Trạng thái">
                      <span className={`vi-badge ${badgeMod}`}>
                        {r.trangThai === "done"
                          ? "Hoàn tất"
                          : r.trangThai === "canceled"
                          ? "Hủy"
                          : "Đang xử lý"}
                      </span>
                    </td>
                    <td data-label="Người mua">{r.buyerName}</td>
                    <td data-label="Số tiền" className={`vi-amount ${moneyMod}`}>
                      {r.trangThai === "canceled" ? "0đ" : `${r.sign}${formatVND(r.soTien)}`}
                    </td>
                    <td data-label="Tên gói">{r.tenGoi}</td> {/* hiển thị tên gói */}
                    <td data-label="Thời gian">{formatDate(r.ngayTao)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
