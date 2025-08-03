import { Routes, Route } from 'react-router-dom';
import DangNhapLayout from './layouts/DangNhapLayout';
import DangNhap from './pages/DangNhap';
import DangKy from './pages/DangKy';
import TrangChu from './pages/TrangChu';
import Traphi from './pages/TraPhi/Traphi';

export default function App() {
  return (
    <Routes>
      <Route element={<DangNhapLayout />}>
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/traphi" element={<Traphi/>} />

      </Route>
      <Route path="/" element={<TrangChu />} />
    </Routes>
  );
}
