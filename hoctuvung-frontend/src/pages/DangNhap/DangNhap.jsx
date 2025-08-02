import { useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faGoogle } from "@fortawesome/free-brands-svg-icons";
import "./DangNhap.css";

function DangNhap() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <img src="/src/image/formimg.png" alt="imgloginform" />
        </div>
        <div className="login-right">
          <div className="login-tabs">
            <span>Sign Up</span>
            <span className="active">Login</span>
          </div>
          <button className="login-btn social facebook">
            <FontAwesomeIcon
              icon={faFacebook}
              size={20}
              style={{ color: "#EA4335" }}
            />{" "}
            Login with Facebook
          </button>
          <button className="login-btn social google">
            <FontAwesomeIcon icon={faGoogle} style={{ color: "#1877F2" }} />{" "}
            Login with Google
          </button>

          <div class="divider">
            <span>Or Email</span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <label>Email</label>
            <input
              type="email"
              {...register("email", { required: "Vui lòng nhập email" })}
            />
            {errors.email && (
              <span className="error">{errors.email.message}</span>
            )}
            <label>Password</label>
            <input
              type="password"
              {...register("password", {
                required: "Vui lòng nhập mật khẩu",
                minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
              })}
            />
            {errors.password && (
              <span className="error">{errors.password.message}</span>
            )}
            <div className="forgot">
              <a href="/">Quên mật khẩu</a>
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

export default DangNhap;
