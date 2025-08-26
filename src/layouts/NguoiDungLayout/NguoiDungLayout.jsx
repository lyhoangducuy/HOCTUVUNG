import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./NguoiDungLayout.css";
import Header from "../../components/NguoiDung/Header/Header";
import Sidebar from "../../components/NguoiDung/Sidebar/Sidebar";
import Footer from "../../components/Auth/Footer/Footer";
import { FaRobot } from "react-icons/fa";
import AuthSync from "../../components/Auth/AuthSync";

export default function NguoiDungLayout() {
  const [prime, setPrime] = useState(false);
  const navigate = useNavigate();
    useEffect(() => {
      const computePrime = () => {
        try {
          const ss = JSON.parse(sessionStorage.getItem("session") || "null");
          if (!ss?.idNguoiDung) {
            setPrime(false);
            return;
          }
          setPrime(hasActiveSub(ss.idNguoiDung));
        } catch {
          setPrime(false);
        }
      };
      computePrime();
  
      const onStorage = (e) => {
        if (!e || !e.key) return;
        if (e.key === "goiTraPhiCuaNguoiDung") computePrime();
      };
      const onSubChanged = () => computePrime();
  
      window.addEventListener("storage", onStorage);
      window.addEventListener("subscriptionChanged", onSubChanged);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("subscriptionChanged", onSubChanged);
      };
    }, []);
  
  const AILockedButton = () => {
      const onLockedClick = () => {
        alert("Tính năng AI chỉ dành cho tài khoản trả phí. Vui lòng nâng cấp để sử dụng.");
        navigate("/tra-phi", { state: { from: "ai" } });
      };
      return (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 1000,
          }}
        >
          <button
            onClick={onLockedClick}
            title="Nâng cấp để dùng AI"
            aria-label="Nâng cấp để dùng AI"
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              border: "1px solid #7d7e80ff",
              boxShadow: "0 6px 16px rgba(255, 0, 0, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <FaRobot style={{ fontSize: 18, color: "#6b7280" }} />
            {/* Huy hiệu ngôi sao */}
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                fontSize: 12,
                color: "#ffff",
                background: "#f59e0b",
                border: "1px solid #ffff",
                padding: "2px 6px",
                borderRadius: 999,
                lineHeight: 1,
                pointerEvents: "none",
              }}
              title="Nâng cấp để mở khóa"
            >
              ★
            </span>
          </button>
        </div>
      );
    };
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
       {/* AI: nếu prime thì dùng AIButton; chưa prime thì hiện nút có sao, click → alert + /tra-phi */}
      {prime ? <AIButton /> : <AILockedButton />}

      {/* GẦN ĐÂY */}
      </div>
      <Footer/>
    </div>
  );
}
