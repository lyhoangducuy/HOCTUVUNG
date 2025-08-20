import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBookOpen,
  faSearch,
  faCirclePlus,
  faGear,
  faFolderOpen,
  faClone,
} from "@fortawesome/free-solid-svg-icons";
import "./header.css";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Header() {
  const [show, setShow] = useState(false);
  const [showplus, setShowplus] = useState(false);
  const [nguoiDungHienTai, setNguoiDungHienTai] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [ketQuaBoThe, setKetQuaBoThe] = useState([]);
  const [ketQuaLop, setKetQuaLop] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const menuRef = useRef(null);
  const plusRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // ---- Nạp user từ session -> localStorage.nguoiDung
  useEffect(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!session?.idNguoiDung) return;

      const ds = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
      const found =
        ds.find((u) => u.idNguoiDung === session.idNguoiDung) || null;
      setNguoiDungHienTai(found);
    } catch {
      setNguoiDungHienTai(null);
    }
  }, []);

  // ---- Đóng menu/nút plus/search khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (plusRef.current && !plusRef.current.contains(e.target)) {
        setShowplus(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShow(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  const avatarSrc = nguoiDungHienTai?.anhDaiDien || "!"; // fallback ảnh
  const tenNguoiDung = nguoiDungHienTai?.tenNguoiDung || "Người dùng";

  // ---- Xử lý tìm kiếm
  const handleSearch = (value) => {
    setKeyword(value);
    if (!value.trim()) {
      setKetQuaBoThe([]);
      setKetQuaLop([]);
      return;
    }
    const boThe = JSON.parse(localStorage.getItem("boThe") || "[]");
    const lop = JSON.parse(localStorage.getItem("lop") || "[]");

    const boTheFilter = boThe.filter((item) =>
      item.tenBoThe?.toLowerCase().includes(value.toLowerCase())
    );
    const lopFilter = lop.filter((item) =>
      item.tenLop?.toLowerCase().includes(value.toLowerCase())
    );

    setKetQuaBoThe(boTheFilter);
    setKetQuaLop(lopFilter);
  };

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

      <div className="search-section" ref={searchRef}>
        <FontAwesomeIcon icon={faSearch} className="icon search-icon" />
        <input
          type="search"
          placeholder="Tìm kiếm"
          className="search-input"
          value={keyword}
          onChange={(e) => {
            handleSearch(e.target.value);
            setShowSearch(true);
          }}
          onFocus={() => setShowSearch(true)}
        />
        {showSearch && keyword && (
          <div className="search-result">
            {ketQuaBoThe.length === 0 && ketQuaLop.length === 0 && (
              <p className="empty">Không tìm thấy kết quả</p>
            )}

            {ketQuaBoThe.length > 0 && (
              <div className="result-group">
                <h4>Bộ thẻ</h4>
                {ketQuaBoThe.map((item) => (
                  <div
                    key={item.idBoThe}
                    className="result-item"
                    onClick={() => {
                      navigate(`/flashcard/${item.idBoThe}`);
                      setShowSearch(false);
                      setKeyword("");
                    }}
                  >
                    📑 {item.tenBoThe}
                  </div>
                ))}
              </div>
            )}

            {ketQuaLop.length > 0 && (
              <div className="result-group">
                <h4>Lớp học</h4>
                {ketQuaLop.map((item) => (
                  <div
                    key={item.idLop}
                    className="result-item"
                    onClick={() => {
                      navigate(`/lop/${item.idLop}`);
                      setShowSearch(false);
                      setKeyword("");
                    }}
                  >
                    🏫 {item.tenLop}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="right-section">
        <div className="plus-container" ref={plusRef}>
          <FontAwesomeIcon
            icon={faCirclePlus}
            className="icon plus-icon"
            onClick={() => setShowplus((v) => !v)}
          />
          {showplus && (
            <div className="plus">
              <div
                className="plus-item"
                onClick={() => {
                  navigate("/newBoThe");
                  setShowplus(false);
                }}
              >
                <FontAwesomeIcon icon={faClone} />
                <span>Bộ thẻ mới</span>
              </div>
              <div
                className="plus-item"
                onClick={() => {
                  navigate("/newfolder");
                  setShowplus(false);
                }}
              >
                <FontAwesomeIcon icon={faFolderOpen} />
                <span>Thư mục mới</span>
              </div>
              {nguoiDungHienTai?.vaiTro === "GIANG_VIEN" && (
                <div
                  className="plus-item"
                  onClick={() => {
                    navigate("/newclass");
                    setShowplus(false);
                  }}
                >
                  <FontAwesomeIcon icon={faBookOpen} />
                  <span>Lớp học mới</span>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="btn-upgrade" onClick={() => navigate("/tra-phi")}>
          Nâng cấp tài khoản
        </button>

        <div className="inforContainer" ref={menuRef}>
          <img
            src={avatarSrc}
            alt="avatar"
            className="avatar"
            onClick={() => setShow((v) => !v)}
          />

          {show && (
            <div className="setting">
              <div className="infor">
                <img src={avatarSrc} alt="avatar" className="avatar" />
                <h2 className="tittle">{tenNguoiDung}</h2>
              </div>

              <div className="divide"></div>

              <div
                className="confirg"
                onClick={() => {
                  setShow(false);
                  navigate("/setting");
                }}
              >
                <FontAwesomeIcon icon={faGear} className="icon icon-setting" />
                <span className="confirg-text">Cài đặt</span>
              </div>

              <div className="divide"></div>

              <div className="loggout" onClick={logout}>
                Đăng xuất
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
