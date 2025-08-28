import "./TableAdmin.css";
import { useEffect, useMemo, useState } from "react";

const TableAdmin = ({
  Colums = [],
  Data = [],
  Action = [],
  pageSizeDefault = 5,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const [pageSize, setPageSize] = useState(pageSizeDefault);
  const [currentPage, setCurrentPage] = useState(1);

  const total = Array.isArray(Data) ? Data.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // clamp trang khi đổi dữ liệu / pageSize
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(total / pageSize));
    setCurrentPage((p) => Math.min(p, newTotalPages));
  }, [total, pageSize]);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return Array.isArray(Data) ? Data.slice(start, start + pageSize) : [];
  }, [Data, currentPage, pageSize]);

  // for "1–10 / 123"
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  // build dãy trang với "…"
  const pages = useMemo(() => {
    const arr = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) arr.push(i);
      return arr;
    }
    arr.push(1);
    if (currentPage > 3) arr.push("…");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    if (currentPage < totalPages - 2) arr.push("…");
    arr.push(totalPages);
    return arr;
  }, [currentPage, totalPages]);

  return (
    <div className="table-wrapper">
      <table className="user-table">
        <thead>
          <tr>
            {Colums.map((col, idx) => (
              <th key={idx}>{col.name}</th>
            ))}
            {Action?.length > 0 && <th>Action</th>}
          </tr>
        </thead>

        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td
                colSpan={Colums.length + (Action?.length > 0 ? 1 : 0)}
                style={{ textAlign: "center", padding: 16, opacity: 0.7 }}
              >
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            pageData.map((item) => (
              <tr key={item.id || JSON.stringify(item)}>
                {Colums.map((col, idx) => (
                  <td key={idx}>{item[col.key]}</td>
                ))}

                {Action?.length > 0 && (
                  <td>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {Action.map((act, idx) => (
                        <button
                          key={idx}
                          className={act.class}
                          style={act.style}
                          title={act.title || ""}
                          onClick={() => {
                            const ret = act.onClick?.(item.id, item);
                            if (typeof ret === "function") ret();
                          }}
                          aria-label={act.ariaLabel || act.name}
                        >
                          {act.name}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Phân trang */}
      <div className="user-pagination">
        <div className="admin-pagesize">
          <label>
            Hiển thị
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-pages">
          <button
            className="admin-pagebtn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            aria-label="Trang đầu"
          >
            «
          </button>
          <button
            className="admin-pagebtn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Trang trước"
          >
            ‹
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`dots-${i}`} className="admin-pagebtn admin-pagebtn--dots">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`admin-pagebtn ${
                  p === currentPage ? "admin-pagebtn--active" : ""
                }`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            )
          )}

          <button
            className="admin-pagebtn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Trang sau"
          >
            ›
          </button>
          <button
            className="admin-pagebtn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Trang cuối"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableAdmin;
