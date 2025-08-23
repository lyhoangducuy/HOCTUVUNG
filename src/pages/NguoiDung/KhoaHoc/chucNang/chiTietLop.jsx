import React, { useEffect, useState } from "react";
import "./chiTietLop.css";

export default function ChiTietLopModal({
  open,
  lop,
  onClose,
  onSave,          // optional: nếu không truyền, sẽ tự lưu vào localStorage
  isEditMode = false, // optional: mở modal là edit luôn
}) {
  if (!open || !lop) return null;

  const [form, setForm] = useState({
    tenKhoaHoc: "",
    moTa: "",
    kienThucText: "",
  });
  const [isEditing, setIsEditing] = useState(!!isEditMode);

  // ===== Helpers =====
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

  const readJSON = (k, fb) => {
    try {
      const v = JSON.parse(localStorage.getItem(k) || "null");
      return v ?? fb;
    } catch {
      return fb;
    }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const getAnyId = (x) => x?.idKhoaHoc ?? x?.idLop ?? x?.id ?? x?.maLop ?? null;

  // đồng bộ prop -> state khi mở modal / đổi lop
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

  // fallback lưu vào localStorage (khoaHoc + legacy lop)
  const fallbackSaveToLocalStorage = (next) => {
    const id = getAnyId(next);
    if (!id) return;

    // 1) cập nhật 'khoaHoc'
    {
      const arr = readJSON("khoaHoc", []);
      const idx = arr.findIndex((it) => String(getAnyId(it)) === String(id));
      if (idx > -1) arr[idx] = { ...arr[idx], ...next };
      else arr.push(next);
      writeJSON("khoaHoc", arr);
    }

    // 2) cập nhật 'lop' (legacy) để không phá phần cũ
    {
      const arr = readJSON("lop", []);
      if (Array.isArray(arr) && arr.length) {
        const idx = arr.findIndex((it) => String(getAnyId(it)) === String(id));
        if (idx > -1) {
          arr[idx] = {
            ...arr[idx],
            tenLop: next.tenKhoaHoc,
            moTa: next.moTa,
            boTheIds: next.boTheIds,
            folderIds: next.folderIds,
            thanhVienIds: next.thanhVienIds,
            kienThuc: next.kienThuc,
          };
          writeJSON("lop", arr);
        }
      }
    }

    // phát sự kiện để các màn khác reload
    window.dispatchEvent(new Event("khoaHocChanged"));
  };

  const handleSave = () => {
    const tenKhoaHoc = String(form.tenKhoaHoc || "").trim();
    if (!tenKhoaHoc) {
      alert("Vui lòng nhập tên khóa học.");
      return;
    }
    const moTa = String(form.moTa || "").trim();
    const kienThuc = parseTags(form.kienThucText);

    const next = {
      ...lop,
      idKhoaHoc: lop.idKhoaHoc ?? getAnyId(lop) ?? Date.now(),
      tenKhoaHoc,
      moTa,
      kienThuc,
      boTheIds: Array.isArray(lop.boTheIds) ? lop.boTheIds : [],
      folderIds: Array.isArray(lop.folderIds) ? lop.folderIds : [],
      thanhVienIds: Array.isArray(lop.thanhVienIds) ? lop.thanhVienIds : [],
      // giữ tên cũ cho phần legacy dùng 'tenLop'
      tenLop: tenKhoaHoc,
    };

    if (typeof onSave === "function") onSave(next);
    else fallbackSaveToLocalStorage(next);

    // Ở lại modal, chuyển về chế độ xem
    setIsEditing(false);
  };

  const soBoThe =
    Array.isArray(lop.boTheIds) ? lop.boTheIds.length :
    (Number.isFinite(lop?.soBoThe) ? lop.soBoThe : 0);
  const soFolder =
    Array.isArray(lop.folderIds) ? lop.folderIds.length :
    (Number.isFinite(lop?.soFolder) ? lop.soFolder : 0);
  const soThanhVien =
    Array.isArray(lop.thanhVienIds) ? lop.thanhVienIds.length :
    (Number.isFinite(lop?.soThanhVien) ? lop.soThanhVien : 0);

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
                {Array.isArray(lop.kienThuc) && lop.kienThuc.length > 0 ? (
                  lop.kienThuc.join(", ")
                ) : (
                  "—"
                )}
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
                  Mẹo: bạn có thể nhập mỗi dòng 1 thẻ hoặc dùng dấu phẩy. Hệ thống tự loại trùng & chuẩn hóa chữ thường.
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
              <span className="ctl-stat-label">Thư mục</span>
              <span className="ctl-stat-value">{soFolder}</span>
            </div>
            <div className="ctl-stat-item">
              <span className="ctl-stat-label">Thành viên</span>
              <span className="ctl-stat-value">{soThanhVien}</span>
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
