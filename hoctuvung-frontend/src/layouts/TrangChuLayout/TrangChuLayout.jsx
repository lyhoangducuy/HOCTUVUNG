import React from 'react'
import { Outlet } from 'react-router-dom';
import Giangvien_Header from '../../components/GiangVien/Header/Giangvien_Header';
import Giangvien_Sidebar from '../../components/GiangVien/Sidebar/Giangvien_Sidebar';
import './TrangChuLayout.css';

export default function TrangChuLayout() {
  return (
    <div className="trangchu-layout-container">
      <Giangvien_Header />
      <div className="trangchu-layout-main">
        <div className="trangchu-layout-sidebar">
          <Giangvien_Sidebar />
        </div>
        <div className="trangchu-layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}