import {
  FaChartBar,
  FaUser,
  FaLayerGroup,
  FaChalkboardTeacher,
  FaMoneyCheckAlt,
  FaHandHoldingUsd,
  FaVideo,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "./SidebarAdmin.css";

const SidebarAdmin = () => {
  return (
    <aside className="sidebar-container">
      <div className="sidebar-content">
        <h3 className="sidebar-logo">
          <NavLink id="trangChuAdmin" to="/admin">
            Học từ Vựng
          </NavLink>
        </h3>

        <nav aria-label="Admin navigation">
          <ul className="sidebar-menu">
            <li>
              <NavLink className="menu-link" to="/admin/thong-ke">
                <span className="sidebar-icon"><FaChartBar /></span>
                <span>Thống Kê</span>
              </NavLink>
            </li>

            <li>
              <NavLink className="menu-link" to="/admin/quan-ly-user">
                <span className="sidebar-icon"><FaUser /></span>
                <span>Quản Lý Người Dùng</span>
              </NavLink>
            </li>

            <li>
              <NavLink className="menu-link" to="/admin/quan-ly-bo-the">
                <span className="sidebar-icon"><FaLayerGroup /></span>
                <span>Quản Lý Bộ Thẻ</span>
              </NavLink>
            </li>

            <li>
              <NavLink className="menu-link" to="/admin/quan-ly-khoa-hoc">
                <span className="sidebar-icon"><FaChalkboardTeacher /></span>
                <span>Quản Lý Khóa Học</span>
              </NavLink>
            </li>

            {/* Quản lý thu/chi gói trả phí */}
            <li>
              <NavLink className="menu-link" to="/admin/quan-ly-tra-phi">
                <span className="sidebar-icon"><FaMoneyCheckAlt /></span>
                <span>Quản lý chi trả</span>
              </NavLink>
            </li>

            {/* Payouts (rút tiền) – KHÔNG dùng URL có dấu */}
            <li>
              <NavLink className="menu-link" to="/admin/rut-tien">
                <span className="sidebar-icon"><FaHandHoldingUsd /></span>
                <span>Chi trả (Payouts)</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default SidebarAdmin;
