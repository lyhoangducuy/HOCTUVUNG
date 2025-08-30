import React, { useEffect, useMemo, useState } from "react";
import "./chiTietLop.css";

import { db } from "../../../../../lib/firebase";
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, limit, getDocs,
  serverTimestamp,
} from "firebase/firestore";

/* ===== helpers ===== */
const safeArr = (v) => (Array.isArray(v) ? v : []);
const toNum   = (v, d=0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const toVNDate = (date) =>
  date instanceof Date && !Number.isNaN(date) ? date.toLocaleDateString("vi-VN") : "";
const fromMaybeTs = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate(); // Firestore Timestamp
  if (!Number.isNaN(Number(val))) {
    const n = Number(val);
    return new Date(n > 1e12 ? n : n * 1000); // ms|s epoch
  }
  const d = new Date(val);
  return Number.isNaN(d) ? null : d;
};

async function getCourseDocRefByAnyId(id) {
  if (id === undefined || id === null) return null;
  const idStr = String(id);

  const r1 = doc(db, "khoaHoc", idStr);
  const s1 = await getDoc(r1);
  if (s1.exists()) return r1;

  const rs = await getDocs(
    query(collection(db, "khoaHoc"), where("idKhoaHoc", "==", idStr), limit(1))
  );
  if (!rs.empty) return rs.docs[0].ref;

  return null;
}

