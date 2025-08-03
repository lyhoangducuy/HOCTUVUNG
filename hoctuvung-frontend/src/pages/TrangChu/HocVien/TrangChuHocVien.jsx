import Header from "../../../components/Header/Header";
import Sidebar from "../../../components/Sidebar/Sidebar";
import MainContent from "../../../components/MainContent/MainContent";
import { useState } from "react";

const TrangChuHocVien = () => {
  const [isSidebar, setIsSidebar] = useState(true);
  const handleShowSidebar = (e) => {
    setIsSidebar(!isSidebar);
    e.preventDefault();
  };
  return (
    <div>
      <div className="container-header">
        <Header handleShowSidebar={handleShowSidebar} />
      </div>
      <div className="container-sidebar">
        <Sidebar />
      </div>
      <div className="container-content">
        <MainContent />
      </div>
    </div>
  );
};

export default TrangChuHocVien;
