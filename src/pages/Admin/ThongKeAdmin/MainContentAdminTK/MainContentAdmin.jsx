import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

import TopContent from "./TopContentAdmin";
import AISummary from "./AISummary";
import MiniCharts from "./MiniCharts";
import ProAnalytics from "./ProAnalytics";

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
      console.log("=== BẮT ĐẦU LOAD DỮ LIỆU ===");
      
      // ===== LẤY DỮ LIỆU TỪ FIRESTORE =====
      const nguoiDungSnap = await getDocs(collection(db, "nguoiDung"));
      const dsNguoiDung = nguoiDungSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const khoaHocSnap = await getDocs(collection(db, "khoaHoc"));
      const dsKhoaHoc = khoaHocSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const boTheSnap = await getDocs(collection(db, "boThe"));
      const dsBoThe = boTheSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const donHangSnap = await getDocs(collection(db, "donHangTraPhi"));
      const ordersAll = donHangSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      console.log("Tổng số đơn hàng:", ordersAll.length);
      console.log("Sample đơn hàng đầu tiên:", ordersAll[0]);

      // ===== THỐNG KÊ =====
      const soNguoiDung = dsNguoiDung.length;
      const soKhoaHoc   = dsKhoaHoc.length;
      const soBoThe     = dsBoThe.length;

      // ===== DOANH THU - IMPROVED VERSION =====
      console.log("\n=== TÍNH DOANH THU ===");
      
      // Kiểm tra các trạng thái có trong data
      const allStatuses = [...new Set(ordersAll.map(o => o.trangThai))];
      console.log("Các trạng thái đơn hàng có trong DB:", allStatuses);
      
      // Lọc đơn hàng đã thanh toán (case-insensitive)
      const paidOrders = ordersAll.filter((o) => {
        const status = o.trangThai?.toLowerCase?.();
        return status === "paid" || status === "thành công" || status === "hoàn thành";
      });
      
      console.log("Số đơn hàng đã thanh toán:", paidOrders.length);
      if (paidOrders.length > 0) {
        console.log("Sample đơn hàng đã thanh toán:", paidOrders[0]);
      }

      let total = 0;
      const byMonth = {};
      const debugInfo = [];

      paidOrders.forEach((o, index) => {
        console.log(`\n--- Xử lý đơn hàng ${index + 1} (ID: ${o.id}) ---`);
        
        // Xác định ngày thanh toán
        let when = null;
        let dateSource = "";
        
        if (o.paidAt) {
          when = new Date(o.paidAt);
          dateSource = "paidAt";
          console.log("Sử dụng paidAt:", o.paidAt);
        } else if (o.createdAt) {
          when = new Date(o.createdAt);
          dateSource = "createdAt";
          console.log("Sử dụng createdAt:", o.createdAt);
        } else if (o.NgayBatDau) {
          when = parseVN(o.NgayBatDau);
          dateSource = "NgayBatDau";
          console.log("Sử dụng NgayBatDau:", o.NgayBatDau, "->", when);
        }
        
        // Fallback to current date nếu không có ngày hợp lệ
        if (!when || isNaN(when.getTime())) {
          when = new Date();
          dateSource = "current";
          console.log("⚠️ Không có ngày hợp lệ, sử dụng ngày hiện tại");
        }

        const key = ymKey(when);
        console.log("Key tháng-năm:", key);

        // Xác định số tiền - improved
        let amount = 0;
        if (o.soTienThanhToanThucTe !== null && o.soTienThanhToanThucTe !== undefined) {
          amount = Number(o.soTienThanhToanThucTe);
          console.log("Sử dụng soTienThanhToanThucTe:", o.soTienThanhToanThucTe);
        } else if (o.soTienThanhToan !== null && o.soTienThanhToan !== undefined) {
          amount = Number(o.soTienThanhToan);
          console.log("Sử dụng soTienThanhToan:", o.soTienThanhToan);
        }
        
        console.log("Số tiền final:", amount);

        if (amount > 0) {
          total += amount;
          byMonth[key] = (byMonth[key] || 0) + amount;
          console.log("✅ Đã cộng vào tổng. Tổng hiện tại:", total.toLocaleString("vi-VN"));
          
          debugInfo.push({
            orderId: o.id,
            date: when.toLocaleDateString("vi-VN"),
            monthKey: key,
            amount: amount,
            dateSource: dateSource
          });
        } else {
          console.log("⚠️ Số tiền = 0 hoặc không hợp lệ, bỏ qua");
        }
      });

      const nowKey = ymKey(new Date());
      const monthRevenue = byMonth[nowKey] || 0;

      console.log("\n=== KẾT QUẢ CUỐI CÙNG ===");
      console.log("Tháng hiện tại:", nowKey);
      console.log("Tổng doanh thu:", total.toLocaleString("vi-VN"), "đ");
      console.log("Doanh thu tháng này:", monthRevenue.toLocaleString("vi-VN"), "đ");
      console.log("Doanh thu theo tháng:", Object.entries(byMonth).map(([k,v]) => `${k}: ${v.toLocaleString("vi-VN")}đ`));
      console.log("Debug info:", debugInfo);

      // ===== CẬP NHẬT STATE =====
      setUserStats([
        { id: 1, name: "Người dùng", value: soNguoiDung, title: "Tổng số người dùng trong hệ thống" },
        { id: 2, name: "Lớp học", value: soKhoaHoc, title: "Tổng số lớp học đã tạo" },
        { id: 3, name: "Bộ thẻ", value: soBoThe, title: "Tổng số bộ thẻ hiện có" },
        { id: 4, name: "Doanh thu (tháng này)", value: monthRevenue.toLocaleString("vi-VN") + " đ", title: "Tổng doanh thu tháng hiện tại (đơn đã thanh toán)" },
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

      {/* Bộ biểu đồ phân tích nâng cao */}
      <div style={{ marginTop: 16 }}>
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