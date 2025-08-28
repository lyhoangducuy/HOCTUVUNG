// src/pages/NguoiDung/Vi/RutTien/RutTien.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./RutTien.css";
import { db } from "../../../../../lib/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  increment,
  getDoc,
} from "firebase/firestore";

const BANKS = [
  "Vietcombank","Techcombank","VietinBank","BIDV","Agribank",
  "MB Bank","ACB","TPBank","Sacombank","VPBank","HDBank",
];

const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmtVND = (n) => `${toNumber(n).toLocaleString("vi-VN")}đ`;

export default function RuTien({
  open = false,
  onClose = () => {},
  uid,
  soDuHienTai = 0,
  savedBank = null,
  onSubmitted = () => {},
}) {
  const [amountStr, setAmountStr] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankOwner, setBankOwner] = useState("");
  const [saveBank, setSaveBank] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // % phí realtime từ cauHinh/rutTien.phiPhanTram (fallback 10)
  const [feePct, setFeePct] = useState(10);
  useEffect(() => {
    if (!open) return;
    const unsub = onSnapshot(
      doc(db, "cauHinh", "rutTien"),
      (snap) => {
        const pct = Number(snap.data()?.phiPhanTram);
        setFeePct(Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 10);
      },
      () => setFeePct(10)
    );
    return () => unsub && unsub();
  }, [open, db]);

  // reset + auto-fill bank đã lưu
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setAmountStr("");
    if (savedBank) {
      setBankName(savedBank.tenNganHang || "");
      setBankAccount(savedBank.soTaiKhoan || "");
      setBankOwner(savedBank.chuTaiKhoan || "");
    } else {
      setBankName("");
      setBankAccount("");
      setBankOwner("");
    }
  }, [open, savedBank]);

  const amount = useMemo(() => Math.max(0, toNumber(amountStr)), [amountStr]);
  const phiUI = useMemo(() => Math.round((amount * feePct) / 100), [amount, feePct]);
  const netUI = useMemo(() => Math.max(0, amount - phiUI), [amount, phiUI]);

  const validate = () => {
    const e = {};
    if (!amount || amount <= 0) e.amount = "Số tiền rút phải lớn hơn 0.";
    else if (amount > soDuHienTai) e.amount = "Số tiền rút vượt quá số dư.";
    if (!bankName) e.bankName = "Vui lòng chọn ngân hàng.";
    if (!bankAccount) e.bankAccount = "Vui lòng nhập số tài khoản.";
    else if (!/^\d{6,20}$/.test(String(bankAccount).replace(/\s/g, ""))) {
      e.bankAccount = "Số tài khoản chỉ gồm số (6–20 chữ số).";
    }
    if (!bankOwner || bankOwner.trim().length < 2)
      e.bankOwner = "Tên chủ tài khoản chưa hợp lệ.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (submitting || !uid) return;
    if (!validate()) return;

    try {
      setSubmitting(true);

      // Lấy % phí mới nhất tại thời điểm submit
      let feePctNow = feePct; // fallback từ state
      try {
        const cfg = await getDoc(doc(db, "cauHinh", "rutTien"));
        const p = Number(cfg.data()?.phiPhanTram);
        feePctNow = Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : feePct;
      } catch {}

      const SoTaiKhoanNganHang = `${bankName} | ${bankOwner} | ${bankAccount}`.trim();

      // Tính phí theo feePctNow (snapshot lúc tạo)
      const phi = Math.round((amount * feePctNow) / 100);
      const net = Math.max(0, amount - phi);

      // Tạo batch để: tạo YC, trừ ví, log biến động (giữ tạm), (tuỳ chọn) lưu ngân hàng
      const batch = writeBatch(db);

      // 1) Tạo doc rutTien với id sẵn để link vào biến động
      const reqRef = doc(collection(db, "rutTien"));
      batch.set(reqRef, {
        idRutTien: reqRef.id,
        idNguoiDung: String(uid),
        idVi: String(uid),
        SoTien: amount,
        Phi: phi,
        TienSauPhi: net,
        TinhTrang: "pending",           // pending | approved | paid | canceled
        SoTaiKhoanNganHang,
        NgayTao: serverTimestamp(),
        PhiPhanTramSnapshot: feePctNow,
        DaTruSoDu: true,                // đánh dấu đã trừ ví
      });

      // 2) Trừ ví bằng increment để tránh race-condition
      const walletRef = doc(db, "vi", String(uid));
      batch.set(
        walletRef,
        {
          idNguoiDung: String(uid),
          soDu: increment(-amount),
          ngayCapNhat: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 3) Ghi biến động: giữ tạm khi tạo YC (để admin hủy có thể tìm)
      const bdcvRef = doc(collection(db, "bienDongCuaVi"));
      batch.set(bdcvRef, {
        idVi: String(uid),
        loai: "rut_tien_deduct",
        noiDung: "Yêu cầu rút tiền",
        soTien: amount,                // số tiền bị giữ/trừ
        trangThai: "pending",          // chờ tất toán
        ngayTao: serverTimestamp(),
        refRutTienId: reqRef.id,
      });

      // 4) (Tuỳ chọn) Lưu info ngân hàng
      if (saveBank) {
        const payload = {
          nganHang: { tenNganHang: bankName, soTaiKhoan: bankAccount, chuTaiKhoan: bankOwner },
          ngayCapNhat: serverTimestamp(),
        };
        batch.set(walletRef, payload, { merge: true });
        batch.set(doc(db, "nguoiDung", String(uid)), payload, { merge: true });
      }

      await batch.commit();

      onSubmitted();
      onClose();
      alert("Đã gửi yêu cầu rút tiền. Vui lòng chờ xét duyệt.");
    } catch (e) {
      console.error(e);
      alert("Không thể gửi yêu cầu rút tiền. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="vi-modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="vi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vi-modal-header">
          <h3>Yêu cầu rút tiền</h3>
          <button className="vi-modal-close" onClick={onClose} disabled={submitting}>×</button>
        </div>

        <div className="vi-modal-body">
          <div className="vi-input">
            <label>Số dư</label>
            <div className="vi-static">{fmtVND(soDuHienTai)}</div>
          </div>

          <div className="vi-input">
            <label>Số tiền muốn rút</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Nhập số tiền (VND)"
              disabled={submitting}
            />
            {errors.amount && <div className="vi-error">{errors.amount}</div>}
          </div>

          <div className="vi-grid-2">
            <div className="vi-input">
              <label>Phí ({feePct}%)</label>
              <input type="text" value={fmtVND(phiUI)} disabled />
            </div>
            <div className="vi-input">
              <label>Dự kiến nhận</label>
              <input type="text" value={fmtVND(netUI)} disabled />
            </div>
          </div>

          <div className="vi-split" />

          <div className="vi-input">
            <label>Tên ngân hàng</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              disabled={submitting}
            >
              <option value="">-- Chọn ngân hàng --</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.bankName && <div className="vi-error">{errors.bankName}</div>}
          </div>

          <div className="vi-input">
            <label>Số tài khoản</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value.replace(/\s/g, ""))}
              placeholder="VD: 0123456789"
              disabled={submitting}
            />
            {errors.bankAccount && <div className="vi-error">{errors.bankAccount}</div>}
          </div>

          <div className="vi-input">
            <label>Chủ tài khoản</label>
            <input
              type="text"
              value={bankOwner}
              onChange={(e) => setBankOwner(e.target.value)}
              placeholder="VD: Nguyen Van A"
              disabled={submitting}
            />
            {errors.bankOwner && <div className="vi-error">{errors.bankOwner}</div>}
          </div>

          <label className="vi-checkbox">
            <input
              type="checkbox"
              checked={saveBank}
              onChange={(e) => setSaveBank(e.target.checked)}
              disabled={submitting}
            />
            Lưu thông tin ngân hàng cho lần sau
          </label>
        </div>

        <div className="vi-modal-footer">
          <button className="vi-btn-secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button
            className="vi-btn-primary"
            onClick={submit}
            disabled={submitting || amount <= 0 || amount > soDuHienTai}
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu rút"}
          </button>
        </div>
      </div>
    </div>
  );
}
