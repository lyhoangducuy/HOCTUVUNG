import React from 'react'
import { Outlet } from 'react-router-dom';
import Giangvien_Header from '../../components/GiangVien/Header/Giangvien_Header';
import Giangvien_Sidebar from '../../components/GiangVien/Sidebar/Giangvien_Sidebar';
export default function TrangChuLayout() {
  return (
   <>
       
      <Giangvien_Header/>
      <Giangvien_Sidebar/>
      <Outlet/>
    
       
    </>
  )
}
