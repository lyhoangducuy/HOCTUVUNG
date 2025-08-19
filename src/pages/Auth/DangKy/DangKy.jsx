import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./DangKy.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const schema = yup.object({
  email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  username: yup.string().required("Vui lòng nhập tên người dùng"),
  role: yup.string().oneOf(["hocvien", "giangvien"], "Vui lòng chọn vai trò").required(),
  password: yup.string().min(6, "Mật khẩu tối thiểu 6 ký tự").required(),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref("password")], "Mật khẩu không khớp")
    .required(),
});

function DangKy() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // map role UI -> role hệ thống
  const roleMap = { giangvien: "GIANG_VIEN", hocvien: "HOC_VIEN" };

  // lưu danh sách user demo trong localStorage
  const [nguoiDung, setNguoiDung] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    } catch { return []; }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const newUser = {
        idNguoiDung: Math.floor(Math.random() * 1000000),
        email: data.email,
        tenNguoiDung: data.username,
        hoten: "",
        anhDaiDien: "",
        matkhau: data.password,
        vaiTro: roleMap[data.role],
        ngayTaoTaiKhoan: new Date().toISOString()
      };


      const next = [...nguoiDung, newUser];
      setNguoiDung(next);
      localStorage.setItem("nguoiDung", JSON.stringify(next));

      alert("Đăng ký thành công!");
      navigate("/"); // trang đăng nhập theo routes của bạn
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data || "Đăng ký thất bại!";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-left">
          <img src="/src/assets/image/logo.jpg" alt="imgsignupform" />
        </div>
        <div className="signup-right">
          <div className="signup-tabs">
            <span className="active" onClick={() => navigate("/dang-ky")} style={{ cursor: "pointer" }}>
              Đăng ký
            </span>
            <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              Đăng nhập
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
            <label>Email</label>
            <input type="email" {...register("email")} className={errors.email ? "error" : ""} />
            {errors.email && <span className="error">{errors.email.message}</span>}

            <label>Tên người dùng</label>
            <input type="text" {...register("username")} className={errors.username ? "error" : ""} />
            {errors.username && <span className="error">{errors.username.message}</span>}

            <label>Vai trò</label>
            <select {...register("role")} className={errors.role ? "error" : ""}>
              <option value="">-- Chọn vai trò --</option>
              <option value="giangvien">Giảng viên</option>
              <option value="hocvien">Học viên</option>
            </select>
            {errors.role && <span className="error">{errors.role.message}</span>}

            <label>Mật khẩu</label>
            <input type="password" {...register("password")} className={errors.password ? "error" : ""} />
            {errors.password && <span className="error">{errors.password.message}</span>}

            <label>Nhập lại mật khẩu</label>
            <input type="password" {...register("passwordConfirm")} className={errors.passwordConfirm ? "error" : ""} />
            {errors.passwordConfirm && <span className="error">{errors.passwordConfirm.message}</span>}

            <button type="submit" className="signup-btn submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng Ký"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DangKy;
