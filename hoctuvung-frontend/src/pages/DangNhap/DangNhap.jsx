import { useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faGoogle } from "@fortawesome/free-brands-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./DangNhap.css";
import { useState } from "react";

function DangNhap() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();


  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");

  const onSubmit = async (data) => {
    setLoginError("");

    try {
      const response = await axios.post("http://localhost:8080/api/nguoidung/dangnhap", {
        email: data.email,
        matkhau: data.password, // tùy theo tên field trên server
      });

      if (response.data) {
        alert("Đăng nhập thành công!");
        // Lưu thông tin người dùng nếu cần
        localStorage.setItem("nguoiDung", JSON.stringify(response.data));
        console.log(response.data);
        // Hàm để xử lý đăng nhập
        // const login = (userData) => {
        //   sessionStorage.setItem('user', JSON.stringify(userData)); // Lưu vào sessionStorage
        //   setUser(userData); // Cập nhật state
        // };
        if (response.vaiTro === "GIANG_VIEN") {
          navigate("/giangvien");
        }
        if (response.vaiTro === "HOC_VIEN") {
          navigate("/hocvien");
        } 
        if (response.vaiTro === "ADMIN") {
          navigate("/admin");
        }
      } else {
        setLoginError("Sai email hoặc mật khẩu.");
      }
    } catch (error) {
      console.error(error);
      setLoginError("Đã xảy ra lỗi khi đăng nhập.");
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
            <span className="active" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              Đăng nhập
            </span>
          </div>

          <button className="login-btn social google">
            <FontAwesomeIcon icon={faGoogle} style={{ color: "rgb(234, 67, 53)" }} />
            Login with Google
          </button>

          <button className="login-btn social facebook">
            <FontAwesomeIcon icon={faFacebook} size={20} style={{ color: "#6e65f1ff" }} />
            Login with Facebook
          </button>

          <div className="divider"><span>Or Email</span></div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <label>Email</label>
            <input
              type="email"
              {...register("email", { required: "Vui lòng nhập email" })}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}

            <label>Password</label>
            <input
              type="password"
              {...register("password", {
                required: "Vui lòng nhập mật khẩu",
                minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
              })}
              className={errors.password ? "error" : ""}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}

            {loginError && <span className="error">{loginError}</span>}

            <div className="forgot">
              <a href="#">Quên mật khẩu</a>
            </div>

            <button type="submit" className="login-btn submit">Đăng Nhập</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DangNhap;