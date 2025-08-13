import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBookOpen,
  faSearch,
  faCirclePlus,
  faGear,
  faMoon,
  faFolderOpen,
  faClone,
} from "@fortawesome/free-solid-svg-icons";
import "./header.css";
import { useRef, useState, useEffect } from "react";

function Giangvien_Header() {
  const [show, setShow] = useState(false);
  const [showplus, setShowplus] = useState(false);
  const menuRef = useRef();
  const plusRef = useRef();
  const navigate = useNavigate();
  console.log(show);
  useEffect(() => {
    function handleClickOutside(e) {
      if (!plusRef.current.contains(e.target)) {
        setShowplus(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showplus]);
  useEffect(() => {
    function handleClickOutside(e) {
      if (!menuRef.current.contains(e.target)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show]);
  return (
    <div className="header-container">
      <div className="left-section">
        <FontAwesomeIcon icon={faBars} className="icon menu-icon" />
        <FontAwesomeIcon
          icon={faBookOpen}
          className="icon book-icon"
          onClick={() => navigate("/giangvien")}
        />
      </div>

      <div className="search-section">
        <FontAwesomeIcon icon={faSearch} className="icon search-icon" />
        <input type="search" placeholder="Tìm kiếm" className="search-input" />
      </div>

      <div className="right-section">
        <div className="plus-container" ref={plusRef}>
          <FontAwesomeIcon
            icon={faCirclePlus}
            className="icon plus-icon"
            onClick={() => setShowplus(!showplus)}
          />
          {showplus && (
            <div className="plus">
              <div className="plus-item"
                 onClick={() => {
                  navigate("/newcard");
                  setShowplus(!showplus);
                }}
              >
                <FontAwesomeIcon icon={faClone} />
                <span>Bộ thẻ mới</span>
              </div>
              <div
                className="plus-item"
                onClick={() => {
                  navigate("/newfolder");
                  setShowplus(!showplus);
                }}
              >
                <FontAwesomeIcon icon={faFolderOpen} />
                <span>Thư Mục Mới</span>
              </div>
              <div
                className="plus-item"
                onClick={() => {
                  navigate("/newclass");
                  setShowplus(!showplus);
                }}
              >
                <FontAwesomeIcon icon={faBookOpen} />
                <span>Lớp Học Mới</span>
              </div>
            </div>
          )}
        </div>

        <button className="btn-upgrade">Nâng cấp tài khoản</button>
        <div className="inforContainer" ref={menuRef}>
          <img
            src="/src/image/formimg.png"
            alt="avatar"
            className="avatar"
            onClick={() => setShow(!show)}
          />
          {show && (
            <div className="setting">
              <div className="infor">
                <img
                  src="/src/image/formimg.png"
                  alt="avatar"
                  className="avatar"
                />
                <h2 className="tittle">{"Huynh"}</h2>
              </div>
              <div className="divide"></div>
              <div className="confirg">
                <FontAwesomeIcon icon={faGear} className="icon icon-setting" />
                {"Cài Đặt"}
                <FontAwesomeIcon icon={faMoon} className="icon icon-moon" />
                {"Chế Độ Màn Hình Tối"}
              </div>
              <div className="divide"></div>
              <div className="loggout">Đăng Xuất</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Giangvien_Header;
