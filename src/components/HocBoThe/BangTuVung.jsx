import React, { useMemo } from "react";

export default function BangTuVung({ danhSachThe = [], showAll = false, onToggle }) {
  const termsToShow = useMemo(
    () => (showAll ? danhSachThe : danhSachThe.slice(0, 10)),
    [showAll, danhSachThe]
  );

  return (
    <div className="bt-list">
      <div className="bt-list-head">
        <h3>Từ vựng</h3>
        {danhSachThe.length > 10 && (
          <button className="btn xs" onClick={onToggle}>
            {showAll ? "Thu gọn" : `Xem tất cả (${danhSachThe.length})`}
          </button>
        )}
      </div>

      {danhSachThe.length === 0 ? (
        <div className="empty">Bộ thẻ chưa có mục nào.</div>
      ) : (
        <div className="table">
          <div className="tr head">
            <div className="td idx">#</div>
            <div className="td">Từ</div>
            <div className="td">Nghĩa</div>
          </div>
          {termsToShow.map((t, i) => (
            <div className="tr" key={`${i}-${t?.tu}-${t?.nghia}`}>
              <div className="td idx">{i + 1}</div>
              <div className="td">{t?.tu}</div>
              <div className="td">{t?.nghia}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
