import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faFolderOpen,
  faBell,
  faPlus,
  faClone,
} from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";

function Giangvien_Sidebar() {
  return (
    <div className="sidebar_container">
      <div className="sidebar_top">
        <div>
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
        <div className="create_folder">
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
