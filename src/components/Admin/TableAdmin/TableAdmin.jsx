import "./TableAdmin.css";
import { useState } from "react";
const TableAdmin = ({ Colums, Data, Action }) => {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(Data.length / pageSize);
  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const startID = (currentPage - 1) * pageSize;
  const endID = startID + pageSize;
  const handleInputChange = (e) => {
    const value = Number(e.target.value);
    if (value > 0) setPageSize(value);
  };
  return (
    <div className="table-wrapper">
      
      <table className="user-table">
        <thead>
          <tr>
            {Colums.map((Colum, index) => (
              <th key={index}>{Colum.name}</th>
            ))}
            {Action && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {Data.slice(startID, endID).map((item) => (
            <tr key={item.id}>
              {Colums.map((colum, index) => (
                <td key={index}>{item[colum.key]}</td>
              ))}
              <td>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {Action &&
                    Action.map((act, index) => (
                      <button
                        key={index}
                        className={act.class}
                        style={act.style}
                        onClick={act.onClick(item.id)}
                      >
                        {act.name}
                      </button>
                    ))}
                </div>
              </td>
            </tr>
          ))}
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
