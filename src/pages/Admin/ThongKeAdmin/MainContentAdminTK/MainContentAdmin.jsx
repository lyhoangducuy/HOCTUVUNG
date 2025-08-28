import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import TopContent from "./TopContents/TopContentAdmin";
import AISummary from "./Alsummary/AISummary";
import AITrendAnalysis from "./AlTrendAnalysis/AITrendAnalysis";
import AIUserBehavior from "./AIUserBehavior/AIUserBehavior";
import MiniCharts from "./MiniCharts/MiniCharts";
import ProAnalytics from "./ProAnalytics/ProAnalytics";
import "./MainContentAdmin.css";


/* ---------- Helpers ---------- */
// dd/mm/yyyy -> Date
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
  const [revenue, setRevenue] = useState({
    total: 0,
    monthRevenue: 0,
    byMonth: {},
  });

  const load = async () => {
    try {
      // ===== LẤY DỮ LIỆU TỪ FIRESTORE =====
      const nguoiDungSnap = await getDocs(collection(db, "nguoiDung"));
      const dsNguoiDung = nguoiDungSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const khoaHocSnap = await getDocs(collection(db, "khoaHoc"));
      const dsKhoaHoc = khoaHocSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      console.log("=== DANH SÁCH KHÓA HỌC ===");
      dsKhoaHoc.forEach((k) => {
        console.log(`Khóa học ${k.id}:`, {
          ten: k.ten || k.tenKhoaHoc,
          gia: k.gia || k.price || 0,
          raw: k, // Log toàn bộ dữ liệu thô
        });
      });

      const boTheSnap = await getDocs(collection(db, "boThe"));
      const dsBoThe = boTheSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const donHangSnap = await getDocs(
        collection(db, "goiTraPhiCuaNguoiDung")
      );
      const ordersAll = donHangSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // ===== THỐNG KÊ =====
      const soNguoiDung = dsNguoiDung.length;
      const soKhoaHoc = dsKhoaHoc.length;
      const soBoThe = dsBoThe.length;

      // Lọc đơn hàng đã thanh toán (case-insensitive)
      const paidOrders = ordersAll.filter((o) => {
        const status = o.trangThai?.toLowerCase?.();
        return (
          status === "paid" ||
          status === "thành công" ||
          status === "hoàn thành"
        );
      });

      let total = 0;
      const byMonth = {};
      const debugInfo = [];

      // ===== TÍNH DOANH THU ĐƠN HÀNG (100%) =====
      paidOrders.forEach((o) => {
        // Xác định ngày thanh toán
        let when = null;
        if (o.NgayKetThuc) {
          when = new Date(o.NgayKetThuc);
        } else if (o.NgayBatDau) {
          when = new Date(o.NgayBatDau);
        } else {
          when = new Date(); // Fallback to current date
        }

        const key = ymKey(when);

        // Xác định số tiền từ gói trả phí
        let amount = 0;
        if (o.giaGoi) {
          amount = Number(o.giaGoi);
        }

        if (amount > 0) {
          total += amount;
          byMonth[key] = (byMonth[key] || 0) + amount;
          debugInfo.push({
            orderId: o.id,
            date: when.toLocaleDateString("vi-VN"),
            monthKey: key,
            amount: amount,
          });
        }
      });

      // ===== TÍNH DOANH THU KHÓA HỌC (10%) =====
      let khoaHocRevenue = 0;
      dsKhoaHoc.forEach((k) => {
        // Ưu tiên giá sau giảm, fallback các trường phổ biến; ép sạch ký tự không phải số
        const rawGia = k.giaSauGiam ?? k.giaKhoaHoc ?? k.gia ?? k.price ?? 0;
        const gia = Number(String(rawGia).toString().replace(/[^\d.-]/g, "")) || 0;
        if (gia > 0) {
          khoaHocRevenue += gia * 0.1; // lấy 10%
        }
      });

      // Cộng doanh thu khóa học vào tổng và tháng hiện tại
      total += khoaHocRevenue;
      const nowKey = ymKey(new Date());
      byMonth[nowKey] = (byMonth[nowKey] || 0) + khoaHocRevenue;
      const monthRevenue = byMonth[nowKey] || 0;

      // ===== CẬP NHẬT STATE =====
      setUserStats([
        {
          id: 1,
          name: "Người dùng",
          value: soNguoiDung,
          title: "Tổng số người dùng trong hệ thống",
        },
        {
          id: 2,
          name: "Lớp học",
          value: soKhoaHoc,
          title: "Tổng số lớp học đã tạo",
        },
        {
          id: 3,
          name: "Bộ thẻ",
          value: soBoThe,
          title: "Tổng số bộ thẻ hiện có",
        },
        {
          id: 4,
          name: "Doanh thu (tháng này)",
          value: monthRevenue.toLocaleString("vi-VN") + " đ",
          title:
            "Tổng doanh thu tháng hiện tại (đơn đã thanh toán + 10% khóa học)",
        },
      ]);

      setRawUsers(dsNguoiDung);
      setRawClasses(dsKhoaHoc);
      setRawCards(dsBoThe);
      setRevenue({ total, monthRevenue, byMonth });
    } catch (error) {
      console.error("Lỗi khi load dữ liệu:", error);
    }
  };

  useEffect(() => {
    load(); // load 1 lần khi vào trang
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>THỐNG KÊ</h1>
      </div>

      <div className="top-content">
        <TopContent userStats={userStats} />
      </div>

      {/* [AI] Tóm tắt + dự báo */}
      <div className="section">
        <AISummary
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={revenue}
        />
      </div>

      {/* [AI] Phân tích xu hướng & Dự báo */}
      <div className="section">
        <AITrendAnalysis
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={revenue}
        />
      </div>

      {/* [AI] Phân tích hành vi người dùng */}
      <div className="section">
        <AIUserBehavior
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
        />
      </div>

      {/* [AI] Biểu đồ mini */}
      <div className="section">
        <MiniCharts
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={revenue}
        />
      </div>

      {/* Bộ biểu đồ phân tích nâng cao */}
      <div className="section">
        <ProAnalytics
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={revenue}
        />
      </div>
    </div>
  );
}
