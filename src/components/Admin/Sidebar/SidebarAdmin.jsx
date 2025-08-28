import {
  FaChartBar,
  FaUser,
  FaLayerGroup,
  FaChalkboardTeacher,
  FaMoneyCheckAlt,
  FaVideo,
} from "react-icons/fa";
import "./SidebarAdmin.css";
const SidebarAdmin = () => {
  return (
    <div className={`sidebar-container`}>
      <div className="sidebar-content">
        <h3>
          <a id="trangChuAdmin" href="/admin">
            Học từ Vựng
          </a>
        </h3>

        <ul>
          <li>
            <a href="/admin/thong-ke">
              <span className="sidebar-icon">
                <FaChartBar />
              </span>
              Thống Kê
            </a>
          </li>
          <li>
            <a href="/admin/quan-ly-user">
              <span className="sidebar-icon">
                <FaUser />
              </span>
              Quản Lý Người Dùng
            </a>
          </li>
          <li>
            <a href="/admin/quan-ly-bo-the">
              <span className="sidebar-icon">
                <FaLayerGroup />
              </span>
              Quản Lý Bộ Thẻ
            </a>
          </li>
          <li>
            <a href="/admin/quan-ly-khoa-hoc">
              <span className="sidebar-icon">
                <FaChalkboardTeacher />
              </span>
              Quản Lý Khóa Học
            </a>
          </li>
          <li>
            <a href="/admin/quan-ly-video">
              <span className="sidebar-icon">
                <FaVideo />
              </span>
              Quản Lý Video
            </a>
          </li>
          <li>
            <a href="/admin/quan-ly-tra-phi">
              <span className="sidebar-icon">
                <FaMoneyCheckAlt />
              </span>
              Quản Lý Trả Phí
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SidebarAdmin;
