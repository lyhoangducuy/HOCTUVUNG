import React from "react";

export default function MetaThongTin({ idBoThe, creatorName, ngayTao, ngayChinhSua }) {
  return (
    <div className="bt-grid">
      <div className="bt-row"><span className="bt-label">Mã bộ thẻ</span><span>{idBoThe}</span></div>
      <div className="bt-row"><span className="bt-label">Người tạo</span><span>{creatorName}</span></div>
      <div className="bt-row"><span className="bt-label">Ngày tạo</span><span>{ngayTao}</span></div>
      <div className="bt-row"><span className="bt-label">Chỉnh sửa</span><span>{ngayChinhSua}</span></div>
    </div>
  );
}
