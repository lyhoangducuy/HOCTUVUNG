import { Routes, Route } from "react-router-dom";
//router
import { YeuCauDangNhap, DangNhapTheoRole } from "./router/phanQuyen";

// Layouts
import AuthLayout from "./layouts/AuthLayout/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import NguoiDungLayout from "./layouts/NguoiDungLayout/NguoiDungLayout";

// Auth
import DangNhap from "./pages/Auth/DangNhap";
import DangKy from "./pages/Auth/DangKy";
import QuenMatKhau from "./pages/Auth/QuenMatKhau";

// Admin
import TrangChuAdmin from "./pages/Admin/TrangChu";
import ThongKeAdmin from "./pages/Admin/ThongKeAdmin/ThongKeAdmin";

// Giảng viên
import TrangChu from "./pages/NguoiDung/TrangChu";
import FlashCard from "./pages/NguoiDung/HocBoThe/FlashCard/FlashCard";
import TracNghiem from "./pages/NguoiDung/HocBoThe/TracNghiem";
import Test from "./pages/NguoiDung/HocBoThe/Test";
import MatchGame from "./pages/NguoiDung/HocBoThe/MatchGame";
import Video from "./pages/NguoiDung/HocBoThe/Video/Video";
import VideoLibrary from "./pages/NguoiDung/HocBoThe/Video/VideoLibrary";

import Newclass from "./pages/NguoiDung/AddNew/NewClass/Newclass";
import NewBoThe from "./pages/NguoiDung/AddNew/NewBoThe/NewBoThe";
import Lop from "./pages/NguoiDung/Lop/Lop";
import ThuVienCuaToi from "./pages/NguoiDung/ThuVienCuaToi/ThuVienCuaToi";

import QuanLyUser from "./pages/Admin/QuanLyUser/QuanLyUser";
import QuanLyBoThe from "./pages/Admin/QuanLyBoThe/QuanLyBoThe";
import QuanLyLop from "./pages/Admin/QuanLyLop/QuanLyLop";
import Setting from "./pages/NguoiDung/Setting/Setting";
import SuaBoThe from "./pages/NguoiDung/HocBoThe/SuaBoThe/SuaBoThe";
import Landingpage from "./pages/Auth/LandingPage/Landingpage";
import Traphi from "./pages/NguoiDung/TraPhi/Traphi";
import QuanLyTraPhi from "./pages/Admin/QuanLyTraPhi/QuanLyTRaPhi";


export default function App() {
  return (
    <Routes>
      {/* Đăng nhập */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
        <Route path="/landingpage" element={<Landingpage />} />
       
      </Route>
      <Route element={<YeuCauDangNhap />}>
        <Route
          element={
            <DangNhapTheoRole allowed={["GIANG_VIEN", "HOC_VIEN", "ADMIN"]} />
          }
        >
          {/* Giảng viên */}
          <Route element={<NguoiDungLayout />}>
            <Route path="/giangvien" element={<TrangChu />} />
            <Route path="/hocvien" element={<TrangChu />} />
            <Route path="/tra-phi" element={<Traphi />} />
            <Route path="/flashcard/:id" element={<FlashCard />} />
            <Route path="/tracnghiem/:id" element={<TracNghiem />} />
            <Route path="/test/:id" element={<Test />} />
            <Route path="/game/:id" element={<MatchGame />} />
            <Route path="/newBoThe" element={<NewBoThe />} />
            <Route path="/lop/:id" element={<Lop />} />
            <Route path="/thuviencuatoi" element={<ThuVienCuaToi />} />
            <Route path="/video" element={<VideoLibrary/>} />
            <Route path="/video/:id" element={<Video />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/suabothe/:id" element={<SuaBoThe />} />

          </Route>
        </Route>
        <Route element={<DangNhapTheoRole allowed={["GIANG_VIEN", "ADMIN"]} />}>
          <Route element={<NguoiDungLayout />}>
            <Route path="/newclass" element={<Newclass />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<DangNhapTheoRole allowed={["ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<TrangChuAdmin />} />
            <Route path="/admin/quan-ly-user" element={<QuanLyUser />} />
            <Route path="/admin/thong-ke" element={<ThongKeAdmin />} />
            <Route path="/admin/quan-ly-tra-phi" element={<QuanLyTraPhi />} />
            <Route path="/admin/quan-ly-bo-the" element={<QuanLyBoThe />} />
            <Route path="/admin/quan-ly-lop" element={<QuanLyLop />} />
          </Route>
        </Route>
      </Route>
      {/* 404 */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
