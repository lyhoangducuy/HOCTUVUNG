// src/components/Sidebar/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faFolderOpen, faBell, faVideo } from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";
import { useNavigate } from "react-router-dom";

/* ===== Helpers ===== */
const readJSON = (k, def = []) => {
  try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? def; }
  catch { return def; }
};
const parseVNDate = (dmy) => {
  if (!dmy) return null;
  const [d, m, y] = dmy.split("/").map(Number);
  return y ? new Date(y, (m || 1) - 1, d || 1) : null;
};
// ✅ Chỉ tính prime nếu: chưa bị hủy + còn hạn
const hasActiveSub = (userId) => {
  const list = readJSON("goiTraPhiCuaNguoiDung", []);
  const today = new Date();
  return list.some((s) =>
    s.idNguoiDung === userId &&
    s.status !== "Đã hủy" &&
    parseVNDate(s.NgayKetThuc) >= today
  );
};

function Sidebar() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(true);
  const [prime, setPrime] = useState(false);

  const [showNoti, setShowNoti] = useState(false);
  const notiRef = useRef(null);

  // load user + prime; lắng nghe thay đổi
  useEffect(() => {
    const loadPrime = () => {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!ss?.idNguoiDung) { setPrime(false); return; }
      setPrime(hasActiveSub(ss.idNguoiDung));
    };

    loadPrime();

    const onToggle = () => setOpen(v => !v);
    const onStorage = (e) => {
      if (e.key === "goiTraPhiCuaNguoiDung") loadPrime();
    };
    const onSubChanged = () => loadPrime(); // Traphi phát sự kiện này khi đăng ký/hủy

    window.addEventListener("sidebar:toggle", onToggle);
    window.addEventListener("storage", onStorage);
    window.addEventListener("subscriptionChanged", onSubChanged);

    return () => {
      window.removeEventListener("sidebar:toggle", onToggle);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("subscriptionChanged", onSubChanged);
    };
  }, []);

  // đóng dropdown thông báo khi click ra ngoài
  useEffect(() => {
    const outside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setShowNoti(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const gotoVideo = () => {
    if (!prime) {
      alert("Bạn cần nâng cấp tài khoản để dùng chức năng Video.");
      navigate("/tra-phi");
      return;
    }
    navigate("/video");
  };

  return (
    <div className={`sidebar_container ${open ? "" : "is-closed"}`}>
      <div className="sidebar_top">
        <div onClick={() => navigate("/giangvien")}>
          <FontAwesomeIcon icon={faHouse} className="icon" />
          Trang chủ
        </div>

        <div onClick={() => navigate("/thuviencuatoi")}>
          <FontAwesomeIcon icon={faFolderOpen} className="icon" />
          Thư viện của tôi
        </div>

        <div ref={notiRef} className="noti-wrapper" onClick={() => setShowNoti(v => !v)}>
          <span className="noti-trigger">
            <FontAwesomeIcon icon={faBell} className="icon" />
            Thông báo
          </span>
          {showNoti && (
            <div className="noti-dropdown">
              <div className="noti-item" onClick={() => setShowNoti(false)}>
                <div className="noti-title">Ví dụ thông báo</div>
                <div className="noti-time">Vừa xong</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="divider" />

      <div className="sidebar_center">
        <div onClick={gotoVideo}>
          <FontAwesomeIcon icon={faVideo} className="icon" />
          Học qua Video
          {/* ⭐ Hiện sao khi CHƯA prime */}
          {!prime && <span className="prime-badge" title="Nâng cấp để mở khóa">★</span>}
        </div>
      </div>

      <div className="divider" />
    </div>
  );
}

export default Sidebar;
