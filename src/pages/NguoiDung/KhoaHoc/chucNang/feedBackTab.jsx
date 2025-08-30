// src/pages/Home/chucNang/FeedbackTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./FeedbackTab.css";

import { auth, db } from "../../../../../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";
import { faStar as FaStarRegular } from "@fortawesome/free-solid-svg-icons";// ✅ ĐÚNG: regular

/* Helpers */
const toVNDateTime = (d) =>
  d instanceof Date && !Number.isNaN(d) ? d.toLocaleString("vi-VN") : "";

const fromMaybeTs = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate();
  const d = new Date(val);
  return Number.isNaN(d) ? null : d;
};

const chunk = (arr, n = 10) => {
  const rs = [];
  for (let i = 0; i < arr.length; i += n) rs.push(arr.slice(i, i + n));
  return rs;
};

async function getCourseDocRefByAnyId(id) {
  const idStr = String(id);
  const refById = doc(db, "khoaHoc", idStr);
  const s1 = await getDoc(refById);
  if (s1.exists()) return refById;

  const rs = await getDocs(query(collection(db, "khoaHoc"), where("idKhoaHoc", "==", idStr)));
  if (!rs.empty) return rs.docs[0].ref;
  return null;
}

async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "nguoiDung", String(uid)));
    return snap.exists() ? { _docId: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}

