// src/components/Vi/BienDongVi/BangBienDongVi.jsx
import React, { useMemo, useState, useEffect } from "react";
import { formatDate, formatVND } from "../../../pages/NguoiDung/Vi/utils/dinhDang";

export default function BangBienDongVi({
  rows = [],
  loading = false,
  pageSizeDefault = 5,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);

  // Chuẩn hoá thời gian
  const toPlainDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v?.toDate === "function") return v.toDate();
    if (typeof v === "number") return new Date(v);
    if (typeof v === "string") {
      const d = new Date(v);
      return isNaN(d) ? null : d;
    }
    return null;
  };

  // Gom trạng thái về done | canceled | pending (để ăn CSS sẵn có)
  const normStatus = (s) => {
    const t = String(s || "").toLowerCase();
    if (["done", "paid", "success", "succeeded"].includes(t)) return "done";
    if (["canceled", "cancelled", "failed", "refunded"].includes(t)) return "canceled";
    return "pending";
  };

  // 🚩 CHỈ LỌC THEO loaiThanhToan === "muaKhoaHoc"
  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => String(r.loaiThanhToan || "").toLowerCase() === "muakhoahoc")
      .map((r) => {
        const status = normStatus(r.trangThai);
        const amount =
          Number(
            r.soTien ??
            r.soTienThanhToanThucTe ??
            r.soTienThanhToan ??
            0
          ) || 0;

        const time =
          toPlainDate(r.paidAt) ||
          toPlainDate(r.createdAt) ||
          toPlainDate(r.ngayTao) ||
          toPlainDate(r.updatedAt) ||
          null;

        const buyerName =
          r.buyerName ||
          r.tenNguoiDung ||
          r.hoTen ||
          r.hoten ||
          r.email ||
          "Người dùng";

        const noiDung = r.noiDung || r.tenGoi || "—";

        return {
          id: r.id || r.idHoaDon,
          status,
          amount,
          buyerName,
          noiDung,
          time,
          isWithdraw: !!r.isWithdraw,
        };
      });
  }, [rows]);

  // Phân trang
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = useMemo(() => {
    const out = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
      return out;
    }
    out.push(1);
    if (page > 3) out.push("…");
    const s = Math.max(2, page - 1);
    const e = Math.min(totalPages - 1, page + 1);
    for (let i = s; i <= e; i++) out.push(i);
    if (page < totalPages - 2) out.push("…");
    out.push(totalPages);
    return out;
  }, [page, totalPages]);

  // Render
  return (
    <div className="vi-table-wrap">
      <div className="vi-table-headline">
        <h2>Lịch sử thanh toán khóa học</h2>
        <span className="vi-muted">
          {total} dòng{total ? ` • ${from}-${to}` : ""}
        </span>
      </div>

      {loading ? (
        <div className="vi-empty">Đang tải…</div>
      ) : total === 0 ? (
        <div className="vi-empty">Chưa có giao dịch mua khóa học.</div>
      ) : (
        <>
          <table className="vi-table">
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Người mua</th>
                <th>Số tiền</th>
                <th>Nội dung</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const badgeMod =
                  r.status === "done"
                    ? "vi-badge--plus"
                    : r.status === "canceled"
                    ? "vi-badge--minus"
                    : "vi-badge--pending";

                const moneyMod =
                  r.status === "canceled" || r.isWithdraw
                    ? "vi-amount--minus"
                    : "vi-amount--plus";

                return (
                  <tr key={r.id}>
                    <td data-label="Trạng thái">
                      <span className={`vi-badge ${badgeMod}`}>
                        {r.status === "done"
                          ? "Hoàn tất"
                          : r.status === "canceled"
                          ? "Hủy"
                          : "Đang xử lý"}
                      </span>
                    </td>
                    <td data-label="Người mua">{r.buyerName}</td>
                    <td data-label="Số tiền" className={`vi-amount ${moneyMod}`}>
                      {r.status === "canceled" ? "0đ" : `+${formatVND(r.amount)}`}
                    </td>
                    <td data-label="Nội dung">{r.noiDung}</td>
                    <td data-label="Thời gian">{formatDate(r.time)}</td>
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
              <button className="vi-pagebtn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Trang đầu">«</button>
              <button className="vi-pagebtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Trang trước">‹</button>

              {pages.map((p, i) =>
                p === "…" ? (
                  <span key={`dots-${i}`} className="vi-pagebtn vi-pagebtn--dots">…</span>
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

              <button className="vi-pagebtn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Trang sau">›</button>
              <button className="vi-pagebtn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Trang cuối">»</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
