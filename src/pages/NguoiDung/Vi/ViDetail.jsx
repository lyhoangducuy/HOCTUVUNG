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
  getDoc,
  documentId,
} from "firebase/firestore";

import RuTien from "./RutTien/RutTien";

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

  /* Ví + ngân hàng đã lưu */
  const [wallet, setWallet] = useState({ soDu: 0, ngayCapNhat: null, nganHang: null });
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
            ngayCapNhat: data.ngayCapNhat || null,
            nganHang: data.nganHang || null,
          });
        } else {
          setWallet({ idVi: String(uid), soDu: 0, ngayCapNhat: null, nganHang: null });
        }
        setLoadingWallet(false);
      },
      () => setLoadingWallet(false)
    );
    return () => unsub();
  }, [uid]);

  // Fallback: nếu ví chưa có ngân hàng -> lấy từ hồ sơ người dùng
  useEffect(() => {
    if (!uid) return;
    if (wallet.nganHang) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "nguoiDung", String(uid)));
        const data = snap.exists() ? snap.data() : null;
        if (data?.nganHang && !wallet.nganHang) {
          setWallet((w) => ({ ...w, nganHang: data.nganHang }));
        }
      } catch {}
    })();
  }, [uid, wallet.nganHang]);

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
      if (!bdcv.length) {
        setRows([]);
        return;
      }

      // Lấy hóa đơn
      const orderIds = Array.from(
        new Set(bdcv.map((r) => String(r.idHoaDon || "")).filter(Boolean))
      );
      const orderMap = {};
      for (let i = 0; i < orderIds.length; i += 10) {
        const chunk = orderIds.slice(i, i + 10);
        try {
          const rs = await getDocs(
            query(collection(db, "hoaDon"), where(documentId(), "in", chunk))
          );
          rs.forEach((d) => (orderMap[d.id] = { id: d.id, ...(d.data() || {}) }));
        } catch {}
      }

      // Lấy người mua
      const buyerIds = Array.from(
        new Set(
          Object.values(orderMap)
            .map((o) => String(o.idNguoiDung || ""))
            .filter(Boolean)
        )
      );
      const userMap = {};
      for (let i = 0; i < buyerIds.length; i += 10) {
        const chunk = buyerIds.slice(i, i + 10);
        try {
          const rs = await getDocs(
            query(collection(db, "nguoiDung"), where(documentId(), "in", chunk))
          );
          rs.forEach((d) => (userMap[d.id] = { id: d.id, ...(d.data() || {}) }));
        } catch {}
      }

      if (cancelled) return;

      const joined = bdcv.map((r) => {
        const od = orderMap[String(r.idHoaDon)] || {};
        const buyer = userMap[String(od.idNguoiDung)] || {};
        const soTien = Number(od.soTienThanhToan ?? 0) || 0;
        const st = String(r.trangThai || "").toLowerCase(); // pending | done | canceled
        const sign = st === "done" ? "+" : st === "canceled" ? "" : "+";

        return {
          id: r.id,
          ngayTao: r.ngayTao,
          trangThai: st,
          tenGoi: od.tenGoi || "—",
          buyerName: buyer.tenNguoiDung || buyer.hoTen || "Người dùng",
          soTien,
          sign,
        };
      });
      setRows(joined);
    })();
    return () => {
      cancelled = true;
    };
  }, [bdcv]);

  /* ====== Lịch sử rút tiền ====== */
  const [withdraws, setWithdraws] = useState([]);
  const [loadingWd, setLoadingWd] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoadingWd(true);
    const q = query(collection(db, "rutTien"), where("idNguoiDung", "==", String(uid)));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const x = d.data() || {};
          const soTien = Number(x.SoTien ?? x.soTien ?? 0);
          const phi = Number(x.Phi ?? x.phi ?? 0);
          const net = x.TienSauPhi != null ? Number(x.TienSauPhi) : Math.max(0, soTien - phi);
          const status = String(x.TinhTrang ?? x.trangThai ?? "pending").toLowerCase();
        const acct =
          x.SoTaiKhoanNganHang ||
          (x.nganHang
            ? `${x.nganHang.tenNganHang || ""} | ${x.nganHang.chuTaiKhoan || ""} | ${x.nganHang.soTaiKhoan || ""}`.trim()
            : "—");
          const created = x.NgayTao || x.createdAt || x.ngayTao || null;

          return { id: d.id, soTien, phi, net, status, acct, created };
        });

        rows.sort((a, b) => {
          const ta = toDate(a.created)?.getTime() || 0;
          const tb = toDate(b.created)?.getTime() || 0;
          return tb - ta;
        });

        setWithdraws(rows);
        setLoadingWd(false);
      },
      () => {
        setWithdraws([]);
        setLoadingWd(false);
      }
    );
    return () => unsub();
  }, [uid]);

  /* ====== Withdraw Modal integration ====== */
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (!authReady) {
    return (
      <div className="vi-container">
        <div className="vi-empty">Đang kiểm tra đăng nhập…</div>
      </div>
    );
  }

  return (
    <>
      <div className="vi-back" onClick={() => navigate(-1)}>
        ← Quay lại
      </div>
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
            onClick={() => setShowWithdraw(true)}
            disabled={!uid || loadingWallet || Number(wallet.soDu) <= 0}
            title={
              Number(wallet.soDu) <= 0
                ? "Số dư bằng 0, chưa thể yêu cầu rút."
                : "Yêu cầu rút tiền"
            }
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
                <th>Nội dung</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const moneyMod =
                  r.trangThai === "done"
                    ? "vi-amount--plus"
                    : r.trangThai === "canceled"
                    ? "vi-amount--minus"
                    : "vi-amount--pending";
                const badgeMod =
                  r.trangThai === "done"
                    ? "vi-badge--plus"
                    : r.trangThai === "canceled"
                    ? "vi-badge--minus"
                    : "vi-badge--pending";

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
                      {r.trangThai === "canceled"
                        ? "0đ"
                        : `${r.sign}${formatVND(r.soTien)}`}
                    </td>
                    <td data-label="Tên gói">{r.tenGoi}</td>
                    <td data-label="Thời gian">{formatDate(r.ngayTao)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Lịch sử rút tiền */}
      <div className="vi-table-wrap" style={{ marginTop: 24 }}>
        <div className="vi-table-headline">
          <h2>Lịch sử rút tiền</h2>
          <span className="vi-muted">{withdraws.length} yêu cầu</span>
        </div>

        {loadingWd ? (
          <div className="vi-empty">Đang tải…</div>
        ) : withdraws.length === 0 ? (
          <div className="vi-empty">Chưa có yêu cầu rút nào.</div>
        ) : (
          <table className="vi-table">
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Số tiền yêu cầu</th>
                <th>Phí</th>
                <th>Thực nhận</th>
                <th>STK ngân hàng</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {withdraws.map((w) => {
                const badge =
                  w.status === "paid"
                    ? "vi-badge vi-badge--plus"
                    : w.status === "canceled" || w.status === "rejected"
                    ? "vi-badge vi-badge--minus"
                    : "vi-badge vi-badge--pending";
                return (
                  <tr key={w.id}>
                    <td data-label="Trạng thái">
                      <span className={badge}>
                        {w.status === "paid"
                          ? "Đã trả"
                          : w.status === "approved"
                          ? "Đã duyệt"
                          : w.status === "canceled" || w.status === "rejected"
                          ? "Đã hủy"
                          : "Đang xử lý"}
                      </span>
                    </td>
                    <td data-label="Số tiền yêu cầu">{formatVND(w.soTien)}</td>
                    <td data-label="Phí">{formatVND(w.phi)}</td>
                    <td data-label="Thực nhận">{formatVND(w.net)}</td>
                    <td data-label="STK ngân hàng">{w.acct || "—"}</td>
                    <td data-label="Thời gian">{formatDate(w.created)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal rút tiền: truyền savedBank để auto-fill */}
      <RuTien
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        soDuHienTai={Number(wallet.soDu || 0)}
        uid={uid}
        savedBank={wallet.nganHang || null}
      />
    </>
  );
}
