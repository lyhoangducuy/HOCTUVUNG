// src/router/phanQuyen.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

function getCurrentNguoiDung() {
  try {
    const raw = sessionStorage.getItem("session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Bắt buộc đăng nhập: nếu chưa đăng nhập → về trang "/" (login),
 * kèm state.from để đăng nhập xong quay lại đúng trang.
 */
export function YeuCauDangNhap() {
  const location = useLocation();
  const nguoiDung = getCurrentNguoiDung();

  if (!nguoiDung) {
    return <Navigate to="/dang-nhap" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/**
 * Phân quyền theo vai trò: chỉ cho phép role trong "allowed".
 * Nếu chưa đăng nhập → về "/".
 * Nếu sai quyền → điều hướng về trang an toàn (ví dụ /giangvien).
 */
export function DangNhapTheoRole({ allowed = [] }) {
  const location = useLocation();
  const user = getCurrentNguoiDung();

  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location }} />;
  }
  if (allowed.length && !allowed.includes(user.vaiTro)) {
    // Có thể điều hướng tới trang 403/404 riêng nếu bạn có
    return <Navigate to="/error-404" replace />;
  }
  return <Outlet />;
}
