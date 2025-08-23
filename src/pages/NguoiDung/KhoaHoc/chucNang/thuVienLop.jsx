import React from "react";
import { useNavigate } from "react-router-dom";
import "./ThuVienLop.css";

export default function ThuVienLop({ khoaHoc, onCapNhat }) {
  const navigate = useNavigate();

  if (!khoaHoc) return <div className="tvl-empty">Không tìm thấy khóa học.</div>;

  // Lấy session (người dùng hiện tại)
  const session = JSON.parse(sessionStorage.getItem("session") || "null");
  const isOwner =
    !!session?.idNguoiDung &&
    String(session.idNguoiDung) === String(khoaHoc.idNguoiDung);

  // Lấy dữ liệu cần thiết
  const boTheIds = Array.isArray(khoaHoc.boTheIds) ? khoaHoc.boTheIds : [];
  const allBoThe = JSON.parse(localStorage.getItem("boThe") || "[]");
  const dsNguoiDung = JSON.parse(localStorage.getItem("nguoiDung") || "[]");

  // Ghép bộ thẻ trong khóa học + thông tin người tạo (theo idNguoiDung)
  const boTheHienThi = boTheIds
    .map((id) => allBoThe.find((b) => String(b.idBoThe) === String(id)))
    .filter(Boolean)
    .map((bt) => {
      const idNguoiTao = bt?.idNguoiDung ?? bt?.nguoiDung?.idNguoiDung;
      const u = dsNguoiDung.find((x) => String(x.idNguoiDung) === String(idNguoiTao));
      return {
        ...bt,
        _tenNguoiTao: u?.tenNguoiDung ?? bt?.nguoiDung?.tenNguoiDung ?? "Ẩn danh",
        _anhNguoiTao: u?.anhDaiDien ?? bt?.nguoiDung?.anhDaiDien ?? "",
      };
    });

  const xemBoThe = (id) => navigate(`/flashcard/${id}`);

  // ✅ Chỉ chủ khóa học mới gỡ được
  const goBoTheKhoiKhoaHoc = (bt) => {
    if (!isOwner) return;

    const ten = bt.tenBoThe || `Bộ thẻ #${bt.idBoThe}`;
    const ok = window.confirm(`Gỡ "${ten}" khỏi khóa học?`);
    if (!ok) return;

    const dsKH = JSON.parse(localStorage.getItem("khoaHoc") || "[]");
    const idx = dsKH.findIndex((k) => String(k.idKhoaHoc) === String(khoaHoc.idKhoaHoc));
    if (idx === -1) return;

    const cu = Array.isArray(dsKH[idx].boTheIds) ? dsKH[idx].boTheIds : [];
    dsKH[idx] = {
      ...dsKH[idx],
      boTheIds: cu.filter((x) => String(x) !== String(bt.idBoThe)),
    };
    localStorage.setItem("khoaHoc", JSON.stringify(dsKH));
    onCapNhat && onCapNhat(dsKH[idx]); // Cập nhật lại UI ở cha
  };

  if (boTheHienThi.length === 0) {
    return <div className="tvl-empty">Chưa có bộ thẻ nào. Bấm “+ → Thêm bộ thẻ”.</div>;
  }

  return (
    <div className="tvl-grid">
      {boTheHienThi.map((bt) => (
        <div key={bt.idBoThe} className="tvl-card" onClick={() => xemBoThe(bt.idBoThe)}>
          <div className="tvl-title">{bt.tenBoThe || `Bộ thẻ #${bt.idBoThe}`}</div>
          <div className="tvl-sub">{bt.soTu ?? (bt.danhSachThe?.length || 0)} từ</div>

          <div className="tvl-meta" onClick={(e) => e.stopPropagation()}>
            {bt._anhNguoiTao ? (
              <img className="tvl-avatar" src={bt._anhNguoiTao} alt="" />
            ) : (
              <div className="tvl-avatar tvl-avatar--placeholder">
                {(bt._tenNguoiTao || "?")[0]?.toUpperCase() || "?"}
              </div>
            )}
            <span className="tvl-name">{bt._tenNguoiTao}</span>
          </div>

          <div className="tvl-actions" onClick={(e) => e.stopPropagation()}>
            <button className="tvl-btn tvl-btn--ghost" onClick={() => xemBoThe(bt.idBoThe)}>
              Học
            </button>
            {isOwner && (
              <button className="tvl-btn tvl-btn--danger" onClick={() => goBoTheKhoiKhoaHoc(bt)}>
                Gỡ khỏi khóa học
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
