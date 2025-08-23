import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./CheckoutResult.css";

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

export default function checkoutResult() {
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
    const p = new URLSearchParams(window.location.search);
    const responseCode = p.get("vnp_ResponseCode"); // "00" = thành công
    const orderId = p.get("vnp_TxnRef");            // id đơn
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

    const orders = JSON.parse(localStorage.getItem("donHangTraPhi") || "[]");
    const idx = orders.findIndex((o) => String(o.idDonHang) === String(orderId));

    if (idx === -1) {
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

    const expected = Number(orders[idx].soTienThanhToan || 0);
    const moneyOK = expected > 0 ? amount === expected : true;

    const alreadyPaid = orders[idx].trangThai === "paid";

    if (responseCode === "00" && moneyOK) {
      if (!alreadyPaid) {
        orders[idx] = {
          ...orders[idx],
          trangThai: "paid",
          paidAt: new Date().toISOString(),
          soTienThanhToanThucTe: amount,
        };
        localStorage.setItem("donHangTraPhi", JSON.stringify(orders));

        const currentUser = JSON.parse(sessionStorage.getItem("session") || "null");
        if (currentUser) {
          const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
          const now = new Date();
          const end = addDays(now, orders[idx].thoiHanNgay);
          const hasSameActive = subs.some(
            (s) =>
              s.idNguoiDung === currentUser.idNguoiDung &&
              s.idGoi === orders[idx].idGoi &&
              s.status === "Đang hoạt động"
          );
          if (!hasSameActive) {
            subs.push({
              idGTPCND: `SUB_${Date.now()}`,
              idNguoiDung: currentUser.idNguoiDung,
              idGoi: orders[idx].idGoi,
              NgayBatDau: toVN(now),
              NgayKetThuc: toVN(end),
              status: "Đang hoạt động",
            });
            localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(subs));
          }
        }
        window.dispatchEvent(new Event("subscriptionChanged"));
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
      if (!alreadyPaid) {
        orders[idx] = {
          ...orders[idx],
          trangThai: "canceled",
          canceledAt: new Date().toISOString(),
        };
        localStorage.setItem("donHangTraPhi", JSON.stringify(orders));
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
          <Button variant="secondary" onClick={() => navigate("/trangchu")}>Quay lại trang chủ</Button>
          <Button variant="secondary" onClick={() => navigate("/tra-phi")}>
            Mua gói trả phí mới
          </Button>
        </div>
      </div>
    </div>
  );
}
