import React from 'react'
import { Outlet } from 'react-router-dom';
import AuthSync from '../../components/Auth/AuthSync';
export default function TrangChuLayout() {
  return (
    <div>
      <AuthSync />
        <Outlet />
    </div>
  )
}
