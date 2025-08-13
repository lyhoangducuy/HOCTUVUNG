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


function Sidebar() {
  const navigate = useNavigate();
  const [myfolder, setMyfolder] = useState([]);
  const loaddata = () => {
     const folder = JSON.parse(localStorage.getItem("folders")) || [];
    if (folder && folder.lenght > 0) {
      setMyfolder([...myfolder, folder]);
    } else {
      setMyfolder(folder);
    }
  }
  useEffect(() => {
    loaddata();
     window.addEventListener('foldersUpdated', loaddata);

   
    return () => {
      window.removeEventListener('foldersUpdated', loaddata);
    };
   
  }, []);
  const handleFolder = (id) => {
    const folder = JSON.parse(localStorage.getItem("folders")) || [];
    const folder_click = folder.find((item) => item.idThuMuc === id);
    localStorage.setItem("currentFolder", JSON.stringify(folder_click));
    navigate(`/folder/${id}`);
  };
  return (
    <div className="sidebar_container">
      <div className="sidebar_top">
        <div onClick={() => navigate("/giangvien")}>
          <FontAwesomeIcon icon={faHouse} className="icon" />
          Trang chủ
        </div>
        <div onClick={() => navigate("/mylibrary")}>
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
              onClick={() => handleFolder(index+1)}
            >
              {" "}
              <FontAwesomeIcon icon={faBook} className="icon icon-book" />
              {item.tenThuMuc}
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

export default Sidebar;
