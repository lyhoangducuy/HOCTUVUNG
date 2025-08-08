import { useState } from "react";
import "./Newfolder.css";
import { Form, useNavigate } from "react-router-dom";
function Newfolder() {
  const emptyBoThe = {
    idBoThe: null,
    tenBoThe: "",
    soTu: 0,
    nguoiDung: {
      id: null,
      tenNguoiDung: "",
      anhDaiDien: "",
    },
    danhSachThe: [],
  };
  const navigate = useNavigate();
  const [newBoThe, setNewBoThe] = useState(emptyBoThe);
  const getId = () => {
    const current = JSON.parse(localStorage.getItem("cards"));
    return current.length + 1;
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    const id = getId();
    const updatedBoThe = {
      ...newBoThe,
      idBoThe: id,
      soTu: newBoThe.danhSachThe.length,
    };

    const existing = JSON.parse(localStorage.getItem("cards")) || [];
    const updatedList = [...existing, updatedBoThe];
    localStorage.setItem("cards", JSON.stringify(updatedList));
    const folder = localStorage.getItem("myFolder");
    const updateFolder = [folder, updatedBoThe];
    localStorage.setItem("myFolder", JSON.stringify(updateFolder));
    setNewBoThe(emptyBoThe);
    setTimeout(() => {
      navigate("/giangvien");
    }, 1000);
  };

  return (
    <div className="container">
      <h2 className="title">Tạo Thư Mục Mới</h2>
      <form onSubmit={(e) => handleSubmit(e)} className="form-bo-the">
        <input
          required
          type="text"
          placeholder="Tên bộ thẻ"
          value={newBoThe.tenBoThe}
          onChange={(e) =>
            setNewBoThe({ ...newBoThe, tenBoThe: e.target.value })
          }
        />

        <input
          required
          type="text"
          placeholder="Tên người dùng"
          value={newBoThe.nguoiDung.tenNguoiDung}
          onChange={(e) =>
            setNewBoThe({
              ...newBoThe,
              nguoiDung: {
                ...newBoThe.nguoiDung,
                tenNguoiDung: e.target.value,
              },
            })
          }
        />

        
        <button
          type="button"
          onClick={() =>
            setNewBoThe({
              ...newBoThe,
              danhSachThe: [...newBoThe.danhSachThe, { tu: "", nghia: "" }],
            })
          }
        >
          Thêm từ
        </button>

        {newBoThe.danhSachThe.map((item, index) => (
          <div key={index} className="card-input">
            <input
              required
              type="text"
              placeholder="Từ"
              value={item.tu}
              onChange={(e) => {
                const updated = [...newBoThe.danhSachThe];
                updated[index].tu = e.target.value;
                setNewBoThe({ ...newBoThe, danhSachThe: updated });
              }}
            />
            <input
              required
              type="text"
              placeholder="Nghĩa"
              value={item.nghia}
              onChange={(e) => {
                const updated = [...newBoThe.danhSachThe];
                updated[index].nghia = e.target.value;
                setNewBoThe({ ...newBoThe, danhSachThe: updated });
              }}
            />
          </div>
        ))}

        <button type="submit">Lưu bộ thẻ</button>
      </form>
    </div>
  );
}
export default Newfolder;
