import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faBell,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import "./Traphi.css";

function Traphi() {
  const [monthcost] = useState({
    month: "1 tháng",
    price: 30000,
  });
  const [yearcost] = useState({
    month: "1 năm",
    price: 120000,
  });

  return (
    <div className="traphi-container">
      <img src="/src/image/formimg.png" alt="logo" className="traphi-logo"/>

      <div className="traphi-header">
        <h2>HOC TỪ VỰNG</h2>
        <p>WEBSITE HỌC TỪ VỰNG TOP 1 VI EN</p>
      </div>

      <div className="traphi-pricing">
        <div className="pricing-card">
          <h3>{monthcost.month}</h3>
          <p>{monthcost.price.toLocaleString()}VNĐ</p>
          <button className="btn" onClick={() => console.log(monthcost)}>
            Đăng ký ngay
          </button>
        </div>
        <div className="pricing-card">
          <h3>{yearcost.month}</h3>
          <p>{yearcost.price.toLocaleString()}VNĐ</p>
          <button className="btn btn-red" onClick={() => console.log(yearcost)}>
            Đăng ký ngay
          </button>
        </div>
      </div>

      <div className="traphi-timeline">
        <div className="timeline-item">
          <div className="circle-icon">
            <FontAwesomeIcon icon={faCalendar} />
          </div>
          <p>Thứ 7 ngày hủy bất cứ lúc nào</p>
        </div>
        <div className="timeline-item">
          <div className="circle-icon">
            <FontAwesomeIcon icon={faBell} />
          </div>
          <p>Thông báo hết thời gian thử</p>
        </div>
        <div className="timeline-item">
          <div className="circle-icon">
            <FontAwesomeIcon icon={faMoneyBill} />
          </div>
          <p>Tự động thanh toán</p>
        </div>
      </div>
    </div>
  );
}

export default Traphi;
