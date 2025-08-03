import { Routes, Route } from 'react-router-dom';
import DangNhapLayout from './layouts/DangNhapLayout';
import DangNhap from './pages/DangNhap';
import DangKy from './pages/DangKy';
import TrangChu from './pages/TrangChu';
import TraPhi from './pages/TraPhi';
import TrangChuAdmin from './pages/Admin/TrangChu';
import TrangChuHocVien from './pages/HocVien/TrangChu';
import TrangChuGiangVien from './pages/GiangVien/TrangChu';
import TrangChuLayout from './layouts/TrangChuLayout';

export default function App() {
  return (
    <Routes>
      <Route element={<DangNhapLayout />}>
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/tra-phi" element={<TraPhi />} />
      </Route>
      <Route element={<TrangChuLayout/>}>
        <Route path="/" element={<TrangChu />} />
        <Route path="/admin" element={<TrangChuAdmin/>} />
        <Route path="/hocvien" element={<TrangChuHocVien/>} />
        <Route path="/giangvien" element={<TrangChuGiangVien/>} />
      </Route>
    </Routes>
  );
}
