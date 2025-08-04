import { Routes, Route } from "react-router-dom";
import DangNhapLayout from "./layouts/DangNhapLayout";
import DangNhap from "./pages/DangNhap";
import DangKy from "./pages/DangKy";
import TrangChu from "./pages/TrangChu";
import TraPhi from "./pages/HocVien/TraPhi";
import TrangChuAdmin from "./pages/Admin/TrangChu";
import TrangChuHocVien from "./pages/HocVien/TrangChu";
import TrangChuGiangVien from "./pages/GiangVien/TrangChu";
import AdminLayout from "./layouts/AdminLayout";
import Giangvien_Header from "./components/GiangVien/Header/Giangvien_Header";
import GiangVienLayout from "./layouts/GiangVienLayout";
import HocBoThe from "./pages/GiangVien/HocBoThe";

export default function App() {
  return (
    <Routes>
      <Route element={<DangNhapLayout />}>
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
      </Route>
      <Route element={<GiangVienLayout/>}>
        <Route path="/giangvien" element={<TrangChuGiangVien />}>
        </Route>
         <Route path="/hoc-bo-the/:id" element={<HocBoThe/>} />
       
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<TrangChuAdmin />} />
      </Route>
    </Routes>
  );
}
