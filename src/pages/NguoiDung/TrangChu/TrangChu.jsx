// src/pages/Home/TrangChu.jsx
import React, { useEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./TrangChu.css";
// Lazy load AIButton để giảm bundle ban đầu
const AIButton = lazy(() => import("../../../components/Admin/AIButton/AIButton"));

import { auth, db } from "../../../../lib/firebase";
import { collection, getDocs, onSnapshot, orderBy, limit, query, where, documentId } from "firebase/firestore";

export default function TrangChu() {
  const navigate = useNavigate();

  // ====== STATE ======
  const [ganDay, setGanDay] = useState([]);   // 6 bộ thẻ mới
  const [phoBien, setPhoBien] = useState([]); // 8 bộ thẻ công khai, lượt học cao nhất
  const [userMap, setUserMap] = useState({}); // {uid: {tenNguoiDung, anhDaiDien}}
  const userMapRef = useRef({});              // cache để tránh tải lại profile đã có
  const [prime, setPrime] = useState(false);

  // ====== HELPERS ======
  const parseVNDate = (dmy) => {
    if (!dmy || typeof dmy !== "string") return null; // "dd/mm/yyyy"
    const [d, m, y] = dmy.split("/").map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const denHoc = (id) => navigate(`/flashcard/${id}`);

  // ====== RECENT: vẫn realtime nhưng giới hạn nhỏ ======
  useEffect(() => {
    const qRecent = query(collection(db, "boThe"), orderBy("idBoThe", "desc"), limit(6));
    const unsubRecent = onSnapshot(qRecent, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          soTu:
            typeof data.soTu === "number"
              ? data.soTu
              : Array.isArray(data.danhSachThe)
              ? data.danhSachThe.length
              : 0,
          luotHoc: Number(data.luotHoc || 0),
        };
      });
      setGanDay(items);
    });
    return () => unsubRecent();
  }, []);

  // ====== POPULAR: chỉ load khi vào + có sự kiện cập nhật, có Fallback khi thiếu index ======
