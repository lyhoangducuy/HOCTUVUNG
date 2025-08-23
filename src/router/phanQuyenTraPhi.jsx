// router/phanQuyenTraPhi.jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";

function coGoiTraPhiHieuLuc(session) {
  try {
    if (!session?.idNguoiDung) return false;
    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const mySubs = subs.filter((s) => s.idNguoiDung === session.idNguoiDung);
    if (mySubs.length === 0) return false;

    const last = mySubs[mySubs.length - 1];
    const [d, m, y] = String(last.NgayKetThuc || "").split("/").map(Number);
    if (!d || !m || !y) return false;

    const expire = new Date(y, m - 1, d);
    const today = new Date();
    return expire >= today;
  } catch {
    return false;
  }
}

export default function YeuCauTraPhi() {
  const location = useLocation();
  const session = JSON.parse(sessionStorage.getItem("session") || "null");

  // nếu chưa đăng nhập → về trang đăng nhập
  if (!session?.idNguoiDung) {
    return <Navigate to="/dang-nhap" replace state={{ from: location }} />;
  }

  // nếu không có gói còn hiệu lực → chuyển tới trang trả phí
  if (!coGoiTraPhiHieuLuc(session)) {
    return (
      <Navigate
        to="/tra-phi"
        replace
        state={{ from: location, reason: "no_active_sub" }}
      />
    );
  }

  // Hợp lệ → render các route con
  return <Outlet />;
}
