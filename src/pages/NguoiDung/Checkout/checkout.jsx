// src/pages/Admin/ThanhToan/Checkout.jsx (đường dẫn của bạn)
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/inputs/Button";
import "./checkout.css";

import { auth, db } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const VN = "vi-VN";
const toVN = (date) => new Date(date).toLocaleDateString(VN);

// Làm sạch id để dùng với vnp_TxnRef
const safeId = (s) => String(s).replace(/[^0-9a-zA-Z_-]/g, "").slice(0, 34);

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [order, setOrder] = useState(null);
  const [paying, setPaying] = useState(false);

  // chống chạy lặp (auto xử lý đơn 0đ chỉ chạy 1 lần)
  const autoHandledRef = useRef(false);

  // Lấy uid (ưu tiên Firebase Auth, fallback session)
  useEffect(() => {
    const sessionUser = JSON.parse(sessionStorage.getItem("session") || "null");
    const _uid = auth.currentUser?.uid || sessionUser?.idNguoiDung || null;
    if (!_uid) {
      alert("Vui lòng đăng nhập.");
      navigate("/dang-nhap");
      return;
    }
    setUid(String(_uid));
  }, [navigate]);

  // Nạp đơn hàng: ưu tiên orderId từ location.state, fallback pending mới nhất
  useEffect(() => {
    if (!uid) return;

    let unsub = null;

    (async () => {
      const stateOrderId = location?.state?.orderId;

      // helper: attach listener cho 1 doc đơn
      const listenOrderDoc = async (docId) => {
        const ref = doc(db, "donHangTraPhi", docId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return false;

        // Đảm bảo idDonHang an toàn: ưu tiên dùng doc id (đã an toàn)
        const cur = snap.data()?.idDonHang;
        if (cur !== snap.id) {
          try {
            await updateDoc(ref, { idDonHang: snap.id });
          } catch {}
        }

        unsub = onSnapshot(ref, (d) => {
          if (!d.exists()) return;
          const data = d.data();
          setOrder({
            ...data,
            idDonHang: data.idDonHang || d.id, // dùng trường, fallback doc id
            _docId: d.id,
          });
        });
        return true;
      };

      // 1) Nếu có orderId → thử doc đó
      if (stateOrderId) {
        const ok = await listenOrderDoc(String(stateOrderId));
        if (ok) return;
      }

      // 2) Không có / không tìm thấy → lấy pending mới nhất của user
      const qPending = query(
        collection(db, "donHangTraPhi"),
        where("idNguoiDung", "==", String(uid)),
        where("trangThai", "==", "pending"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const rs = await getDocs(qPending);
      const first = rs.docs[0];
      if (!first) {
        alert("Không tìm thấy đơn hàng thanh toán.");
        navigate("/tra-phi");
        return;
      }
      await listenOrderDoc(first.id);
    })();

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [uid, location, navigate]);

  // Nếu số tiền = 0đ → tự xác nhận thành công và đi tới checkoutResult
  useEffect(() => {
    const autoCompleteZeroOrder = async () => {
      if (!order || autoHandledRef.current) return;

      const amount = Number(order.soTienThanhToan || 0);
      if (amount > 0) return; // chỉ xử lý đơn 0đ

      // Đơn đã paid thì thôi
      if (order.trangThai === "paid") {
        autoHandledRef.current = true;
        navigate("/checkout/result", {
          state: { orderId: order.idDonHang || order._docId, status: "success" },
          replace: true,
        });
        return;
      }

      try {
        autoHandledRef.current = true;
        setPaying(true);
        const ref = doc(db, "donHangTraPhi", order._docId);
        await updateDoc(ref, {
          trangThai: "paid",
          kenhThanhToan: "MIEN_PHI", // ghi chú kênh thanh toán 0đ
          soTienThanhToanThucTe: 0,
          paidAt: serverTimestamp(),
        });

        navigate("/checkout/result", {
          state: { orderId: order.idDonHang || order._docId, status: "success" },
          replace: true,
        });
      } catch (e) {
        console.error("Xác nhận đơn 0đ thất bại:", e);
        setPaying(false);
        autoHandledRef.current = false; // cho phép thử lại nếu cần
        alert("Không thể xác nhận đơn 0đ.");
      }
    };

    autoCompleteZeroOrder();
  }, [order, navigate]);

  const priceText = useMemo(() => {
    if (!order) return "";
    return Number(order.soTienThanhToan || 0).toLocaleString(VN) + " đ";
  }, [order]);

  const payWithVNPay = async () => {
    if (!order || paying) return;
    try {
      setPaying(true);

      const amount = Number(order.soTienThanhToan || 0);
      // Trường hợp 0đ: phòng hờ nếu user bấm nút (dù đã auto xử lý ở useEffect)
      if (amount <= 0) {
        const ref = doc(db, "donHangTraPhi", order._docId);
        await updateDoc(ref, {
          trangThai: "paid",
          kenhThanhToan: "MIEN_PHI",
          soTienThanhToanThucTe: 0,
          paidAt: serverTimestamp(),
        });
        navigate("/checkout/result", {
          state: { orderId: order.idDonHang || order._docId, status: "success" },
          replace: true,
        });
        return;
      }

      // bảo đảm idDonHang an toàn (đã sync với doc id ở trên, nhưng ta vẫn sanitize lần cuối)
      const idForVNP = safeId(order.idDonHang || order._docId);

      const resp = await fetch("http://localhost:3001/create_payment_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,           // VND; backend sẽ *100
          orderId: idForVNP,        // vnp_TxnRef
          // bankCode: "VNBANK",
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

  const isZero = Number(order.soTienThanhToan || 0) <= 0;
  const isPaid = order.trangThai === "paid";

  return (
    <>
      <div className="back" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        <span>Quay lại</span>
      </div>

      <h2 className="checkout-title">Thanh toán</h2>

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
            {Number(order.giamGia || 0) > 0 && (
              <small className="muted"> (đã áp dụng -{order.giamGia}%)</small>
            )}
          </span>
        </div>

        <div className="row">
          <span className="label">Mã đơn:</span>
          <span className="value code">{order.idDonHang || order._docId}</span>
        </div>

        <div className="row">
          <span className="label">Trạng thái:</span>
          <span className="value status">
            {order.trangThai === "pending"
              ? "Đang chờ"
              : order.trangThai === "paid"
              ? "Đã thanh toán"
              : "Đã hủy"}
          </span>
        </div>

        {/* Nút hành động:
            - Ẩn khi 0đ (đã auto xử lý) hoặc đã paid
            - Hiện khi cần thanh toán VNPay */}
        {!isZero && !isPaid && (
          <div className="checkout-actions">
            <Button onClick={payWithVNPay} disabled={paying}>
              {paying ? "Đang chuyển tới VNPay..." : "Thanh toán"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
