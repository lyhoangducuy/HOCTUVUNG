function ItemKhoaHoc({ item, dsNguoiDung, onClick }) {
  const nguoiTao = dsNguoiDung.find(
    (u) => String(u.idNguoiDung) === String(item.idNguoiDung)
  );
  const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
  const anhNguoiTao = nguoiTao?.anhDaiDien || "";

  return (
    <div className="item-Search" onClick={() => onClick(item.idKhoaHoc)}>
      <h1>{item.tenKhoaHoc || "Khóa học"}</h1>
      <p>
        {(item.boTheIds?.length || 0)} bộ thẻ • {(item.thanhVienIds?.length || 0)} thành viên
      </p>
      {Array.isArray(item.kienThuc) && item.kienThuc.length > 0 && (
        <div className="tags">
          {item.kienThuc.map((t, i) => (
            <span className="tag" key={i}>
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="user-item">
        <div
          className="mini-avatar"
          style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
        />
        <span>{tenNguoiTao}</span>
      </div>
    </div>
  );
}
export default ItemKhoaHoc;