export default function FeedbackTab({ idKhoaHoc }) {
  const [uid, setUid] = useState(null);
  const [altId, setAltId] = useState(null);
  const myId = useMemo(() => String(altId || uid || ""), [uid, altId]);

  const [course, setCourse] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [laThanhVien, setLaThanhVien] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [userCache, setUserCache] = useState(new Map());

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [replyInputs, setReplyInputs] = useState({});

  /* Auth + profile */
  useEffect(() => {
    const _uid = auth.currentUser?.uid || null;
    setUid(_uid);
    (async () => {
      if (!_uid) { setAltId(null); return; }
      const prof = await getUserProfile(_uid);
      const idField = prof?.idNguoiDung;
      setAltId(idField && String(idField) !== String(_uid) ? String(idField) : null);
    })();
  }, []);

  /* Course + quyền */
  useEffect(() => {
    (async () => {
      if (!idKhoaHoc) return;
      const ref = await getCourseDocRefByAnyId(idKhoaHoc);
      if (!ref) { setCourse(null); setIsOwner(false); setLaThanhVien(false); return; }
      const snap = await getDoc(ref);
      if (!snap.exists()) { setCourse(null); setIsOwner(false); setLaThanhVien(false); return; }
      const kh = { _docId: ref.id, ...snap.data() };
      setCourse(kh);

      const ownerId = String(kh.idNguoiDung || "");
      const members = Array.isArray(kh.thanhVienIds) ? kh.thanhVienIds.map(String) : [];
      setIsOwner(ownerId === String(myId) || ownerId === String(uid));
      setLaThanhVien(members.includes(String(myId)) || members.includes(String(uid)));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKhoaHoc, uid, altId, myId]);

  /* Realtime feedback (KHÔNG dùng orderBy để khỏi cần index; sort client) */
  useEffect(() => {
    if (!idKhoaHoc) return;
    const qFb = query(collection(db, "feedbackKhoaHoc"), where("idKhoaHoc", "==", String(idKhoaHoc)));
    const unsub = onSnapshot(
      qFb,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const x = d.data() || {};
          const when = fromMaybeTs(x.ngay) || new Date(0);
          const replies = Array.isArray(x.replies)
            ? x.replies.map((r) => ({ ...r, date: fromMaybeTs(r?.date) || null }))
            : [];
          return {
            idNguoiDung: String(x.idNguoiDung || ""),
            rating: Number(x.rating || 0),
            comment: String(x.comment || ""),
            ngay: when,
            replies,
          };
        });
        rows.sort((a, b) => (b.ngay?.getTime?.() || 0) - (a.ngay?.getTime?.() || 0));
        setFeedbacks(rows);
      },
      (err) => {
        console.error("onSnapshot feedbackKhoaHoc error:", err);
        setFeedbacks([]);
      }
    );
    return () => unsub();
  }, [idKhoaHoc]);

  /* Preload user info */
  useEffect(() => {
    const authorIds = new Set(feedbacks.map((r) => r.idNguoiDung));
    feedbacks.forEach((r) => r.replies?.forEach((rr) => authorIds.add(String(rr.userId || ""))));
    const need = Array.from(authorIds).filter((id) => id && !userCache.has(id));
    if (need.length === 0) return;

    (async () => {
      const batches = chunk(need, 10);
      const newMap = new Map(userCache);
      for (const ids of batches) {
        const rs = await Promise.all(ids.map((id) => getDoc(doc(db, "nguoiDung", id))));
        rs.forEach((snap) => {
          if (snap.exists()) {
            const u = snap.data();
            newMap.set(snap.id, {
              tenNguoiDung: u?.tenNguoiDung || u?.hoten || u?.email || "Người dùng",
              anhDaiDien: u?.anhDaiDien || "",
            });
          } else {
            newMap.set(snap.id, { tenNguoiDung: "Người dùng", anhDaiDien: "" });
          }
        });
      }
      setUserCache(newMap);
    })();
  }, [feedbacks, userCache]);

  /* Derived */
  const count = feedbacks.length;
  const avg = useMemo(
    () => (count ? feedbacks.reduce((s, x) => s + (Number(x.rating) || 0), 0) / count : 0),
    [feedbacks, count]
  );
  const pct = Math.max(0, Math.min(100, (avg / 5) * 100));
  const daDanhGia = useMemo(
    () => !!myId && feedbacks.some((f) => String(f.idNguoiDung) === String(myId)),
    [feedbacks, myId]
  );

  /* Submit feedback (chỉ 1 lần) */
  const themFeedback = async (e) => {
    e.preventDefault();
    if (!myId) return;
    if (!rating) return alert("Vui lòng chọn số sao!");
    if (!laThanhVien) return alert("Chỉ thành viên của khóa học mới được đánh giá.");
    if (isOwner) return alert("Chủ khóa học không thể tự đánh giá khóa học của mình.");

    const key = `${String(idKhoaHoc)}_${myId}`;
    const exist = await getDoc(doc(db, "feedbackKhoaHoc", key)); // ✅ đúng collection
    if (exist.exists()) return alert("Bạn đã đánh giá khóa học này rồi.");

    try {
      await setDoc(
        doc(db, "feedbackKhoaHoc", key), // ✅ đúng collection
        {
          idKhoaHoc: String(idKhoaHoc),
          idNguoiDung: myId,
          rating: Number(rating),
          comment: String(comment || "").trim(),
          ngay: serverTimestamp(),
        },
        { merge: false }
      );
      setRating(0);
      setComment("");
      // onSnapshot sẽ hiển thị ngay sau khi ghi
    } catch (err) {
      console.error("Ghi feedback thất bại:", err);
      alert("Không thể gửi đánh giá. Vui lòng thử lại.");
    }
  };

  /* Owner replies */
  const submitReply = async (idNguoiDung) => {
    const text = (replyInputs[idNguoiDung] || "").trim();
    if (!text) return;
    if (!isOwner) return alert("Chỉ giảng viên/chủ khóa học mới được phản hồi.");

    const key = `${String(idKhoaHoc)}_${String(idNguoiDung)}`;
    try {
      await updateDoc(doc(db, "feedbackKhoaHoc", key), { // ✅ đúng collection
        replies: arrayUnion({
          userId: myId || uid,
          text,
          date: serverTimestamp(),
        }),
      });
      setReplyInputs((s) => ({ ...s, [idNguoiDung]: "" }));
    } catch (err) {
      console.error("Gửi phản hồi thất bại:", err);
      alert("Không thể gửi phản hồi. Vui lòng thử lại.");
    }
  };

  return (
    <div className="fb-wrap">
      <div className="fb-head">
        <h3>Đánh giá & phản hồi</h3>

        <div className="fb-avg" aria-label={`Điểm trung bình ${avg.toFixed(1)}/5`}>
          <div className="fb-stars2">
            <div className="stars stars-bg">
              {Array.from({ length: 5 }).map((_, i) => (
                <FontAwesomeIcon key={`bg-${i}`} icon={FaStarRegular} />
              ))}
            </div>
            <div className="stars stars-fill" style={{ width: `${pct}%` }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <FontAwesomeIcon key={`fg-${i}`} icon={faStarSolid} />
              ))}
            </div>
          </div>
          <span className="fb-avg-num">{avg.toFixed(1)}</span>
          <span className="fb-count">({count})</span>
        </div>
      </div>

      {/* Form: thành viên, không phải chủ, CHƯA đánh giá */}
      {laThanhVien && !isOwner && !daDanhGia && (
        <form onSubmit={themFeedback} className="fb-form">
          <div className="fb-stars-picker">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`fb-star ${star <= rating ? "active" : ""}`}
                onClick={() => setRating(star)}
                aria-label={`Chọn ${star} sao`}
              >
                ★
              </button>
            ))}
            {rating > 0 && <span className="fb-picked">{rating}/5</span>}
          </div>

          <textarea
            className="fb-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận về khóa học..."
            rows={3}
          />

          <div className="fb-row-end">
            <button type="submit" className="fb-btn fb-primary">Gửi đánh giá</button>
          </div>
        </form>
      )}

      {/* Danh sách feedback */}
      {count === 0 ? (
        <p className="fb-empty">Chưa có feedback nào.</p>
      ) : (
        <ul className="fb-list">
          {feedbacks.map((fb) => {
            const u = userCache.get(fb.idNguoiDung) || {};
            const name = u.tenNguoiDung || "Người dùng";
            const avatar = u.anhDaiDien || "";

            return (
              <li key={fb.idNguoiDung} className="fb-item">
                <div className="fb-item-head">
                  <div className="fb-user">
                    <div className="fb-avatar">
                      {avatar ? <img src={avatar} alt={name} /> : (name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fb-user-name">{name}</div>
                      <div className="fb-meta">
                        <span className="fb-stars-inline">
                          {"★".repeat(fb.rating)}
                          <span className="fb-stars-dim">
                            {"★".repeat(5 - fb.rating)}
                          </span>
                        </span>
                        <span>· {toVNDateTime(fb.ngay)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="fb-body">{fb.comment}</div>

                {Array.isArray(fb.replies) && fb.replies.length > 0 && (
                  <div className="fb-replies">
                    {fb.replies.map((r, i) => (
                      <div key={i} className="fb-reply">
                        <div className="fb-reply-badge">Phản hồi của giảng viên</div>
                        <div className="fb-reply-text">{r.text}</div>
                        <div className="fb-reply-time">{toVNDateTime(fromMaybeTs(r.date))}</div>
                      </div>
                    ))}
                  </div>
                )}

                {isOwner && (
                  <div className="fb-reply-box">
                    <textarea
                      className="fb-input"
                      rows={2}
                      placeholder="Phản hồi lại học viên..."
                      value={replyInputs[fb.idNguoiDung] || ""}
                      onChange={(e) => setReplyInputs((s) => ({ ...s, [fb.idNguoiDung]: e.target.value }))}
                    />
                    <div className="fb-row-end">
                      <button
                        type="button"
                        className="fb-btn fb-secondary"
                        onClick={() => setReplyInputs((s) => ({ ...s, [fb.idNguoiDung]: "" }))}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="fb-btn fb-primary"
                        onClick={() => submitReply(fb.idNguoiDung)}
                      >
                        Gửi phản hồi
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
