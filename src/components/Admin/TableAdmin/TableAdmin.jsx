import "./TableAdmin.css";
import { useEffect, useMemo, useState } from "react";

const TableAdmin = ({ Colums = [], Data = [], Action = [] }) => {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil((Data?.length || 0) / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Clamp currentPage khi Data/pageSize đổi (tránh tối đa render vòng lặp)
  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil((Data?.length || 0) / pageSize));
    setCurrentPage((p) => Math.min(p, newTotal));
  }, [Data, pageSize]);

  const pageData = useMemo(
    () => (Array.isArray(Data) ? Data.slice(startIndex, endIndex) : []),
    [Data, startIndex, endIndex]
  );
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handleInputChange = (e) => {
    const value = Number(e.target.value);
    if (Number.isFinite(value) && value > 0) {
      setPageSize(value);
      setCurrentPage(1);
    }
  };

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
              <tr key={item.id}>
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
                            // Hỗ trợ cả 2 dạng:
                            // 1) (id,item)=>handleXxx(id,item)
                            // 2) (id,item)=>()=>handleXxx(id,item)
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

      <div className="user-pagination">
        <div className="pagination-input">
          <span>Hiển thị</span>
          <input
            type="number"
            value={pageSize}
            min={1}
            onChange={handleInputChange}
          />
        </div>

        <div className="pagination-info">
          <span>Phần tử</span>
          <button onClick={handlePrev} disabled={currentPage === 1}>
            {"<"}
          </button>
          <span style={{ margin: "0 8px" }}>
            {currentPage}/{totalPages}
          </span>
          <button onClick={handleNext} disabled={currentPage === totalPages}>
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableAdmin;
