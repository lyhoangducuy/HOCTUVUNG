import { useEffect, useState } from "react";
import { FaRegListAlt } from "react-icons/fa";
import axios from "axios";
import "./TrangChuGiangVien.css";

export default function TrangChuGiangVien() {
  const [recentSets, setRecentSets] = useState([]);
  const [popularSets, setPopularSets] = useState([]);

  // Giả sử id giảng viên là 1, bạn có thể lấy từ session hoặc context
  const giangVienId = 1;

  useEffect(() => {
    // Lấy bộ thẻ gần đây
    axios
      .get(`http://localhost:8080/api/giangvien/trangchu/gan-day/${giangVienId}`)
      .then((res) => setRecentSets(res.data || []))
      .catch(() => setRecentSets([]));

    // Lấy bộ thẻ phổ biến
    axios
      .get("http://localhost:8080/api/giangvien/trangchu/bo-the-pho-bien")
      .then((res) => setPopularSets(res.data || []))
      .catch(() => setPopularSets([]));
  }, []);

  return (
    <div className="gv-home-container">
      {/* Gần đây */}
      {recentSets.length > 0 && (
        <>
          <h2 className="gv-section-title">Gần đây</h2>
          <div className="gv-recent-list">
            <div className="gv-recent-grid">
              {recentSets.slice(0, 6).map((item, idx) => (
                <div className="gv-recent-item" key={item.idBoThe || idx}>
                  <FaRegListAlt size={32} style={{ marginRight: 8 }} />
                  <span>{item.tenBoThe || "Tên bộ thẻ"}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bộ thẻ phổ biến */}
      {popularSets.length > 0 && (
        <>
          <h2 className="gv-section-title">Bộ thẻ phổ biến</h2>
          <div className="gv-popular-list">
            <div className="gv-popular-grid">
              {popularSets.slice(0, 6).map((item, idx) => (
                <div className="gv-popular-card" key={item.idBoThe || idx}>
                  <div className="gv-popular-title">{item.tenBoThe || "Tên bộ thẻ"}</div>
                  <div className="gv-popular-terms">{item.soTu || 0} terms</div>
                  <div className="gv-popular-user">
                    <img
                      src={item.nguoiDung?.anhDaiDien || "/default-avatar.png"}
                      alt="avatar"
                      className="gv-popular-avatar"
                    />
                    <span>{item.nguoiDung?.tenNguoiDung || "Tên người dùng"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
