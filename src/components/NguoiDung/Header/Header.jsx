// src/components/Header/Header.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBookOpen, faCirclePlus, faGear, faFolderOpen, faClone, faReceipt } from "@fortawesome/free-solid-svg-icons";
import "./header.css";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AIButton from "../../Admin/AIButton/AIButton";

/* helpers   */
const readJSON = (key, fallback = []) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const parseVNDate = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;            // "dd/mm/yyyy"
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
};
// Prime: đúng user + chưa "Đã hủy" + còn hạn
const isPrime = (userId) => {
  const list = readJSON("goiTraPhiCuaNguoiDung", []);
  const today = new Date();
  return list.some((p) => {
    if (p.idNguoiDung !== userId) return false;
    if (p.status === "Đã hủy") return false;
    const end = parseVNDate(p.NgayKetThuc);
    return end && end >= today;
  });
};

export default function Header() {
  const navigate = useNavigate();

  // refs để đóng popup khi click ra ngoài
  const menuRef = useRef(null);
  const plusRef = useRef(null);
  const searchRef = useRef(null);

  // user + prime
  const [user, setUser] = useState(null);
  const [prime, setPrime] = useState(false);

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search state
  const [keyword, setKeyword] = useState("");
  const [resCards, setResCards] = useState([]);      // bộ thẻ
  const [resCourses, setResCourses] = useState([]);  // khóa học

  /*  1) Nạp user + prime  */
  useEffect(() => {
    const load = () => {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!ss?.idNguoiDung) { setUser(null); setPrime(false); return; }
      const users = readJSON("nguoiDung", []);
      const u = users.find(x => x.idNguoiDung === ss.idNguoiDung) || null;
      setUser(u);
      setPrime(isPrime(ss.idNguoiDung));
    };
    load();

    // Nếu dữ liệu đổi từ tab khác -> cập nhật
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (["nguoiDung", "goiTraPhiCuaNguoiDung"].includes(e.key)) load();
    };
    const onDangKy = () => load();
    window.addEventListener("subscriptionChanged", onDangKy);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("subscriptionChanged", onDangKy);
    }
  }, []);

  /*2) Đóng popup khi click ra ngoài*/
  useEffect(() => {
    const outside = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) setShowPlus(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  /*  3) Tìm kiếm nhanh (boThe + khoaHoc)
     - Đơn giản: match theo tên (và với khóa học, có match thêm tag "kienThuc")
  */
  const doSearch = (q) => {
    setKeyword(q);
    const query = q.trim().toLowerCase();
    if (!query) { setResCards([]); setResCourses([]); return; }

    const cards = readJSON("boThe", []).filter(
      (x) => (x.tenBoThe || "").toLowerCase().includes(query)
    );

    const courses = readJSON("khoaHoc", []).filter((k) => {
      const byName = (k.tenKhoaHoc || "").toLowerCase().includes(query);
      const byTag = Array.isArray(k.kienThuc) && k.kienThuc.some(t => String(t).toLowerCase().includes(query));
      return byName || byTag;
    });

    setResCards(cards);
    setResCourses(courses);
  };

  /* 4) Logout  */
  const logout = () => {
    sessionStorage.clear();
    navigate("/dang-nhap", { replace: true });
  };

  const avatarSrc = user?.anhDaiDien || "";
  const displayName = user?.tenNguoiDung || "Người dùng";

  return (
    <div className="header-container">
      {/* Left */}
      <div className="left-section">
        <FontAwesomeIcon icon={faBars} className="icon menu-icon" />
        <FontAwesomeIcon
          icon={faBookOpen}
          className="icon book-icon"
          onClick={() => navigate("/trangchu")}
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
          onKeyDown={(e) => { if (e.key === "Enter") navigate(`/timkiem/${keyword}`); }}
        />

        {showSearch && keyword && (
          <div className="search-result">
            {resCards.length === 0 && resCourses.length === 0 && (
              <p className="empty">Không tìm thấy kết quả</p>
            )}

            {resCards.length > 0 && (
              <div className="result-group">
                <h4>Bộ thẻ</h4>
                {resCards.map((item) => (
                  <div
                    key={item.idBoThe}
                    className="result-item"
                    onClick={() => {
                      navigate(`/flashcard/${item.idBoThe}`);
                      setShowSearch(false); setKeyword("");
                    }}
                  >
                    📑 {item.tenBoThe}
                  </div>
                ))}
              </div>
            )}

            {resCourses.length > 0 && (
              <div className="result-group">
                <h4>Khóa học</h4>
                {resCourses.map((item) => (
                  <div
                    key={item.idKhoaHoc}
                    className="result-item"
                    onClick={() => {
                      // vẫn dùng /lop/:id để vào trang chi tiết (component đã đọc từ "khoaHoc")
                      navigate(`/khoaHoc/${item.idKhoaHoc}`);
                      setShowSearch(false); setKeyword("");
                    }}
                  >
                    🏫 {item.tenKhoaHoc}
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
              {user?.vaiTro === "GIANG_VIEN" || user?.vaiTro === "ADMIN" && (
                <div className="plus-item" onClick={() => { navigate("/newKhoaHoc"); setShowPlus(false); }}>
                  <FontAwesomeIcon icon={faBookOpen} />
                  <span>Khóa học mới</span>
                </div>
              )}
            </div>
          )}
        </div>
          <AIButton/>
        <button className="btn-upgrade" onClick={() => navigate("/tra-phi")}>
          Nâng cấp tài khoản
        </button>

        {/* Account */}
        <div className="inforContainer" ref={menuRef}>
          <div className="avatar-wrapper" onClick={() => setShowMenu((v) => !v)}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="avatar" />
              : <div className="avatar avatar-fallback">{(displayName || "U").charAt(0).toUpperCase()}</div>
            }
            {prime && <span className="prime-badge" title="Tài khoản Prime">★</span>}
          </div>

          {showMenu && (
            <div className="setting">
              <div className="infor">
                <div className="avatar-wrapper">
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar" className="avatar" />
                    : <div className="avatar avatar-fallback">{(displayName || "U").charAt(0).toUpperCase()}</div>
                  }
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
              <div className="confirg" onClick={() => { setShowMenu(false); navigate("/lichSuThanhToan"); }}>
                <FontAwesomeIcon icon={faReceipt} className="icon icon-setting" />
                <span className="confirg-text">Lịch sử thanh toán</span>
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
