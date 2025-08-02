import { Outlet } from 'react-router-dom';
import DangKyHeader from '../../components/DangKyHeader';
import Footer from '../../components/Footer';

export default function DangNhapLayout() {
  return (
    <div>
      <DangKyHeader />
      <Outlet />
      <Footer />
    </div>
  );
}
