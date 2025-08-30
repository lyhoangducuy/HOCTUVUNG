export default function ItemUser({ item, onClick }) {
  return (
    <div
      className="item-Search"
      onClick={() => onClick(item.idNguoiDung)}
      style={{ cursor: "pointer" }}
      title="Xem hồ sơ"
    >
      <div className="user-item">
        <div
          className="mini-avatar"
          style={item.anhDaiDien ? { backgroundImage: `url(${item.anhDaiDien})` } : {}}
        />
        <span>{item.tenNguoiDung}</span>
      </div>
    </div>
  );
}