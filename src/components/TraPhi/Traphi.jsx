import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faBell,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./Traphi.css";

function Traphi() {
  const navigate = useNavigate();

  const [monthcost] = useState({
    key: "MONTH",
    month: "1 tháng",
    price: 30000,
    days: 30,
  });

  const [yearcost] = useState({
    key: "YEAR",
    month: "1 năm",
    price: 120000,
    days: 365,
  });

  const [currentSub, setCurrentSub] = useState({
    ngayDangky: null,
    ngayHethan: null,
    goi: null,
  });

  const [userList, setUserList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userIndex, setUserIndex] = useState(-1);
  const [prime, setPrime] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);

  useEffect(() => {
    try {
      const storedUserList = JSON.parse(
        localStorage.getItem("nguoiDung") || "[]"
      );
      const sessionUser = JSON.parse(
        sessionStorage.getItem("session") || "null"
      );

      if (!sessionUser) {
        alert("Vui lòng đăng nhập để sử dụng tính năng trả phí.");
        navigate("/");
        return;
      }

      const idx = storedUserList.findIndex(
        (us) => us.idNguoiDung === sessionUser.idNguoiDung
      );

      if (idx === -1) {
        alert("Không tìm thấy tài khoản. Vui lòng đăng nhập lại.");
        navigate("/");
        return;
      }
      if (currentSub?.ngayHethan) {
        const today = new Date();
        const [day, month, year] = currentSub.ngayHethan.split("/");
        const expireDate = new Date(year, month - 1, day);

        if (today > expireDate) {
          setPrime(false);
          setCurrentSub(null);
          storedUserList[idx].isPrime = false;
          storedUserList[idx].currentSub = null;
          localStorage.setItem("nguoiDung", JSON.stringify(storedUserList));
        }
      }
      setUserList(storedUserList);
      setCurrentUser(sessionUser);
      setUserIndex(idx);

      if (storedUserList[idx]?.isPrime === true) {
        setPrime(true);
      }

      if (storedUserList[idx]?.currentSub) {
        setCurrentSub(storedUserList[idx].currentSub);
      }
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const getNgayhethan = (ngayDangky, days) => {
    const date =
      typeof ngayDangky === "string" && ngayDangky.includes("/")
        ? (() => {
            const [day, month, year] = ngayDangky.split("/");
            return new Date(Number(year), Number(month) - 1, Number(day));
          })()
        : new Date(ngayDangky);

    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("vi-VN");
  };

  const handleSub = (cost) => {
    if (userIndex === -1) {
      alert("Vui lòng đăng nhập lại.");
      navigate("/");
      return;
    }

    const updatedUserList = [...userList];

    const now = new Date().toLocaleDateString("vi-VN");
    const ngayHethanCu = updatedUserList[userIndex]?.currentSub?.ngayHethan;
    const expire = getNgayhethan(ngayHethanCu ? ngayHethanCu : now, cost.days);

    const newSub = {
      ngayDangky: now,
      ngayHethan: expire,
      goi: cost.key,
    };

    setCurrentSub(newSub);

    updatedUserList[userIndex].isPrime = true;
    updatedUserList[userIndex].currentSub = newSub;

    setUserList(updatedUserList);
    setPrime(true);
    localStorage.setItem("nguoiDung", JSON.stringify(updatedUserList));
  };

  return (
    <div className="traphi-container">
      <img
        src="/src/assets/image/formimg.png"
        alt="logo"
        className="traphi-logo"
      />

      <div className="traphi-header">
        <h2>HOC TỪ VỰNG</h2>
        <p>WEBSITE HỌC TỪ VỰNG TOP 1 VI EN</p>
      </div>

      {userIndex !== -1 && (
        <div className="subscription-banner">
          {prime && currentSub?.ngayHethan ? (
            <>
              <strong>Trạng thái:</strong> Thành viên Premium.
              <br />
              <span>Hạn sử dụng: {currentSub.ngayHethan}</span>
            </>
          ) : (
            <>
              <strong>Chưa có gói Premium.</strong> Hãy chọn gói bên dưới để
              kích hoạt.
            </>
          )}
        </div>
      )}

      <div className="traphi-pricing">
        <div className="pricing-card">
          <h3>{monthcost.month}</h3>
          <p>{monthcost.price.toLocaleString()} VNĐ</p>
          <button className="btn" onClick={() => handleSub(monthcost)}>
            Đăng ký ngay
          </button>
        </div>
        <div className="pricing-card">
          <h3>{yearcost.month}</h3>
          <p>{yearcost.price.toLocaleString()} VNĐ</p>
          <button className="btn btn-red" onClick={() => handleSub(yearcost)}>
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
