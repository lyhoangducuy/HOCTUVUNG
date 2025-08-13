import Header from "../../../components/Header/Header";
import Sidebar from "../../../components/Sidebar/Sidebar";
import MainContent from "../../../components/MainContent/MainContent";
import { useState } from "react";
import "./TrangChuHocVien.css";

const TrangChuHocVien = () => {
  const [isSidebar, setIsSidebar] = useState(false);
  const handleShowSidebar = (e) => {
    setIsSidebar(!isSidebar);
    e.preventDefault();
  };
  return (
    <div className={`trangchu-hocvien-root${isSidebar ? " sidebar-open" : ""}`}>
      <div className="trangchu-hocvien-header">
        <Header handleShowSidebar={handleShowSidebar} />
      </div>
      <div className="trangchu-hocvien-main">
        {isSidebar && (
          <div className="trangchu-hocvien-sidebar">
            <Sidebar />
          </div>
        )}
        <div className="trangchu-hocvien-content">
          <MainContent />
        </div>
      </div>
    </div>
  );
};

export default TrangChuHocVien;
