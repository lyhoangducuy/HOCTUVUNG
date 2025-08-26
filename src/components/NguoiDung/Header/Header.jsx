// src/components/Header/Header.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBookOpen,
  faCirclePlus,
  faGear,
  faClone,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import "./header.css";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

/* ===== Firestore helpers ===== */
const userRef = (id) => doc(db, "nguoiDung", String(id));
const boTheCol = () => collection(db, "boThe");
const khoaHocCol = () => collection(db, "khoaHoc");
const subCol = () => collection(db, "goiTraPhiCuaNguoiDung");

/* Nhận diện trạng thái đã hủy: không kén dấu/biến thể */
const isCanceled = (s) => {
  const t = String(s || "").toLowerCase();
  const noAccent = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t === "đã hủy" || noAccent === "da huy") return true;
  return (
    t.includes("hủy") ||
    t.includes("huỷ") ||
    noAccent.includes("huy") ||
    /cancel|canceled|cancelled/.test(noAccent)
  );
};

/* Chuyển mọi kiểu ngày -> Date */
const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (typeof v === "string") {
    // "dd/MM/yyyy" hoặc ISO
    const [d, m, y] = v.split("/").map(Number);
    if (y) return new Date(y, (m || 1) - 1, d || 1);
    const dISO = new Date(v);
    return isNaN(dISO) ? null : dISO;
  }
  return null;
};

export default function Header() {
  const navigate = useNavigate();

  const menuRef = useRef(null);
  const plusRef = useRef(null);
  const searchRef = useRef(null);
  const unsubSubRef = useRef(null); // giữ unsub của onSnapshot để huỷ khi nhận logout từ tab khác

  // user + prime
  const [user, setUser] = useState(null);
  const [prime, setPrime] = useState(false);

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search state
  const [keyword, setKeyword] = useState("");
  const [resCards, setResCards] = useState([]); // boThe
  const [resCourses, setResCourses] = useState([]); // khoaHoc

  /* 1) Nạp user từ Auth/Session + theo dõi Prime realtime */
  useEffect(() => {
    let unsubSub = null;

    const loadUserAndPrime = async () => {
      try {
        const ss = JSON.parse(sessionStorage.getItem("session") || "null");
        const uid = auth.currentUser?.uid || ss?.idNguoiDung;
        if (!uid) {
          setUser(null);
          setPrime(false);
          return;
        }

        // Lấy hồ sơ người dùng
        const snap = await getDoc(userRef(uid));
        if (snap.exists()) setUser(snap.data());
        else setUser({ idNguoiDung: uid, tenNguoiDung: "Người dùng" });

        // Realtime theo dõi mọi sub của user (KHÔNG lọc theo ngày ở query để chắc chắn nhận được cập nhật hủy)
        const qSubs = query(subCol(), where("idNguoiDung", "==", String(uid)));
        unsubSub = onSnapshot(qSubs, (ssnap) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const hasActive = ssnap.docs.some((d) => {
            const row = d.data();
            if (isCanceled(row?.status)) return false;
            const end = toDateFlexible(row?.NgayKetThuc);
            if (!(end instanceof Date) || isNaN(end)) return false;
            end.setHours(0, 0, 0, 0);
            return end >= today;
          });

          setPrime(hasActive);
        });
        unsubSubRef.current = unsubSub;
      } catch {
        setUser(null);
        setPrime(false);
      }
    };

    loadUserAndPrime();
    return () => {
      if (unsubSub) unsubSub();
      unsubSubRef.current = null;
    };
  }, []);

  /* 2) Đóng popup khi click ra ngoài */
  useEffect(() => {
    const outside = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) setShowPlus(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  /* 3) Tìm kiếm nhanh (boThe + khoaHoc) – lọc client */
  const doSearch = async (q) => {
    setKeyword(q);
    const queryText = q.trim().toLowerCase();
    if (!queryText) {
      setResCards([]);
      setResCourses([]);
      return;
    }

    try {
      // Lấy một lượng giới hạn rồi lọc client
      const [cardsSnap, coursesSnap] = await Promise.all([
        getDocs(query(boTheCol(), limit(50))),
        getDocs(query(khoaHocCol(), limit(50))),
      ]);

      const cards = cardsSnap.docs
        .map((d) => d.data())
        .filter((x) => (x.tenBoThe || "").toLowerCase().includes(queryText));

      const courses = coursesSnap.docs
        .map((d) => d.data())
        .filter((k) => {
          const byName = (k.tenKhoaHoc || "").toLowerCase().includes(queryText);
          const byTag =
            Array.isArray(k.kienThuc) &&
            k.kienThuc.some((t) => String(t).toLowerCase().includes(queryText));
          return byName || byTag;
        });

      setResCards(cards);
      setResCourses(courses);
    } catch {
      setResCards([]);
      setResCourses([]);
    }
  };

  /* 4) Logout (Auth) — đồng bộ đa tab bằng localStorage 'auth:logout' */
  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      sessionStorage.removeItem("session");
      localStorage.setItem("auth:logout", String(Date.now())); // 🔔 phát tín hiệu cho tab khác
      navigate("/dang-nhap", { replace: true });
    }
  };

  // avatar & tên hiển thị
  const avatarSrc = user?.anhDaiDien || "";
  const displayName = user?.tenNguoiDung || "Người dùng";

  /* 5) Nghe tín hiệu logout từ tab khác */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "auth:logout") {
        sessionStorage.removeItem("session");
        unsubSubRef.current?.(); // huỷ theo dõi realtime nếu có
        unsubSubRef.current = null;

        setUser(null);
        setPrime(false);
        setShowMenu(false);
        setShowPlus(false);
        setShowSearch(false);

        navigate("/dang-nhap", { replace: true });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate]);

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
            if (e.key === "Enter") {
              setShowSearch(false);
              navigate(`/timkiem/${keyword}`);
            }
          }}
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
                      setShowSearch(false);
                      setKeyword("");
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
              {(user?.vaiTro === "GIANG_VIEN" || user?.vaiTro === "ADMIN") && (
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

        {/* Ẩn nút nâng cấp nếu đã có gói hoạt động */}
        {!prime && (
          <button className="btn-upgrade" onClick={() => navigate("/tra-phi")}>
            Nâng cấp tài khoản
          </button>
        )}

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
