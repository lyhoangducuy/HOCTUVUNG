// src/pages/Admin/ThanhToan/CheckoutResult.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./CheckoutResult.css";

import { db } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  arrayUnion,
  setDoc,
  increment,
} from "firebase/firestore";

const VN = "vi-VN";
const toVN = (date) => new Date(date).toLocaleDateString(VN);
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};
const sanitizeId = (s) => String(s || "").replace(/[^0-9a-zA-Z_-]/g, "");

// Map mã phản hồi VNPay -> thông điệp
const RESP_TEXT = {
  "00": "Giao dịch thành công",
  "07": "Trừ tiền thành công. Giao dịch nghi ngờ (liên hệ ngân hàng)",
  "09": "Thẻ/Tài khoản chưa đăng ký InternetBanking",
  "10": "Xác thực OTP sai quá số lần",
  "11": "Hết hạn mức giao dịch",
  "12": "Tài khoản/Thẻ bị khóa",
  "24": "Khách hàng huỷ giao dịch",
  "51": "Tài khoản không đủ số dư",
  "65": "Vượt quá hạn mức giao dịch",
  "75": "Ngân hàng thanh toán đang bảo trì",
  "79": "Khách không nhập OTP",
  "99": "Lỗi khác",
};

// ===== BDCV helpers =====
const buildBDCVId = (idVi, idHoaDon) => `${String(idVi)}_${String(idHoaDon)}`;

async function upsertBDCV({ idVi, idHoaDon, trangThai }) {
  const idBDCV = buildBDCVId(idVi, idHoaDon);
  await setDoc(
    doc(db, "bienDongCuaVi", idBDCV),
    {
      idBDCV,
      idVi: String(idVi),
      idHoaDon: String(idHoaDon),
      trangThai: String(trangThai), // 'pending' | 'done' | 'canceled'
      ngayTao: serverTimestamp(),
    },
    { merge: true }
  );
  return idBDCV;
}

