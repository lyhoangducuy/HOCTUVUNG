import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";

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

  // Format số tiền đẹp hơn
  const amountText = useMemo(
    () => (summary.amount ? Number(summary.amount).toLocaleString(VN) + " đ" : "—"),
    [summary.amount]
  );

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const responseCode = p.get("vnp_ResponseCode"); // "00" = thành công
    const orderId = p.get("vnp_TxnRef");            // id đơn
    const amount = Number(p.get("vnp_Amount") || 0) / 100; // VNPay trả *100

    // Thiếu mã đơn: hiển thị lỗi
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

    // Lấy đơn trong localStorage
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

    // So khớp số tiền (khuyến nghị)
    const expected = Number(orders[idx].soTienThanhToan || 0);
    const moneyOK = expected > 0 ? amount === expected : true;

    // Idempotency: nếu đã paid/canceled rồi thì không tạo lại subscription
    const alreadyPaid = orders[idx].trangThai === "paid";

    if (responseCode === "00" && moneyOK) {
      // Chỉ cập nhật nếu chưa paid
      if (!alreadyPaid) {
        orders[idx] = {
          ...orders[idx],
          trangThai: "paid",
          paidAt: new Date().toISOString(),
          soTienThanhToanThucTe: amount,
        };
        localStorage.setItem("donHangTraPhi", JSON.stringify(orders));

        // Kích hoạt gói (subscription)
        const currentUser = JSON.parse(sessionStorage.getItem("session") || "null");
        if (currentUser) {
          const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
          const now = new Date();
          const end = addDays(now, orders[idx].thoiHanNgay);
          // Tránh tạo trùng sub cơ bản: kiểm tra đã có sub active cùng user + gói chưa
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
        // thông báo UI khác có thể lắng nghe
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
      // Cập nhật canceled (trừ khi đã paid trước đó)
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

  // UI hiển thị theo trạng thái
  const isSuccess = status === "success";
  const isFail = status === "fail";
  const isError = status === "error";
  const isProcessing = status === "processing";

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          {isProcessing && <h2>Đang xử lý giao dịch…</h2>}
          {isSuccess && <h2 style={{ color: "#059669" }}>Thanh toán thành công</h2>}
          {isFail && <h2 style={{ color: "#dc2626" }}>Thanh toán không thành công</h2>}
          {isError && <h2 style={{ color: "#dc2626" }}>Có lỗi xảy ra</h2>}

          {!isProcessing && (
            <p style={{ marginTop: 8, opacity: 0.85 }}>{summary.message}</p>
          )}
        </div>

        {/* Details */}
        {!isProcessing && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              rowGap: 8,
              columnGap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ opacity: 0.7 }}>Mã đơn</div>
            <div><strong>{summary.orderId || "—"}</strong></div>

            <div style={{ opacity: 0.7 }}>Số tiền</div>
            <div>{amountText}</div>

            <div style={{ opacity: 0.7 }}>Mã phản hồi</div>
            <div>{summary.responseCode || "—"}</div>

            {summary.paidAt ? (
              <>
                <div style={{ opacity: 0.7 }}>Thời gian</div>
                <div>{toVN(summary.paidAt)}</div>
              </>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/trangchu")}>Về trang chủ</Button>
          <Button variant="secondary" onClick={() => navigate("/tra-phi")}>
            Về gói trả phí
          </Button>
        </div>
      </div>
    </div>
  );
}
