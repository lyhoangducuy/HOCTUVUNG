import { useEffect, useMemo, useState } from "react";
import "./ThuVienCuaToi.css";
import { useLocation, useNavigate } from "react-router-dom";

function ThuVienCuaToi() {
  const [cardLib, setCardLib] = useState([]);
  const [actionTab, setActionTab] = useState("boThe");
  const [lopList, setLopList] = useState([]);
  const navigate = useNavigate();

  const dsNguoiDung = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch {
      return [];
    }
  }, []);
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
          {cardLib.map((item) => {
            // 👉 Lấy người tạo bộ thẻ dựa vào idNguoiDung của item
            const nguoiTao = dsNguoiDung.find(
              (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
            );
            const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
            const anhNguoiTao = nguoiTao?.anhDaiDien || "";

            return (
              <div
                key={item.idBoThe}
                className="mini-card"
                onClick={() => handleStudy(item.idBoThe)}
              >
                <div className="mini-title">{item?.tenBoThe || "Không tên"}</div>
                <div className="mini-sub">{item.soTu ?? 0} thẻ</div>
                <div className="mini-meta">
                  <div
                    className="mini-avatar"
                    style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
                  />
                  <span className="mini-name">{tenNguoiTao}</span>
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
            );
          })}
          {cardLib.length === 0 && <p className="emty">Không có bộ thẻ nào cả</p>}
        </div>
      )}


      {actionTab === "lop" && (
        <div className="myLop">
          {lopList.map((item) => {
            // Lấy người tạo lớp bằng cách so sánh id
            const nguoiTao = dsNguoiDung.find(
              (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
            );
            const tenNguoiTao = nguoiTao?.tenNguoiDung;
            const anhNguoiTao = nguoiTao?.anhDaiDien || "";

            return (
              <div
                key={item.idLop}
                className="mini-card"
                onClick={() => handleLop(item.idLop)}
              >
                <div className="mini-title">{item?.tenLop || "Lớp học"}</div>
                <div className="mini-sub">{item?.tenTruong || ""}</div>

                <div className="mini-meta">
                  <div
                    className="mini-avatar"
                    style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
                  />
                  <span className="mini-name">{tenNguoiTao}</span>
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
            );
          })}
          {lopList.length === 0 && <p className="emty">Không có lớp nào cả</p>}
        </div>
      )}

    </div>
  );
}

export default ThuVienCuaToi;
