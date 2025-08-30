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
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";

export default function HocGanDay() {
  const navigate = useNavigate();

  // uid: undefined = chờ Auth; null = chưa đăng nhập; string = đã đăng nhập
  const [uid, setUid] = useState(undefined);
  const [recentCards, setRecentCards] = useState([]);

  // Giữ UID từ session nếu có (F5 không mất)
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

  // Nạp danh sách “học gần đây”
  useEffect(() => {
    if (uid === undefined) return; // chờ auth init
    let unsub = () => {};
    let cancelled = false;

    // (A) User đăng nhập: lấy từ tienDoHoc realtime, sort server theo ngayHocGanDay desc
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

            // Lấy boThe theo lô (<=10 id/lần), sau đó reorder đúng theo ids
            const chunks = [];
            for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
            const results = await Promise.all(
              chunks.map((chunk) =>
                getDocs(query(collection(db, "boThe"), where(documentId(), "in", chunk)))
              )
            );
            const map = new Map();
            results.forEach((rs) => rs.forEach((d) => map.set(d.id, d.data() || {})));

            const ordered = ids
              .map((id) => ({ id, data: map.get(id) }))
              .filter((x) => !!x.data)
              .map(({ id, data }) => ({
                ...data,
                idBoThe: data.idBoThe ?? id,
                soTu:
                  typeof data.soTu === "number"
                    ? data.soTu
                    : Array.isArray(data.danhSachThe)
                    ? data.danhSachThe.length
                    : 0,
                luotHoc: Number(data.luotHoc || 0),
              }));

            if (!cancelled) setRecentCards(ordered);
          } catch (e) {
            console.error("Lỗi nạp học gần đây:", e);
            if (!cancelled) setRecentCards([]);
          }
        },
        // Fallback khi thiếu index: where + sort client
        async (err) => {
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

              const ids = rows.map((r) => String(r.idBoThe)).filter(Boolean);
              if (ids.length === 0) { if (!cancelled) setRecentCards([]); return; }

              const chunks = [];
              for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
              const results = await Promise.all(
                chunks.map((chunk) =>
                  getDocs(query(collection(db, "boThe"), where(documentId(), "in", chunk)))
                )
              );
              const map = new Map();
              results.forEach((rs) => rs.forEach((d) => map.set(d.id, d.data() || {})));

              const ordered = ids
                .map((id) => ({ id, data: map.get(id) }))
                .filter((x) => !!x.data)
                .map(({ id, data }) => ({
                  ...data,
                  idBoThe: data.idBoThe ?? id,
                  soTu:
                    typeof data.soTu === "number"
                      ? data.soTu
                      : Array.isArray(data.danhSachThe)
                      ? data.danhSachThe.length
                      : 0,
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

    // (B) User chưa đăng nhập: lấy top mới nhất công khai (server sort), có fallback
    const loadNewestPublicFallback = () => {
      const qNewest = query(
        collection(db, "boThe"),
        where("cheDo", "==", "cong_khai"),
        orderBy("idBoThe", "desc"),
        limit(6)
      );

      unsub = onSnapshot(
        qNewest,
        (snap) => {
          const items = snap.docs.map((d) => {
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
          });
          if (!cancelled) setRecentCards(items);
        },
        async (err) => {
          // Nếu thiếu index (where + orderBy), fallback: lấy ~40 công khai rồi sort client
          if (err?.code === "failed-precondition" && /index/i.test(err?.message || "")) {
            try {
              const snap = await getDocs(
                query(collection(db, "boThe"), where("cheDo", "==", "cong_khai"), limit(40))
              );
              const items = snap.docs
                .map((d) => {
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
                })
                .sort((a, b) => String(b.idBoThe).localeCompare(String(a.idBoThe)))
                .slice(0, 6);
              if (!cancelled) setRecentCards(items);
            } catch (e2) {
              console.error("Fallback newest public lỗi:", e2);
              if (!cancelled) setRecentCards([]);
            }
          } else {
            if (!cancelled) setRecentCards([]);
          }
        }
      );
    };

    if (uid) loadFromTienDoHoc();
    else loadNewestPublicFallback();

    return () => { cancelled = true; unsub && unsub(); };
  }, [uid]);

  // Click học + tracking (KHÔNG cần getDoc để tăng tốc)
  const goLearnTracked = async (idBoThe) => {
    if (!idBoThe) return;
    const idStr = String(idBoThe);

    try {
      if (uid) {
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

        // Tăng lượt học (nếu bộ thẻ còn tồn tại); bỏ qua lỗi để không chặn UX
        await updateDoc(doc(db, "boThe", idStr), {
          luotHoc: increment(1),
          ngayChinhSua: serverTimestamp(),
        }).catch(() => {});
        window.dispatchEvent(new Event("tienDoHocUpdated"));
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
