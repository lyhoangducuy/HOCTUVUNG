import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/inputs/Button";
import "./checkout.css";

const VN = "vi-VN";
const toVN = (date) => new Date(date).toLocaleDateString(VN);

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
      const cleaned = safeId(found.idDonHang);
      const idx = orders.findIndex((o) => o.idDonHang === found.idDonHang);
      found = { ...found, idDonHang: cleaned };
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
          // bankCode: "VNBANK", // tùy chọn
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
    <div className="checkout-container">
      <div className="back" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        <span>Quay lại</span>
      </div>

      <h2 className="checkout-title">Checkout</h2>

      <div className="checkout-card">
        <div className="row">
          <span className="label">Gói:</span>
          <span className="value">{order.tenGoi}</span>
        </div>

        <div className="row">
          <span className="label">Thời hạn:</span>
          <span className="value">{order.thoiHanNgay} ngày</span>
        </div>

        <div className="row">
          <span className="label">Thanh toán:</span>
          <span className="value">
            {priceText}
            {order.giamGia > 0 && (
              <small className="muted"> (đã áp dụng -{order.giamGia}%)</small>
            )}
          </span>
        </div>

        <div className="row">
          <span className="label">Mã đơn:</span>
          <span className="value code">{order.idDonHang}</span>
        </div>

        <div className="row">
          <span className="label">Trạng thái:</span>
          <span className="value status">
            {order.trangThai === "pending" ? "Đang chờ" :
             order.trangThai === "paid" ? "Đã thanh toán" : "Đã hủy"}
          </span>
        </div>

        <div className="checkout-actions">
          <Button onClick={payWithVNPay} disabled={paying}>
            {paying ? "Đang chuyển tới VNPay..." : "Thanh toán"}
          </Button>
        </div>
      </div>
    </div>
  );
}
