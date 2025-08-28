import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../../../../../lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
import "../header.css";

// Firestore helpers
const boTheCol = () => collection(db, "boThe");
const khoaHocCol = () => collection(db, "khoaHoc");

// Highlight từ khóa khớp
function Highlight({ text = "", keyword = "" }) {
  const kw = String(keyword || "").trim();
  if (!kw) return <>{text}</>;
  const lower = String(text || "").toLowerCase();
  const idx = lower.indexOf(kw.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + kw.length);
  const after = text.slice(idx + kw.length);
  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  );
}

export default function SearchBox({ navigate }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  // Chỉ nạp 1 lần, sau đó lọc client
  const [cardsIndex, setCardsIndex] = useState([]);   // all fetched cards
  const [coursesIndex, setCoursesIndex] = useState([]); // all fetched courses
  const [resCards, setResCards] = useState([]);       // filtered
  const [resCourses, setResCourses] = useState([]);   // filtered

  // Điều hướng bằng bàn phím
  const [activeIdx, setActiveIdx] = useState(-1); // index trong mảng flatten

  // Click ra ngoài -> đóng
  useEffect(() => {
    const outside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  // Prefetch khi cần
  const ensureIndexLoaded = async () => {
    if (cardsIndex.length > 0 || coursesIndex.length > 0) return;
    setLoading(true);
    try {
      const [cardsSnap, coursesSnap] = await Promise.all([
        getDocs(query(boTheCol(), limit(80))),     // tăng/giảm tùy nhu cầu
        getDocs(query(khoaHocCol(), limit(80))),
      ]);
      setCardsIndex(cardsSnap.docs.map((d) => d.data()));
      setCoursesIndex(coursesSnap.docs.map((d) => d.data()));
    } catch {
      setCardsIndex([]);
      setCoursesIndex([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce lọc client
  useEffect(() => {
    const q = String(keyword || "").trim().toLowerCase();
    if (!q) {
      setResCards([]);
      setResCourses([]);
      setActiveIdx(-1);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      await ensureIndexLoaded(); // đảm bảo đã prefetch
      if (cancelled) return;

      const filterText = (v) => String(v || "").toLowerCase().includes(q);
      const cards = cardsIndex
        .filter((x) => filterText(x.tenBoThe) || filterText(x.moTa))
        .slice(0, 8);

      const courses = coursesIndex
        .filter((k) => {
          const byName = filterText(k.tenKhoaHoc);
          const byTag =
            Array.isArray(k.kienThuc) &&
            k.kienThuc.some((t) => filterText(String(t)));
          return byName || byTag || filterText(k.moTa);
        })
        .slice(0, 8);

      setResCards(cards);
      setResCourses(courses);
      setActiveIdx(-1);
    }, 250); // debounce 250ms

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Gộp list để điều hướng mũi tên
  const flatResults = useMemo(() => {
    const a = resCards.map((item) => ({ type: "card", id: item.idBoThe, item }));
    const b = resCourses.map((item) => ({ type: "course", id: item.idKhoaHoc, item }));
    return [...a, ...b];
  }, [resCards, resCourses]);

  const selectActive = () => {
    const chosen = flatResults[activeIdx];
    if (!chosen) {
      // Không chọn item -> chuyển sang trang tìm kiếm tổng hợp
      if (keyword.trim()) navigate(`/timkiem/${keyword.trim()}`);
      setOpen(false);
      setActiveIdx(-1);
      return;
    }
    if (chosen.type === "card") {
      navigate(`/flashcard/${chosen.item.idBoThe}`);
    } else {
      navigate(`/khoaHoc/${chosen.item.idKhoaHoc}`);
    }
    setOpen(false);
    setKeyword("");
    setActiveIdx(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectActive();
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  return (
    <div className="search-section" ref={rootRef}>
      <input
        type="search"
        placeholder="Tìm kiếm"
        className="search-input"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && (
        <div className="search-result">
          {/* Loading */}
          {loading && (
            <div className="result-group">
              <div className="result-item">Đang tải dữ liệu...</div>
            </div>
          )}

          {/* Không nhập từ khóa */}
          {!loading && !keyword.trim() && (
            <p className="empty">Nhập từ khóa để tìm kiếm</p>
          )}

          {/* Không có kết quả */}
          {!loading &&
            keyword.trim() &&
            resCards.length === 0 &&
            resCourses.length === 0 && (
              <p className="empty">Không tìm thấy kết quả</p>
            )}

          {/* Bộ thẻ */}
          {!loading && resCards.length > 0 && (
            <div className="result-group">
              <h4>Bộ thẻ</h4>
              {resCards.map((item, idx) => {
                const flatIndex = idx; // index trong flatResults (cards đứng trước)
                const active = activeIdx === flatIndex;
                return (
                  <div
                    key={item.idBoThe}
                    className="result-item"
                    style={active ? { background: "color-mix(in srgb, var(--brand) 8%, transparent)" } : {}}
                    onMouseEnter={() => setActiveIdx(flatIndex)}
                    onMouseLeave={() => setActiveIdx(-1)}
                    onClick={() => {
                      navigate(`/flashcard/${item.idBoThe}`);
                      setOpen(false);
                      setKeyword("");
                      setActiveIdx(-1);
                    }}
                  >
                    📑 <Highlight text={item.tenBoThe} keyword={keyword} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Khóa học */}
          {!loading && resCourses.length > 0 && (
            <div className="result-group">
              <h4>Khóa học</h4>
              {resCourses.map((item, idx) => {
                const flatIndex = resCards.length + idx; // sau cards
                const active = activeIdx === flatIndex;
                return (
                  <div
                    key={item.idKhoaHoc}
                    className="result-item"
                    style={active ? { background: "color-mix(in srgb, var(--brand) 8%, transparent)" } : {}}
                    onMouseEnter={() => setActiveIdx(flatIndex)}
                    onMouseLeave={() => setActiveIdx(-1)}
                    onClick={() => {
                      navigate(`/khoaHoc/${item.idKhoaHoc}`);
                      setOpen(false);
                      setKeyword("");
                      setActiveIdx(-1);
                    }}
                  >
                    🏫 <Highlight text={item.tenKhoaHoc} keyword={keyword} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
