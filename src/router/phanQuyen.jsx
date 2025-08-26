import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../providers/AuthProvider";

export function YeuCauDangNhap() {
  const location = useLocation();
  const { user, loading } = useSession();

  if (loading) return null; // hoặc spinner
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location }} />;
  return <Outlet />;
}

export function DangNhapTheoRole({ allowed = [] }) {
  const location = useLocation();
  const { user, profile, loading } = useSession();

  if (loading) return null;
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location }} />;

  const vaiTro = profile?.vaiTro || "HOC_VIEN";
  if (allowed.length && !allowed.includes(vaiTro)) {
    return <Navigate to="/error-404" replace />;
  }
  return <Outlet />;
}
