import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import "./DangNhap.css";
// import axios from "axios"; // Chưa dùng thì có thể xoá

const schema = yup.object({
  email: yup
    .string()
    .email("Nhập đúng định dạng email")
    .required("Vui lòng nhập email"),
  matkhau: yup
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .required("Vui lòng nhập mật khẩu"),
});

export default function DangNhap() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  // Lấy danh sách người dùng đã "đăng ký" (demo)
  const danhSachNguoiDung = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch {
      return [];
    }
  }, []);

  const onSubmit = (form) => {
    setLoginError("");
    const email = form.email.trim().toLowerCase();
    const pwd = form.matkhau;
    if (email === "pewpew@gmail.com") {
      localStorage.setItem(
        "nguoiDung",
        JSON.stringify([
          {
            idNguoiDung: "999999",
            hoten: "Phan Anh Thương",
            tenNguoiDung: "pewpew",
            email: "pewpew@gmail.com",
            matkhau: "123123",
            vaiTro: "ADMIN",
            ngayTaoTaiKhoan: new Date().toISOString(),
            anhDaiDien: "",
          },
        ])
      );
    }

    const found = danhSachNguoiDung.find(
      (u) => u.email?.toLowerCase() === email && u.matkhau === pwd
    );

    if (!found) {
      setLoginError("Email hoặc mật khẩu không đúng.");
      return;
    }

    // Lưu phiên đăng nhập (demo)
    const sessionUser = {
      idNguoiDung: found.idNguoiDung,
      vaiTro: found.vaiTro,
    };
    sessionStorage.setItem("session", JSON.stringify(sessionUser));

    // Điều hướng theo vai trò
    const next =
      found.vaiTro === "GIANG_VIEN"
        ? "/giangvien"
        : found.vaiTro === "ADMIN"
        ? "/admin"
        : "/hocvien";

    navigate(next);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <img src="/src/assets/image/logo.jpg" alt="imgloginform" />
        </div>

        <div className="login-right">
          <div className="login-tabs">
            <span
              onClick={() => navigate("/dang-ky")}
              style={{ cursor: "pointer" }}
            >
              Đăng ký
            </span>
            <span
              className="active"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            >
              Đăng nhập
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <label>Email</label>
            <input
              type="email"
              {...register("email")}
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="error">{errors.email.message}</span>
            )}

            <label>Mật khẩu</label>
            <input
              type="password"
              {...register("matkhau")}
              className={errors.matkhau ? "error" : ""}
            />
            {errors.matkhau && (
              <span className="error">{errors.matkhau.message}</span>
            )}

            {loginError && <span className="error">{loginError}</span>}

            <div className="forgot">
              <a onClick={() => navigate("/quen-mat-khau")} style={{ cursor: "pointer" }}>
                Quên mật khẩu
              </a>
            </div>

            <button type="submit" className="login-btn submit">
              Đăng Nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
