// src/pages/Home/BoThePhoBien.jsx
import React, { useEffect, useRef, useState } from "react";
import "../TrangChu.css";

import ItemBo from "../../../../components/BoThe/itemBo";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../../../lib/firebase";
import {
  collection, query, where, limit, getDocs, onSnapshot,
  documentId, doc, setDoc, updateDoc, serverTimestamp, increment, orderBy
} from "firebase/firestore";

export default function BoThePhoBien() {
  const [uid, setUid] = useState(null);
  const [popularCards, setPopularCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userMap, setUserMap] = useState({});
  const userMapRef = useRef({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
    return () => unsub();
  }, []);

  // Lấy TOP 12 công khai, sắp xếp ngay trên server theo luotHoc desc
  useEffect(() => {
    let cancelled = false;

    const mapDoc = (d) => {
      const data = d.data() || {};
      return {
        ...data,
        idBoThe: data.idBoThe ?? d.id,
        soTu:
          typeof data.soTu === "number"
            ? data.soTu
            : Array.isArray(data.danhSachThe)
            ? data.danhSachThe.length
            : 0,
        luotHoc: Number(data.luotHoc || 0),
      };
    };

    // Ưu tiên realtime + orderBy (cần composite index cheDo==cong_khai + orderBy luotHoc)
    const qTop = query(
      collection(db, "boThe"),
      where("cheDo", "==", "cong_khai"),
      orderBy("luotHoc", "desc"),
      limit(12)
    );

    const unsub = onSnapshot(
      qTop,
      (snap) => {
        if (cancelled) return;
        const all = snap.docs.map(mapDoc);
        setPopularCards(all);
        setLoading(false);
      },
      async (err) => {
        // Fallback khi thiếu index: lấy ~120 rồi sort client
        console.warn("onSnapshot TOP error, fallback client-sort:", err?.code || err);
        try {
          const qPublic = query(
            collection(db, "boThe"),
            where("cheDo", "==", "cong_khai"),
            limit(120)
          );
          const snap = await getDocs(qPublic);
          if (cancelled) return;
          const all = snap.docs.map(mapDoc).sort((a, b) => b.luotHoc - a.luotHoc).slice(0, 12);
          setPopularCards(all);
        } catch (e) {
          console.error("Fallback fetch popular failed:", e);
          if (!cancelled) setPopularCards([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      unsub && unsub();
    };
  }, []);

  // Nạp hồ sơ tác giả (theo lô, chỉ những id chưa có trong cache)
  useEffect(() => {
    const ownerIds = popularCards
      .map((b) => (b?.idNguoiDung != null ? String(b.idNguoiDung) : null))
      .filter(Boolean);

    const unique = Array.from(new Set(ownerIds));
    const missing = unique.filter((x) => !userMapRef.current[x]);
    if (missing.length === 0) return;

    const chunks = [];
    for (let i = 0; i < missing.length; i += 10) chunks.push(missing.slice(i, i + 10));

    (async () => {
      try {
        const results = await Promise.all(
          chunks.map((chunk) =>
            getDocs(query(collection(db, "nguoiDung"), where(documentId(), "in", chunk)))
          )
        );
        const next = { ...userMapRef.current };
        results.forEach((rs) => rs.forEach((d) => (next[d.id] = d.data() || {})));
        userMapRef.current = next;
        setUserMap(next);
      } catch (e) {
        console.error("Fetch authors failed:", e);
      }
    })();
  }, [popularCards]);

  // click học + tracking (bỏ getDoc để nhanh hơn)
  const goLearnTracked = async (idBoThe) => {
    if (!idBoThe) return;
    const idStr = String(idBoThe);

    try {
      if (uid) {
        // Ghi tiến độ (merge)
        const idTDH = `${uid}_${idStr}`;
        await setDoc(
          doc(db, "tienDoHoc", idTDH),
          {
            idTDH,
            idBoThe: Number.isFinite(Number(idStr)) ? Number(idStr) : idStr,
            idNguoiDung: String(uid),
            ngayHocGanDay: serverTimestamp(),
          },
          { merge: true }
        );

        // Tăng lượt học + cập nhật mốc
        await updateDoc(doc(db, "boThe", idStr), {
          luotHoc: increment(1),
          ngayChinhSua: serverTimestamp(),
        }).catch(() => {}); // boThe có thể đã xoá/ẩn -> bỏ qua lỗi
      }
    } catch (e) {
      console.warn("Tracking popular lỗi (bỏ qua):", e);
    }

    window.location.href = `/bothe/${idStr}`;
  };

  return (
    <section className="block">
      <div className="block-head">
        <h2 className="block-title">Bộ thẻ phổ biến</h2>
      </div>

      {loading ? (
        <div className="empty">Đang tải…</div>
      ) : popularCards.length === 0 ? (
        <div className="empty">Chưa có dữ liệu để hiển thị.</div>
      ) : (
        <div className="mini-grid">
          {popularCards.map((item) => (
            <ItemBo
              key={item.idBoThe}
              item={item}
              author={userMap[String(item.idNguoiDung)]}
              onClick={goLearnTracked}
              onLearn={goLearnTracked}
            />
          ))}
        </div>
      )}
    </section>
  );
}
