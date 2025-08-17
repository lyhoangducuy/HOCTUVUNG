import { useEffect, useState } from "react";
import TopContent from "./TopContentAdmin";

const MainContent = () => {
  const [userStats, setUserStats] = useState([]);

  useEffect(() => {
    // Đọc dữ liệu từ localStorage
    const dsNguoiDung = JSON.parse(localStorage.getItem("nguoiDung")) || [];
    const dsLop = JSON.parse(localStorage.getItem("class")) || [];
    const dsBoThe = JSON.parse(localStorage.getItem("boThe")) || [];

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
  }, []);

  return (
    <div>
      <div style={{ width: "100%", height: "100px" }}>
        <h1>THỐNG KÊ</h1>
      </div>

      <div className="Top-Content">
        <TopContent userStats={userStats} />
      </div>
    </div>
  );
};

export default MainContent;
