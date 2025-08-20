// src/components/Header/Header.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBookOpen, faCirclePlus, faGear, faFolderOpen, faClone } from "@fortawesome/free-solid-svg-icons";
import "./header.css";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Helpers an toàn */
const readJSON = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const parseVNDate = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
};
const checkPrime = (userId) => {
  const list = readJSON("goiTraPhiCuaNguoiDung", []);
  const today = new Date();
  return list.some((s) => {
    if (s.idNguoiDung !== userId) return false;
    const end = parseVNDate(s.NgayKetThuc);
    return end && end >= today;
  });
};

export default function Header() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const plusRef = useRef(null);
  const searchRef = useRef(null);

  const [user, setUser] = useState(null);
  const [prime, setPrime] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [resCard, setResCard] = useState([]);
  const [resClass, setResClass] = useState([]);

  // Nạp user + prime (và tự reload khi storage hoặc app bắn event)
  useEffect(() => {
    const load = () => {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!ss?.idNguoiDung) {
        setUser(null);
        setPrime(false);
        return;
      }
      const ds = readJSON("nguoiDung", []);
      const u = ds.find((x) => x.idNguoiDung === ss.idNguoiDung) || null;
      setUser(u);
      setPrime(checkPrime(ss.idNguoiDung));
    };

    load();

    const onStorage = (e) => {
      if (!e || !e.key || ["nguoiDung", "goiTraPhiCuaNguoiDung"].includes(e.key)) load();
    };
    const onSubChanged = () => load();   // event tự đặt để cập nhật ngay trong cùng tab
    const onDangKy = () => load();       // alias khi bạn dispatch "dangkytraphi"

    window.addEventListener("storage", onStorage);
    window.addEventListener("subscriptionChanged", onSubChanged);
    window.addEventListener("dangkytraphi", onDangKy);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("subscriptionChanged", onSubChanged);
      window.removeEventListener("dangkytraphi", onDangKy);
    };
  }, []);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const outside = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) setShowPlus(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  // Search đơn giản
  const doSearch = (q) => {
    setKeyword(q);
    if (!q.trim()) {
      setResCard([]);
      setResClass([]);
      return;
    }
    const ql = q.toLowerCase();
    const cards = readJSON("boThe", []).filter((x) => x.tenBoThe?.toLowerCase().includes(ql));
    const classes = readJSON("lop", []).filter((x) => x.tenLop?.toLowerCase().includes(ql));
    setResCard(cards);
    setResClass(classes);
  };

  const logout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  const avatarSrc = user?.anhDaiDien || ""; // để trống nếu không có URL
  const displayName = user?.tenNguoiDung || "Người dùng";

  return (
    <div className="header-container">
      {/* Left */}
      <div className="left-section">
        <FontAwesomeIcon icon={faBars} className="icon menu-icon" />
        <FontAwesomeIcon
          icon={faBookOpen}
          className="icon book-icon"
          onClick={() => navigate("/giangvien")}
        />
      </div>

      {/* Search */}
      <div className="search-section" ref={searchRef}>
        <input
          type="search"
          placeholder="Tìm kiếm"
          className="search-input"
          value={keyword}
          onChange={(e) => { doSearch(e.target.value); setShowSearch(true); }}
          onFocus={() => setShowSearch(true)}
          onKeyDown={(e) => { if (e.key === "Enter") navigate(`/timkiem/${encodeURIComponent(keyword)}`); }}
        />
        {showSearch && keyword && (
          <div className="search-result">
            {resCard.length === 0 && resClass.length === 0 && (
              <p className="empty">Không tìm thấy kết quả</p>
            )}
            {resCard.length > 0 && (
              <div className="result-group">
                <h4>Bộ thẻ</h4>
                {resCard.map((item) => (
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
            {resClass.length > 0 && (
              <div className="result-group">
                <h4>Lớp học</h4>
                {resClass.map((item) => (
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

      {/* Right */}
      <div className="right-section">
        {/* Plus */}
        <div className="plus-container" ref={plusRef}>
          <FontAwesomeIcon
            icon={faCirclePlus}
            className="icon plus-icon"
            onClick={() => setShowPlus((v) => !v)}
          />
          {showPlus && (
            <div className="plus">
              <div className="plus-item" onClick={() => { navigate("/newBoThe"); setShowPlus(false); }}>
                <FontAwesomeIcon icon={faClone} />
                <span>Bộ thẻ mới</span>
              </div>
              <div className="plus-item" onClick={() => { navigate("/newfolder"); setShowPlus(false); }}>
                <FontAwesomeIcon icon={faFolderOpen} />
                <span>Thư mục mới</span>
              </div>
              {user?.vaiTro === "GIANG_VIEN" && (
                <div className="plus-item" onClick={() => { navigate("/newclass"); setShowPlus(false); }}>
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

        {/* Account */}
        <div className="inforContainer" ref={menuRef}>
          <div className="avatar-wrapper" onClick={() => setShowMenu((v) => !v)}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="avatar" />
            ) : (
              <div className="avatar avatar-fallback">{(displayName || "U").charAt(0).toUpperCase()}</div>
            )}
            {prime && <span className="prime-badge" title="Tài khoản Prime">★</span>}
          </div>

          {showMenu && (
            <div className="setting">
              <div className="infor">
                <div className="avatar-wrapper">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="avatar" />
                  ) : (
                    <div className="avatar avatar-fallback">{(displayName || "U").charAt(0).toUpperCase()}</div>
                  )}
                  {prime && <span className="prime-badge" title="Tài khoản Prime">★</span>}
                </div>
                <h2 className="tittle">{displayName}</h2>
              </div>

              <div className="divide" />

              <div className="confirg" onClick={() => { setShowMenu(false); navigate("/setting"); }}>
                <FontAwesomeIcon icon={faGear} className="icon icon-setting" />
                <span className="confirg-text">Cài đặt</span>
              </div>

              <div className="divide" />

              <div className="loggout" onClick={logout}>Đăng xuất</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
