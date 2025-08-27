import { useEffect, useMemo, useState } from "react";
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
  orderBy,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

/* ========== Helpers ========== */
const toVNDateTime = (d) =>
  d instanceof Date && !Number.isNaN(d) ? d.toLocaleString("vi-VN") : "";

const fromMaybeTs = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate(); // Firestore Timestamp
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

/* ========== Component ========== */
export default function FeedbackTab({ idKhoaHoc }) {
  // Auth + profile/lightweight
  const [uid, setUid] = useState(null);
  const [altId, setAltId] = useState(null); // nếu DB cũ dùng idNguoiDung ≠ auth.uid
  const myId = useMemo(() => String(altId || uid || ""), [uid, altId]);
  const [myRole, setMyRole] = useState(null); // HOC_VIEN | GIANG_VIEN | ADMIN | null

  // Course
  const [courseRef, setCourseRef] = useState(null);
  const [course, setCourse] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [laThanhVien, setLaThanhVien] = useState(false);

  // Feedbacks
  const [feedbacks, setFeedbacks] = useState([]);
  const [userCache, setUserCache] = useState(new Map()); // idNguoiDung -> { tenNguoiDung, anhDaiDien }

  // Form states
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [replyInputs, setReplyInputs] = useState({}); // key = idNguoiDung của feedback

  /* ===== 1) Lấy uid từ Auth + altId (idNguoiDung) và vai trò ===== */
  useEffect(() => {
    const _uid = auth.currentUser?.uid || null;
    setUid(_uid);

    (async () => {
      if (!_uid) {
        setAltId(null);
        setMyRole(null);
        return;
      }
      const prof = await getUserProfile(_uid);
      const idField = prof?.idNguoiDung;
      setAltId(idField && String(idField) !== String(_uid) ? String(idField) : null);
      setMyRole(prof?.vaiTro || null);
    })();
  }, []);

  /* ===== 2) Load thông tin khóa học + quyền owner/member ===== */
  useEffect(() => {
    (async () => {
      if (!idKhoaHoc) return;
      const ref = await getCourseDocRefByAnyId(idKhoaHoc);
      setCourseRef(ref);

      if (!ref) {
        setCourse(null);
        setIsOwner(false);
        setLaThanhVien(false);
        return;
      }

      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setCourse(null);
        setIsOwner(false);
        setLaThanhVien(false);
        return;
      }
      const kh = { _docId: ref.id, ...snap.data() };
      setCourse(kh);

      const ownerId = String(kh.idNguoiDung || "");
      const members = Array.isArray(kh.thanhVienIds) ? kh.thanhVienIds.map(String) : [];

      setIsOwner(ownerId === myId || ownerId === String(uid)); // phòng khi altId/uid khác
      setLaThanhVien(members.includes(myId) || members.includes(String(uid)));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKhoaHoc, uid, altId, myId]);

  /* ===== 3) Realtime feedback của khóa học ===== */
  useEffect(() => {
    if (!idKhoaHoc) return;
    const qFb = query(
      collection(db, "feedbackKhoaHoc"),
      where("idKhoaHoc", "==", String(idKhoaHoc)),
      orderBy("ngay", "desc")
    );

    const unsub = onSnapshot(
      qFb,
      async (snap) => {
        const rows = snap.docs.map((d) => {
          const x = d.data();
          const when = fromMaybeTs(x.ngay) || new Date();
          const replies = Array.isArray(x.replies) ? x.replies.map((r) => ({
            ...r,
            date: fromMaybeTs(r?.date) || null,
          })) : [];
        return {
            idNguoiDung: String(x.idNguoiDung || ""),
            rating: Number(x.rating || 0),
            comment: String(x.comment || ""),
            ngay: when,
            replies,
          };
        });
        setFeedbacks(rows);

        // nạp thông tin người dùng cho tên/avatar (tác giả & người trả lời)
        const authorIds = new Set(rows.map((r) => r.idNguoiDung));
        rows.forEach((r) => r.replies?.forEach((rr) => authorIds.add(String(rr.userId || ""))));
        // bỏ id rỗng và id đã có trong cache
        const need = Array.from(authorIds).filter(
          (id) => id && !userCache.has(id)
        );
        if (need.length > 0) {
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
        }
      },
      (err) => {
        console.error("Lỗi đọc feedback:", err);
        setFeedbacks([]);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKhoaHoc, userCache]);

  /* ===== 4) Gửi / cập nhật feedback của học viên ===== */
  const themFeedback = async (e) => {
    e.preventDefault();
    if (!myId) return;
    if (!rating) {
      alert("Vui lòng chọn số sao!");
      return;
    }
    if (!laThanhVien) {
      alert("Chỉ thành viên của khóa học mới được đánh giá.");
      return;
    }

    const key = `${String(idKhoaHoc)}_${myId}`;
    try {
      // dùng merge để không xoá mảng replies hiện có
      await setDoc(
        doc(db, "feedbackKhoaHoc", key),
        {
          idKhoaHoc: String(idKhoaHoc),
          idNguoiDung: myId,
          rating: Number(rating),
          comment: String(comment || "").trim(),
          ngay: serverTimestamp(),
        },
        { merge: true }
      );
      setRating(0);
      setComment("");
    } catch (err) {
      console.error("Thêm/cập nhật feedback thất bại:", err);
      alert("Không thể gửi đánh giá. Vui lòng thử lại.");
    }
  };

  /* ===== 5) Chủ khóa học phản hồi ===== */
  const submitReply = async (idNguoiDung) => {
    const text = (replyInputs[idNguoiDung] || "").trim();
    if (!text) return;
    if (!isOwner) {
      alert("Chỉ giảng viên/chủ khóa học mới được phản hồi.");
      return;
    }
    const key = `${String(idKhoaHoc)}_${String(idNguoiDung)}`;
    try {
      await updateDoc(doc(db, "feedbackKhoaHoc", key), {
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

  /* ===== Render ===== */
  const count = feedbacks.length;

  return (
    <div className="fb-wrap">
      <div className="fb-head">
        <h3>Đánh giá & phản hồi</h3>
        <span className="fb-count">{count} đánh giá</span>
      </div>

      {/* Form học viên */}
      {myRole === "HOC_VIEN" && laThanhVien && (
        <form onSubmit={themFeedback} className="fb-form">
          <div className="fb-stars">
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
                      {avatar ? (
                        <img src={avatar} alt={name} />
                      ) : (
                        (name || "U").charAt(0).toUpperCase()
                      )}
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

                {/* Replies list */}
                {Array.isArray(fb.replies) && fb.replies.length > 0 && (
                  <div className="fb-replies">
                    {fb.replies.map((r, i) => {
                      const owner = userCache.get(String(r.userId || "")) || {};
                      return (
                        <div key={i} className="fb-reply">
                          <div className="fb-reply-badge">Phản hồi của giảng viên</div>
                          <div className="fb-reply-text">{r.text}</div>
                          <div className="fb-reply-time">
                            {toVNDateTime(fromMaybeTs(r.date))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply box for owner */}
                {isOwner && (
                  <div className="fb-reply-box">
                    <textarea
                      className="fb-input"
                      rows={2}
                      placeholder="Phản hồi lại học viên..."
                      value={replyInputs[fb.idNguoiDung] || ""}
                      onChange={(e) =>
                        setReplyInputs((s) => ({ ...s, [fb.idNguoiDung]: e.target.value }))
                      }
                    />
                    <div className="fb-row-end">
                      <button
                        type="button"
                        className="fb-btn fb-secondary"
                        onClick={() =>
                          setReplyInputs((s) => ({ ...s, [fb.idNguoiDung]: "" }))
                        }
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
