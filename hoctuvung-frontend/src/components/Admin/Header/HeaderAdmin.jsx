import { FaBars, FaCaretDown, FaUserAlt } from "react-icons/fa";
import "./HeaderAdmin.css";
const HeaderAdmin = (props) => {
  return (
    <div className="header-admin-container">
      <button className="icon-btn" onClick={props.handleShowSidebar}>
        {" "}
        <FaBars />{" "}
      </button>

      <button className="icon-btn">
        <FaUserAlt />
        <FaCaretDown />
      </button>
    </div>
  );
};

export default HeaderAdmin;
