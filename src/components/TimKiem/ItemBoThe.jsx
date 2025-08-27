export default function ItemBoThe({ item, dsNguoiDung, onClick }) {
  const nguoiTao = dsNguoiDung.find(
    (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
  );
  const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
  const anhNguoiTao = nguoiTao?.anhDaiDien || "";

  return (
    <div className="item-Search" onClick={() => onClick(item.idBoThe)}>
      <h1>{item.tenBoThe || "Không tên"}</h1>
      <p>{item.soTu ?? (item.danhSachThe?.length || 0)} thẻ</p>
      <div className="user-item">
        <div
          className="mini-avatar"
          style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
        />
        <span>{tenNguoiTao}</span>
      </div>
      <button
        className="btn-hoc"
        onClick={(e) => {
          e.stopPropagation();
          onClick(item.idBoThe);
        }}
      >
        Học
      </button>
    </div>
  );
}