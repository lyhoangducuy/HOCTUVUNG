import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./QuenMatKhau.css";

const schema = yup.object({
  emailOrPhone: yup
    .string()
    .required("Vui lòng nhập email hoặc số điện thoại"),
  matkhau: yup
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .required("Vui lòng nhập mật khẩu mới"),
  xacNhanMatKhau: yup
    .string()
    .oneOf([yup.ref("matkhau")], "Mật khẩu xác nhận không khớp")
    .required("Vui lòng xác nhận mật khẩu"),
});

export default function QuenMatKhau() {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (form) => {
    setError("");
    const emailOrPhone = form.emailOrPhone.trim();
    const newPassword = form.matkhau;

    try {
     
      const danhSachNguoiDung = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
      const userIndex = danhSachNguoiDung.findIndex(
        (u) => u.email?.toLowerCase() === emailOrPhone.toLowerCase() 
      );

      if (userIndex === -1) {
        setError("Email này chưa được đăng ký trong hệ thống.");
        return;
      }

     
      danhSachNguoiDung[userIndex].matkhau = newPassword;
      localStorage.setItem("nguoiDung", JSON.stringify(danhSachNguoiDung));
      
      setIsSuccess(true);
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  };

  if (isSuccess) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-left">
            <img src="/src/assets/image/logo.jpg" alt="imgloginform" />
          </div>

          <div className="login-right">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Đặt lại mật khẩu thành công!</h2>
              <p>
                Mật khẩu của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập với mật khẩu mới.
              </p>
              <button 
                onClick={() => navigate("/")}
                className="login-btn submit"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <img src="/src/assets/image/logo.jpg" alt="imgloginform" />
        </div>

        <div className="login-right">
          <div className="login-tabs">
            <span onClick={() => navigate("/dang-ky")} style={{ cursor: "pointer" }}>
              Đăng ký
            </span>
            <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              Đăng nhập
            </span>
            <span className="active">
              Quên mật khẩu
            </span>
          </div>

          <div className="forgot-password-info">
            <h2>Quên mật khẩu?</h2>
            <p>
              Nhập email  của bạn và mật khẩu mới để đặt lại.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <label>Email </label>
            <input
              type="text"
              {...register("emailOrPhone")}
              className={errors.emailOrPhone ? "error" : ""}
              placeholder="Nhập email của bạn"
            />
            {errors.emailOrPhone && <span className="error">{errors.emailOrPhone.message}</span>}

            <label>Mật khẩu mới</label>
            <input
              type="password"
              {...register("matkhau")}
              className={errors.matkhau ? "error" : ""}
              placeholder="Nhập mật khẩu mới"
            />
            {errors.matkhau && <span className="error">{errors.matkhau.message}</span>}

            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              {...register("xacNhanMatKhau")}
              className={errors.xacNhanMatKhau ? "error" : ""}
              placeholder="Nhập lại mật khẩu mới"
            />
            {errors.xacNhanMatKhau && <span className="error">{errors.xacNhanMatKhau.message}</span>}

            {error && <span className="error">{error}</span>}

            <button type="submit" className="login-btn submit">
              Đặt lại mật khẩu
            </button>
          </form>

          <div className="back-to-login">
            <a onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              ← Quay lại đăng nhập
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
