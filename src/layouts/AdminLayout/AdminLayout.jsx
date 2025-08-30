import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderAdmin from "../../components/Admin/Header/HeaderAdmin";
import SidebarAdmin from "../../components/Admin/Sidebar/SidebarAdmin";
import "./AdminLayout.css";
import AuthSync from "../../components/Auth/AuthSync";
export default function AdminLayout({ children }) {
  const [isSidebar, setIsSidebar] = useState(false);
  const handleShowSidebar = (e) => {
    setIsSidebar(!isSidebar);
    e.preventDefault();
  };
  return (
    <div className={`admin-layout-root${isSidebar ? " sidebar-open" : ""}`}>
      <div className="admin-layout-header">
        <HeaderAdmin handleShowSidebar={handleShowSidebar} />
        <AuthSync />
      </div>
      <div className="admin-layout-main">
        <div className="admin-layout-sidebar">
          <SidebarAdmin />
        </div>
        <div className="admin-layout-content">{children || <Outlet />}</div>
      </div>
    </div>
  );
}
