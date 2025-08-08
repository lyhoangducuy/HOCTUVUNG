import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faFolderOpen,
  faBell,
  faPlus,
  faClone,
  faBook,
} from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Giangvien_Sidebar() {
  const navigate = useNavigate();
  const [myfolder, setMyfolder] = useState([]);
  useEffect(() => {
    const folder = JSON.parse(localStorage.getItem("myFolder")) || [];
    if (folder && folder.lenght > 0) {
      setMyfolder([...myfolder, folder]);
    }
  }, []);

  const handleStudy = (id) => {
    const card = JSON.parse(localStorage.getItem("cards"));
    const ketQua = card.find((item) => item.idBoThe === id);

    localStorage.setItem("selected", JSON.stringify(ketQua));

    navigate(`/flashcard/${id}`);
  };
  return (
    <div className="sidebar_container">
      <div className="sidebar_top">
        <div onClick={() => navigate("/giangvien")}>
          <FontAwesomeIcon icon={faHouse} className="icon" />
          Trang chủ
        </div>
        <div>
          <FontAwesomeIcon icon={faFolderOpen} className="icon" />
          Thư viện của tôi
        </div>
        <div>
          <FontAwesomeIcon icon={faBell} className="icon" />
          Thông báo
        </div>
      </div>

      <div className="divider" />

      <div className="sidebar_center">
        <h3>Thư mục của tôi</h3>
        <ul>
          {myfolder.map((item, index) => (
            <li
              key={index}
              className="folder-item"
              onClick={() => handleStudy(item.idBoThe)}
            >
              {" "}
              <FontAwesomeIcon icon={faBook} className="icon icon-book" />
              {item.tenBoThe}
            </li>
          ))}
        </ul>
        <div className="create_folder" onClick={() => navigate("/newfolder")}>
          <FontAwesomeIcon icon={faPlus} className="icon" />
          Thư mục mới
        </div>
      </div>

      <div className="divider" />

      <div className="sidebar_bottom">
        <h3>Bắt đầu</h3>
        <div>
          <FontAwesomeIcon icon={faClone} className="icon" />
          Flashcards
        </div>
      </div>
    </div>
  );
}

export default Giangvien_Sidebar;
