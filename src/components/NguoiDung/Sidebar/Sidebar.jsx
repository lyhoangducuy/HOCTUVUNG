import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faFolderOpen,
  faBell,
  faPlus,
  faClone,
  faBook,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";
import { useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const [moSidebar, setMoSidebar] = useState(true); // <-- trạng thái mở/đóng
  const [prime, setPrime] = useState(false);

  const loaddata = () => {
    const folder = JSON.parse(localStorage.getItem("thuMuc") || "[]");
    // sửa typo 'lenght' -> 'length' và set luôn mảng

  };

  useEffect(() => {
    loaddata();
    window.addEventListener("foldersUpdated", loaddata);

    // nghe sự kiện toggle sidebar từ Header
    const toggle = () => setMoSidebar((v) => !v);
    window.addEventListener("sidebar:toggle", toggle);
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    if (!session?.idNguoiDung) return;

    const ds = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    const found = ds.find((u) => u.idNguoiDung === session.idNguoiDung) || null;
    setPrime(found?.isPrime === true);
    return () => {
      window.removeEventListener("foldersUpdated", loaddata);
      window.removeEventListener("sidebar:toggle", toggle);
    };
  }, []);


  const notiRef = useRef(null);
  const [showNoti, setShowNoti] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setShowNoti(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`sidebar_container ${moSidebar ? "" : "is-closed"}`}>
      <div className="sidebar_top">
        <div onClick={() => navigate("/giangvien")}>
          <FontAwesomeIcon icon={faHouse} className="icon" />
          Trang chủ
        </div>
        <div onClick={() => navigate("/thuviencuatoi")}>
          <FontAwesomeIcon icon={faFolderOpen} className="icon" />
          Thư viện của tôi
        </div>

        <div
          ref={notiRef}
          className="noti-wrapper"
          onClick={() => setShowNoti((v) => !v)}
        >
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
        <div onClick={() => navigate('/video')} style={{ cursor: 'pointer', color: '#2563eb', marginTop: 6 }}>
          <FontAwesomeIcon icon={faVideo} />
          Học Tự Vựng Qua Video
        </div>
      </div>

      <div className="divider" />

    </div>
  );
}

export default Sidebar;
