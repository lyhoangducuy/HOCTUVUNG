import React from "react";

export default function ChiTietLopModal({ open, lop, onClose }) {
  if (!open || !lop) return null;

  const soBoThe = Array.isArray(lop.boTheIds) ? lop.boTheIds.length : 0;
  const soFolder = Array.isArray(lop.folderIds) ? lop.folderIds.length : 0;
  const soThanhVien = Array.isArray(lop.thanhVienIds) ? lop.thanhVienIds.length : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Thông tin lớp</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="info-row"><span className="label">Tên lớp:</span> <span>{lop.tenLop || "-"}</span></div>
          <div className="info-row"><span className="label">Trường:</span> <span>{lop.school || "-"}</span></div>
          <div className="info-row"><span className="label">Quốc gia:</span> <span>{lop.country || "-"}</span></div>
          <div className="info-row"><span className="label">Thành phố:</span> <span>{lop.city || "-"}</span></div>
          <div className="info-row"><span className="label">Mô tả:</span> <span>{lop.description || "-"}</span></div>
          <div className="split" />
          <div className="info-row"><span className="label">Bộ thẻ:</span> <span>{soBoThe}</span></div>
          <div className="info-row"><span className="label">Thư mục:</span> <span>{soFolder}</span></div>
          <div className="info-row"><span className="label">Thành viên:</span> <span>{soThanhVien}</span></div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
