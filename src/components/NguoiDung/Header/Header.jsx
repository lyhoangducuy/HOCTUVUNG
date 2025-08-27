// src/components/Header/Header.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBookOpen,
  faCirclePlus,
  faGear,
  faClone,
  faReceipt,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import "./header.css";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../../../../lib/firebase";
import {
  collection,
  doc,
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

/* Trạng thái hủy */
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

/* Chuẩn hóa ngày */
const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (typeof v === "string") {
    const [d, m, y] = v.split("/").map(Number);
    if (y) return new Date(y, (m || 1) - 1, d || 1);
    const dISO = new Date(v);
    return isNaN(dISO) ? null : dISO;
  }
  return null;
};

/* Format tiền VND ngắn gọn: 12.345đ */
const formatVND = (val) => {
  const n = Number(val || 0);
  return `${n.toLocaleString("vi-VN")}đ`;
};

export default function Header() {
  const navigate = useNavigate();

  const menuRef = useRef(null);
  const plusRef = useRef(null);
  const searchRef = useRef(null);
  const unsubSubRef = useRef(null);
  const unsubUserRef = useRef(null);

  // user + prime
  const [user, setUser] = useState(null);
  const [prime, setPrime] = useState(false);

  // UI
  const [showMenu, setShowMenu] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search
  const [keyword, setKeyword] = useState("");
  const [resCards, setResCards] = useState([]);
  const [resCourses, setResCourses] = useState([]);

  /* 1) Nạp user + theo dõi số dư & prime realtime */
  useEffect(() => {
    let unsubSub = null;

    const init = async () => {
      const ss = JSON.parse(sessionStorage.getItem("session") || "null");
      const uid = auth.currentUser?.uid || ss?.idNguoiDung;
      if (!uid) {
        setUser(null);
        setPrime(false);
        return;
      }

      // 🔴 Realtime hồ sơ user (để số dư cập nhật trực tiếp)
      unsubUserRef.current = onSnapshot(
        userRef(uid),
        (snap) => {
          if (snap.exists()) {
            setUser({ idNguoiDung: uid, ...snap.data() });
          } else {
            setUser({ idNguoiDung: uid, tenNguoiDung: "Người dùng", soDu: 0 });
          }
        },
        () => setUser({ idNguoiDung: uid, tenNguoiDung: "Người dùng", soDu: 0 })
      );

      // Realtime gói đang hoạt động
      const qSubs = query(subCol(), where("idNguoiDung", "==", String(uid)));
      unsubSub = onSnapshot(
        qSubs,
        (ssnap) => {
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
        },
        () => setPrime(false)
      );
      unsubSubRef.current = unsubSub;
    };

    init();
    return () => {
      unsubSub?.();
      unsubSubRef.current = null;
      unsubUserRef.current?.();
      unsubUserRef.current = null;
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

  /* 3) Search nhanh (client filter) */
  const doSearch = async (q) => {
    setKeyword(q);
    const queryText = q.trim().toLowerCase();
    if (!queryText) {
      setResCards([]);
      setResCourses([]);
      return;
    }
    try {
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

  /* 4) Logout */
  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      sessionStorage.removeItem("session");
      localStorage.setItem("auth:logout", String(Date.now()));
      navigate("/dang-nhap", { replace: true });
    }
  };

  const avatarSrc = user?.anhDaiDien || "";
  const displayName = user?.tenNguoiDung || "Người dùng";
  const balanceText = formatVND(user?.soDu);

  /* 5) Đồng bộ logout đa tab */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "auth:logout") {
        sessionStorage.removeItem("session");
        unsubSubRef.current?.();
        unsubSubRef.current = null;
        unsubUserRef.current?.();
        unsubUserRef.current = null;

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

        {/* Nâng cấp (ẩn nếu Prime) */}
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

              {/* SỐ DƯ — realtime từ user.soDu */}
              <div
                className="confirg"
                onClick={() => {
                  setShowMenu(false);
                  navigate("/so-du");
                }}
              >
                <FontAwesomeIcon icon={faWallet} className="icon icon-setting" />
                <span className="confirg-text">Số dư</span>
                <span className="balance-text" style={{ marginLeft: 8, fontWeight: 600 }}>
                  {balanceText}
                </span>
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
