import React from "react";
import { Outlet } from "react-router-dom";
import "./TrangChuLayout.css";
import Header from "../../components/TrangChu/Header/Header";
import Sidebar from "../../components/TrangChu/Sidebar/Sidebar";

export default function GiangVienLayout() {
  return (
    <div className="trangchu-layout-container">
      <Header />
      <div className="trangchu-layout-main">
        <div className="trangchu-layout-sidebar">
          <Sidebar />
        </div>
        <div className="trangchu-layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
