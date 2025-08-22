import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";

const VN = "vi-VN";
const toVN = (date) => new Date(date).toLocaleDateString(VN);
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};

// (khuyến nghị) làm sạch orderId để khớp vnp_TxnRef
const safeId = (s) => String(s).replace(/[^0-9a-zA-Z_-]/g, "").slice(0, 34);

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const sessionUser = JSON.parse(sessionStorage.getItem("session") || "null");
    if (!sessionUser) {
      alert("Vui lòng đăng nhập.");
      navigate("/");
      return;
    }
    setCurrentUser(sessionUser);

    const stateOrderId = location?.state?.orderId;
    const orders = JSON.parse(localStorage.getItem("donHangTraPhi") || "[]") || [];

    let found = null;
    if (stateOrderId) {
      found = orders.find((o) => o.idDonHang === stateOrderId) || null;
    }
    if (!found) {
      const minePending = orders
        .filter((o) => o.idNguoiDung === sessionUser.idNguoiDung && o.trangThai === "pending")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      found = minePending[0] || null;
    }

    if (!found) {
      alert("Không tìm thấy đơn hàng thanh toán.");
      navigate("/traphi");
      return;
    }

    // đảm bảo idDonHang an toàn trước khi gửi cho VNPay
    if (found.idDonHang !== safeId(found.idDonHang)) {
      found.idDonHang = safeId(found.idDonHang);
      const idx = orders.findIndex((o) => o.idDonHang === stateOrderId);
      if (idx !== -1) {
        orders[idx] = found;
        localStorage.setItem("donHangTraPhi", JSON.stringify(orders));
      }
    }

    setOrder(found);
  }, [location, navigate]);

  const priceText = useMemo(() => {
    if (!order) return "";
    return Number(order.soTienThanhToan || 0).toLocaleString(VN) + " đ";
  }, [order]);

  const payWithVNPay = async () => {
    if (!order || paying) return;
    try {
      setPaying(true);
      const resp = await fetch("http://localhost:3001/create_payment_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(order.soTienThanhToan), // VND; backend sẽ *100
          orderId: order.idDonHang,              // vnp_TxnRef
          // bankCode: "VNBANK",                  // tùy chọn
        }),
      });
      const data = await resp.json();
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setPaying(false);
        alert("Không tạo được liên kết thanh toán.");
      }
    } catch (e) {
      console.error(e);
      setPaying(false);
      alert("Lỗi tạo thanh toán VNPay.");
    }
  };

  if (!order) return null;

  return (
    <div style={{ maxWidth: 720, margin: "30px auto", padding: 16 }}>
      <h2>Checkout</h2>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Gói:</strong> {order.tenGoi}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Thời hạn:</strong> {order.thoiHanNgay} ngày
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Thanh toán:</strong> {priceText}
          {order.giamGia > 0 ? (
            <small style={{ marginLeft: 8, opacity: 0.8 }}>(đã áp dụng -{order.giamGia}%)</small>
          ) : null}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Mã đơn:</strong> {order.idDonHang}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Trạng thái:</strong> {order.trangThai}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button onClick={payWithVNPay} disabled={paying}>
            {paying ? "Đang chuyển tới VNPay..." : "Thanh toán VNPay"}
          </Button>

          {/* Giữ nút mock nếu muốn test nhanh offline */}
          {/* <Button onClick={handleMockPaySuccess}>Giả lập thanh toán thành công</Button>
          <Button variant="cancel" onClick={handleMockPayFail}>Giả lập thất bại / Hủy</Button> */}

          <Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Sau khi thanh toán xong, VNPay sẽ chuyển bạn về <code>/checkout/result</code>.
      </p>
    </div>
  );
}
