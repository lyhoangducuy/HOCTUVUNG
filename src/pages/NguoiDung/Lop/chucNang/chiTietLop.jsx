import React, { useEffect, useState } from "react";

export default function ChiTietLopModal({ open, lop, onClose, onSave }) {
  if (!open || !lop) return null;

  const [form, setForm] = useState({
    tenLop: "",
    tenTruong: "",
    tenQuocGia: "",
    tenThanhPho: "",
    moTa: "",
  });

  // nạp dữ liệu ban đầu mỗi khi mở modal
  useEffect(() => {
    if (!open) return;
    setForm({
      tenLop: lop.tenLop || "",
      tenTruong: lop.tenTruong || "",
      tenQuocGia: lop.tenQuocGia || "",
      tenThanhPho: lop.tenThanhPho || "",
      moTa: lop.moTa || "",
    });
  }, [open, lop]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const getLopId = (x) => x?.idLop ?? x?.id ?? x?.maLop ?? null;

  // Fallback lưu localStorage (nếu không truyền onSave)
  const fallbackSaveToLocalStorage = (next) => {
    try {
      const keys = ["class", "classes", "lop"];
      const id = getLopId(next);
      if (!id) return;

      for (const k of keys) {
        const arr = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(arr) && arr.length) {
          const idx = arr.findIndex(
            (it) => String(getLopId(it)) === String(id)
          );
          if (idx > -1) {
            arr[idx] = { ...arr[idx], ...next };
            localStorage.setItem(k, JSON.stringify(arr));
          }
        }
      }
    } catch {}
  };

  const handleSave = () => {
    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, String(v || "").trim()])
    );
    const next = { ...lop, ...trimmed };
    if (typeof onSave === "function") onSave(next);
    else fallbackSaveToLocalStorage(next);
    onClose?.();
  };

  // Hiển thị số liệu (nếu cần)
  const soBoThe = Array.isArray(lop.boTheIds) ? lop.boTheIds.length : (Number.isFinite(lop?.soBoThe) ? lop.soBoThe : 0);
  const soFolder = Array.isArray(lop.folderIds) ? lop.folderIds.length : (Number.isFinite(lop?.soFolder) ? lop.soFolder : 0);
  const soThanhVien = Array.isArray(lop.thanhVienIds) ? lop.thanhVienIds.length : (Number.isFinite(lop?.soThanhVien) ? lop.soThanhVien : 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>Thông tin lớp</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className="modal-body">
          <div className="info-row">
            <span className="label">Tên lớp:</span>
            <input
              name="tenLop"
              type="text"
              value={form.tenLop}
              onChange={onChange}
              className="input"
              placeholder="Nhập tên lớp"
            />
          </div>

          <div className="info-row">
            <span className="label">Trường:</span>
            <input
              name="tenTruong"
              type="text"
              value={form.tenTruong}
              onChange={onChange}
              className="input"
              placeholder="Nhập tên trường"
            />
          </div>

          <div className="info-row">
            <span className="label">Quốc gia:</span>
            <input
              name="tenQuocGia"
              type="text"
              value={form.tenQuocGia}
              onChange={onChange}
              className="input"
              placeholder="Nhập quốc gia"
            />
          </div>

          <div className="info-row">
            <span className="label">Thành phố:</span>
            <input
              name="tenThanhPho"
              type="text"
              value={form.tenThanhPho}
              onChange={onChange}
              className="input"
              placeholder="Nhập thành phố"
            />
          </div>

          <div className="info-row">
            <span className="label">Mô tả:</span>
            <textarea
              name="moTa"
              rows={3}
              value={form.moTa}
              onChange={onChange}
              className="textarea"
              placeholder="Mô tả ngắn về lớp…"
            />
          </div>

          <div className="split" />

          <div className="info-row"><span className="label">Bộ thẻ:</span> <span>{soBoThe}</span></div>
          <div className="info-row"><span className="label">Thư mục:</span> <span>{soFolder}</span></div>
          <div className="info-row"><span className="label">Thành viên:</span> <span>{soThanhVien}</span></div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn-primary" onClick={handleSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
}
