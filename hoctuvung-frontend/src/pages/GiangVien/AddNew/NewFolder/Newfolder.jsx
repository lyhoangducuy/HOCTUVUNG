import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Newfolder.css";

import TextInput from "../../../../components/inputs/TextInput";

function Newfolder() {
  const folderMoi = {
    idBoThe: "",
    tenBoThe: "",
  }
  const [newFolder, setNewFolder] = useState(folderMoi);
  const navigate = useNavigate();
  const handleOnSubmit = (e) => {
    e.preventDefault();
    const folders = JSON.parse(localStorage.getItem("folders")||"[]");
    const newId = folders ? folders.length + 1 : 1;
    newFolder.idBoThe = newId;
    localStorage.setItem("folders", JSON.stringify([...folders, newFolder]));
    setNewFolder({ idBoThe: "", tenBoThe: "" });
    navigate("/giangvien");

  }
  return (
    <div className="container">
      <h1>Tọa thư mục mới</h1>
      <form onSubmit={handleOnSubmit}>

        <div className="textInput">
          <TextInput
            type="text"
            placeholder="Nhập tên thư mục mới"
            value={newFolder.tenBoThe}
            onChange={(e) => setNewFolder({ ...newFolder, tenBoThe: e.target.value })}
          />
        </div>
        <div className="button-submit">
          <button type="submit" className="btn-submit" onClick={() => { }}>
            Tạo
          </button>
          <button type="button" className="btn-close" onClick={() => navigate("/giangvien")}>
            Hủy
          </button>
        </div>
      </form >
    </div >
  );
}

export default Newfolder;
