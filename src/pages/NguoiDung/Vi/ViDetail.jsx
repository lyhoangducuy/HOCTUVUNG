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

import RutTien from "../../../components/Vi/RutTien/RutTien";
import BangRutTien from "../../../components/Vi/BangRutTien/BangRutTien";

import {
  toDate,
  formatDate,
  formatVND,
  isWithdrawType,
} from "./utils/dinhDang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import BangBienDongVi from "../../../components/Vi/BienDongVi/BienDongVi";

export default function ViDetail() {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Lấy UID
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.uid) setUid(u.uid);
      else {
        try {
          const ss = JSON.parse(sessionStorage.getItem("session") || "null");
          if (ss?.idNguoiDung) setUid(String(ss.idNguoiDung));
        } catch { }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authReady && !uid) navigate("/dang-nhap", { replace: true });
  }, [authReady, uid, navigate]);

  /* Ví + ngân hàng đã lưu */
  const [wallet, setWallet] = useState({ soDu: 0, updatedAt: null, nganHang: null });
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
            updatedAt: data.updatedAt || data.ngayCapNhat || null,
            nganHang: data.nganHang || null,
          });
        } else {
          setWallet({ idVi: String(uid), soDu: 0, updatedAt: null, nganHang: null });
        }
        setLoadingWallet(false);
      },
      () => setLoadingWallet(false)
    );
    return () => unsub();
  }, [uid]);

  // Fallback ngân hàng từ hồ sơ
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
      } catch { }
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
        // sort theo updatedAt rồi fallback ngayTao
        rows.sort((a, b) => {
          const ta = toDate(a.updatedAt || a.ngayTao)?.getTime() || 0;
          const tb = toDate(b.updatedAt || b.ngayTao)?.getTime() || 0;
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

  /* JOIN: bdcv (KHÔNG gồm rút tiền) -> hoaDon -> nguoiDung */
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Bỏ hết bản ghi rút tiền khỏi biến động ví
      const bdcvNonWithdraw = bdcv.filter((r) => !isWithdrawType(r.loai));
      if (!bdcvNonWithdraw.length) {
        setRows([]);
        return;
      }

      // 2) Chỉ lấy idHoaDon của bản ghi KHÔNG rút tiền
      const orderIds = Array.from(
        new Set(bdcvNonWithdraw.map((r) => String(r.idHoaDon || "")).filter(Boolean))
      );

      const orderMap = {};
      for (let i = 0; i < orderIds.length; i += 10) {
        const chunk = orderIds.slice(i, i + 10);
        if (!chunk.length) continue;
        try {
          const rs = await getDocs(
            query(collection(db, "hoaDon"), where(documentId(), "in", chunk))
          );
          rs.forEach((d) => (orderMap[d.id] = { id: d.id, ...(d.data() || {}) }));
        } catch { }
      }

      // 3) Join người mua
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
        if (!chunk.length) continue;
        try {
          const rs = await getDocs(
            query(collection(db, "nguoiDung"), where(documentId(), "in", chunk))
          );
          rs.forEach((d) => (userMap[d.id] = { id: d.id, ...(d.data() || {}) }));
        } catch { }
      }

      if (cancelled) return;

      // 4) Tạo rows cho bảng Biến động ví (chỉ giao dịch không phải rút tiền)
      // ...
      const joined = bdcvNonWithdraw
        .map((r) => {
          const od = orderMap[String(r.idHoaDon)] || {};
          const isCourse =
            String(od.loai || od.loaiGiaoDich || "").toUpperCase() === "MUA_KHOA_HOC" ||
            String(od.maDichVu || od.dichVu || "").toUpperCase() === "KHOA_HOC" ||
            String(od.loaiSanPham || "").toUpperCase() === "COURSE";

          if (!isCourse) return null;

          const raw = Number(r.soTien ?? od.soTienThanhToan ?? 0) || 0;
          const soTienAbs = Math.abs(raw);
          const st = String(r.trangThai || "").toLowerCase(); // pending|done|canceled
          const sign = st === "canceled" ? "" : "+";

          const noiDung =
            r.noiDung || r.moTa || (od.tenGoi ? `Doanh thu: ${od.tenGoi}` : "—");

          const buyer = userMap[String(od.idNguoiDung)] || {};

          return {
            id: r.id,
            ngayTao: r.updatedAt || r.ngayTao,
            trangThai: st,
            isWithdraw: false,
            noiDung,
            buyerName: buyer.tenNguoiDung || buyer.hoten || buyer.hoTen || "Người dùng",
            soTien: soTienAbs,
            sign,
          };
        })
        .filter(Boolean);
      setRows(joined);

    })();
    return () => { cancelled = true; };
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
      <div className="back" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        Quay lại
      </div>
      <h1 className="vi-title">Ví của tôi</h1>

      {/* Số dư */}
      <div className="vi-balance-card">
        <div className="vi-balance-label">Số dư hiện tại</div>
        <div className="vi-balance-value">
          {loadingWallet ? "…" : formatVND(wallet.soDu)}
        </div>
        <div className="vi-balance-sub">Cập nhật: {formatDate(wallet.updatedAt)}</div>
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



      <BangBienDongVi rows={rows} allowedLoai={["MUA_KHOA_HOC"]} />

      {/* BẢNG: Lịch sử rút tiền */}
      <BangRutTien withdraws={withdraws} loading={loadingWd} />

      {/* Modal rút tiền */}
      <RutTien
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        soDuHienTai={Number(wallet.soDu || 0)}
        uid={uid}
        savedBank={wallet.nganHang || null}
      />
    </>
  );
}
