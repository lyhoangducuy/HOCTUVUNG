import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/inputs/Button"; // nhớ đổi đúng path tới Button.jsx
import "./Traphi.css";

function Traphi() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  // Danh sách gói
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

    // kiểm tra gói hoạt động
    const dsDangKy = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const mySubs = dsDangKy.filter((s) => s.idNguoiDung === sessionUser.idNguoiDung);
    const lastSub = mySubs.length > 0 ? mySubs[mySubs.length - 1] : null;

    if (lastSub) {
      const [d, m, y] = lastSub.NgayKetThuc.split("/");
      const expireDate = new Date(y, m - 1, d);
      const today = new Date();
      if (expireDate >= today) {
        setHasActiveSub(true);
      }
    }
  }, [navigate]);

  // hàm cộng ngày
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  // đăng ký gói
  const handleSub = (goi) => {
    if (!currentUser) return;

    const dsDangKy = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const mySubs = dsDangKy.filter((s) => s.idNguoiDung === currentUser.idNguoiDung);
    const lastSub = mySubs.length > 0 ? mySubs[mySubs.length - 1] : null;

    if (lastSub) {
      const [d, m, y] = lastSub.NgayKetThuc.split("/");
      const expireDate = new Date(y, m - 1, d);
      const today = new Date();
      if (expireDate >= today) {
        alert("Bạn đã có gói đang hoạt động. Hãy hủy hoặc chờ hết hạn mới được đăng ký gói khác.");
        return;
      }
    }

    const ngayBatDau = new Date();
    const ngayKetThuc = addDays(ngayBatDau, goi.thoiHan);

    const newSub = {
      idGTPCND: "SUB" + Date.now(),
      idNguoiDung: currentUser.idNguoiDung,
      idGoi: goi.idGoi,
      NgayBatDau: ngayBatDau.toLocaleDateString("vi-VN"),
      NgayKetThuc: ngayKetThuc.toLocaleDateString("vi-VN"),
    };

    dsDangKy.push(newSub);
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(dsDangKy));

    setHasActiveSub(true);
    alert("Đăng ký thành công!");
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
        <div style={{ marginTop: "30px" }}>
          <Button variant="cancel" onClick={handleCancel}>
            Hủy gói hiện tại
          </Button>
        </div>
      )}
    </div>
  );
}

export default Traphi;
