import { Routes, Route } from "react-router-dom";

// Layouts
import DangNhapLayout from "./layouts/DangNhapLayout";
import AdminLayout from "./layouts/AdminLayout";
import GiangVienLayout from "./layouts/GiangVienLayout";

// Auth
import DangNhap from "./pages/DangNhap";
import DangKy from "./pages/DangKy";

// Admin
import TrangChuAdmin from "./pages/Admin/TrangChu";
import ThongKeAdmin from "./pages/Admin/ThongKeAdmin/ThongKeAdmin";

// Giảng viên
import TrangChuGiangVien from "./pages/GiangVien/TrangChu";
import FlashCard from "./pages/GiangVien/HocBoThe/FlashCard/FlashCard";
import TracNghiem from "./pages/GiangVien/HocBoThe/TracNghiem";
import Test from "./pages/GiangVien/HocBoThe/Test";
import MatchGame from "./pages/GiangVien/HocBoThe/MatchGame";
import Video from "./pages/GiangVien/HocBoThe/Video";
import Newfolder from "./pages/GiangVien/AddNew/NewFolder/Newfolder";
import Newclass from "./pages/GiangVien/AddNew/NewClass/Newclass";
import NewBoThe from "./pages/GiangVien/AddNew/NewBoThe/NewBoThe";
import Lop from "./pages/GiangVien/Lop/Lop";
import Library from "./pages/GiangVien/MyLib/BoThe-Lib/Library";
import MyFolder from "./pages/GiangVien/MyFolder/MyFolder";
import QuanLyUser from "./pages/Admin/QuanLyUser/QuanLyUser";
import QuanLyTraPhi from "./pages/Admin/QuanLyTraPhi/QuanLyTraPhi";
import QuanLyBoThe from "./pages/Admin/QuanLyBoThe/QuanLyBoThe";
import QuanLyLop from "./pages/Admin/QuanLyLop/QuanLyLop";
import Setting from "./pages/GiangVien/Setting/Setting";

export default function App() {
  return (
    <Routes>
      {/* Đăng nhập */}
      <Route element={<DangNhapLayout />}>
        <Route path="/" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
      </Route>

      {/* Giảng viên */}
      <Route element={<GiangVienLayout />}>
        <Route path="/giangvien" element={<TrangChuGiangVien />} />
        <Route path="/flashcard/:id" element={<FlashCard />} />
        <Route path="/tracnghiem/:id" element={<TracNghiem />} />
        <Route path="/test/:id" element={<Test />} />
        <Route path="/game/:id" element={<MatchGame />} />
        <Route path="/video/:id" element={<Video />} />
        <Route path="/newcard" element={<NewBoThe />} />
        <Route path="/newfolder" element={<Newfolder />} />
        <Route path="/lop/:id" element={<Lop />} />
        <Route path="/newclass" element={<Newclass />} />
        <Route path="/mylibrary" element={<Library />} />
        <Route path="/folder/:id" element={<MyFolder/>} />
        <Route path="/setting" element={<Setting/>} />

      </Route>

      {/* Admin */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<TrangChuAdmin />} />
        <Route path="/admin/quan-ly-user" element={<QuanLyUser />} />
        <Route path="/admin/thong-ke" element={<ThongKeAdmin />} />
        <Route path="/admin/quan-ly-tra-phi" element={<QuanLyTraPhi/>}/>
        <Route path="/admin/quan-ly-bo-the" element={<QuanLyBoThe/>}/>
        <Route path="/admin/quan-ly-lop" element={<QuanLyLop/>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
