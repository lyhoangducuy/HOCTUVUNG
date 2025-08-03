import { Outlet } from 'react-router-dom';
import Footer from '../../components/HocVien/Footer';
import Header_HocVien from '../../components/HocVien/Header_HocVien';

export default function DangNhapLayout() {
  return (
    <div>
      <Header_HocVien />
      <Outlet />
      <Footer />
    </div>
  );
}
