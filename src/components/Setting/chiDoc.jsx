import React from "react";

export default function chiDoc({ nhan, giaTri }) {
  return (
    <div className="info-item">
      <div className="info-account">
        <div className="info-label">{nhan} :</div>
        <div className="info-value">{String(giaTri ?? "—")}</div>
      </div>
      <div className="info-action">{/* không có nút Sửa */}</div>
    </div>
  );
}
