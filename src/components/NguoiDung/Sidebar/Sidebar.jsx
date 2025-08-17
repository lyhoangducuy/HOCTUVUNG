import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faFolderOpen, faBell, faPlus, faClone, faBook } from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";
import { useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const [myfolder, setMyfolder] = useState([]);
  const [moSidebar, setMoSidebar] = useState(true); // <-- trạng thái mở/đóng

  const loaddata = () => {
    const folder = JSON.parse(localStorage.getItem("thuMuc") || "[]");
    // sửa typo 'lenght' -> 'length' và set luôn mảng
    setMyfolder(Array.isArray(folder) ? folder : []);
  };

  useEffect(() => {
    loaddata();
    window.addEventListener("foldersUpdated", loaddata);

    // nghe sự kiện toggle sidebar từ Header
    const toggle = () => setMoSidebar((v) => !v);
    window.addEventListener("sidebar:toggle", toggle);

    return () => {
      window.removeEventListener("foldersUpdated", loaddata);
      window.removeEventListener("sidebar:toggle", toggle);
    };
  }, []);

  const handleFolder = (idThuMuc) => {
    const folder = JSON.parse(localStorage.getItem("thuMuc") || "[]");
    const folder_click = folder.find((item) => item.idThuMuc === idThuMuc);
    if (folder_click) {
      localStorage.setItem("currentFolder", JSON.stringify(folder_click));
      navigate(`/folder/${idThuMuc}`);
    }
  };

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

        <div ref={notiRef} className="noti-wrapper" onClick={() => setShowNoti((v) => !v)}>
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
        <h3>Thư mục của tôi</h3>
        <ul>
          {myfolder.map((item) => (
            <li
              key={item.idThuMuc}
              className="folder-item"
              onClick={() => handleFolder(item.idThuMuc)} // dùng idThuMuc thực tế
            >
              <FontAwesomeIcon icon={faBook} className="icon icon-book" />
              {item.tenThuMuc}
            </li>
          ))}
        </ul>
        <div className="create_folder" onClick={() => navigate("/newfolder")}>
          <FontAwesomeIcon icon={faPlus} className="icon" />
          Thư mục mới
        </div>
      </div>

      <div className="divider" />

      <div className="sidebar_bottom">
        <h3>Bắt đầu</h3>
        <div>
          <FontAwesomeIcon icon={faClone} className="icon" />
          Flashcards
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
