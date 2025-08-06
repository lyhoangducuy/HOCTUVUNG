import { Outlet } from 'react-router-dom';
import Footer from '../../components/NguoiDung/Footer';
import Header_DangNhap from '../../components/NguoiDung/Header_HocVien';

export default function DangNhapLayout() {
  return (
    <div>
      <Header_DangNhap />
      <Outlet />
      <Footer />
    </div>
  );
}
