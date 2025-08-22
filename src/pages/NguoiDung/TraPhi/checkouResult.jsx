import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const VN = "vi-VN";
const toVN = (date) => new Date(date).toLocaleDateString(VN);
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};

// (tuỳ chọn) map mã phản hồi VNPay -> thông báo dễ đọc
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

  useEffect(() => {
    // Lấy tham số VNPay trả về trên URL
    const p = new URLSearchParams(window.location.search);
    const responseCode = p.get("vnp_ResponseCode"); // "00" = thành công
    const orderId = p.get("vnp_TxnRef");            // chính là id đơn bạn đã gửi
    const amount = Number(p.get("vnp_Amount") || 0) / 100; // VNPay trả *100
    // (tuỳ chọn) nếu cần xem thêm:
    // const bankCode = p.get("vnp_BankCode");
    // const bankTranNo = p.get("vnp_BankTranNo");
    // const payDate = p.get("vnp_PayDate");

    if (!orderId) {
      alert("Thiếu mã đơn hàng (vnp_TxnRef).");
      navigate("/traphi");
      return;
    }

    // Tải danh sách đơn trong localStorage
    const orders = JSON.parse(localStorage.getItem("donHangTraPhi") || "[]");
    const idx = orders.findIndex((o) => String(o.idDonHang) === String(orderId));

    if (idx === -1) {
      alert("Không tìm thấy đơn hàng tương ứng.");
      navigate("/traphi");
      return;
    }

    // (khuyến nghị) so khớp số tiền để tránh tamper
    const expected = Number(orders[idx].soTienThanhToan || 0);
    const moneyOK = expected > 0 ? amount === expected : true;

    if (responseCode === "00" && moneyOK) {
      // Cập nhật đơn "paid"
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
        const sub = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
        const now = new Date();
        const end = addDays(now, orders[idx].thoiHanNgay);
        sub.push({
          idGTPCND: `SUB_${Date.now()}`,
          idNguoiDung: currentUser.idNguoiDung,
          idGoi: orders[idx].idGoi,
          NgayBatDau: toVN(now),
          NgayKetThuc: toVN(end),
          status: "Đang hoạt động",
        });
        localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(sub));
      }

      window.dispatchEvent(new Event("subscriptionChanged"));
      alert(RESP_TEXT["00"] || "Thanh toán VNPay thành công. Gói đã kích hoạt.");
    } else {
      // Coi là thất bại / huỷ
      orders[idx] = {
        ...orders[idx],
        trangThai: "canceled",
        canceledAt: new Date().toISOString(),
      };
      localStorage.setItem("donHangTraPhi", JSON.stringify(orders));

      const msg =
        RESP_TEXT[responseCode || ""] ||
        "Thanh toán không thành công hoặc bị hủy.";
      alert(msg);
    }

    // Quay lại trang Trả phí
    navigate("/traphi");
  }, [navigate]);

  // Không cần UI, auto xử lý & chuyển trang
  return null;
}
