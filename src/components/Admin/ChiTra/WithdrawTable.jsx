// src/pages/Admin/ChiTra/components/WithdrawTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../../../pages/Admin/ChiTra/ChiTra.css";

const VN = "vi-VN";
const num  = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const vnd  = (n) => num(n).toLocaleString(VN) + "đ";
const toDate = (v) => (typeof v?.toDate === "function" ? v.toDate() : new Date(v || 0));
const time = (v) => {
  try { const d = toDate(v); return isNaN(d.getTime()) ? "" : d.toLocaleString(VN); }
  catch { return ""; }
};

export default function WithdrawTable({
  loading = false,
  rows = [],
  nameById = () => "",
  onApprove = () => {},
  onPaid = () => {},
  onCancel = () => {},
  pageSizeDefault = 5,
  pageSizeOptions = [5, 10, 20, 50],
}) {
  /* ===== Pagination state ===== */
  const [pageSize, setPageSize] = useState(pageSizeDefault);
  const [page, setPage] = useState(1);

  const total = Array.isArray(rows) ? rows.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Clamp trang khi đổi dữ liệu / pageSize
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(total / pageSize));
    setPage((p) => Math.min(p, newTotalPages));
  }, [total, pageSize]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return Array.isArray(rows) ? rows.slice(start, start + pageSize) : [];
  }, [rows, page, pageSize]);

  // 1–10 / 123
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  // Dãy trang với “…”
  const pages = useMemo(() => {
    const arr = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) arr.push(i);
      return arr;
    }
    arr.push(1);
    if (page > 3) arr.push("…");
    const start = Math.max(2, page - 1);
    const end   = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    if (page < totalPages - 2) arr.push("…");
    arr.push(totalPages);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="rt-table-wrap">
      <table className="rt-table">
        <thead>
          <tr>
            <th>Mã YC</th>
            <th>Người dùng</th>
            <th>Số tiền</th>
            <th>Phí</th>
            <th>Thực chi</th>
            <th>Số TK NH</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th style={{ minWidth: 220 }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="rt-empty">Đang tải…</td></tr>
          ) : pageRows.length === 0 ? (
            <tr><td colSpan={9} className="rt-empty">Chưa có yêu cầu nào.</td></tr>
          ) : (
            pageRows.map((r) => {
              const st = String(r.TinhTrang || "pending");
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{nameById(r.idNguoiDung)}</td>
                  <td>{vnd(r.SoTien)}</td>
                  <td>{vnd(r.Phi)}</td>
                  <td>{vnd(r.TienSauPhi)}</td>
                  <td>{r.SoTaiKhoanNganHang || "—"}</td>
                  <td>
                    <span className={`rt-badge rt-badge--${st}`}>
                      {st === "pending"
                        ? "Đang xử lý"
                        : st === "approved"
                        ? "Đã duyệt"
                        : st === "paid"
                        ? "Đã trả"
                        : "Đã hủy"}
                    </span>
                  </td>
                  <td>{time(r.NgayTao)}</td>
                  <td className="rt-actions">
                    <button
                      className="rt-btn"
                      disabled={st !== "pending"}
                      onClick={() => onApprove(r)}
                    >
                      Duyệt
                    </button>
                    <button
                      className="rt-btn"
                      disabled={!(st === "pending" || st === "approved")}
                      onClick={() => onPaid(r)}
                    >
                      Đã trả
                    </button>
                    <button
                      className="rt-btn rt-btn-danger"
                      disabled={st === "paid" || st === "canceled"}
                      onClick={() => onCancel(r)}
                    >
                      Huỷ
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="rt-pagination">
        <div className="rt-pagesize">
          <label>
            Hiển thị
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="rt-pages">
          <button
            className="rt-pagebtn"
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="Trang đầu"
          >
            «
          </button>
          <button
            className="rt-pagebtn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Trang trước"
          >
            ‹
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`dots-${i}`} className="rt-pagebtn rt-pagebtn--dots">…</span>
            ) : (
              <button
                key={p}
                className={`rt-pagebtn ${p === page ? "rt-pagebtn--active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            )
          )}

          <button
            className="rt-pagebtn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Trang sau"
          >
            ›
          </button>
          <button
            className="rt-pagebtn"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            aria-label="Trang cuối"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
