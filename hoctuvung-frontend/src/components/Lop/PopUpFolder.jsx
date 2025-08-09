import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function PopUpFolder({ showAddFolder, setShowAddFolder }) {
  if (!showAddFolder) return null;

  // Khóa scroll và đóng bằng ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setShowAddFolder(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [setShowAddFolder]);

  const ui = (
    <div className="popup-overlay" onClick={() => setShowAddFolder(false)}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Thêm một thư mục</h3>
          <button className="popup-close" onClick={() => setShowAddFolder(false)}>✕</button>
        </div>

        <div className="popup-body">
          <label>Tên thư mục</label>
          <input className="popup-input" type="text" placeholder="Nhập tên folder" />
        </div>

        <div className="popup-footer">
          <button className="btn-primary" onClick={() => setShowAddFolder(false)}>Xong</button>
        </div>
      </div>
    </div>
  );

  // Render thẳng vào <body> để tránh mọi stacking/overflow của parent
  return createPortal(ui, document.body);
}
