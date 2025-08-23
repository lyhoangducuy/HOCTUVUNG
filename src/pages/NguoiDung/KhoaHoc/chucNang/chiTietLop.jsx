import React, { useEffect, useState } from "react";

export default function ChiTietLopModal({ open, lop, onClose, onSave }) {
  if (!open || !lop) return null;

  const [form, setForm] = useState({
    tenKhoaHoc: "",
    moTa: "",
    kienThucText: "", // nhập bằng dấu phẩy hoặc xuống dòng
  });

  // helpers
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
    try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? fb; }
    catch { return fb; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const getAnyId = (x) => x?.idKhoaHoc ?? x?.idLop ?? x?.id ?? x?.maLop ?? null;

  // nạp dữ liệu ban đầu mỗi khi mở modal
  useEffect(() => {
    if (!open) return;
    const tenKhoaHoc = lop.tenKhoaHoc ?? lop.tenLop ?? "";
    const moTa = lop.moTa ?? "";
    const kienThucText = Array.isArray(lop.kienThuc) ? lop.kienThuc.join(", ") : "";
    setForm({ tenKhoaHoc, moTa, kienThucText });
  }, [open, lop]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // Lưu: ưu tiên ghi vào 'khoaHoc', đồng thời cập nhật 'lop' (legacy) để tương thích
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

    // 2) cập nhật 'lop' (legacy) nếu tồn tại để không phá phần cũ
    {
      const arr = readJSON("lop", []);
      if (Array.isArray(arr) && arr.length) {
        const idx = arr.findIndex((it) => String(getAnyId(it)) === String(id));
        if (idx > -1) {
          arr[idx] = {
            ...arr[idx],
            // giữ đồng bộ name cũ để phần legacy còn dùng được
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
  };

  const handleSave = () => {
    const tenKhoaHoc = String(form.tenKhoaHoc || "").trim();
    const moTa = String(form.moTa || "").trim();
    const kienThuc = parseTags(form.kienThucText);

    // dựng object theo schema mới, kèm field cũ để tương thích
    const next = {
      ...lop,
      idKhoaHoc: lop.idKhoaHoc ?? getAnyId(lop) ?? Date.now(),
      tenKhoaHoc,
      moTa,
      kienThuc,
      boTheIds: Array.isArray(lop.boTheIds) ? lop.boTheIds : [],
      folderIds: Array.isArray(lop.folderIds) ? lop.folderIds : [],
      thanhVienIds: Array.isArray(lop.thanhVienIds) ? lop.thanhVienIds : [],
      // giữ tên cũ cho phần còn dùng 'lop'
      tenLop: tenKhoaHoc,
    };

    if (typeof onSave === "function") onSave(next);
    else fallbackSaveToLocalStorage(next);

    onClose?.();
  };

  // Số liệu hiển thị
  const soBoThe = Array.isArray(lop.boTheIds) ? lop.boTheIds.length : (Number.isFinite(lop?.soBoThe) ? lop.soBoThe : 0);
  const soFolder = Array.isArray(lop.folderIds) ? lop.folderIds.length : (Number.isFinite(lop?.soFolder) ? lop.soFolder : 0);
  const soThanhVien = Array.isArray(lop.thanhVienIds) ? lop.thanhVienIds.length : (Number.isFinite(lop?.soThanhVien) ? lop.soThanhVien : 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>Thông tin khóa học</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className="modal-body">
          <div className="info-row">
            <span className="label">Tên khóa học:</span>
            <input
              name="tenKhoaHoc"
              type="text"
              value={form.tenKhoaHoc}
              onChange={onChange}
              className="input"
              placeholder="Nhập tên khóa học"
            />
          </div>

          <div className="info-row">
            <span className="label">Kỹ năng/Chủ đề (kiến thức):</span>
            <textarea
              name="kienThucText"
              rows={2}
              value={form.kienThucText}
              onChange={onChange}
              className="textarea"
              placeholder="Ví dụ: it, tiếng nhật, tiếng anh…"
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
              placeholder="Mô tả ngắn về khóa học…"
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
