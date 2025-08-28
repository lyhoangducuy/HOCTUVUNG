// src/layouts/NguoiDungLayout/NguoiDungLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import "./NguoiDungLayout.css";

import Header from "../../components/NguoiDung/Header/Header";
import Sidebar from "../../components/NguoiDung/Sidebar/Sidebar";
import Footer from "../../components/Auth/Footer/Footer";
import AuthSync from "../../components/Auth/AuthSync";
import AIButton from "../../components/Admin/AIButton/AIButton";

export default function NguoiDungLayout() {
  return (
    <div className="trangchu-layout-container">
      <Header />
      <AuthSync />
      <div className="trangchu-layout-main">
        <div className="trangchu-layout-sidebar">
          <Sidebar />
        </div>

        <div className="trangchu-layout-content">
          <Outlet />
        </div>

        {/* Luôn hiển thị nút AI (không cần prime) */}
        <AIButton />
      </div>
      <Footer />
    </div>
  );
}
