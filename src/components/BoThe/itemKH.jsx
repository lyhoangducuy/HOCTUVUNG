import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./itemKH.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";
import { faStar as FaStarRegular } from "@fortawesome/free-solid-svg-icons";



// Chỉ dùng khi cần sao (trường hợp chưa join)
import { db } from "../../../lib/firebase"; // chỉnh lại nếu khác
import { collection, query, where, onSnapshot } from "firebase/firestore";

/**
 * Props:
 * - item: { idKhoaHoc, tenKhoaHoc, boTheIds?, thanhVienIds?, idNguoiDung, ... }
 * - author?: { tenNguoiDung?, gmail?, email?, anhDaiDien? }
 * - dsNguoiDung?: Array<{ idNguoiDung, tenNguoiDung?, gmail?, email?, anhDaiDien? }>
 * - onClick?: (idKhoaHoc) => void         // click card
 * - onEnter?: (idKhoaHoc) => void         // click nút "Vào lớp"
 * - isJoined?: boolean                    // đã tham gia lớp?
 */
export default function ItemKH({
  item = {},
  author,
  dsNguoiDung,
  onClick,
  onEnter,
  isJoined = false,
}) {
  const navigate = useNavigate();

  // id & title
  const idKhoaHoc = item?.idKhoaHoc;
  const title = item?.tenKhoaHoc || "Khóa học";

  // Tìm author giống ItemBo
  const u =
    author ||
    (Array.isArray(dsNguoiDung)
      ? dsNguoiDung.find((x) => String(x.idNguoiDung) === String(item?.idNguoiDung))
      : null);

  const displayName = u?.tenNguoiDung || u?.gmail || u?.email || "Ẩn danh";
  const avatar = u?.anhDaiDien || "";

  // Số bộ thẻ & số thành viên
  const soBoThe = Array.isArray(item?.boTheIds) ? item.boTheIds.length : Number(item?.soBoThe || 0);
  const soHocVien = Array.isArray(item?.thanhVienIds)
    ? item.thanhVienIds.length
    : Number(item?.soHocVien || 0);

  // Giá hiển thị (khi chưa join)
  const VN = "vi-VN";
  const giaRaw = Number(item?.giaThamGia ?? item?.hocPhi ?? item?.giaKhoaHoc ?? 0);
  const giaText = giaRaw.toLocaleString(VN) + " đ";

  // Rating trung bình (realtime) — chỉ nghe khi chưa join
  const [avg, setAvg] = useState(0);
  useEffect(() => {
    if (isJoined || !idKhoaHoc) { setAvg(0); return; }
    const q = query(collection(db, "feedbackKhoaHoc"), where("idKhoaHoc", "==", String(idKhoaHoc)));
    const unsub = onSnapshot(q, (snap) => {
      let sum = 0, c = 0;
      snap.forEach((d) => {
        const r = Math.max(0, Math.min(5, Number(d.data()?.rating) || 0));
        sum += r; c++;
      });
      setAvg(c ? sum / c : 0);
    });
    return () => unsub();
  }, [idKhoaHoc, isJoined]);

  // Điều hướng mặc định tới trang lớp
  const goToDetail = () => {
    if (!idKhoaHoc) return;
    navigate(`/khoaHoc/${idKhoaHoc}`);
  };

  const handleOpen = () => {
    if (onClick) onClick(idKhoaHoc);
    else goToDetail();
  };

  const handleEnter = (e) => {
    e.stopPropagation();
    if (onEnter) onEnter(idKhoaHoc);
    else goToDetail(); // mặc định nút → /khoaHoc/:id
  };

  const percent = Math.max(0, Math.min(100, (avg / 5) * 100));

  return (
    <div className="kh-card" onClick={!isJoined ? handleOpen : undefined}>
      <div className="kh-title">{title}</div>

      <div className="kh-meta">
        {soBoThe} bộ thẻ <span className="dot">•</span> {soHocVien} thành viên
      </div>

      <div className="kh-author" onClick={(e) => e.stopPropagation()}>
        <div
          className="kh-avatar"
          style={avatar ? { backgroundImage: `url(${avatar})` } : {}}
        />
        <span className="kh-name">{displayName}</span>
      </div>

      {!isJoined ? (
        <div className="kh-bottom">
          {/* LEFT: stars vàng -> số xám */}
          <div
            className="kh-rating-row"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Đánh giá ${avg.toFixed(1)}/5`}
          >
            <div className="kh-stars2">
              <div className="stars stars-bg">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FontAwesomeIcon key={`bg-${i}`} icon={FaStarRegular } />
                ))}
              </div>
              <div className="stars stars-fill" style={{ width: `${percent}%` }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FontAwesomeIcon key={`fg-${i}`} icon={faStarSolid  } />
                ))}
              </div>
            </div>
            <span className="kh-rating-num">{avg.toFixed(1)}</span>
          </div>

          {/* RIGHT: price */}
          <div className="kh-price">{giaText}</div>
        </div>
      ) : (
        <button className="kh-btn" onClick={handleEnter} title="Vào lớp">
          Vào lớp
        </button>
      )}
    </div>
  );
}
