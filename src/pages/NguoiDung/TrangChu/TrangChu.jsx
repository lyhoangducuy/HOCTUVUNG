import React, { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./TrangChu.css";

export default function TrangChu() {
  const navigate = useNavigate();
  const [dsBoThe, setDsBoThe] = useState([]);

  const dsNguoiDung = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const luu = JSON.parse(localStorage.getItem("boThe")) || [];
    setDsBoThe(Array.isArray(luu) ? luu : []);
  }, []);

  const denHoc = (id) => navigate(`/flashcard/${id}`);

  // Gần đây: lấy tối đa 6 bộ thẻ mới nhất theo id (đơn giản)
  const ganDay = useMemo(() => {
    const x = [...dsBoThe];
    x.sort((a, b) => (b.idBoThe || 0) - (a.idBoThe || 0));
    return x.slice(0, 6);
  }, [dsBoThe]);

  // Phổ biến: tạm thời cũng hiển thị danh sách (có thể đổi thành top theo soTu)
  const phoBien = useMemo(() => {
    const x = [...dsBoThe];
    x.sort((a, b) => (b.soTu || 0) - (a.soTu || 0));
    return x.slice(0, 8);
  }, [dsBoThe]);

  const AvatarNho = ({ url, ten }) => {
    if (url) {
      return <span className="mini-avatar" style={{ backgroundImage: `url(${url})` }} />;
    }
    const initial = (ten || "U").charAt(0).toUpperCase();
    return <span className="mini-avatar mini-avatar-fallback">{initial}</span>;
  };

  return (
    <div className="home-wrap">
      {/* GẦN ĐÂY */}
      <section className="block">
        <div className="block-head">
          <h2 className="block-title">Học gần đây</h2>
        </div>

        {ganDay.length === 0 ? (
          <div className="empty">Chưa có bộ thẻ nào. Hãy tạo bộ thẻ mới!</div>
        ) : (
          <ul className="recent-list">
            {ganDay.map((item) => (
              <li
                key={item.idBoThe}
                className="recent-item"
                onClick={() => denHoc(item.idBoThe)}
              >
                <FontAwesomeIcon icon={faBook} className="icon-book" />
                <span className="recent-name">
                  {item.tenBoThe || `Bộ thẻ #${item.idBoThe}`}
                </span>
                <span className="recent-count">{item.soTu ?? 0} từ</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* BỘ THẺ PHỔ BIẾN */}
      <section className="block">
        <div className="block-head">
          <h2 className="block-title">Bộ thẻ phổ biến</h2>
        </div>

        {phoBien.length === 0 ? (
          <div className="empty">Chưa có dữ liệu để hiển thị.</div>
        ) : (
          <div className="mini-grid">
            {phoBien.map((item) => {
              const nguoiTao = dsNguoiDung.find(
                (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
              );
              const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
              const anhNguoiTao = nguoiTao?.anhDaiDien || "";

              return (
                <div
                  key={item.idBoThe}
                  className="mini-card"
                  onClick={() => denHoc(item.idBoThe)}
                >
                  <div className="mini-title">{item.tenBoThe || "Không tên"}</div>
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
                        denHoc(item.idBoThe);
                      }}
                    >
                      Học
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        )}
      </section>
    </div>
  );
}
