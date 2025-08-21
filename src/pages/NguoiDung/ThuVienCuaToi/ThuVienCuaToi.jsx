import { useEffect, useMemo, useState } from "react";
import "./ThuVienCuaToi.css";
import { useNavigate } from "react-router-dom";

function ThuVienCuaToi() {
  const [cardLib, setCardLib] = useState([]);
  const [actionTab, setActionTab] = useState("boThe");
  const [khoaHocList, setKhoaHocList] = useState([]);
  const navigate = useNavigate();

  const dsNguoiDung = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const myCard = JSON.parse(localStorage.getItem("boThe") || "[]");
    const myCourses = JSON.parse(localStorage.getItem("khoaHoc") || "[]");
    setCardLib(Array.isArray(myCard) ? myCard : []);
    setKhoaHocList(Array.isArray(myCourses) ? myCourses : []);
  }, []);

  const handleStudy = (id) => {
    navigate(`/flashcard/${id}`);
  };

  const handleKhoaHoc = (id) => {
    // vẫn dùng route /lop/:id để hiển thị chi tiết (phần chi tiết đã đọc từ khoaHoc)
    navigate(`/lop/${id}`);
  };

  const session = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("session") || "null");
    } catch {
      return null;
    }
  }, []);

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
          className={`lib-item ${actionTab === "khoaHoc" ? "active" : ""}`}
          onClick={() => setActionTab("khoaHoc")}
        >
          Khóa học
        </li>
      </ul>

      {actionTab === "boThe" && (
        <div className="myLibCard">
          {cardLib.map((item) => {
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
                <div className="mini-sub">{item.soTu ?? (item.danhSachThe?.length || 0)} thẻ</div>
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

      {actionTab === "khoaHoc" && (
        <div className="myLop">
          {khoaHocList
            .filter((item) => {
              if (!session?.idNguoiDung) return false;
              const isOwner = String(item.idNguoiDung) === String(session.idNguoiDung);
              const isMember = (item.thanhVienIds || []).includes(session.idNguoiDung);
              return isOwner || isMember;
            })
            .map((item) => {
              const nguoiTao = dsNguoiDung.find(
                (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
              );
              const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
              const anhNguoiTao = nguoiTao?.anhDaiDien || "";

              return (
                <div
                  key={item.idKhoaHoc}
                  className="mini-card"
                  onClick={() => handleKhoaHoc(item.idKhoaHoc)}
                >
                  <div className="mini-title">{item?.tenKhoaHoc || "Khóa học"}</div>
                  <div className="mini-sub">
                    {(item.boTheIds?.length || 0)} bộ thẻ • {(item.thanhVienIds?.length || 0)} thành viên
                  </div>

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
                        handleKhoaHoc(item.idKhoaHoc);
                      }}
                    >
                      Vào khóa học
                    </button>
                  </div>
                </div>
              );
            })}

          {khoaHocList.filter((item) => {
            if (!session?.idNguoiDung) return false;
            const isOwner = String(item.idNguoiDung) === String(session.idNguoiDung);
            const isMember = (item.thanhVienIds || []).includes(session.idNguoiDung);
            return isOwner || isMember;
          }).length === 0 && <p className="emty">Không có khóa học nào cả</p>}
        </div>
      )}
    </div>
  );
}

export default ThuVienCuaToi;
