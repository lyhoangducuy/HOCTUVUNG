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
import Lop from "./pages/GiangVien/Lop/Lop";
import Library from "./pages/GiangVien/MyLib/BoThe-Lib/Library";
import NewBoThe from "./pages/GiangVien/AddNew/NewBoThe/NewBoThe";
import MyFolder from "./pages/GiangVien/MyFolder/MyFolder";

import TrangChuLayout from "./layouts/TrangChuLayout/TrangChuLayout";
import QuanLyUser from "./pages/Admin/QuanLyUser/QuanLyUser";
import ThongKeAdmin from "./pages/Admin/ThongKeAdmin/ThongKeAdmin";
import Edit from "./components/Admin/Edit/Edit";
import QuanLyBoThe from "./pages/Admin/QuanLyBoThe/QuanLyBoThe";
import QuanLyLop from "./pages/Admin/QuanLyLop/QuanLyLop";
import QuanLyTraPhi from "./pages/Admin/QuanLyTraPhi/QuanLyTRaPhi";
export default function App() {
  return (
    <Routes>
      <Route element={<DangNhapLayout />}>
        <Route path="/" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/tra-phi" element={<TraPhi />} />
        <Route path="/giangvienheader" element={<Giangvien_Header />} />
      </Route>
      <Route element={<TrangChuLayout />}>
        <Route path="/" element={<TrangChu />} />
        <Route path="/hocvien" element={<TrangChuHocVien />} />
        <Route path="/giangvien" element={<TrangChuGiangVien />}></Route>
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<TrangChuAdmin />} />
        <Route path="/admin/quan-ly-user" element={<QuanLyUser />} />
        <Route path="/admin/thong-ke" element={<ThongKeAdmin />} />
        <Route path="/edit" element={<Edit />} />
        <Route path="/admin/quan-ly-bo-the" element={<QuanLyBoThe />} />
        <Route path="/admin/quan-ly-lop" element={<QuanLyLop />} />
        <Route path="/admin/quan-ly-tra-phi" element={<QuanLyTraPhi />} />
      </Route>
      <Route element={<GiangVienLayout />}>
        <Route path="/giangvien" element={<TrangChuGiangVien />} />
        <Route path="/flashcard/:id" element={<FlashCard />} />
        <Route path="/tracnghiem/:id" element={<TracNghiem />} />
        <Route path="/test/:id" element={<Test />} />
        <Route path="/game/:id" element={<MatchGame />} />
        <Route path="/video/:id" element={<Video />} />
        <Route path="/newcard" element={<NewBoThe/>} />
        <Route path="/newfolder" element={<Newfolder />} />
        <Route path="/lop/:id" element={<Lop />} />
        <Route path="/newclass" element={<Newclass />} />
        <Route path="/mylibrary" element={<Library />} />
        <Route path="/folder/:id" element={<MyFolder/>} />

      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<TrangChuAdmin />} />
        <Route path="/admin/quan-ly-user" element={<QuanLyUser />} />
        <Route path="/admin/thong-ke" element={<ThongKeAdmin />} />
      </Route>
    </Routes>
  );
}
