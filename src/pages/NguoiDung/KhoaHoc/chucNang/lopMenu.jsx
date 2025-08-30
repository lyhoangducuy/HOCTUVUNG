// src/components/LopMenu/LopMenu.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../../../../../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
  arrayRemove,
} from "firebase/firestore";

/**
 * Menu dấu ba chấm cho trang Khóa học
 * Props:
 * - open: boolean
 * - anchorRef: ref tới nút "..."
 * - onClose: () => void
 * - onViewDetail: () => void
 * - onDelete: () => void
 * - isOwner: boolean (chỉ chủ khóa học mới thấy sửa/xóa)
 * - idKhoaHoc: string|number (docId hoặc field idKhoaHoc)
 * - canLeave: boolean (thành viên không phải chủ -> có thể rời lớp)
 * - onLeft: () => void (callback sau khi rời lớp để reload UI)
 */

// ===== Helpers Firestore =====
const khoaHocCol = () => collection(db, "khoaHoc");

/** Tìm docRef theo docId hoặc field idKhoaHoc */
async function getCourseDocRefByAnyId(id) {
  const idStr = String(id);
  // 1) thử docId
  const refByDocId = doc(db, "khoaHoc", idStr);
  const snap1 = await getDoc(refByDocId);
  if (snap1.exists()) return refByDocId;

  // 2) thử field idKhoaHoc
  const q1 = query(khoaHocCol(), where("idKhoaHoc", "==", idStr), limit(1));
  const rs = await getDocs(q1);
  if (!rs.empty) return rs.docs[0].ref;

  return null;
}

/** Lấy hồ sơ người dùng từ collection 'nguoiDung' theo auth.uid */
async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "nguoiDung", String(uid)));
    return snap.exists() ? { _docId: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}

export default function LopMenu({
  open,
  anchorRef,
  onClose,
  onViewDetail,
  onDelete,
  isOwner = false,
  idKhoaHoc,
  canLeave = false,
  onLeft,
}) {
  const menuRef = useRef(null);

  // đánh giá
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // auth & profile
  const [uid, setUid] = useState(null);
  const [altId, setAltId] = useState(null); // phòng trường hợp DB cũ lưu idNguoiDung ≠ auth.uid

  // thành viên?
  const [isMember, setIsMember] = useState(false);

  // ===== 1) Lấy uid từ Firebase Auth =====
  useEffect(() => {
    setUid(auth.currentUser?.uid || null);
  }, []);

  // ===== 2) Lấy altId từ hồ sơ người dùng (idNguoiDung nếu khác uid) =====
  useEffect(() => {
    (async () => {
      if (!uid) {
        setAltId(null);
        return;
      }
      const prof = await getUserProfile(uid);
      const idField = prof?.idNguoiDung;
      setAltId(idField && String(idField) !== String(uid) ? String(idField) : null);
    })();
  }, [uid]);

  // ===== 3) Kiểm tra thành viên của khóa học =====
  useEffect(() => {
    (async () => {
      if (!idKhoaHoc || !uid) {
        setIsMember(false);
        return;
      }
      const ref = await getCourseDocRefByAnyId(idKhoaHoc);
      if (!ref) {
        setIsMember(false);
        return;
      }
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setIsMember(false);
        return;
      }
      const kh = snap.data();
      const mem = Array.isArray(kh?.thanhVienIds) ? kh.thanhVienIds.map(String) : [];
      const me1 = String(uid);
      const me2 = altId ? String(altId) : null;
      setIsMember(mem.includes(me1) || (me2 ? mem.includes(me2) : false));
    })();
  }, [idKhoaHoc, uid, altId]);

  // ===== 4) Đóng khi click ra ngoài =====
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      const a = anchorRef?.current;
      const m = menuRef.current;
      if (m && !m.contains(e.target) && a && !a.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  // ===== 5) Gửi đánh giá (Firestore) =====
  const themFeedback = async (e) => {
    e.preventDefault();
    if (!uid) {
      alert("Vui lòng đăng nhập để đánh giá.");
      return;
    }
    if (!rating) {
      alert("Vui lòng chọn số sao!");
      return;
    }
    // Chỉ cho phép thành viên đánh giá (tùy yêu cầu)
    if (!isMember) {
      alert("Chỉ thành viên của khóa học mới được đánh giá.");
      return;
    }
    try {
      const key = `${String(idKhoaHoc)}_${String(altId || uid)}`;
      await setDoc(doc(db, "feedbackKhoaHoc", key), {
        idKhoaHoc: String(idKhoaHoc),
        idNguoiDung: String(altId || uid),
        rating: Number(rating),
        comment: String(comment || "").trim(),
        ngay: serverTimestamp(),
      });
      alert("Đã gửi đánh giá của bạn!");
      setRating(0);
      setComment("");
      onClose?.();
    } catch (err) {
      console.error("Gửi đánh giá thất bại:", err);
      alert("Không thể gửi đánh giá. Vui lòng thử lại.");
    }
  };

  // ===== 6) Rời khóa học (Firestore) =====
  const roiLop = async () => {
    if (!uid || !idKhoaHoc) return;
    if (!window.confirm("Bạn chắc chắn muốn rời khóa học này?")) return;

    try {
      const ref = await getCourseDocRefByAnyId(idKhoaHoc);
      if (!ref) {
        alert("Không tìm thấy khóa học.");
        return;
      }

      // Loại mình khỏi danh sách thành viên & danh sách chờ (nếu có)
      const me1 = String(uid);
      const me2 = altId ? String(altId) : null;
      const toRemove = me2 ? [me1, me2] : [me1];

      await updateDoc(ref, {
        thanhVienIds: arrayRemove(...toRemove),
        yeuCauThamGiaIds: arrayRemove(...toRemove),
      });

      // bắn event tùy app (nếu nhiều nơi cần reload)
      window.dispatchEvent(new Event("khoaHocChanged"));

      onLeft?.();
      onClose?.();
    } catch (err) {
      console.error("Rời khóa học thất bại:", err);
      alert("Không thể rời khóa học. Vui lòng thử lại.");
    }
  };

  return (
    <div ref={menuRef} className="ellipsis-menu">
      {isOwner && (
        <>
          <button
            className="ellipsis-item"
            onClick={() => {
              onViewDetail?.();
              onClose?.();
            }}
          >
            Xem chi tiết khóa học / Sửa
          </button>
          <button
            className="ellipsis-item danger"
            onClick={() => {
              onDelete?.();
              onClose?.();
            }}
          >
            Xóa khóa học
          </button>
        </>
      )}

      {!isOwner && canLeave && (
        <button className="ellipsis-item danger" onClick={roiLop}>
          Rời khóa học
        </button>
      )}

      {/* Nếu muốn bật form đánh giá ngay trong menu, bỏ comment khối dưới */}
      {/* {isMember && (
        <form className="feedback-form" onSubmit={themFeedback} style={{ padding: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <label>Số sao:</label>{" "}
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              <option value={0}>—</option>
              <option value={1}>★</option>
              <option value={2}>★★</option>
              <option value={3}>★★★</option>
              <option value={4}>★★★★</option>
              <option value={5}>★★★★★</option>
            </select>
          </div>
          <textarea
            placeholder="Nhận xét..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: "100%", marginBottom: 6 }}
          />
          <button type="submit" className="ellipsis-item">Gửi đánh giá</button>
        </form>
      )} */}
    </div>
  );
}
