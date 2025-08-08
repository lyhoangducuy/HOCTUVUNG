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

import FlashCard from "./pages/GiangVien/HocBoThe/FlashCard/FlashCard";
import TracNghiem from "./pages/GiangVien/HocBoThe/TracNghiem";
import Test from "./pages/GiangVien/HocBoThe/Test";
import MatchGame from "./pages/GiangVien/HocBoThe/MatchGame";
import Video from "./pages/GiangVien/HocBoThe/Video";
import QuanLyUser from "./pages/Admin/QuanLyUser/QuanLyUser";
import ThongKeAdmin from "./pages/Admin/ThongKeAdmin/ThongKeAdmin";
import Newfolder from "./pages/GiangVien/AddNew/NewFolder/Newfolder";
import Newclass from "./pages/GiangVien/AddNew/NewClass/Newclass";

export default function App() {
  return (
    <Routes>
      <Route element={<DangNhapLayout />}>
        <Route path="/" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
      </Route>
      <Route element={<GiangVienLayout />}>
        <Route path="/giangvien" element={<TrangChuGiangVien />} />
        <Route path="/flashcard/:id" element={<FlashCard />} />
        <Route path="/tracnghiem/:id" element={<TracNghiem />} />
        <Route path="/test/:id" element={<Test />} />
        <Route path="/game/:id" element={<MatchGame />} />
        <Route path="/video/:id" element={<Video />} />
        <Route path="/newfolder" element={<Newfolder />} />
         <Route path="/newclass" element={<Newclass/>} />

      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<TrangChuAdmin />} />
        <Route path="/admin/quan-ly-user" element={<QuanLyUser />} />
        <Route path="/admin/thong-ke" element={<ThongKeAdmin />} />
      </Route>
    </Routes>
  );
}
