import React from 'react'
import { Outlet } from 'react-router-dom'

export default function TrangChuLayout() {
  return (
    <div>
        <TrangChuHeader/>
        <Outlet/>
        <TrangChuFooter />
    </div>
  )
}
