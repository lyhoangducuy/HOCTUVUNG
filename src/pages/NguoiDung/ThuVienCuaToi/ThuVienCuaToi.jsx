import { useEffect, useState } from "react";
import "./ThuVienCuaToi.css";
import { useLocation, useNavigate } from "react-router-dom";

function ThuVienCuaToi() {
  const [cardLib, setCardLib] = useState([]);
  const [actionTab, setActionTab] = useState("boThe");
  const [lopList, setLopList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const myCard = JSON.parse(localStorage.getItem("boThe")) || [];
    const myClass = JSON.parse(localStorage.getItem("lop")) || [];
    setLopList(myClass);
    setCardLib(myCard);
  }, []);

  const handleStudy = (id) => {
    navigate(`/flashcard/${id}`);
  };
  const handleLop = (id) => {
    navigate(`/lop/${id}`);
  };

  return (
    <div className="myLib-container">
      <h2 className="tittle-lib">Thư viện của tôi</h2>

      <ul className="header-lib">
        <li
          className={`lib-item ${actionTab === "boThe" ? "active" : ""}`}
          onClick={() => setActionTab("boThe")}
        >
          Bộ Thẻ
        </li>
        <li
          className={`lib-item ${actionTab === "lop" ? "active" : ""}`}
          onClick={() => setActionTab("lop")}
        >
          Lớp Học
        </li>
      </ul>

      {actionTab === "boThe" && (
        <div className="myLibCard">
          {cardLib.map((item) => (
            <div
              key={item.idBoThe}
              className="mini-card"
              onClick={() => handleStudy(item.idBoThe)}
            >
              <div className="mini-title">{item?.tenBoThe || "Không tên"}</div>

              <div className="mini-meta">
                <div
                  className="mini-avatar"
                  style={
                    item?.nguoiDung?.anhDaiDien
                      ? { backgroundImage: `url(${item.nguoiDung.anhDaiDien})` }
                      : {}
                  }
                />
                <span className="mini-name">
                  {item?.nguoiDung?.tenNguoiDung || "Ẩn danh"}
                </span>
              </div>

              <div className="mini-actions">
                <button
                  className="btn ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStudy(item.idBoThe);
                  }}
                >
                  Học
                </button>
              </div>
            </div>
          ))}
          {cardLib.length === 0 && (
            <p className="emty">Không có bộ thẻ nào cả</p>
          )}
        </div>
      )}

      {actionTab === "lop" && (
        <div className="myLop">
          {lopList.map((item) => (
            <div
              key={item.idLop}
              className="mini-card"
              onClick={() => handleLop(item.idLop)}
            >
              <div className="mini-title">{item?.tenLop || "Lớp học"}</div>
              <div className="mini-sub">{item?.school || ""}</div>

              <div className="mini-meta">
                <div className="mini-avatar" />
                <span className="mini-name">
                  {item?.nguoiDung?.tenNguoiDung || "Giáo viên"}
                </span>
              </div>

              <div className="mini-actions">
                <button
                  className="btn ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLop(item.idLop);
                  }}
                >
                  Vào lớp
                </button>
              </div>
            </div>
          ))}
          {lopList.length === 0 && (
            <p className="emty">Không có lớp nào cả</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ThuVienCuaToi;
