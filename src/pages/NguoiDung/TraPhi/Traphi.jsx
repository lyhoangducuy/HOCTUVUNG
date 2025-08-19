import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button";
import "./Traphi.css";

function Traphi() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  const goiList = [
    { idGoi: "BASIC1", tenGoi: "1 tháng", giaGoi: 30000, thoiHan: 30 },
    { idGoi: "PRO1Y", tenGoi: "1 năm", giaGoi: 120000, thoiHan: 365 },
  ];

  useEffect(() => {
    const sessionUser = JSON.parse(sessionStorage.getItem("session") || "null");
    if (!sessionUser) {
      alert("Vui lòng đăng nhập để sử dụng tính năng trả phí.");
      navigate("/");
      return;
    }
    setCurrentUser(sessionUser);

    // kiểm tra gói đang hoạt động
    const dsDangKy = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const mySubs = dsDangKy.filter((s) => s.idNguoiDung === sessionUser.idNguoiDung);
    const lastSub = mySubs.length > 0 ? mySubs[mySubs.length - 1] : null;

    if (lastSub) {
      const [d, m, y] = lastSub.NgayKetThuc.split("/");
      const expireDate = new Date(y, m - 1, d);
      const today = new Date();
      if (expireDate >= today) setHasActiveSub(true);
    }
  }, [navigate]);

  // cộng ngày
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  // bấm đăng ký: tạo "đơn chờ thanh toán" rồi chuyển trang
  const handleSub = (goi) => {
    if (!currentUser) return;

    // chặn nếu đang còn hạn
    const dsDangKy = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const mySubs = dsDangKy.filter((s) => s.idNguoiDung === currentUser.idNguoiDung);
    const lastSub = mySubs.length > 0 ? mySubs[mySubs.length - 1] : null;
    if (lastSub) {
      const [d, m, y] = lastSub.NgayKetThuc.split("/");
      const expireDate = new Date(y, m - 1, d);
      if (expireDate >= new Date()) {
        alert("Bạn đã có gói đang hoạt động. Hãy hủy hoặc chờ hết hạn mới được đăng ký gói khác.");
        return;
      }
    }

    // tạo order pending (chưa ghi localStorage)
    const orderId = "ORDER" + Date.now();
    const pending = {
      orderId,
      userId: currentUser.idNguoiDung,
      goi: { idGoi: goi.idGoi, tenGoi: goi.tenGoi, giaGoi: goi.giaGoi, thoiHan: goi.thoiHan },
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem("pendingPayment", JSON.stringify(pending));

    // chuyển sang trang thanh toán giả lập
    navigate(`/thanhtoan?orderId=${orderId}`);
  };

  // hủy gói
  const handleCancel = () => {
    const dsDangKy = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const mySubs = dsDangKy.filter((s) => s.idNguoiDung === currentUser.idNguoiDung);

    if (mySubs.length === 0) {
      alert("Bạn chưa có gói nào để hủy.");
      return;
    }

    const updated = dsDangKy.filter(
      (s) => s.idGTPCND !== mySubs[mySubs.length - 1].idGTPCND
    );
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(updated));
    setHasActiveSub(false);
    alert("Đã hủy gói thành công!");
  };

  return (
    <div className="traphi-container">
      <h2>Danh sách gói trả phí</h2>

      <div className="traphi-pricing">
        {goiList.map((goi) => (
          <div key={goi.idGoi} className="pricing-card">
            <h3>{goi.tenGoi}</h3>
            <p>{goi.giaGoi.toLocaleString()} VNĐ</p>
            <p><small>Thời hạn: {goi.thoiHan} ngày</small></p>
            <Button variant="register" onClick={() => handleSub(goi)}>
              Đăng ký
            </Button>
          </div>
        ))}
      </div>

      {hasActiveSub && (
        <div className="traphi-actions" style={{ marginTop: 30 }}>
          <Button variant="cancel" onClick={handleCancel}>
            Hủy gói hiện tại
          </Button>
        </div>
      )}
    </div>
  );
}

export default Traphi;
