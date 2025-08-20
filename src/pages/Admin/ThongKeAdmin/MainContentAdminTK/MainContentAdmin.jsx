// Trang nội dung Thống kê Admin
// - Đọc dữ liệu từ localStorage
// - Hiển thị ô thống kê (TopContent)
// - Thêm 2 block AI: tóm tắt (AISummary) và biểu đồ nhanh (MiniCharts)
import { useEffect, useState } from "react";
import TopContent from "./TopContentAdmin";
import AISummary from "./AISummary";   // [AI]
import MiniCharts from "./MiniCharts"; // [AI]

const MainContent = () => {
  const [userStats, setUserStats] = useState([]);
  // Nguồn dữ liệu thô cho AI
  const [rawUsers, setRawUsers] = useState([]);
  const [rawClasses, setRawClasses] = useState([]);
  const [rawCards, setRawCards] = useState([]);

  useEffect(() => {
    // Đọc dữ liệu từ localStorage
    const dsNguoiDung = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    // Hỗ trợ cả key cũ "class" và mới "lop"
    const dsLop = JSON.parse(
      localStorage.getItem("lop") || localStorage.getItem("class") || "[]"
    );
    // Hỗ trợ cả key mới "cards" và cũ "boThe"
    const dsBoThe = JSON.parse(
      localStorage.getItem("cards") || localStorage.getItem("boThe") || "[]"
    );

    const soNguoiDung = Array.isArray(dsNguoiDung) ? dsNguoiDung.length : 0;
    const soLop = Array.isArray(dsLop) ? dsLop.length : 0;
    const soBoThe = Array.isArray(dsBoThe) ? dsBoThe.length : 0;

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
        value: soLop,
        title: "Tổng số lớp học đã tạo",
      },
      {
        id: 3,
        name: "Bộ thẻ",
        value: soBoThe,
        title: "Tổng số bộ thẻ hiện có",
      },
    ]);

    setRawUsers(Array.isArray(dsNguoiDung) ? dsNguoiDung : []);
    setRawClasses(Array.isArray(dsLop) ? dsLop : []);
    setRawCards(Array.isArray(dsBoThe) ? dsBoThe : []);
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
        <AISummary users={rawUsers} classes={rawClasses} cards={rawCards} />
      </div>

      {/* [AI] Biểu đồ mini */}
      <div style={{ marginTop: 16 }}>
        <MiniCharts users={rawUsers} classes={rawClasses} cards={rawCards} />
      </div>
    </div>
  );
};

export default MainContent;
