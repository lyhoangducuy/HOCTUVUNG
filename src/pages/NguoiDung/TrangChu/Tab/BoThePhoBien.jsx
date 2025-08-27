// src/pages/Home/BoThePhoBien.jsx
import React, { useEffect, useRef, useState } from "react";
import "../TrangChu.css";

import ItemBo from "../../../../components/BoThe/itemBo";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  documentId,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";

export default function BoThePhoBien() {
  const [uid, setUid] = useState(null);
  const [popularCards, setPopularCards] = useState([]);

  // author map
  const [userMap, setUserMap] = useState({});
  const userMapRef = useRef({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
    return () => unsub();
  }, []);

  // nạp danh sách phổ biến
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
        const qPopular = query(
          collection(db, "boThe"),
          where("cheDo", "==", "cong_khai"),
          orderBy("luotHoc", "desc"),
          limit(8)
        );
        const snap = await getDocs(qPopular);
        if (!cancelled) setPopularCards(mapSnap(snap));
      } catch (e) {
        if (e?.code === "failed-precondition" && /index/i.test(e?.message || "")) {
          console.warn("Thiếu composite index (cheDo, luotHoc). Dùng fallback client.");
          try {
            const qNoFilter = query(
              collection(db, "boThe"),
              orderBy("luotHoc", "desc"),
              limit(64)
            );
            const snap2 = await getDocs(qNoFilter);
            if (!cancelled) {
              const all = mapSnap(snap2)
                .filter((x) => x.cheDo === "cong_khai")
                .slice(0, 8);
              setPopularCards(all);
            }
          } catch (e2) {
            console.error("Fallback popular failed:", e2);
            if (!cancelled) setPopularCards([]);
          }
        } else {
          console.error("Fetch popular failed:", e);
          if (!cancelled) setPopularCards([]);
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

  // nạp hồ sơ tác giả (chỉ những uid chưa có)
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
        results.forEach((rs) => rs.forEach((d) => (next[d.id] = d.data())));
        userMapRef.current = next;
        setUserMap(next);
      } catch (e) {
        console.error("Fetch authors failed:", e);
      }
    })();
  }, [popularCards]);

  // click học + tracking (giống HocGanDay)
  const goLearnTracked = async (idBoThe) => {
    if (!idBoThe) return;
    const idStr = String(idBoThe);

    try {
      if (uid) {
        const btSnap = await getDoc(doc(db, "boThe", idStr));
        if (btSnap.exists()) {
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
          await updateDoc(doc(db, "boThe", idStr), {
            luotHoc: increment(1),
            ngayChinhSua: serverTimestamp(),
          });
          window.dispatchEvent(new Event("tienDoHocUpdated"));
        }
      }
    } catch (e) {
      console.warn("Tracking popular lỗi (bỏ qua):", e);
    }

    // điều hướng
    window.location.href = `/flashcard/${idStr}`;
  };

  return (
    <section className="block">
      <div className="block-head">
        <h2 className="block-title">Bộ thẻ phổ biến</h2>
      </div>

      {popularCards.length === 0 ? (
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