export default function CheckoutResult() {
  const navigate = useNavigate();
  const location = useLocation();

  // UI state
  const [status, setStatus] = useState("processing"); // 'success' | 'fail' | 'error' | 'processing'
  const [summary, setSummary] = useState({
    orderId: "",
    responseCode: "",
    message: "",
    amount: 0,
    paidAt: "",
  });

  const amountText = useMemo(
    () => (summary.amount ? Number(summary.amount).toLocaleString(VN) + " đ" : "—"),
    [summary.amount]
  );

  // Kích hoạt gói cho người dùng (idempotent)
  const ensureKichHoatGoi = async (orderData) => {
    const uid = String(orderData.idNguoiDung || "");
    const idGoi = String(orderData.idGoi || "");
    const thoiHanNgay = Number(orderData.thoiHanNgay || 0);
    if (!uid || !idGoi || thoiHanNgay <= 0) return;

    const qSub = query(
      collection(db, "goiTraPhiCuaNguoiDung"),
      where("idNguoiDung", "==", uid),
      where("idGoi", "==", idGoi),
      limit(50)
    );
    const rs = await getDocs(qSub);
    const now = new Date();

    const hasActiveSamePack = rs.docs.some((d) => {
      const s = d.data();
      const status = s?.status || "";
      const endAt =
        typeof s?.NgayKetThuc?.toDate === "function"
          ? s.NgayKetThuc.toDate()
          : typeof s?.NgayKetThuc === "string"
          ? new Date(s.NgayKetThuc)
          : null;
      return status !== "Đã hủy" && endAt && endAt >= now;
    });

    if (!hasActiveSamePack) {
      await addDoc(collection(db, "goiTraPhiCuaNguoiDung"), {
        idNguoiDung: uid,
        idGoi,
        NgayBatDau: serverTimestamp(),
        NgayKetThuc: addDays(now, thoiHanNgay),
        status: "Đang hoạt động",
      });
    }
  };

  // Cấp quyền vào khóa học (idempotent)
  const ensureCapQuyenVaoLop = async (orderData) => {
    const uid = String(orderData.idNguoiDung || "");
    const idKhoaHoc = String(orderData.idKhoaHoc || "");
    if (!uid || !idKhoaHoc) return;

    const refKH = doc(db, "khoaHoc", idKhoaHoc);
    const khSnap = await getDoc(refKH);
    if (!khSnap.exists()) return;

    await updateDoc(refKH, { thanhVienIds: arrayUnion(uid) });
  };

  // Cộng tiền cho chủ khóa học + log BDCV (idempotent qua cờ trên hóa đơn)
  const creditOwnerWalletOnce = async (orderRef, orderData, paidAmount) => {
    try {
      if (orderData.loaiThanhToan !== "muaKhoaHoc") return;
      const amount = Number(paidAmount || 0);
      if (amount <= 0) return;

      // đọc lại hóa đơn để kiểm tra cờ
      const latest = await getDoc(orderRef);
      const cur = latest.data() || {};
      if (cur.daChiaTienChoChuKhoaHoc === true) return; // đã cộng trước đó

      // lấy chủ khóa học
      const idKhoaHoc = String(orderData.idKhoaHoc || "");
      if (!idKhoaHoc) {
        await updateDoc(orderRef, { daChiaTienChoChuKhoaHoc: false, ghiChuChiaTien: "missing_idKhoaHoc" });
        return;
      }
      const khRef = doc(db, "khoaHoc", idKhoaHoc);
      const khSnap = await getDoc(khRef);
      if (!khSnap.exists()) {
        await updateDoc(orderRef, { daChiaTienChoChuKhoaHoc: false, ghiChuChiaTien: "khoaHoc_not_found" });
        return;
      }
      const ownerId = String(khSnap.data()?.idNguoiDung || "");
      if (!ownerId) {
        await updateDoc(orderRef, { daChiaTienChoChuKhoaHoc: false, ghiChuChiaTien: "owner_not_found" });
        return;
      }

      // 1) Ghi biến động của ví (pending)
      await upsertBDCV({ idVi: ownerId, idHoaDon: orderRef.id, trangThai: "pending" });

      // 2) Cập nhật ví (tự tạo nếu chưa có)
      const viRef = doc(db, "vi", ownerId);
      try {
        await updateDoc(viRef, {
          soDu: increment(amount),
          updatedAt: serverTimestamp(),
        });
      } catch {
        await setDoc(
          viRef,
          {
            idNguoiDung: ownerId,
            soDu: amount,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // 3) Log giao dịch ví (để màn Ví đọc realtime)
      await addDoc(collection(db, "bienDongSoDu"), {
        idVi: ownerId,
        soTien: amount, // dương = cộng
        moTa: `Doanh thu từ hóa đơn ${orderRef.id} (khóa học ${idKhoaHoc})`,
        maThamChieu: orderRef.id,
        loai: "thu_ban_khoa_hoc",
        ngayTao: serverTimestamp(),
      });

      // 4) BDCV = done
      await upsertBDCV({ idVi: ownerId, idHoaDon: orderRef.id, trangThai: "done" });

      // 5) Đặt cờ để không cộng trùng
      await updateDoc(orderRef, { daChiaTienChoChuKhoaHoc: true });
    } catch (e) {
      console.error("creditOwnerWalletOnce error:", e);
      // không throw để không chặn luồng hiển thị
    }
  };

  // Nếu giao dịch failed/canceled → ghi BDCV 'canceled' cho chủ lớp (nếu xác định được)
  const cancelBDCVIfNeeded = async (orderData, orderId) => {
    try {
      if (orderData.loaiThanhToan !== "muaKhoaHoc") return;
      const idKhoaHoc = String(orderData.idKhoaHoc || "");
      if (!idKhoaHoc) return;
      const khSnap = await getDoc(doc(db, "khoaHoc", idKhoaHoc));
      if (!khSnap.exists()) return;
      const ownerId = String(khSnap.data()?.idNguoiDung || "");
      if (!ownerId) return;
      await upsertBDCV({ idVi: ownerId, idHoaDon: orderId, trangThai: "canceled" });
    } catch (e) {
      console.error("cancelBDCVIfNeeded error:", e);
    }
  };

  useEffect(() => {
    (async () => {
      const p = new URLSearchParams(location.search);

      const stateOrderId = location.state?.orderId || "";
      const stateStatus = location.state?.status || ""; // 'success' nếu luồng 0đ đã confirm trước
      const vnpCode = p.get("vnp_ResponseCode");       // "00" = thành công
      const vnpOrder = sanitizeId(p.get("vnp_TxnRef")); // đã sanitize ở bước checkout
      const vnpAmount = Number(p.get("vnp_Amount") || 0) / 100; // VNPay trả *100
      const queryOrder = sanitizeId(p.get("orderId"));

      const orderId = vnpOrder || stateOrderId || queryOrder;

      if (!orderId) {
        setStatus("error");
        setSummary({
          orderId: "",
          responseCode: "",
          message: "Thiếu mã hóa đơn.",
          amount: 0,
          paidAt: "",
        });
        return;
      }

      // --- LẤY HÓA ĐƠN TỪ 'hoaDon' ---
      let orderRef = doc(db, "hoaDon", orderId);
      let snap = await getDoc(orderRef);
      if (!snap.exists()) {
        const qByField = query(
          collection(db, "hoaDon"),
          where("idHoaDon", "==", orderId),
          limit(1)
        );
        const r = await getDocs(qByField);
        if (r.empty) {
          setStatus("error");
          setSummary({
            orderId,
            responseCode: vnpCode || "",
            message: "Không tìm thấy hóa đơn tương ứng.",
            amount: vnpAmount || 0,
            paidAt: "",
          });
          return;
        }
        const found = r.docs[0];
        orderRef = doc(db, "hoaDon", found.id);
        snap = await getDoc(orderRef);
      }

      const o = snap.data() || {};
      const expected = Number(o.soTienThanhToan || 0);
      const alreadyPaid = o.trangThai === "paid";
      const isFree = expected <= 0;

      // Thành công nếu:
      // - VNPay "00" + số tiền khớp, hoặc
      // - Hóa đơn 0đ, hoặc
      // - state.status === 'success'
      const moneyOK = expected > 0 ? vnpAmount === expected : true;
      const treatSuccess =
        (vnpCode === "00" && moneyOK) || isFree || stateStatus === "success";

      if (treatSuccess) {
        // cập nhật hóa đơn thành paid nếu chưa
        if (!alreadyPaid) {
          await updateDoc(orderRef, {
            trangThai: "paid",
            paidAt: serverTimestamp(),
            soTienThanhToanThucTe: isFree ? 0 : vnpAmount,
            kenhThanhToan: isFree ? "MIEN_PHI" : (o.kenhThanhToan || "VNPAY"),
          });
        }

        // Hậu thanh toán theo loại
        try {
          if (o.loaiThanhToan === "nangCapTraPhi") {
            await ensureKichHoatGoi(o);
          } else if (o.loaiThanhToan === "muaKhoaHoc") {
            await ensureCapQuyenVaoLop(o);
            const paidAmount = isFree ? 0 : (vnpAmount || expected);
            await creditOwnerWalletOnce(orderRef, o, paidAmount);
          }
        } catch (e) {
          console.error("Hậu thanh toán thất bại:", e);
        }

        setStatus("success");
        setSummary({
          orderId: orderId,
          responseCode: "00",
          message: isFree
            ? "Giao dịch 0đ — đã kích hoạt quyền."
            : (RESP_TEXT["00"] || "Thanh toán thành công."),
          amount: isFree ? 0 : (vnpAmount || expected),
          paidAt: new Date().toISOString(),
        });
      } else {
        // thất bại/hủy → nếu chưa paid thì chuyển canceled
        if (!alreadyPaid) {
          await updateDoc(orderRef, {
            trangThai: "canceled",
            canceledAt: serverTimestamp(),
          });
        }

        // ghi BDCV 'canceled' cho chủ lớp (nếu là muaKhoaHoc)
        try { await cancelBDCVIfNeeded(o, orderRef.id); } catch {}

        setStatus("fail");
        setSummary({
          orderId,
          responseCode: vnpCode || "",
          message:
            RESP_TEXT[vnpCode || ""] ||
            "Thanh toán không thành công hoặc đã bị hủy.",
          amount: vnpAmount || expected || 0,
          paidAt: "",
        });
      }
    })();
  }, [location]);

  const isSuccess = status === "success";
  const isFail = status === "fail";
  const isError = status === "error";
  const isProcessing = status === "processing";

  return (
    <div className="cr-container">
      <div className="cr-card">
        {/* Header */}
        <div className="cr-header">
          {isProcessing && <h2 className="cr-title">Đang xử lý giao dịch…</h2>}
          {isSuccess && <h2 className="cr-title cr-title--success">Thanh toán thành công</h2>}
          {isFail && <h2 className="cr-title cr-title--fail">Thanh toán không thành công</h2>}
          {isError && <h2 className="cr-title cr-title--fail">Có lỗi xảy ra</h2>}
        </div>

        {/* Details */}
        {!isProcessing && (
          <div className="cr-details">
            <div className="cr-label">Mã hóa đơn</div>
            <div className="cr-value"><strong>{summary.orderId || "—"}</strong></div>

            <div className="cr-label">Số tiền</div>
            <div className="cr-value">{amountText}</div>

            <div className="cr-label">Lý do</div>
            <div className="cr-value">{summary.message || "—"}</div>

            {summary.paidAt ? (
              <>
                <div className="cr-label">Thời gian</div>
                <div className="cr-value">{toVN(summary.paidAt)}</div>
              </>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div className="cr-actions">
          <Button variant="secondary" onClick={() => navigate("/trangchu")}>
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
