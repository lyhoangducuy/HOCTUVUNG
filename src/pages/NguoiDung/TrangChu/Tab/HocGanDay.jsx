// src/pages/Home/HocGanDay.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../TrangChu.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  documentId,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";

export default function HocGanDay() {
  const navigate = useNavigate();

  // uid: undefined = đang chờ Auth; null = chưa đăng nhập; string = đã đăng nhập
  const [uid, setUid] = useState(undefined);
  const [recentCards, setRecentCards] = useState([]);

  // lấy uid (đảm bảo F5 không mất)
  const sessionUser = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);
  useEffect(() => {
    const firstUid = auth.currentUser?.uid || sessionUser?.idNguoiDung || null;
    if (firstUid) setUid(firstUid);
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
    return () => unsub();
  }, [sessionUser]);

  // nạp “học gần đây”
  useEffect(() => {
    if (uid === undefined) return; // chờ auth
    let unsub = () => {};
    let cancelled = false;

    const loadFromTienDoHoc = () => {
      const qTDH = query(
        collection(db, "tienDoHoc"),
        where("idNguoiDung", "==", String(uid)),
        orderBy("ngayHocGanDay", "desc"),
        limit(6)
      );
      unsub = onSnapshot(
        qTDH,
        async (snap) => {
          try {
            const rows = snap.docs.map((d) => d.data());
            const ids = rows.map((r) => String(r.idBoThe)).filter(Boolean);
            if (ids.length === 0) { if (!cancelled) setRecentCards([]); return; }

            // lấy chi tiết boThe theo thứ tự ids
            const chunks = [];
            for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
            const results = await Promise.all(
              chunks.map((chunk) =>
                getDocs(query(collection(db, "boThe"), where(documentId(), "in", chunk)))
              )
            );
            const map = new Map();
            results.forEach((rs) => rs.forEach((d) => map.set(d.id, d.data())));
            const ordered = ids.map((id) => map.get(id)).filter(Boolean).map((data) => ({
              ...data,
              soTu:
                typeof data.soTu === "number"
                  ? data.soTu
                  : Array.isArray(data.danhSachThe) ? data.danhSachThe.length : 0,
              luotHoc: Number(data.luotHoc || 0),
            }));
            if (!cancelled) setRecentCards(ordered);
          } catch (e) {
            console.error("Lỗi nạp học gần đây:", e);
            if (!cancelled) setRecentCards([]);
          }
        },
        async (err) => {
          // fallback khi thiếu index: where + sort client
          if (err?.code === "failed-precondition" && /index/i.test(err?.message || "")) {
            try {
              const snap = await getDocs(
                query(collection(db, "tienDoHoc"), where("idNguoiDung", "==", String(uid)))
              );
              const rows = snap.docs
                .map((d) => d.data())
                .sort(
                  (a, b) =>
                    (b?.ngayHocGanDay?.toMillis?.() || 0) -
                    (a?.ngayHocGanDay?.toMillis?.() || 0)
                )
                .slice(0, 6);
              const ids = rows.map((r) => String(r.idBoThe));
              if (ids.length === 0) { if (!cancelled) setRecentCards([]); return; }
              const chunks = [];
              for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
              const results = await Promise.all(
                chunks.map((chunk) =>
                  getDocs(query(collection(db, "boThe"), where(documentId(), "in", chunk)))
                )
              );
              const map = new Map();
              results.forEach((rs) => rs.forEach((d) => map.set(d.id, d.data())));
              const ordered = ids.map((id) => map.get(id)).filter(Boolean).map((data) => ({
                ...data,
                soTu:
                  typeof data.soTu === "number"
                    ? data.soTu
                    : Array.isArray(data.danhSachThe) ? data.danhSachThe.length : 0,
                luotHoc: Number(data.luotHoc || 0),
              }));
              if (!cancelled) setRecentCards(ordered);
            } catch (e2) {
              console.error("Fallback học gần đây lỗi:", e2);
              if (!cancelled) setRecentCards([]);
            }
          } else {
            if (!cancelled) setRecentCards([]);
          }
        }
      );
    };

    const loadNewestFallback = () => {
      const qRecent = query(collection(db, "boThe"), orderBy("idBoThe", "desc"), limit(6));
      unsub = onSnapshot(
        qRecent,
        (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              soTu:
                typeof data.soTu === "number"
                  ? data.soTu
                  : Array.isArray(data.danhSachThe) ? data.danhSachThe.length : 0,
              luotHoc: Number(data.luotHoc || 0),
            };
          });
          if (!cancelled) setRecentCards(items);
        },
        () => !cancelled && setRecentCards([])
      );
    };

    if (uid) loadFromTienDoHoc();
    else loadNewestFallback();

    return () => { cancelled = true; unsub && unsub(); };
  }, [uid]);

  // click học + tracking
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
      console.warn("Tracking học gần đây lỗi (bỏ qua):", e);
    }

    navigate(`/flashcard/${idStr}`);
  };

  return (
    <section className="block">
      <div className="block-head">
        <h2 className="block-title">Học gần đây</h2>
      </div>

      {recentCards.length === 0 ? (
        <div className="empty">Chưa có bộ thẻ nào. Hãy bắt đầu học!</div>
      ) : (
        <ul className="recent-list">
          {recentCards.map((item) => (
            <li
              key={item.idBoThe}
              className="recent-item"
              onClick={() => goLearnTracked(item.idBoThe)}
            >
              <FontAwesomeIcon icon={faBook} className="icon-book" />
              <span className="recent-name">
                {item.tenBoThe || `Bộ thẻ #${item.idBoThe}`}
              </span>
              <span className="recent-count">
                {(typeof item.soTu === "number"
                  ? item.soTu
                  : Array.isArray(item.danhSachThe)
                  ? item.danhSachThe.length
                  : 0) || 0}{" "}
                từ
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
