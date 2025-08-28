import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import TopContent from "./TopContents/TopContentAdmin";
import AISummary from "./Alsummary/AISummary";
import AITrendAnalysis from "./AlTrendAnalysis/AITrendAnalysis";
import AIUserBehavior from "./AIUserBehavior/AIUserBehavior";
import MiniCharts from "./MiniCharts/MiniCharts";
import "./MainContentAdmin.css";

export default function MainContent() {
  // UI State
  const [userStats, setUserStats] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
  const [rawClasses, setRawClasses] = useState([]);
  const [rawCards, setRawCards] = useState([]);
  const [rawSciences, setRawSciences] = useState([]);

  // Firestore Data
  const [dsNguoiDung, setDsNguoiDung] = useState([]);
  const [dsBoThe, setDsBoThe] = useState([]);
  const [dsKhoaHoc, setDsKhoaHoc] = useState([]);
  const [dsDonHang, setDsDonHang] = useState([]);
  const [dsGoiTraPhi, setDsGoiTraPhi] = useState([]);

  useEffect(() => {
    const listeners = [
      { col: "nguoiDung", set: setDsNguoiDung },
      { col: "boThe", set: setDsBoThe },
      { col: "khoaHoc", set: setDsKhoaHoc },
      { col: "goiTraPhiCuaNguoiDung", set: setDsDonHang },
      { col: "goiTraPhi", set: setDsGoiTraPhi },
    ].map(({ col, set }) =>
      onSnapshot(collection(db, col), (snap) =>
        set(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      )
    );

    return () => listeners.forEach((unsub) => unsub());
  }, []);

  // Chạy load() mỗi khi dữ liệu từ Firestore thay đổi
  useEffect(() => {
    async function loadData() {
      try {
        const soNguoiDung = dsNguoiDung.length;
        const soBoThe = dsBoThe.length;
        const soKhoaHoc = dsKhoaHoc.length;

        // Lọc đơn hàng đã thanh toán (case-insensitive)
        const goiMap = new Map(
          dsGoiTraPhi.map((g) => [g.idGoi, g.giaGoi || 0])
        );

        const paidOrders = dsDonHang.filter((o) => {
          const status = (
            typeof o.status === "function" ? o.status() : o.status
          )?.toLowerCase();
          return status === "dang hoạt động" || status === "đã hủy";
        });

        // Tính tổng doanh thu
        const tongDoanhThu = paidOrders.reduce((sum, order) => {
          const gia = Number(goiMap.get(order.idGoi)) || 0;
          return sum + gia;
        }, 0);

        // ===== TÍNH DOANH THU KHÓA HỌC (10%) =====
        let khoaHocRevenue = 0;
        dsKhoaHoc.forEach((k) => {
          try {
            const giaKhoaHoc = Number(k.giaKhoaHoc || k.giaSauGiam || 0);
            const soThanhVien = Array.isArray(k.thanhVienIds)
              ? k.thanhVienIds.length
              : 0;
            const doanhThu = giaKhoaHoc * soThanhVien;

            if (doanhThu > 0) {
              khoaHocRevenue += doanhThu * 0.2;
            }
          } catch (err) {
            console.error("Lỗi khi tính khóa học " + k.id + ":", err);
          }
        });

        // Tổng doanh thu
        const total = khoaHocRevenue + tongDoanhThu;

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
            name: "Khóa học",
            value: soKhoaHoc,
            title: "Tổng số khoa học hiện có",
          },
          {
            id: 5,
            name: "Doanh thu (tháng này)",
            value: total.toLocaleString("vi-VN") + " đ",
            title:
              "Tổng doanh thu tháng hiện tại (đơn đã thanh toán + 10% khóa học)",
          },
        ]);

        setRawUsers(dsNguoiDung);
        setRawClasses(dsKhoaHoc);
        setRawCards(dsBoThe);
        setRawSciences(dsKhoaHoc);
      } catch (error) {
        console.error("Lỗi khi load dữ liệu:", error);
      }
    }

    if (
      dsNguoiDung.length ||
      dsBoThe.length ||
      dsKhoaHoc.length ||
      dsDonHang.length
    ) {
      loadData();
    }
  }, [dsNguoiDung, dsBoThe, dsKhoaHoc, dsDonHang, dsGoiTraPhi]);
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
          revenue={{ total: 0 }}
        />
      </div>

      {/* [AI] Phân tích xu hướng & Dự báo */}
      <div className="section">
        <AITrendAnalysis
          users={rawUsers}
          classes={rawClasses}
          cards={rawCards}
          revenue={{ total: 0 }}
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
          sciences={rawSciences}
          cards={rawCards}
        />
      </div>
    </div>
  );
}
