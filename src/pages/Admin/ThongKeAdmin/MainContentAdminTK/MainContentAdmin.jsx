// src/pages/Admin/ThongKeAdmin/MainContent.jsx
import { useEffect, useState } from "react";
import TopContent from "./TopContentAdmin";
import AISummary from "./AISummary";
import MiniCharts from "./MiniCharts";

/* ---------- Helpers ---------- */
const read = (k, def = []) => {
  try {
    const raw = localStorage.getItem(k);
    const v = raw ? JSON.parse(raw) : def;
    return Array.isArray(v) ? v : def;
  } catch {
    return def;
  }
};

// dd/mm/yyyy -> Date (để fallback nếu cần)
const parseVN = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const [d, m, y] = dmy.split("/").map(Number);
  return y ? new Date(y, (m || 1) - 1, d || 1) : null;
};

const ymKey = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

/* ---------- Component ---------- */
export default function MainContent() {
  const [userStats, setUserStats] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
  const [rawClasses, setRawClasses] = useState([]);
  const [rawCards, setRawCards] = useState([]);

  // doanh thu: { total, monthRevenue, byMonth: { "2025-08": 12345, ... } }
  const [revenue, setRevenue] = useState({
    total: 0,
    monthRevenue: 0,
    byMonth: {},
  });

  const load = () => {
    // ===== DỮ LIỆU CHUẨN HOÁ KEY =====
    const dsNguoiDung = read("nguoiDung", []);
    const dsKhoaHoc = read("khoaHoc", []);      // trước đây dùng "lop"/"class"
    const dsBoThe   = read("boThe", []);        // trước đây fallback "cards"

    // ===== THỐNG KÊ SỐ LƯỢNG =====
    const soNguoiDung = dsNguoiDung.length;
    const soKhoaHoc   = dsKhoaHoc.length;
    const soBoThe     = dsBoThe.length;

    // ===== DOANH THU: TÍNH TỪ ĐƠN HÀNG "paid" =====
    // - nguồn: localStorage.donHangTraPhi
    // - số tiền: ưu tiên soTienThanhToanThucTe, fallback soTienThanhToan
    // - thời điểm: ưu tiên paidAt, fallback createdAt
    const ordersAll = read("donHangTraPhi", []);
    const paidOrders = ordersAll.filter((o) => o.trangThai === "paid");

    let total = 0;
    const byMonth = {};
    paidOrders.forEach((o) => {
      const when =
        (o.paidAt && new Date(o.paidAt)) ||
        (o.createdAt && new Date(o.createdAt)) ||
        parseVN(o.NgayBatDau) ||
        new Date();
      const key = ymKey(when);
      const amount = Number(
        o.soTienThanhToanThucTe ?? o.soTienThanhToan ?? 0
      );
      total += amount;
      byMonth[key] = (byMonth[key] || 0) + amount;
    });

    const nowKey = ymKey(new Date());
    const monthRevenue = byMonth[nowKey] || 0;

    // ===== CẬP NHẬT CARDS =====
    setUserStats([
      { id: 1, name: "Người dùng", value: soNguoiDung, title: "Tổng số người dùng trong hệ thống" },
      { id: 2, name: "Lớp học", value: soKhoaHoc, title: "Tổng số lớp học đã tạo" },
      { id: 3, name: "Bộ thẻ", value: soBoThe, title: "Tổng số bộ thẻ hiện có" },
      { id: 4, name: "Doanh thu (tháng này)", value: monthRevenue.toLocaleString("vi-VN") + " đ", title: "Tổng doanh thu tháng hiện tại (đơn đã thanh toán)" },
    ]);

    // ===== DỮ LIỆU THÔ CHO AI/CHARTS =====
    setRawUsers(dsNguoiDung);
    setRawClasses(dsKhoaHoc);
    setRawCards(dsBoThe);

    setRevenue({ total, monthRevenue, byMonth });
  };

  useEffect(() => {
    load();

    // Tự reload khi dữ liệu thay đổi
    const onStorage = (e) => {
      if (
        [
          "nguoiDung",
          "khoaHoc",
          "boThe",
          "donHangTraPhi",
          "goiTraPhi",
          "goiTraPhiCuaNguoiDung",
        ].includes(e.key)
      ) {
        load();
      }
    };

    // Các sự kiện tùy chỉnh app đang dùng rải rác
    const onChanged = () => load();

    window.addEventListener("storage", onStorage);
    window.addEventListener("subscriptionChanged", onChanged);
    window.addEventListener("packsChanged", onChanged);
    window.addEventListener("coursesChanged", onChanged);
    window.addEventListener("khoaHocChanged", onChanged);
    window.addEventListener("boTheUpdated", onChanged);
    window.addEventListener("ordersChanged", onChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("subscriptionChanged", onChanged);
      window.removeEventListener("packsChanged", onChanged);
      window.removeEventListener("coursesChanged", onChanged);
      window.removeEventListener("khoaHocChanged", onChanged);
      window.removeEventListener("boTheUpdated", onChanged);
      window.removeEventListener("ordersChanged", onChanged);
    };
  }, []);

  return (
    <div>
      <div style={{ width: "100%", height: "100px" }}>
        <h1>THỐNG KÊ</h1>
      </div>

      <div className="Top-Content">
        <TopContent userStats={userStats} />
      </div>

      {/* [AI] Tóm tắt + dự báo */}
      <div style={{ marginTop: 24 }}>
        <AISummary
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={revenue}
        />
      </div>

      {/* [AI] Biểu đồ mini */}
      <div style={{ marginTop: 16 }}>
        <MiniCharts
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={revenue}
        />
      </div>
    </div>
  );
}
