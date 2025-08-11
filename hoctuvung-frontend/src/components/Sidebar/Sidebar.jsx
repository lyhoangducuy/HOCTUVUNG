import { FaBell, FaBook, FaHome, FaPlus, FaThLarge } from "react-icons/fa";
import { PiTelevisionSimpleBold } from "react-icons/pi";
import { GiNotebook } from "react-icons/gi";
import "./Sidebar.css";
const Sidebar = () => {
  return (
    <div className="Sidebar-Container">
      <div className="top-section">
        <a>
          <FaHome /> trang chủ
        </a>
        <a>
          <FaBook /> Thư viện của tôi
        </a>
        <a>
          <FaBell /> Thông báo
        </a>
      </div>
      <hr />
      <div className="body-section">
        <span>Thư mục của tôi</span>
        <a href="">
          {" "}
          <PiTelevisionSimpleBold /> Tv jp
        </a>
        <a href="">
          {" "}
          <GiNotebook /> Tiếng nhật N1
        </a>
        <a href="">
          <FaPlus /> Thư mục mới
        </a>
      </div>
      <div className="bottom-section">
        <span>Bắt đầu</span>
        <a href="">
          <FaThLarge /> Flashcards
        </a>
      </div>
    </div>
  );
};
export default Sidebar;
