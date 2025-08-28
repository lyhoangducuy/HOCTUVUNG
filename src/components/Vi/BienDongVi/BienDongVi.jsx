import React, { useMemo, useState, useEffect } from "react";
import { formatDate, formatVND } from "../../../pages/NguoiDung/Vi/utils/dinhDang";

export default function BangBienDongVi({
  rows = [],
  loading = false,
  pageSizeDefault = 5,
  // Các loại “mua khóa học” mặc định (tùy schema của bạn):
  allowedLoai = ["MUA_KHOA_HOC", "COURSE_PURCHASE"],
  // Nếu muốn tự lọc chi tiết, truyền filterLoai: (row) => boolean
  filterLoai,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);

  // --- Chỉ lấy hóa đơn mua khóa học ---
  const filteredRows = useMemo(() => {
    const isCoursePurchase = (r) => {
      // Ưu tiên trường “loại” nếu có
      const loaiRaw =
        r.loai || r.type || r.loaiGiaoDich || r.kind || r.category || "";
      const loai = String(loaiRaw).toUpperCase();

      // Một số hệ thống lưu “mã dịch vụ” cho khóa học
      const mdvRaw = r.maDichVu || r.dichVu || "";
      const mdv = String(mdvRaw).toUpperCase();

      // Heuristic theo nội dung mô tả
      const nd = String(r.noiDung || "").toLowerCase();

      return (
        (allowedLoai?.length && loai && allowedLoai.includes(loai)) ||
        mdv === "KHOA_HOC" ||
        mdv === "COURSE" ||
        nd.includes("khóa học") ||
        nd.includes("khoa hoc") ||
        nd.includes("course")
      );
    };

    if (typeof filterLoai === "function") {
      return rows.filter(filterLoai);
    }
    return rows.filter(isCoursePurchase);
  }, [rows, allowedLoai, filterLoai]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = useMemo(() => {
    const out = [];
    const push = (v) => out.push(v);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return out;
    }
    push(1);
    if (page > 3) push("…");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) push(i);
    if (page < totalPages - 2) push("…");
    push(totalPages);
    return out;
  }, [page, totalPages]);

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
                const moneyMod =
                  r.trangThai === "canceled"
                    ? "vi-amount--minus"
                    : r.isWithdraw
                    ? "vi-amount--minus"
                    : "vi-amount--plus";

                const badgeMod =
                  r.trangThai === "done"
                    ? r.isWithdraw
                      ? "vi-badge--minus"
                      : "vi-badge--plus"
                    : r.trangThai === "canceled"
                    ? "vi-badge--minus"
                    : "vi-badge--pending";

                return (
                  <tr key={r.id}>
                    <td data-label="Trạng thái">
                      <span className={`vi-badge ${badgeMod}`}>
                        {r.trangThai === "done"
                          ? "Hoàn tất"
                          : r.trangThai === "canceled"
                          ? "Hủy"
                          : "Đang xử lý"}
                      </span>
                    </td>
                    <td data-label="Người mua">{r.buyerName}</td>
                    <td data-label="Số tiền" className={`vi-amount ${moneyMod}`}>
                      {r.trangThai === "canceled"
                        ? "0đ"
                        : `${r.sign}${formatVND(r.soTien)}`}
                    </td>
                    <td data-label="Nội dung">{r.noiDung}</td>
                    <td data-label="Thời gian">{formatDate(r.ngayTao)}</td>
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
