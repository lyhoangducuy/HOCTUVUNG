import { FaBars, FaCaretDown, FaUserAlt } from "react-icons/fa";
import "./HeaderAdmin.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AIButton from "../AIButton/AIButton";
const HeaderAdmin = (props) => {
  const [open, setOpen] = useState(false);
const menuRef = useRef(null);
const navigate = useNavigate();

useEffect(() => {
  const onClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
  };
  document.addEventListener("mousedown", onClickOutside);
  return () => document.removeEventListener("mousedown", onClickOutside);
}, []);
let avatarSrc = "/src/assets/image/formimg.png";
let displayName = "Người dùng";
try {
  const session = JSON.parse(sessionStorage.getItem("session") || "null");
  const ds = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
  const me = ds.find(u => u.idNguoiDung === session?.idNguoiDung);
  if (me) {
    avatarSrc = me.anhDaiDien || avatarSrc;
    displayName = me.tenNguoiDung || displayName;
  }
} catch {console.error("lỗi setting admin");
}
  return (
    <div className="header-admin-container">
      <button className="icon-btn" onClick={props.handleShowSidebar}>
        {" "}
        <FaBars />{" "}
      </button>
    
      
        <div className="admin-user-menu" ref={menuRef}>
        <button className="icon-btn" onClick={() => setOpen(v => !v)}>
          <img src={avatarSrc} alt="avatar" className="avatar" />
        </button>
      
        {open && (
          <div className="admin-user-dropdown">
            <div className="dropdown-infor">
              <img src={avatarSrc} alt="avatar" className="avatar" />
              <h2 className="title">{displayName}</h2>
            </div>
      
            <div className="dropdown-divider" />
      
            <div
              className="dropdown-item"
              onClick={() => { setOpen(false); navigate("/admin/setting"); }}
            >
              <span className="icon">⚙️</span>
              <span style={{color: "black"}} >Cài đặt</span>
            </div>
      
            <div className="dropdown-divider" />
      
            <div
              className="dropdown-item danger"
              onClick={() => { setOpen(false); sessionStorage.clear(); navigate("/"); }}
            >
              Đăng xuất
            </div>
          </div>
        )}
      </div>
      {/* Nút AI ở góc phải */}
      <AIButton />
      
    </div>
  );
};

export default HeaderAdmin;
