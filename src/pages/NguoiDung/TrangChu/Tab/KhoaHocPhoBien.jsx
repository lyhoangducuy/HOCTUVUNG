// src/pages/Home/Tab/KhoaHocPhoBien.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ItemKH from "../../../../components/BoThe/itemKH";

import { auth, db } from "../../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";

export default function KhoaHocPhoBien() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [userMap, setUserMap] = useState({});

  // Lấy id người dùng (ưu tiên Firebase Auth, fallback session cũ)
  const myId = useMemo(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem("session") || "null");
      return String(auth.currentUser?.uid || session?.idNguoiDung || "");
    } catch {
      return "";
    }
  }, []);

  // Nạp khóa học → sort theo số thành viên giảm dần → top 12
  useEffect(() => {
    // Nếu chỉ muốn public: bật 2 dòng dưới
    // const qRef = query(collection(db, "khoaHoc"), where("cheDo", "==", "public"));
    // const unsub = onSnapshot(qRef, handleSnap, () => setList([]));

    const unsub = onSnapshot(
      collection(db, "khoaHoc"),
      (snap) => {
        const arr = snap.docs.map((d) => {
          const data = d.data() || {};
          const soTV = Array.isArray(data.thanhVienIds) ? data.thanhVienIds.length : 0;
          const soBo = Array.isArray(data.boTheIds) ? data.boTheIds.length : 0;
          return {
            ...data,
            idKhoaHoc: data.idKhoaHoc ?? d.id, // fallback doc id
            _soTV: soTV,
            _soBo: soBo,
          };
        });
        arr.sort((a, b) => b._soTV - a._soTV);
        setList(arr.slice(0, 12));
      },
      () => setList([])
    );
    return () => unsub();
  }, []);

  // Tải hồ sơ tác giả cho các khoá học trong danh sách
  useEffect(() => {
    const ownerIds = [
      ...new Set(
        list
          .map((k) => (k?.idNguoiDung != null ? String(k.idNguoiDung) : null))
          .filter(Boolean)
      ),
    ];
    if (ownerIds.length === 0) { setUserMap({}); return; }

    const chunks = [];
    for (let i = 0; i < ownerIds.length; i += 10) chunks.push(ownerIds.slice(i, i + 10));

    (async () => {
      const map = {};
      for (const chunk of chunks) {
        const q = query(collection(db, "nguoiDung"), where(documentId(), "in", chunk));
        const rs = await getDocs(q);
        rs.forEach((d) => (map[d.id] = d.data()));
      }
      setUserMap(map);
    })();
  }, [list]);

  return (
    <section className="home-section">
      <div className="home-section-header">
        <h2 className="home-title">Khóa học phổ biến</h2>
      </div>

      <div className="home-grid">
        {list.map((k) => {
          const owner = userMap[String(k.idNguoiDung)] || {};
          // Đánh dấu đã tham gia: là chủ hoặc nằm trong thanhVienIds
          const joined =
            !!myId &&
            (
              String(k.idNguoiDung) === myId ||
              (Array.isArray(k.thanhVienIds) && k.thanhVienIds.map(String).includes(myId))
            );

          return (
            <ItemKH
              key={k.idKhoaHoc}
              item={k}
              author={owner}
              isJoined={joined}                      
              onClick={(id) => navigate(`/khoaHoc/${id}`)}
              onEnter={(id) => navigate(`/khoaHoc/${id}`)}  
            />
          );
        })}
        {list.length === 0 && <p className="emty">Chưa có khóa học nào.</p>}
      </div>
    </section>
  );
}
