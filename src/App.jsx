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

import NewKhoaHoc from "./pages/NguoiDung/AddNew/NewKhoaHoc/NewKhoaHoc";
import NewBoThe from "./pages/NguoiDung/AddNew/NewBoThe/NewBoThe";
import KhoaHoc from "./pages/NguoiDung/KhoaHoc/KhoaHoc";
import ThuVienCuaToi from "./pages/NguoiDung/ThuVienCuaToi/ThuVienCuaToi";

import QuanLyUser from "./pages/Admin/QuanLyUser/QuanLyUser";
import QuanLyBoThe from "./pages/Admin/QuanLyBoThe/QuanLyBoThe";
import QuanLyKhoaHoc from "./pages/Admin/QuanLyKhoaHoc/QuanLyKhoaHoc";
import QuanLyVideo from "./pages/Admin/QuanLyVideo/QuanLyVideo";
import Setting from "./pages/NguoiDung/Setting/Setting";
import SuaBoThe from "./pages/NguoiDung/HocBoThe/SuaBoThe/SuaBoThe";
import Landingpage from "./pages/Auth/LandingPage/Landingpage";
import Traphi from "./pages/NguoiDung/TraPhi/Traphi";
import QuanLyTraPhi from "./pages/Admin/QuanLyTraPhi/QuanLyTRaPhi";
import TrangTimKiem from "./pages/NguoiDung/TrangTimKiem/TrangTimKiem";
import SettingAdmin from "./pages/Admin/Setting/Setting";
import YeuCauTraPhi from "./router/phanQuyenTraPhi";
import Checkout from "./pages/NguoiDung/Checkout/checkout";
import CheckoutResult from "./pages/NguoiDung/Checkout/checkoutResult";
import LichSuThanhToan from "./pages/NguoiDung/TraPhi/lichSuThanhToan";
import NguoiDungDetail from "./pages/NguoiDung/NguoiDungDetail/NguoiDungDetail";
import BoTheDetail from "./pages/NguoiDung/HocBoThe/BoTheDetail";
import ViDetail from "./pages/NguoiDung/Vi/viDetail";


export default function App() {
  return (
    <Routes>
      {/* Đăng nhập */}
      <Route element={<AuthLayout />}>
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
        <Route path="/" element={<Landingpage />} />

      </Route>
      <Route element={<YeuCauDangNhap />}>

        {/* Giảng viên / Học viên / Admin đã đăng nhập */}
        <Route
          element={
            <DangNhapTheoRole allowed={["GIANG_VIEN", "HOC_VIEN", "ADMIN"]} />
          }
        >
          <Route element={<NguoiDungLayout />}>
            <Route path="/trangchu" element={<TrangChu />} />
            <Route path="/tra-phi" element={<Traphi />} />
            <Route path="/flashcard/:id" element={<FlashCard />} />
            <Route path="/tracnghiem/:id" element={<TracNghiem />} />
            <Route path="/test/:id" element={<Test />} />
            <Route path="/game/:id" element={<MatchGame />} />
            <Route path="/newBoThe" element={<NewBoThe />} />
            <Route path="/khoaHoc/:id" element={<KhoaHoc />} />
            <Route path="/thuviencuatoi" element={<ThuVienCuaToi />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/suabothe/:id" element={<SuaBoThe />} />
            <Route path="/timkiem/:id" element={<TrangTimKiem />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/result" element={<CheckoutResult />} />
            <Route path="/lichSuThanhToan" element={<LichSuThanhToan />}/>
            <Route path="/nguoiDung/:uid" element={<NguoiDungDetail />} />
            <Route path="/bothe/:id" element={<BoTheDetail />} />
            <Route path="/vi" element={<ViDetail/>}/>

            {/* 🔒 Chỉ người có gói trả phí còn hiệu lực mới truy cập được Video */}
            <Route element={<YeuCauTraPhi />}>
              <Route path="/video" element={<VideoLibrary />} />
              <Route path="/video/:id" element={<Video />} />
            </Route>
          </Route>
        </Route>

        <Route element={<DangNhapTheoRole allowed={["GIANG_VIEN", "ADMIN"]} />}>
          <Route element={<NguoiDungLayout />}>
            <Route path="/newKhoaHoc" element={<NewKhoaHoc />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<DangNhapTheoRole allowed={["ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<TrangChuAdmin />} />
            <Route path="/admin/setting" element={<SettingAdmin />} />
            <Route path="/admin/quan-ly-user" element={<QuanLyUser />} />
            <Route path="/admin/thong-ke" element={<ThongKeAdmin />} />
            <Route path="/admin/quan-ly-tra-phi" element={<QuanLyTraPhi />} />
            <Route path="/admin/quan-ly-bo-the" element={<QuanLyBoThe />} />
            <Route path="/admin/quan-ly-khoa-hoc" element={<QuanLyKhoaHoc />} />
            <Route path="/admin/quan-ly-video" element={<QuanLyVideo />} />
          </Route>
        </Route>
      </Route>
      {/* 404 */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
