import React from "react";

export default function TieuDeBoThe({ tenBoThe, idBoThe, cheDo, soThe, luotHoc }) {
  return (
    <div className="bt-head-only">
      <h2 className="bt-title">{tenBoThe || `Bộ thẻ #${idBoThe}`}</h2>
      <div className="bt-sub">
        <span className={`chip ${cheDo === "cong_khai" ? "pub" : "pri"}`}>
          {cheDo === "cong_khai" ? "Công khai" : "Cá nhân"}
        </span>
        <span className="sep">•</span>
        <span>{soThe} thẻ</span>
        <span className="sep">•</span>
        <span>{luotHoc} lượt học</span>
      </div>
    </div>
  );
}
