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

  // Kích hoạt gói cho người dùng (an toàn chạy nhiều lần)
  const ensureKichHoatGoi = async (orderData) => {
    const uid = String(orderData.idNguoiDung);
    const idGoi = String(orderData.idGoi);
    const thoiHanNgay = Number(orderData.thoiHanNgay || 0);

    if (!uid || !idGoi) return;

    // kiểm tra có sub cùng gói còn hiệu lực không
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
          : (typeof s?.NgayKetThuc === "string" ? new Date(s.NgayKetThuc) : null);
      return status !== "Đã hủy" && endAt && endAt >= now;
    });

    if (!hasActiveSamePack) {
      await addDoc(collection(db, "goiTraPhiCuaNguoiDung"), {
        idNguoiDung: uid,
        idGoi,
        NgayBatDau: serverTimestamp(),
        NgayKetThuc: addDays(now, thoiHanNgay), // Date -> Firestore sẽ lưu Timestamp
        status: "Đang hoạt động",
      });
    }
  };

  useEffect(() => {
    (async () => {
      const p = new URLSearchParams(location.search);
      const stateOrderId = location.state?.orderId || "";
      const stateStatus = location.state?.status || ""; // 'success' khi luồng 0đ điều hướng sang
      const vnpCode = p.get("vnp_ResponseCode");       // "00" = thành công
      const vnpOrder = sanitizeId(p.get("vnp_TxnRef")); // doc id đã được sanitize ở bước checkout
      const vnpAmount = Number(p.get("vnp_Amount") || 0) / 100; // VNPay trả *100
      const queryOrder = sanitizeId(p.get("orderId"));

      const orderId = vnpOrder || stateOrderId || queryOrder;

      if (!orderId) {
        setStatus("error");
        setSummary({
          orderId: "",
          responseCode: "",
          message: "Thiếu mã đơn hàng.",
          amount: 0,
          paidAt: "",
        });
        return;
      }

      // Lấy đơn theo doc id; nếu không có thử theo field idDonHang
      let orderRef = doc(db, "donHangTraPhi", orderId);
      let snap = await getDoc(orderRef);
      if (!snap.exists()) {
        const qByField = query(
          collection(db, "donHangTraPhi"),
          where("idDonHang", "==", orderId),
          limit(1)
        );
        const r = await getDocs(qByField);
        if (r.empty) {
          setStatus("error");
          setSummary({
            orderId,
            responseCode: vnpCode || "",
            message: "Không tìm thấy đơn hàng tương ứng.",
            amount: vnpAmount || 0,
            paidAt: "",
          });
          return;
        }
        const found = r.docs[0];
        orderRef = doc(db, "donHangTraPhi", found.id);
        snap = await getDoc(orderRef);
      }

      const o = snap.data();
      const expected = Number(o.soTienThanhToan || 0);
      const alreadyPaid = o.trangThai === "paid";
      const isFree = expected <= 0;

      // Quyết định thành công:
      // - Có VNPay & mã "00" + số tiền khớp
      // - Hoặc luồng 0đ (isFree)
      // - Hoặc state.status === 'success' (điều hướng nội bộ)
      const moneyOK = expected > 0 ? vnpAmount === expected : true;
      const treatSuccess =
        (vnpCode === "00" && moneyOK) || isFree || stateStatus === "success";

      if (treatSuccess) {
        // cập nhật đơn thành paid nếu chưa
        if (!alreadyPaid) {
          await updateDoc(orderRef, {
            trangThai: "paid",
            paidAt: serverTimestamp(),
            soTienThanhToanThucTe: isFree ? 0 : vnpAmount,
            kenhThanhToan: isFree ? "MIEN_PHI" : (o.kenhThanhToan || "VNPAY"),
          });
        }

        // luôn đảm bảo kích hoạt gói (kể cả đã paid trước đó)
        try {
          await ensureKichHoatGoi(o);
        } catch (e) {
          console.error("Kích hoạt gói thất bại:", e);
          // không chặn thông báo thành công
        }

        setStatus("success");
        setSummary({
          orderId: orderId,
          responseCode: "00",
          message: isFree
            ? "Giao dịch 0đ — gói đã được kích hoạt."
            : (RESP_TEXT["00"] || "Thanh toán thành công. Gói đã kích hoạt."),
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
            <div className="cr-label">Mã đơn</div>
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
          <Button variant="secondary" onClick={() => navigate("/tra-phi")}>
            Mua gói trả phí mới
          </Button>
        </div>
      </div>
    </div>
  );
}
