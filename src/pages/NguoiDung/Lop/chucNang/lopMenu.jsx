import React, { useEffect, useRef } from "react";

/**
 * Menu dấu ba chấm cho trang Lớp
 * props:
 * - open: boolean
 * - anchorRef: ref tới nút "..."
 * - onClose: () => void
 * - onViewDetail: () => void
 * - onDelete: () => void
 */
export default function LopMenu({ open, anchorRef, onClose, onViewDetail, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      const a = anchorRef?.current;
      const m = menuRef.current;
      if (m && !m.contains(e.target) && a && !a.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  return (
    <div ref={menuRef} className="ellipsis-menu">
      <button className="ellipsis-item" onClick={() => { onViewDetail?.(); onClose?.(); }}>
        Xem chi tiết lớp hoặc sửa
      </button>
      <button className="ellipsis-item danger" onClick={() => { onDelete?.(); onClose?.(); }}>
        Xoá lớp
      </button>
    </div>
  );
}
