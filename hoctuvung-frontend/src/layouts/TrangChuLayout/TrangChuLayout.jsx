import React from 'react'

export default function TrangChuLayout() {
  return (
    <div>
        <TrangChuHeader/>
        <Outlet />
        <TrangChuFooter />
    </div>
  )
}
