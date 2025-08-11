import { useState } from "react";
import TopContent from "./TopContentAdmin";

const MainContent = () => {
  const [userStats, setUserStats] = useState([
    {
      id: 1,
      name: "Người dùng trực tuyến",
      value: 11,
      title: " Tăng 25% so với tháng trước",
    },
    {
      id: 2,
      name: "Người dùng trả phí",
      value: 5,
      title: " Tăng 10% so với tháng trước",
    },
    {
      id: 3,
      name: "Số lượng lớp học",
      value: 100,
      title: " Tăng 5% so với tháng trước",
    },
    {
      id: 4,
      name: "Số lượng bộ thẻ",
      value: 20,
      title: " Tăng 15% so với tháng trước",
    },
    {
      id: 5,
      name: "Số lượng thẻ",
      title: " Tăng 20% so với tháng trước",
    },
  ]);
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
