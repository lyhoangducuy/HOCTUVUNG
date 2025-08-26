// src/components/ChiTietLop/ChiTietLopModal.jsx
import React, { useEffect, useState } from "react";
import "./chiTietLop.css";

import { db } from "../../../../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

/* ===== Firestore helpers ===== */
async function getCourseDocRefByAnyId(id) {
  if (!id && id !== 0) return null;
  const idStr = String(id);

  // 1) thử docId
  const ref1 = doc(db, "khoaHoc", idStr);
  const s1 = await getDoc(ref1);
  if (s1.exists()) return ref1;

  // 2) thử field idKhoaHoc
  const rs = await getDocs(
    query(collection(db, "khoaHoc"), where("idKhoaHoc", "==", idStr), limit(1))
  );
  if (!rs.empty) return rs.docs[0].ref;

  return null;
}
const safeArr = (v) => (Array.isArray(v) ? v : []);

export default function ChiTietLopModal({
  open,
  lop,
  onClose,
  onSave,              // optional: nếu không truyền, component tự lưu Firestore
  isEditMode = false,  // mở modal là edit luôn
}) {
  if (!open || !lop) return null;

  const [form, setForm] = useState({
    tenKhoaHoc: "",
    moTa: "",
    kienThucText: "",
  });
  const [isEditing, setIsEditing] = useState(!!isEditMode);

  /* ===== Helpers ===== */
  const parseTags = (txt) =>
    Array.from(
      new Set(
        (txt || "")
          .split(/[\n,]+/g)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.toLowerCase())
      )
    );

  const getAnyId = (x) =>
    x?.idKhoaHoc ?? x?._docId ?? x?.id ?? x?.idLop ?? x?.maLop ?? null;

  /* đồng bộ prop -> state khi mở modal / đổi lop */
  useEffect(() => {
    if (!open) return;
    setIsEditing(!!isEditMode);
    const tenKhoaHoc = lop.tenKhoaHoc ?? lop.tenLop ?? "";
    const moTa = lop.moTa ?? "";
    const kienThucText = Array.isArray(lop.kienThuc) ? lop.kienThuc.join(", ") : "";
    setForm({ tenKhoaHoc, moTa, kienThucText });
  }, [open, lop, isEditMode]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  /* ===== Firestore fallback save (nếu không truyền onSave) ===== */
  const fallbackSaveToFirestore = async (next) => {
    const id = getAnyId(next);
    if (!id && id !== 0) {
      alert("Thiếu ID khóa học để lưu.");
      return false;
    }

    try {
      let ref = await getCourseDocRefByAnyId(id);

      // Nếu chưa có: tạo theo idKhoaHoc (ưu tiên), fallback docId = String(id)
      if (!ref) {
        const newId = String(next.idKhoaHoc ?? id);
        ref = doc(db, "khoaHoc", newId);
        await setDoc(ref, {
          ...next,
          idKhoaHoc: String(next.idKhoaHoc ?? newId),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          tenKhoaHoc: next.tenKhoaHoc,
          moTa: next.moTa,
          kienThuc: next.kienThuc,
          tenLop: next.tenKhoaHoc, // để phần legacy nếu nơi khác còn đọc
          updatedAt: serverTimestamp(),
          // giữ nguyên các mảng đã tính sẵn:
          boTheIds: safeArr(next.boTheIds).map(String),
          folderIds: safeArr(next.folderIds).map(String),
          thanhVienIds: safeArr(next.thanhVienIds).map(String),
        });
      }

      // phát sự kiện cho các màn khác nếu cần reload
      window.dispatchEvent(new Event("khoaHocChanged"));
      return true;
    } catch (e) {
      console.error("Lưu khóa học thất bại:", e);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
      return false;
    }
  };

  const handleSave = async () => {
    const tenKhoaHoc = String(form.tenKhoaHoc || "").trim();
    if (!tenKhoaHoc) {
      alert("Vui lòng nhập tên khóa học.");
      return;
    }
    const moTa = String(form.moTa || "").trim();
    const kienThuc = parseTags(form.kienThucText);

    const next = {
      ...lop,
      idKhoaHoc: String(lop.idKhoaHoc ?? getAnyId(lop) ?? Date.now()),
      tenKhoaHoc,
      moTa,
      kienThuc,
      boTheIds: safeArr(lop.boTheIds),
      folderIds: safeArr(lop.folderIds),
      thanhVienIds: safeArr(lop.thanhVienIds),
      // giữ tên cũ cho phần legacy dùng 'tenLop'
      tenLop: tenKhoaHoc,
    };

    if (typeof onSave === "function") {
      // Parent tự quyết định lưu; nếu parent làm Firestore thì ok
      await onSave(next);
    } else {
      // Component tự lưu Firestore
      const ok = await fallbackSaveToFirestore(next);
      if (!ok) return;
    }

    // Ở lại modal, chuyển về chế độ xem
    setIsEditing(false);
  };

  const soBoThe =
    Array.isArray(lop.boTheIds)
      ? lop.boTheIds.length
      : Number.isFinite(lop?.soBoThe)
      ? lop.soBoThe
      : 0;

  const soThanhVien =
    Array.isArray(lop.thanhVienIds)
      ? lop.thanhVienIds.length
      : Number.isFinite(lop?.soThanhVien)
      ? lop.soThanhVien
      : 0;

  return (
    <div className="ctl-overlay">
      <div className="ctl-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="ctl-header">
          <h3>Thông tin khóa học</h3>
          <button className="ctl-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="ctl-body">
          {/* Tên khóa học */}
          <div className="ctl-row">
            <label className="ctl-label">Tên khóa học</label>
            {!isEditing ? (
              <div className="ctl-static">{form.tenKhoaHoc || "—"}</div>
            ) : (
              <input
                name="tenKhoaHoc"
                type="text"
                value={form.tenKhoaHoc}
                onChange={onChange}
                className="ctl-input"
                placeholder="Nhập tên khóa học"
              />
            )}
          </div>

          {/* Kiến thức / Chủ đề */}
          <div className="ctl-row">
            <label className="ctl-label">Kỹ năng/Chủ đề (kiến thức)</label>
            {!isEditing ? (
              <div className="ctl-static">
                {Array.isArray(lop.kienThuc) && lop.kienThuc.length > 0
                  ? lop.kienThuc.join(", ")
                  : "—"}
              </div>
            ) : (
              <>
                <textarea
                  name="kienThucText"
                  rows={2}
                  value={form.kienThucText}
                  onChange={onChange}
                  className="ctl-textarea"
                  placeholder="Ví dụ: it, tiếng nhật, tiếng anh… (ngăn cách bằng dấu phẩy hoặc xuống dòng)"
                />
                <div className="ctl-hint">
                  Mẹo: bạn có thể nhập mỗi dòng 1 thẻ hoặc dùng dấu phẩy. Hệ thống tự loại trùng & chuẩn hoá chữ thường.
                </div>
              </>
            )}
          </div>

          {/* Mô tả */}
          <div className="ctl-row">
            <label className="ctl-label">Mô tả</label>
            {!isEditing ? (
              <div className="ctl-static">{form.moTa || "—"}</div>
            ) : (
              <textarea
                name="moTa"
                rows={3}
                value={form.moTa}
                onChange={onChange}
                className="ctl-textarea"
                placeholder="Mô tả ngắn về khóa học…"
              />
            )}
          </div>

          <div className="ctl-split" />

          {/* Thống kê */}
          <div className="ctl-stats">
            <div className="ctl-stat-item">
              <span className="ctl-stat-label">Bộ thẻ</span>
              <span className="ctl-stat-value">{soBoThe}</span>
            </div>
            <div className="ctl-stat-item">
              <span className="ctl-stat-label">Thành viên</span>
              <span className="ctl-stat-value">{soThanhVien}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ctl-footer">
          <button className="btn-cancel-outline" onClick={onClose}>
            Đóng
          </button>
          {!isEditing ? (
            <button className="btn-primary" onClick={() => setIsEditing(true)}>
              Chỉnh sửa
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSave}>
              Lưu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
