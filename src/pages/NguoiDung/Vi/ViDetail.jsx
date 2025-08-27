import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViDetail.css";

import { auth, db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";

const formatVND = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;
const formatDate = (v) => {
  if (!v) return "";
  if (typeof v?.toDate === "function") return v.toDate().toLocaleString("vi-VN");
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
};

export default function ViDetail() {
  const navigate = useNavigate();

  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);
  const uid = auth.currentUser?.uid || session?.idNguoiDung || null;

  const [wallet, setWallet] = useState({ soDu: 0, ngayCapNhat: null });
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!uid) navigate("/dang-nhap", { replace: true });
  }, [uid, navigate]);

  // Realtime: ví (doc id = uid) + biến động (collection: bienDongSoDu, lọc idVi = uid)
  useEffect(() => {
    if (!uid) return;

    const unsubWallet = onSnapshot(
      doc(db, "vi", String(uid)),
      (snap) => {
        if (snap.exists()) setWallet({ idVi: snap.id, ...snap.data() });
        else setWallet({ idVi: uid, soDu: 0, ngayCapNhat: null });
        setLoading(false);
      },
      () => setLoading(false)
    );

    const qTx = query(
      collection(db, "bienDongSoDu"),
      where("idVi", "==", String(uid)),
      orderBy("ngayTao", "desc"),
      limit(100)
    );
    const unsubTx = onSnapshot(
      qTx,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTxs(rows);
      },
      () => setTxs([])
    );

    return () => { unsubWallet(); unsubTx(); };
  }, [uid]);

  return (
    <div className="vi-wrap">
      <div className="vi-head">
        <button className="btn ghost" onClick={() => navigate(-1)}>← Quay lại</button>
        <h1>Ví của tôi</h1>
      </div>

      <div className="vi-grid">
        <div className="vi-card balance">
          <div className="lb">Số dư hiện tại</div>
          <div className="val">{formatVND(wallet.soDu)}</div>
          <div className="sub">Cập nhật: {formatDate(wallet.ngayCapNhat)}</div>

          <div className="actions">
            {/* Nút rút tiền: dẫn sang trang yêu cầu rút */}
            <button
              className="btn primary"
              onClick={() => navigate("/rut-tien", { state: { soDu: wallet.soDu } })}
            >
              Yêu cầu rút
            </button>
          </div>
        </div>

        <div className="vi-card tx">
          <div className="tx-head">
            <h2>Lịch sử biến động</h2>
            <span className="muted">{txs.length} dòng gần nhất</span>
          </div>

          {loading ? (
            <div className="empty">Đang tải...</div>
          ) : txs.length === 0 ? (
            <div className="empty">Chưa có biến động nào.</div>
          ) : (
            <div className="tx-table">
              <div className="tr head">
                <div className="td time">Thời gian</div>
                <div className="td type">Loại</div>
                <div className="td money">Số tiền</div>
                <div className="td desc">Mô tả</div>
                <div className="td ref">Tham chiếu</div>
              </div>

              {txs.map((r) => {
                const isPlus = Number(r.soTien) > 0; // >0: cộng; <0: trừ
                return (
                  <div className="tr" key={r.id}>
                    <div className="td time">{formatDate(r.ngayTao)}</div>
                    <div className="td type">
                      <span className={`pill ${isPlus ? "plus" : "minus"}`}>
                        {isPlus ? "Cộng" : "Trừ"}
                      </span>
                    </div>
                    <div className={`td money ${isPlus ? "plus" : "minus"}`}>
                      {isPlus ? "+" : "−"}{formatVND(Math.abs(Number(r.soTien || 0)))}
                    </div>
                    <div className="td desc">{r.moTa || "-"}</div>
                    <div className="td ref">{r.maThamChieu || "-"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
