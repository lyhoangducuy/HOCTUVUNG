// src/pages/Admin/ChiTra/components/StatusFilter.jsx
import React from "react";

export default function StatusFilter({ value, onChange }) {
  return (
    <div className="rt-config-right">
      <label className="rt-label">Lọc trạng thái</label>
      <select className="rt-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">Tất cả</option>
        <option value="pending">Đang xử lý</option>
        <option value="approved">Đã duyệt</option>
        <option value="paid">Đã trả</option>
        <option value="canceled">Đã hủy</option>
      </select>
    </div>
  );
}
