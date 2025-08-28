// src/pages/Admin/ThanhToan/Checkout.jsx
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
  arrayUnion,
} from "firebase/firestore";

const VN = "vi-VN";
const safeId = (s) => String(s).replace(/[^0-9a-zA-Z_-]/g, "").slice(0, 34);

// ===== Phân loại hóa đơn theo loại thanh toán =====
const isMuaKhoaHoc = (o) => {
  const t = (o?.loaiThanhToan || "").toLowerCase();
  if (t === "muakhoahoc") return true;
  // fallback schema cũ:
  return (o?.loaiDon || "").toUpperCase() === "JOIN_CLASS";
};

const isNangCapTraPhi = (o) => {
  const t = (o?.loaiThanhToan || "").toLowerCase();
  if (t === "nangcaptraphi") return true;
  const ld = (o?.loaiDon || "").toUpperCase();
  return ld === "UPGRADE" || ld === "NANG_CAP";
};

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [order, setOrder] = useState(null);
  const [paying, setPaying] = useState(false);

  // chống chạy lặp
  const autoHandledRef = useRef(false);
  const paidHandledRef = useRef(false);

  // Lấy uid (Auth hoặc session)
  useEffect(() => {
    try {
      const sessionUser = JSON.parse(sessionStorage.getItem("session") || "null");
      const _uid = auth.currentUser?.uid || sessionUser?.idNguoiDung || null;
      if (!_uid) {
        alert("Vui lòng đăng nhập.");
        navigate("/dang-nhap");
        return;
      }
      setUid(String(_uid));
    } catch {
      alert("Vui lòng đăng nhập.");
      navigate("/dang-nhap");
    }
  }, [navigate]);

  // ===== Hậu thanh toán theo loại đơn =====
  const capQuyenVaoLop = async (_order) => {
    try {
      if (!_order || !uid || !_order.idKhoaHoc) return;
      const refKH = doc(db, "khoaHoc", String(_order.idKhoaHoc));
      await updateDoc(refKH, { thanhVienIds: arrayUnion(String(uid)) });
    } catch (e) {
      console.error("Cấp quyền vào lớp thất bại:", e);
    }
  };

  const capQuyenNangCap = async (_order) => {
    try {
      if (!uid) return;
      // tuỳ hệ thống: có thể set cờ vào 'nguoiDung' hoặc collection 'goiTraPhiCuaNguoiDung'… 
      // Ở đây chỉ đặt cờ đơn giản trên hồ sơ:
      const refUser = doc(db, "nguoiDung", String(uid));
      await updateDoc(refUser, {
        daNangCapTraPhi: true,
        nangCapAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Cập nhật nâng cấp trả phí thất bại:", e);
    }
  };

  const handleAfterPaid = async (_order) => {
    if (isMuaKhoaHoc(_order)) {
      await capQuyenVaoLop(_order);
    } else if (isNangCapTraPhi(_order)) {
      await capQuyenNangCap(_order);
    }
  };

  // ==== Nạp hóa đơn: ưu tiên orderId từ URL, rồi state, rồi fallback pending mới nhất ====
  useEffect(() => {
    if (!uid) return;

    let unsub = null;

    (async () => {
      const urlOrderId = new URLSearchParams(location.search).get("orderId");
      const stateOrderId = location?.state?.orderId;

      // Gắn listener cho 1 doc trong 'hoaDon'
      const listenInvoiceDoc = async (docId) => {
        const ref = doc(db, "hoaDon", docId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return false;

        // Đồng bộ idHoaDon = doc.id (để VNPay dùng ổn định)
        const cur = snap.data()?.idHoaDon || snap.data()?.idDonHang;
        if (cur !== snap.id) {
          try {
            await updateDoc(ref, { idHoaDon: snap.id });
          } catch {}
        }

        unsub = onSnapshot(ref, (d) => {
          if (!d.exists()) return;
          const data = d.data() || {};
          setOrder({
            ...data,
            idHoaDon: data.idHoaDon || data.idDonHang || d.id,
            _docId: d.id,
          });
        });
        return true;
      };

      // 1) Nếu có orderId trên URL → thử trước
      if (urlOrderId) {
        const ok = await listenInvoiceDoc(String(urlOrderId));
        if (ok) return;
      }

      // 2) Nếu có orderId trên state → thử tiếp
      if (stateOrderId) {
        const ok = await listenInvoiceDoc(String(stateOrderId));
        if (ok) return;
      }

      // 3) Fallback: lấy pending mới nhất của user
      try {
        const qPending = query(
          collection(db, "hoaDon"),
          where("idNguoiDung", "==", String(uid)),
          where("trangThai", "==", "pending"),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const rs = await getDocs(qPending);
        const first = rs.docs[0];
        if (!first) {
          alert("Không tìm thấy hóa đơn đang chờ thanh toán.");
          navigate("/tra-phi");
          return;
        }
        await listenInvoiceDoc(first.id);
      } catch (e) {
        // thiếu composite index → fallback: lọc client
        if (e?.code === "failed-precondition") {
          console.warn("Thiếu composite index (idNguoiDung, trangThai, createdAt). Dùng fallback client.");
          const qLite = query(
            collection(db, "hoaDon"),
            where("idNguoiDung", "==", String(uid)),
            limit(50)
          );
          const rs2 = await getDocs(qLite);
          const docs = rs2.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((x) => x.trangThai === "pending")
            .sort((a, b) => {
              const ta = a?.createdAt?.seconds || 0;
              const tb = b?.createdAt?.seconds || 0;
              return tb - ta; // mới → cũ
            });
          const first = docs[0];
          if (!first) {
            alert("Không tìm thấy hóa đơn đang chờ thanh toán.");
            navigate("/tra-phi");
            return;
          }
          await listenInvoiceDoc(first.id);
        } else {
          console.error("Lỗi tải hóa đơn:", e);
          alert("Không thể tải hóa đơn. Vui lòng thử lại.");
          navigate("/tra-phi");
        }
      }
    })();

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [uid, location, navigate]);

  // Tự xác nhận hóa đơn 0đ
  useEffect(() => {
    const autoCompleteZeroOrder = async () => {
      if (!order || autoHandledRef.current) return;

      const amount = Number(order.soTienThanhToan || 0);
      if (amount > 0) return;

      if (order.trangThai === "paid") {
        autoHandledRef.current = true;
        try { await handleAfterPaid(order); } catch {}
        navigate("/checkout/result", {
          state: { orderId: order.idHoaDon || order._docId, status: "success" },
          replace: true,
        });
        return;
      }

      try {
        autoHandledRef.current = true;
        setPaying(true);
        const ref = doc(db, "hoaDon", order._docId);
        await updateDoc(ref, {
          trangThai: "paid",
          kenhThanhToan: "MIEN_PHI",
          soTienThanhToanThucTe: 0,
          paidAt: serverTimestamp(),
        });

        try { await handleAfterPaid(order); } catch {}

        navigate("/checkout/result", {
          state: { orderId: order.idHoaDon || order._docId, status: "success" },
          replace: true,
        });
      } catch (e) {
        console.error("Xác nhận hóa đơn 0đ thất bại:", e);
        setPaying(false);
        autoHandledRef.current = false;
        alert("Không thể xác nhận hóa đơn 0đ.");
      }
    };

    autoCompleteZeroOrder();
  }, [order, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Điều hướng khi thấy trạng thái 'paid' qua onSnapshot
  useEffect(() => {
    const handlePaid = async () => {
      if (!order || paidHandledRef.current) return;
      if (order.trangThai !== "paid") return;

      paidHandledRef.current = true;
      try { await handleAfterPaid(order); } catch {}
      navigate("/checkout/result", {
        state: { orderId: order.idHoaDon || order._docId, status: "success" },
        replace: true,
      });
    };
    handlePaid();
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
      if (amount <= 0) {
        const ref = doc(db, "hoaDon", order._docId);
        await updateDoc(ref, {
          trangThai: "paid",
          kenhThanhToan: "MIEN_PHI",
          soTienThanhToanThucTe: 0,
          paidAt: serverTimestamp(),
        });

        try { await handleAfterPaid(order); } catch {}

        navigate("/checkout/result", {
          state: { orderId: order.idHoaDon || order._docId, status: "success" },
          replace: true,
        });
        return;
      }

      // vnp_TxnRef dùng idHoaDon (đã đồng bộ = doc.id)
      const idForVNP = safeId(order.idHoaDon || order._docId);

      const resp = await fetch("http://localhost:3001/create_payment_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,            // VND; backend sẽ *100
          orderId: idForVNP, // vnp_TxnRef
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
          <span className="label">Mã hóa đơn:</span>
          <span className="value code">{order.idHoaDon || order._docId}</span>
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