export default function ChiTietKhoaHocModal({ open, lop, onClose, onSaved }) {
  /* ---- hooks ---- */
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    tenKhoaHoc: "",
    moTa: "",
    kienThucText: "",
    giaKhoaHoc: 0,
    giamGia: 0,
  });

  useEffect(() => {
    if (!lop) return;
    setIsEditing(false); // mở modal mặc định là xem
    setForm({
      tenKhoaHoc: String(lop.tenKhoaHoc ?? ""),
      moTa: String(lop.moTa ?? ""),
      kienThucText: Array.isArray(lop.kienThuc) ? lop.kienThuc.join(", ") : "",
      giaKhoaHoc: toNum(lop.giaKhoaHoc, 0),
      giamGia: toNum(lop.giamGia, 0),
    });
  }, [open, lop]);

  const parseTags = (txt) =>
    Array.from(
      new Set(
        String(txt || "")
          .split(/[\n,]+/g)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.toLowerCase())
      )
    );

  const giaSauGiam = useMemo(() => {
    const goc = toNum(form.giaKhoaHoc, 0);
    const gg  = Math.min(100, Math.max(0, toNum(form.giamGia, 0)));
    return Math.round((goc * (100 - gg)) / 100);
  }, [form.giaKhoaHoc, form.giamGia]);

  const soBoThe = Array.isArray(lop?.boTheIds) ? lop.boTheIds.length : 0;
  const soTV    = Array.isArray(lop?.thanhVienIds) ? lop.thanhVienIds.length : 0;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const saveFirestore = async (next) => {
    const anyId = String(next.idKhoaHoc ?? lop?._docId ?? lop?.id ?? Date.now());
    try {
      let ref = await getCourseDocRefByAnyId(anyId);
      if (!ref) {
        // Tạo mới: chỉ set ngayTao theo yêu cầu
        ref = doc(db, "khoaHoc", anyId);
        await setDoc(ref, {
          ...next,
          idKhoaHoc: anyId,
          ngayTao: serverTimestamp(),
        });
      } else {
        // Cập nhật: không đụng tới ngayTao
        await updateDoc(ref, {
          tenKhoaHoc: next.tenKhoaHoc,
          moTa: next.moTa,
          kienThuc: next.kienThuc,
          giaKhoaHoc: next.giaKhoaHoc,
          giamGia: next.giamGia,
          giaSauGiam: next.giaSauGiam,
          boTheIds: safeArr(next.boTheIds).map(String),
          thanhVienIds: safeArr(next.thanhVienIds).map(String),
          folderIds: safeArr(next.folderIds).map(String),
        });
      }
      window.dispatchEvent(new Event("khoaHocChanged"));
      return true;
    } catch (e) {
      console.error("Lưu khóa học thất bại:", e);
      alert("Không thể lưu. Vui lòng thử lại.");
      return false;
    }
  };

  const handleSave = async () => {
    const ten = String(form.tenKhoaHoc || "").trim();
    if (!ten) return alert("Vui lòng nhập tên khóa học.");

    if (!window.confirm("Bạn có chắc muốn lưu thay đổi?")) return;

    const next = {
      ...lop,
      idKhoaHoc: String(lop?.idKhoaHoc ?? lop?._docId ?? Date.now()),
      tenKhoaHoc: ten,
      moTa: String(form.moTa || "").trim(),
      kienThuc: parseTags(form.kienThucText),
      giaKhoaHoc: toNum(form.giaKhoaHoc, 0),
      giamGia: Math.min(100, Math.max(0, toNum(form.giamGia, 0))),
      giaSauGiam,
      boTheIds: safeArr(lop?.boTheIds),
      thanhVienIds: safeArr(lop?.thanhVienIds),
      folderIds: safeArr(lop?.folderIds),
    };

    const ok = onSaved ? (await onSaved(next)) !== false : await saveFirestore(next);
    if (ok) {
      alert("Đã lưu thay đổi.");
      setIsEditing(false);
    }
  };

  if (!open || !lop) return null;

  const money = (n) => Number(n || 0).toLocaleString("vi-VN");
  const ngayTaoStr = toVNDate(fromMaybeTs(lop.ngayTao));

  return (
    <div className="ctl-overlay">
      <div className="ctl-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="ctl-header">
          <h3>Thông tin khóa học</h3>
          <button className="ctl-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        {/* Body */}
        <div className="ctl-body">
          {/* Mã khóa học (readonly) */}
          <div className="ctl-row">
            <label className="ctl-label">Mã khóa học</label>
            <div className="ctl-static">{String(lop?.idKhoaHoc ?? "—")}</div>
          </div>

          {/* Người tạo (readonly) */}
          <div className="ctl-row">
            <label className="ctl-label">Người tạo (ID)</label>
            <div className="ctl-static">{String(lop?.idNguoiDung ?? "—")}</div>
          </div>

          {/* Ngày tạo (readonly) */}
          <div className="ctl-row">
            <label className="ctl-label">Ngày tạo</label>
            <div className="ctl-static">{ngayTaoStr || "—"}</div>
          </div>

          {/* Tên */}
          <div className="ctl-row">
            <label className="ctl-label">Tên khóa học</label>
            {!isEditing ? (
              <div className="ctl-static">{form.tenKhoaHoc || "—"}</div>
            ) : (
              <input
                name="tenKhoaHoc" className="ctl-input" type="text"
                value={form.tenKhoaHoc} onChange={onChange} placeholder="Nhập tên khóa học"
              />
            )}
          </div>

          {/* Kỹ năng/Chủ đề */}
          <div className="ctl-row">
            <label className="ctl-label">Kỹ năng/Chủ đề</label>
            {!isEditing ? (
              <div className="ctl-static">
                {Array.isArray(lop.kienThuc) && lop.kienThuc.length > 0
                  ? lop.kienThuc.join(", ")
                  : "—"}
              </div>
            ) : (
              <>
                <textarea
                  name="kienThucText" rows={2} className="ctl-textarea"
                  value={form.kienThucText} onChange={onChange}
                  placeholder="it, tiếng nhật, tiếng anh… (phẩy hoặc xuống dòng)"
                />
                <div className="ctl-hint">
                  Nhập mỗi dòng 1 thẻ hoặc dùng dấu phẩy. Hệ thống tự loại trùng & chuẩn hoá chữ thường.
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
                name="moTa" rows={3} className="ctl-textarea"
                value={form.moTa} onChange={onChange} placeholder="Mô tả ngắn…"
              />
            )}
          </div>

          {/* Giá tiền */}
          <div className="ctl-grid-2">
            <div className="ctl-row">
              <label className="ctl-label">Học phí (đ)</label>
              {!isEditing ? (
                <div className="ctl-static">{money(form.giaKhoaHoc)}</div>
              ) : (
                <input
                  name="giaKhoaHoc" type="number" min="0" className="ctl-input"
                  value={form.giaKhoaHoc} onChange={onChange} placeholder="0"
                />
              )}
            </div>
            <div className="ctl-row">
              <label className="ctl-label">% giảm giá</label>
              {!isEditing ? (
                <div className="ctl-static">{toNum(form.giamGia)}%</div>
              ) : (
                <input
                  name="giamGia" type="number" min="0" max="100" className="ctl-input"
                  value={form.giamGia} onChange={onChange} placeholder="0"
                />
              )}
            </div>
          </div>

          <div className="ctl-grid-2">
            <div className="ctl-row">
              <label className="ctl-label">Giá sau giảm</label>
              <div className="ctl-static">{money(giaSauGiam)}</div>
            </div>
          </div>

          <div className="ctl-split" />

          {/* Stats */}
          <div className="ctl-stats">
            <div className="ctl-stat-item">
              <span className="ctl-stat-label">Bộ thẻ</span>
              <span className="ctl-stat-value">{soBoThe}</span>
            </div>
            <div className="ctl-stat-item">
              <span className="ctl-stat-label">Thành viên</span>
              <span className="ctl-stat-value">{soTV}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ctl-footer">
          <button className="btn-cancel-outline" onClick={onClose}>Đóng</button>
          {!isEditing ? (
            <button className="btn-primary" onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
          ) : (
            <button className="btn-primary" onClick={handleSave}>Lưu</button>
          )}
        </div>
      </div>
    </div>
  );
}
