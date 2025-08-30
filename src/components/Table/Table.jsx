import React, { useMemo, useState } from "react";
import "./Table.css";

export default function Table({
  columns = [],
  data = [],
  rowKey,                    // string hoặc (row, i) => key
  emptyMessage = "No data available",
  onRowClick,               // optional
  loading = false,          // optional
  dense = false,            // optional: padding gọn hơn
}) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const safeGet = (obj, path) => {
    if (!path) return obj;
    if (typeof path === "function") return path(obj);
    const parts = String(path).split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  };

  const handleSort = (col) => {
    if (!col.sortable) return;
    setSort((s) => {
      const dir = s.key === col.accessor && s.dir === "asc" ? "desc" : "asc";
      return { key: col.accessor, dir };
    });
  };

  const sortedData = useMemo(() => {
    if (loading) return [];
    const arr = Array.isArray(data) ? [...data] : [];
    const col = columns.find((c) => c.accessor === sort.key);
    if (!col || !col.sortable) return arr;

    const cmp =
      col.sortFn ||
      ((a, b) => {
        const va = safeGet(a, col.accessor);
        const vb = safeGet(b, col.accessor);
        const na = Number(va);
        const nb = Number(vb);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return String(va ?? "").localeCompare(String(vb ?? ""), "vi", {
          numeric: true,
          sensitivity: "base",
        });
      });

    arr.sort((a, b) => {
      const res = cmp(a, b);
      return sort.dir === "asc" ? res : -res;
    });
    return arr;
  }, [data, columns, sort, loading]);

  const rowsToRender = loading ? Array.from({ length: 5 }).map(() => ({})) : sortedData;

  const getRowKey = (row, index) => {
    if (typeof rowKey === "function") return rowKey(row, index);
    if (typeof rowKey === "string" && row && row[rowKey] != null)
      return String(row[rowKey]);
    return index;
  };

  const renderCell = (row, col, rowIndex) => {
    if (typeof col.render === "function") return col.render(row, rowIndex);
    const v = safeGet(row, col.accessor);
    return v == null || v === "" ? "—" : v;
  };

  return (
    <div className={`table-wrapper ${dense ? "dense" : ""}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const isActive = sort.key === col.accessor;
              return (
                <th
                  key={col.accessor || col.header}
                  className={`table-header ${col.headerClassName || ""} ${
                    col.sortable ? "sortable" : ""
                  } ${isActive ? `sorted-${sort.dir}` : ""}`}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col)}
                >
                  <span>{col.header}</span>
                  {col.sortable && (
                    <span className="sort-indicator">
                      {isActive ? (sort.dir === "asc" ? "▲" : "▼") : "⇅"}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {!loading && rowsToRender.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="no-data">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rowsToRender.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className={onRowClick ? "clickable" : ""}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.accessor || col.header}
                    className={`table-cell ${col.className || ""} ${
                      col.align ? `align-${col.align}` : ""
                    }`}
                  >
                    {loading ? <div className="skeleton" /> : renderCell(row, col, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
