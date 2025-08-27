// src/components/ItemBo/ItemBo.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./ItemBo.css";

/**
 * Props:
 * - item: { idBoThe, tenBoThe, soTu, luotHoc, danhSachThe?, idNguoiDung, ... }
 * - author?: { tenNguoiDung?, gmail?, email?, anhDaiDien? }
 * - dsNguoiDung?: Array<{ idNguoiDung, tenNguoiDung?, gmail?, email?, anhDaiDien? }>
 * - onClick?: (idBoThe) => void
 * - onLearn?: (idBoThe) => void
 *
 * Ấn nút Học → điều hướng /bothe/:id (BoTheDetail)
 */
export default function ItemBo({
  item = {},
  author,
  dsNguoiDung,
  onClick,
  onLearn,
}) {
  const navigate = useNavigate();

  // Lấy thông tin người tạo (nếu không truyền sẵn author thì tìm trong dsNguoiDung)
  const u =
    author ||
    (Array.isArray(dsNguoiDung)
      ? dsNguoiDung.find(
          (x) => String(x.idNguoiDung) === String(item?.idNguoiDung)
        )
      : null);

  // Ưu tiên tenNguoiDung → gmail → email
  const displayName = u?.tenNguoiDung || u?.gmail || u?.email || "Ẩn danh";
  const avatar = u?.anhDaiDien || "";

  // Số thẻ & lượt học (fallback từ danhSachThe nếu soTu chưa có)
  const termCount =
    typeof item?.soTu === "number"
      ? item.soTu
      : Array.isArray(item?.danhSachThe)
      ? item.danhSachThe.length
      : 0;

  const learnCount = Number(item?.luotHoc || 0);

  // Điều hướng mặc định tới trang chi tiết bộ thẻ
  const goToDetail = () => {
    if (!item?.idBoThe) return;
    navigate(`/bothe/${item.idBoThe}`);
  };

  const handleOpen = () => {
    if (onClick) onClick(item?.idBoThe);
    else goToDetail();
  };

  const handleLearn = (e) => {
    e.stopPropagation();
    if (onLearn) onLearn(item?.idBoThe);
    else goToDetail(); // mặc định ấn Học → /bothe/:id
  };

  return (
    <div className="bo-card" onClick={handleOpen}>
      <div className="bo-title">{item?.tenBoThe || "Không tên"}</div>

      <div className="bo-meta">
        {termCount} thẻ • {learnCount} lượt học
      </div>

      <div className="bo-author" onClick={(e) => e.stopPropagation()}>
        <div
          className="bo-avatar"
          style={avatar ? { backgroundImage: `url(${avatar})` } : {}}
        />
        <span className="bo-name">{displayName}</span>
      </div>

      <button className="bo-btn" onClick={handleLearn} title="Học bộ thẻ này">
        Học
      </button>
    </div>
  );
}
