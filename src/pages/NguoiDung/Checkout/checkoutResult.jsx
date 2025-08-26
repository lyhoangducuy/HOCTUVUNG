import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "firebase/firestore";

const VN = "vi-VN";
const toVN = (date) => new Date(date).toLocaleDateString(VN);
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};

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

  useEffect(() => {
    (async () => {
      const p = new URLSearchParams(window.location.search);
      const responseCode = p.get("vnp_ResponseCode"); // "00" = thành công
      const orderId = (p.get("vnp_TxnRef") || "").replace(/[^0-9a-zA-Z_-]/g, ""); // doc id đã được sanitize ở bước checkout
      const amount = Number(p.get("vnp_Amount") || 0) / 100; // VNPay trả *100

      if (!orderId) {
        setStatus("error");
        setSummary({
          orderId: "",
          responseCode: "",
          message: "Thiếu mã đơn hàng (vnp_TxnRef).",
          amount: 0,
          paidAt: "",
        });
        return;
      }

      // Lấy đơn theo doc id
      const orderRef = doc(db, "donHangTraPhi", orderId);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) {
        setStatus("error");
        setSummary({
          orderId,
          responseCode: responseCode || "",
          message: "Không tìm thấy đơn hàng tương ứng.",
          amount,
          paidAt: "",
        });
        return;
      }

      const o = snap.data();
      const expected = Number(o.soTienThanhToan || 0);
      const moneyOK = expected > 0 ? amount === expected : true;
      const alreadyPaid = o.trangThai === "paid";

      if (responseCode === "00" && moneyOK) {
        // cập nhật đơn thành paid (nếu chưa)
        if (!alreadyPaid) {
          await updateDoc(orderRef, {
            trangThai: "paid",
            paidAt: serverTimestamp(),
            soTienThanhToanThucTe: amount,
          });

          // Kích hoạt/ghi nhận gói cho người dùng
          try {
            const uid = String(o.idNguoiDung);
            const idGoi = String(o.idGoi);
            const thoiHanNgay = Number(o.thoiHanNgay || 0);

            // kiểm tra có sub cùng gói còn hiệu lực không (status !== "Đã hủy" và chưa hết hạn)
            const qSub = query(
              collection(db, "goiTraPhiCuaNguoiDung"),
              where("idNguoiDung", "==", uid),
              where("idGoi", "==", idGoi)
            );
            const rs = await getDocs(qSub);
            const now = new Date();
            const end = addDays(now, thoiHanNgay);

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
                NgayKetThuc: end, // Firestore auto lưu dạng Timestamp
                status: "Đang hoạt động",
              });
            }
          } catch (e) {
            // Không chặn hiển thị thành công nếu tạo sub thất bại, có thể xử lý lại về sau
            console.error("Kích hoạt gói thất bại:", e);
          }
        }

        setStatus("success");
        setSummary({
          orderId,
          responseCode: "00",
          message: RESP_TEXT["00"] || "Thanh toán thành công. Gói đã kích hoạt.",
          amount,
          paidAt: new Date().toISOString(),
        });
      } else {
        // thất bại/hủy → cập nhật canceled nếu chưa paid
        if (!alreadyPaid) {
          await updateDoc(orderRef, {
            trangThai: "canceled",
            canceledAt: serverTimestamp(),
          });
        }

        setStatus("fail");
        setSummary({
          orderId,
          responseCode: responseCode || "",
          message:
            RESP_TEXT[responseCode || ""] ||
            "Thanh toán không thành công hoặc đã bị hủy.",
          amount,
          paidAt: "",
        });
      }
    })();
  }, []);

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
