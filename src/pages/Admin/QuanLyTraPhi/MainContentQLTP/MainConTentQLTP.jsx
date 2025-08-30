import { useState } from "react";
import QuanLyNguoiDungTraPhi from "./QuanLyNguoiDungTraPhi";
import QuanLyGoiTraPhi from "./QuanLyGoiTraPhi";
import "./MainContentQLTP.css";

export default function MainContentQLTP() {
  const [tab, setTab] = useState("nguoidung"); // "nguoidung" | "goi"

  return (
    <div className="main-content-admin-user">
      <h2>Quản Lý Trả Phí</h2>

      <div className="qltp-tabs">
        <button
          className={tab === "nguoidung" ? "active" : ""}
          onClick={() => setTab("nguoidung")}
        >
          Gói trả phí của người dùng
        </button>
        <button
          className={tab === "goi" ? "active" : ""}
          onClick={() => setTab("goi")}
        >
          Các gói trả phí
        </button>
      </div>

      <div className="qltp-content">
        {tab === "nguoidung" ? <QuanLyNguoiDungTraPhi /> : <QuanLyGoiTraPhi />}
      </div>
    </div>
  );
}
