// src/components/ItemBo/ItemBo.jsx
import React from "react";
import "./ItemBo.css";

/**
 * Props:
 * - item: {
 *     idBoThe, tenBoThe, soTu, luotHoc, danhSachThe?, idNguoiDung
 *   }
 * - author?: { tenNguoiDung?, gmail?, email?, anhDaiDien? }  // nếu đã tra sẵn
 * - dsNguoiDung?: Array<{ idNguoiDung, tenNguoiDung?, gmail?, email?, anhDaiDien? }>
 * - onClick?: (idBoThe) => void         // click cả card
 * - onLearn?: (idBoThe) => void         // click nút Học
 */
export default function ItemBo({
  item,
  author,
  dsNguoiDung,
  onClick,
  onLearn,
}) {
  // Tìm thông tin người tạo
  const u =
    author ||
    (Array.isArray(dsNguoiDung)
      ? dsNguoiDung.find(
          (x) => String(x.idNguoiDung) === String(item?.idNguoiDung)
        )
      : null);

  // "gmail đó là tên người dùng đó" -> ưu tiên tenNguoiDung, rồi gmail, rồi email
  const displayName =
    u?.tenNguoiDung || u?.gmail || u?.email || "Ẩn danh";
  const avatar = u?.anhDaiDien || "";

  // Số thẻ & lượt học (fallback từ danhSachThe nếu soTu chưa có)
  const soThe =
    typeof item?.soTu === "number"
      ? item.soTu
      : Array.isArray(item?.danhSachThe)
      ? item.danhSachThe.length
      : 0;

  const luotHoc = Number(item?.luotHoc || 0);

  const handleOpen = () => onClick?.(item?.idBoThe);
  const handleLearn = (e) => {
    e.stopPropagation();
    (onLearn || onClick)?.(item?.idBoThe);
  };

  return (
    <div className="bo-card" onClick={handleOpen}>
      <div className="bo-title">{item?.tenBoThe || "Không tên"}</div>

      <div className="bo-meta">
        {soThe} thẻ • {luotHoc} lượt học
      </div>

      <div className="bo-author" onClick={(e) => e.stopPropagation()}>
        <div
          className="bo-avatar"
          style={avatar ? { backgroundImage: `url(${avatar})` } : {}}
        />
        <span className="bo-name">{displayName}</span>
      </div>

      <button className="bo-btn" onClick={handleLearn}>
        Học
      </button>
    </div>
  );
}
