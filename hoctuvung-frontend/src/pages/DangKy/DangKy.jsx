import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./DangKy.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const schema = yup.object().shape({
  email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  username: yup.string().required("Vui lòng nhập tên người dùng"),
  role: yup.string().oneOf(["hocvien", "giangvien"], "Vui lòng chọn vai trò").required("Vui lòng chọn vai trò"),
  password: yup.string().min(6, "Mật khẩu tối thiểu 6 ký tự").required("Vui lòng nhập mật khẩu"),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref("password")], "Mật khẩu không khớp")
    .required("Vui lòng nhập lại mật khẩu"),
});

function DangKy() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [loading, setLoading] = useState(false);

  const roleMap = {
    giangvien: "GIANG_VIEN",
    hocvien: "HOC_VIEN",
  };

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await axios.post("http://localhost:8080/api/nguoidung/dangky", {
        email: data.email,
        tenNguoiDung: data.username,
        matkhau: data.password,
        vaiTro: roleMap[data.role],
      });
      alert("Đăng ký thành công!");
      navigate("/dang-nhap");
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data.message || error.response.data || "Đăng ký thất bại!");
      } else {
        alert("Đăng ký thất bại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <img src="/src/image/formimg.png" alt="imgloginform" />
        </div>
        <div className="login-right">
          <div className="login-tabs">
            <span onClick={() => navigate("/dang-ky")} style={{ cursor: "pointer" }}>
              Đăng ký
            </span>
            <span onClick={() => navigate("/dang-nhap")} style={{ cursor: "pointer" }}>
              Đăng nhập
            </span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            {/* Email */}
            <label>Email</label>
            <input type="email" {...register("email")} />
            {errors.email && <span className="error">{errors.email.message}</span>}

            {/* Tên người dùng */}
            <label>Tên người dùng</label>
            <input type="text" {...register("username")} />
            {errors.username && <span className="error">{errors.username.message}</span>}

            {/* Vai trò */}
            <label>Vai trò</label>
            <select {...register("role")}>
              <option value="">-- Chọn vai trò --</option>
              <option value="giangvien">Giảng viên</option>
              <option value="hocvien">Học viên</option>
            </select>
            {errors.role && <span className="error">{errors.role.message}</span>}

            {/* Mật khẩu */}
            <label>Mật khẩu</label>
            <input type="password" {...register("password")} />
            {errors.password && <span className="error">{errors.password.message}</span>}

            {/* Nhập lại mật khẩu */}
            <label>Nhập lại mật khẩu</label>
            <input type="password" {...register("passwordConfirm")} />
            {errors.passwordConfirm && <span className="error">{errors.passwordConfirm.message}</span>}

            <button type="submit" className="login-btn submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng Ký"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DangKy;