import { Routes, Route } from 'react-router-dom';
import DangNhapLayout from './layouts/DangNhapLayout';
import DangNhap from './pages/DangNhap';
import DangKy from './pages/DangKy';
import TrangChu from './pages/TrangChu';
import TraPhi from './pages/TraPhi';

export default function App() {
  return (
    <Routes>
      <Route element={<DangNhapLayout />}>
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/tra-phi" element={<TraPhi />} />
      </Route>
      <Route path="/" element={<TrangChu />} />
    </Routes>
  );
}
