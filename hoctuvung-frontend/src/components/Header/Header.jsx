import { FaBars, FaBookOpen, FaPlus, FaSearch } from "react-icons/fa";
import { MdMenuBook } from "react-icons/md";
import "./Header.css";
const Header = (props) => {
  return (
    <div className="container">
      <div className="left-section">
        <button
          className="showSidebar icon-btn"
          onClick={props.handleShowSidebar}
        >
          <FaBars />
        </button>
      </div>
      <button className="logo-icon icon-btn">
        <MdMenuBook />
      </button>
      <div className="search-section">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Tìm kiếm" className="search-input" />
      </div>
      <div className="right-section">
        <button className="icon-btn plus-btn">
          <FaPlus />
        </button>
        <button className="upgrade-btn">Nâng cấp tài khoản</button>
        <a className="avatar">
          <img
            src="https://media.viez.vn/prod/2021/10/31/jack_va_thien_an_5805_47999b223c.jpeg"
            alt=""
          />
        </a>
      </div>
    </div>
  );
};
export default Header;
