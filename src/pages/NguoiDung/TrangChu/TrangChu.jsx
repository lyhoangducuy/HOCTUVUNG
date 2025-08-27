import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./TrangChu.css";
import AIButton from "../../../components/Admin/AIButton/AIButton";
import HelpBot from "../../../components/Admin/ChatAI/HelpBot";
import { FaRobot } from "react-icons/fa";

import { auth, db } from "../../../../lib/firebase";
import { collection, getDocs, onSnapshot, orderBy, limit, query, where, documentId } from "firebase/firestore";

export default function TrangChu() {
  const navigate = useNavigate();

  // ====== STATE ======
  const [ganDay, setGanDay] = useState([]);   // 6 bộ thẻ mới
  const [phoBien, setPhoBien] = useState([]); // 8 bộ thẻ theo soTu
  const [userMap, setUserMap] = useState({}); // {uid: {tenNguoiDung, anhDaiDien}}
  const [prime, setPrime] = useState(false);

  // ====== HELPERS ======
  const parseVNDate = (dmy) => {
    if (!dmy || typeof dmy !== "string") return null; // "dd/mm/yyyy"
    const [d, m, y] = dmy.split("/").map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const denHoc = (id) => navigate(`/flashcard/${id}`);

  // ====== LOAD RECENT & POPULAR FROM FIRESTORE ======
  useEffect(() => {
    // Recent 6
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
        };
      });
      setGanDay(items);
    });

    // Popular 8
    const qPopular = query(collection(db, "boThe"), orderBy("soTu", "desc"), limit(8));
    const unsubPopular = onSnapshot(qPopular, (snap) => {
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
        };
      });
      setPhoBien(items);
    });

    return () => {
      unsubRecent();
      unsubPopular();
    };
  }, []);

  // ====== FETCH AUTHORS (nguoiDung) FOR BOTH LISTS ======
  useEffect(() => {
    const ownerIds = [
      ...new Set(
        [...ganDay, ...phoBien]
          .map((b) => (b?.idNguoiDung != null ? String(b.idNguoiDung) : null))
          .filter(Boolean)
      ),
    ];
    if (ownerIds.length === 0) {
      setUserMap({});
      return;
    }

    // Firestore 'in' chỉ tối đa 10 phần tử/lần → chia lô nếu cần
    const chunks = [];
    for (let i = 0; i < ownerIds.length; i += 10) chunks.push(ownerIds.slice(i, i + 10));

    (async () => {
      const map = {};
      for (const chunk of chunks) {
        const qUsers = query(
          collection(db, "nguoiDung"),
          where(documentId(), "in", chunk)
        );
        const rs = await getDocs(qUsers);
        rs.forEach((d) => (map[d.id] = d.data()));
      }
      setUserMap(map);
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
      {/* (Tuỳ chọn) Hiện nút AI cho Prime */}
      {prime && (
        <div className="ai-strip">
          <AIButton />
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

      {/* BỘ THẺ PHỔ BIẾN */}
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
                  <div className="mini-sub">{item.soTu ?? 0} thẻ</div>

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
