// src/components/Header/Header.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBookOpen,
  faCirclePlus,
  faGear,
  faFolderOpen,
  faClone,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import "./header.css";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import AIButton from "../../Admin/AIButton/AIButton";
import { useSession } from "../../../providers/AuthProvider";
import { auth, db } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

// === Helpers Firestore ===
async function hasActiveSub(uid) {
  if (!uid) return false;
  const now = new Date();
  const q = query(
    collection(db, "subscriptions"),
    where("userId", "==", uid),
    where("status", "==", "active"),
    where("expiresAt", ">=", now) // expiresAt kiểu Timestamp
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

async function quickSearchBoThe(keyword) {
  // Đơn giản: fetch 1 lượt rồi lọc phía client (phù hợp dự án sinh viên/nhỏ)
  const snap = await getDocs(collection(db, "boThe"));
  const all = snap.docs.map((d) => ({ idBoThe: d.id, ...d.data() }));
  const k = keyword.trim().toLowerCase();
  return all.filter((x) => (x.tenBoThe || "").toLowerCase().includes(k));
}

async function quickSearchKhoaHoc(keyword) {
  const snap = await getDocs(collection(db, "khoaHoc"));
  const all = snap.docs.map((d) => ({ idKhoaHoc: d.id, ...d.data() }));
  const k = keyword.trim().toLowerCase();
  return all.filter((khoa) => {
    const byName = (khoa.tenKhoaHoc || "").toLowerCase().includes(k);
    const byTag =
      Array.isArray(khoa.kienThuc) &&
      khoa.kienThuc.some((t) => String(t).toLowerCase().includes(k));
    return byName || byTag;
  });
}

export default function Header() {
  const navigate = useNavigate();
  const { user, profile } = useSession();

  const [chatPro, setChatPro] = useState(false);
  const [prime, setPrime] = useState(false);

  const menuRef = useRef(null);
  const plusRef = useRef(null);
  const searchRef = useRef(null);

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search state
  const [keyword, setKeyword] = useState("");
  const [resCards, setResCards] = useState([]);   // boThe
  const [resCourses, setResCourses] = useState([]); // khoaHoc
  const [searching, setSearching] = useState(false);

  // 1) Tính Prime / ChatPro từ Firestore
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) {
        if (mounted) {
          setPrime(false);
          setChatPro(false);
        }
        return;
      }
      const ok = await hasActiveSub(user.uid);
      if (mounted) {
        setPrime(ok);
        setChatPro(ok); // nếu muốn: chỉ prime mới có AIButton
      }
    })();
    return () => (mounted = false);
  }, [user]);

  // 2) Đóng popup khi click ra ngoài
  useEffect(() => {
    const outside = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) setShowPlus(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  // 3) Tìm kiếm nhanh (Firestore)
  const doSearch = async (q) => {
    setKeyword(q);
    const k = q.trim();
    if (!k) {
      setResCards([]);
      setResCourses([]);
      return;
    }
    setSearching(true);
    try {
      const [cards, courses] = await Promise.all([
        quickSearchBoThe(k),
        quickSearchKhoaHoc(k),
      ]);
      setResCards(cards);
      setResCourses(courses);
    } finally {
      setSearching(false);
    }
  };

  // 4) Logout
  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("session"); // giữ tương thích phần code cũ nếu còn đọc session
    } finally {
      navigate("/dang-nhap", { replace: true });
    }
  };

  // avatar & tên hiển thị
  const avatarSrc = profile?.anhDaiDien || "";
  const displayName = profile?.tenNguoiDung || user?.email || "Người dùng";

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
          onChange={(e) => {
            doSearch(e.target.value);
            setShowSearch(true);
          }}
          onFocus={() => setShowSearch(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(`/timkiem/${keyword}`);
          }}
        />

        {showSearch && keyword && (
          <div className="search-result">
            {searching && <p className="empty">Đang tìm...</p>}

            {!searching && resCards.length === 0 && resCourses.length === 0 && (
              <p className="empty">Không tìm thấy kết quả</p>
            )}

            {!searching && resCards.length > 0 && (
              <div className="result-group">
                <h4>Bộ thẻ</h4>
                {resCards.map((item) => (
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

            {!searching && resCourses.length > 0 && (
              <div className="result-group">
                <h4>Khóa học</h4>
                {resCourses.map((item) => (
                  <div
                    key={item.idKhoaHoc}
                    className="result-item"
                    onClick={() => {
                      navigate(`/khoaHoc/${item.idKhoaHoc}`);
                      setShowSearch(false);
                      setKeyword("");
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
              <div
                className="plus-item"
                onClick={() => {
                  navigate("/newBoThe");
                  setShowPlus(false);
                }}
              >
                <FontAwesomeIcon icon={faClone} />
                <span>Bộ thẻ mới</span>
              </div>
              <div
                className="plus-item"
                onClick={() => {
                  navigate("/newfolder");
                  setShowPlus(false);
                }}
              >
                <FontAwesomeIcon icon={faFolderOpen} />
                <span>Thư mục mới</span>
              </div>
              {(profile?.vaiTro === "GIANG_VIEN" || profile?.vaiTro === "ADMIN") && (
                <div
                  className="plus-item"
                  onClick={() => {
                    navigate("/newKhoaHoc");
                    setShowPlus(false);
                  }}
                >
                  <FontAwesomeIcon icon={faBookOpen} />
                  <span>Khóa học mới</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chỉ Prime mới có AIButton (nếu muốn mở cho tất cả, thay chatPro bằng true) */}
        {chatPro && <AIButton />}

        <button className="btn-upgrade" onClick={() => navigate("/tra-phi")}>
          Nâng cấp tài khoản
        </button>

        {/* Account */}
        <div className="inforContainer" ref={menuRef}>
          <div className="avatar-wrapper" onClick={() => setShowMenu((v) => !v)}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="avatar" />
            ) : (
              <div className="avatar avatar-fallback">
                {(displayName || "U").charAt(0).toUpperCase()}
              </div>
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
                    <div className="avatar avatar-fallback">
                      {(displayName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  {prime && <span className="prime-badge" title="Tài khoản Prime">★</span>}
                </div>
                <h2 className="tittle">{displayName}</h2>
              </div>

              <div className="divide" />

              <div
                className="confirg"
                onClick={() => {
                  setShowMenu(false);
                  navigate("/setting");
                }}
              >
                <FontAwesomeIcon icon={faGear} className="icon icon-setting" />
                <span className="confirg-text">Cài đặt</span>
              </div>

              <div className="divide" />

              <div
                className="confirg"
                onClick={() => {
                  setShowMenu(false);
                  navigate("/lichSuThanhToan");
                }}
              >
                <FontAwesomeIcon icon={faReceipt} className="icon icon-setting" />
                <span className="confirg-text">Lịch sử thanh toán</span>
              </div>

              <div className="divide" />

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