useEffect(() => {
  let cancelled = false;

  const mapSnap = (snap) =>
    snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        soTu:
          typeof data.soTu === "number"
            ? data.soTu
            : Array.isArray(data.danhSachThe)
            ? data.danhSachThe.length
            : 0,
        luotHoc: Number(data.luotHoc || 0),
      };
    });

  const fetchPopular = async () => {
    try {
      // Truy vấn chuẩn (cần composite index): cheDo == 'cong_khai' + orderBy luotHoc desc
      const qPopular = query(
        collection(db, "boThe"),
        where("cheDo", "==", "cong_khai"),
        orderBy("luotHoc", "desc"),
        limit(8)
      );
      const snap = await getDocs(qPopular);
      if (cancelled) return;
      setPhoBien(mapSnap(snap));
    } catch (e) {
      // Fallback khi thiếu index: lấy top theo luotHoc rồi lọc công khai trên client
      if (e?.code === "failed-precondition" && /index/i.test(e?.message || "")) {
        console.warn("Composite index chưa tạo, dùng fallback client-side filter.");
        try {
          // Lấy nhiều hơn (vd 64) để đảm bảo đủ 8 công khai sau khi lọc
          const qNoFilter = query(
            collection(db, "boThe"),
            orderBy("luotHoc", "desc"),
            limit(64)
          );
          const snap2 = await getDocs(qNoFilter);
          if (cancelled) return;
          const all = mapSnap(snap2)
            .filter((x) => x.cheDo === "cong_khai")
            .slice(0, 8);
          setPhoBien(all);
        } catch (e2) {
          console.error("Fallback fetch failed:", e2);
          if (!cancelled) setPhoBien([]);
        }
      } else {
        console.error("Fetch popular failed:", e);
        if (!cancelled) setPhoBien([]);
      }
    }
  };

  fetchPopular();
  const onChanged = () => fetchPopular();
  window.addEventListener("boTheUpdated", onChanged);

  return () => {
    cancelled = true;
    window.removeEventListener("boTheUpdated", onChanged);
  };
}, []);

  // ====== FETCH AUTHORS (nguoiDung) — chỉ tải UID CHƯA CÓ, chạy song song ======
  useEffect(() => {
    const ownerIdsAll = [...ganDay, ...phoBien]
      .map((b) => (b?.idNguoiDung != null ? String(b.idNguoiDung) : null))
      .filter(Boolean);

    const unique = Array.from(new Set(ownerIdsAll));
    const missing = unique.filter((uid) => !userMapRef.current[uid]);
    if (missing.length === 0) return;

    // Firestore 'in' chỉ tối đa 10 phần tử/lần → chia lô
    const chunks = [];
    for (let i = 0; i < missing.length; i += 10) chunks.push(missing.slice(i, i + 10));

    (async () => {
      try {
        const results = await Promise.all(
          chunks.map((chunk) =>
            getDocs(
              query(collection(db, "nguoiDung"), where(documentId(), "in", chunk))
            )
          )
        );

        const nextMap = { ...userMapRef.current };
        results.forEach((rs) => {
          rs.forEach((d) => (nextMap[d.id] = d.data()));
        });
        userMapRef.current = nextMap;
        setUserMap(nextMap);
      } catch (e) {
        console.error("Fetch authors failed:", e);
      }
    })();
  }, [ganDay, phoBien]);

  // ====== PRIME: đọc gói đang hoạt động từ goiTraPhiCuaNguoiDung ======
  useEffect(() => {
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    const uid = auth.currentUser?.uid || session?.idNguoiDung || null;
    if (!uid) {
      setPrime(false);
      return;
    }

    const qSub = query(
      collection(db, "goiTraPhiCuaNguoiDung"),
      where("idNguoiDung", "==", String(uid))
    );

    const unsub = onSnapshot(
      qSub,
      (snap) => {
        const today = new Date();
        const active = snap.docs.some((d) => {
          const s = d.data();
          if (s?.status === "Đã hủy") return false;
          const end = parseVNDate(s?.NgayKetThuc);
          return end && end >= today;
        });
        setPrime(active);
      },
      () => setPrime(false)
    );

    return () => unsub();
  }, []);

  const withAuthor = (item) => {
    const u = userMap[String(item.idNguoiDung)] || {};
    return {
      ...item,
      _tenNguoiTao: u.tenNguoiDung || "Ẩn danh",
      _anhNguoiTao: u.anhDaiDien || "",
    };
  };

  return (
    <div className="home-wrap">
      {/* Nút AI: chỉ tải khi Prime (lazy) */}
      {prime && (
        <div className="ai-strip">
          <Suspense fallback={null}>
            <AIButton />
          </Suspense>
        </div>
      )}

      {/* HỌC GẦN ĐÂY */}
      <section className="block">
        <div className="block-head">
          <h2 className="block-title">Học gần đây</h2>
        </div>

        {ganDay.length === 0 ? (
          <div className="empty">Chưa có bộ thẻ nào. Hãy tạo bộ thẻ mới!</div>
        ) : (
          <ul className="recent-list">
            {ganDay.map((raw) => {
              const item = withAuthor(raw);
              return (
                <li
                  key={item.idBoThe}
                  className="recent-item"
                  onClick={() => denHoc(item.idBoThe)}
                >
                  <FontAwesomeIcon icon={faBook} className="icon-book" />
                  <span className="recent-name">
                    {item.tenBoThe || `Bộ thẻ #${item.idBoThe}`}
                  </span>
                  <span className="recent-count">{item.soTu ?? 0} từ</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* BỘ THẺ PHỔ BIẾN (công khai, lượt học cao nhất) */}
      <section className="block">
        <div className="block-head">
          <h2 className="block-title">Bộ thẻ phổ biến</h2>
        </div>

        {phoBien.length === 0 ? (
          <div className="empty">Chưa có dữ liệu để hiển thị.</div>
        ) : (
          <div className="mini-grid">
            {phoBien.map((raw) => {
              const item = withAuthor(raw);
              return (
                <div
                  key={item.idBoThe}
                  className="mini-card"
                  onClick={() => denHoc(item.idBoThe)}
                >
                  <div className="mini-title">{item.tenBoThe || "Không tên"}</div>
                  <div className="mini-sub">
                    {item.soTu ?? 0} thẻ • {item.luotHoc ?? 0} lượt học
                  </div>

                  <div className="mini-meta" onClick={(e) => e.stopPropagation()}>
                    <div
                      className="mini-avatar"
                      style={
                        item._anhNguoiTao
                          ? { backgroundImage: `url(${item._anhNguoiTao})` }
                          : {}
                      }
                    />
                    <span className="mini-name">{item._tenNguoiTao}</span>
                  </div>

                  <div className="mini-actions">
                    <button
                      className="btn ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        denHoc(item.idBoThe);
                      }}
                    >
                      Học
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* Trợ lý hướng dẫn sử dụng */}
      
    </div>
  );
}
