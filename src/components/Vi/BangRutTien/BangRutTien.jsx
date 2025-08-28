import React, { useMemo, useState, useEffect } from "react";
import { formatDate, formatVND } from "../../../pages/NguoiDung/Vi/utils/dinhDang";

export default function BangRutTien({
  withdraws = [],
  loading = false,
  pageSizeDefault = 5,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);

  const total = withdraws.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return withdraws.slice(start, start + pageSize);
  }, [withdraws, page, pageSize]);

  const pages = useMemo(() => {
    const arr = [];
    const push = (v) => arr.push(v);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return arr;
    }
    push(1);
    if (page > 3) push("…");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) push(i);
    if (page < totalPages - 2) push("…");
    push(totalPages);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="vi-table-wrap" style={{ marginTop: 24 }}>
      <div className="vi-table-headline">
        <h2>Lịch sử rút tiền</h2>
        <span className="vi-muted">{total} yêu cầu</span>
      </div>

      {loading ? (
        <div className="vi-empty">Đang tải…</div>
      ) : total === 0 ? (
        <div className="vi-empty">Chưa có yêu cầu rút nào.</div>
      ) : (
        <>
          <table className="vi-table">
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Số tiền yêu cầu</th>
                <th>Phí</th>
                <th>Thực nhận</th>
                <th>STK ngân hàng</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((w) => {
                // === ĐỔI MÀU Ở ĐÂY: paid -> xanh (plus), canceled/rejected -> đỏ (minus), còn lại -> pending (xám)
                const badge =
                  w.status === "paid"
                    ? "vi-badge vi-badge--plus"
                    : w.status === "canceled" || w.status === "rejected"
                    ? "vi-badge vi-badge--minus"
                    : "vi-badge vi-badge--pending";

                return (
                  <tr key={w.id}>
                    <td data-label="Trạng thái">
                      <span className={badge}>
                        {w.status === "paid"
                          ? "Đã trả"
                          : w.status === "approved"
                          ? "Đã duyệt"
                          : w.status === "canceled" || w.status === "rejected"
                          ? "Đã hủy"
                          : "Đang xử lý"}
                      </span>
                    </td>
                    <td data-label="Số tiền yêu cầu">{formatVND(w.soTien)}</td>
                    <td data-label="Phí">{formatVND(w.phi)}</td>
                    <td data-label="Thực nhận">{formatVND(w.net)}</td>
                    <td data-label="STK ngân hàng">{w.acct || "—"}</td>
                    <td data-label="Thời gian">{formatDate(w.created)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Phân trang */}
          <div className="vi-pager">
            <div className="vi-pagesize">
              <label>
                Hiển thị
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="vi-pages">
              <button
                className="vi-pagebtn"
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label="Trang đầu"
              >
                «
              </button>
              <button
                className="vi-pagebtn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Trang trước"
              >
                ‹
              </button>

              {pages.map((p, i) =>
                p === "…" ? (
                  <span key={`dots-${i}`} className="vi-pagebtn vi-pagebtn--dots">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`vi-pagebtn ${p === page ? "vi-pagebtn--active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className="vi-pagebtn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Trang sau"
              >
                ›
              </button>
              <button
                className="vi-pagebtn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                aria-label="Trang cuối"
              >
                »
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
