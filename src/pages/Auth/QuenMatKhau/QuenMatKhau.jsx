import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./QuenMatKhau.css";

import {
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../../../../lib/firebase";

/**
 * Flow mới (theo chuẩn Firebase):
 * - Nếu KHÔNG có oobCode trên URL: hiển thị form nhập EMAIL -> gửi email đặt lại mật khẩu.
 * - Nếu CÓ oobCode & mode=resetPassword: hiển thị form nhập mật khẩu mới -> xác nhận đặt lại.
 */

const schemaEmail = yup.object({
  email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
});

const schemaReset = yup.object({
  matkhau: yup.string().min(6, "Mật khẩu tối thiểu 6 ký tự").required("Vui lòng nhập mật khẩu mới"),
  xacNhanMatKhau: yup
    .string()
    .oneOf([yup.ref("matkhau")], "Mật khẩu xác nhận không khớp")
    .required("Vui lòng xác nhận mật khẩu"),
});

export default function QuenMatKhau() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Nếu URL có oobCode & mode=resetPassword thì đang ở bước xác nhận mật khẩu mới
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const isResetStep = mode === "resetPassword" && !!oobCode;

  const [checkingLink, setCheckingLink] = useState(isResetStep); // verify link state
  const [linkError, setLinkError] = useState("");
  const [error, setError] = useState("");
  const [successSent, setSuccessSent] = useState(false); // đã gửi email đặt lại
  const [successReset, setSuccessReset] = useState(false); // đã đặt lại mật khẩu xong

  // Chọn schema theo bước
  const resolver = useMemo(
    () => yupResolver(isResetStep ? schemaReset : schemaEmail),
    [isResetStep]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver });

  // Nếu đang ở bước 2 (có oobCode), xác minh mã trước khi cho người dùng đặt mật khẩu
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isResetStep) return;
      try {
        await verifyPasswordResetCode(auth, oobCode);
        if (mounted) {
          setCheckingLink(false);
          setLinkError("");
        }
      } catch (e) {
        if (mounted) {
          setCheckingLink(false);
          setLinkError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
      }
    })();
    return () => (mounted = false);
  }, [isResetStep, oobCode]);

  const onSubmit = async (form) => {
    setError("");

    try {
      if (!isResetStep) {
        // Bước 1: gửi email đặt lại mật khẩu
        await sendPasswordResetEmail(auth, form.email.trim());
        setSuccessSent(true);
        return;
      }

      // Bước 2: xác nhận mật khẩu mới
      await confirmPasswordReset(auth, oobCode, form.matkhau);
      setSuccessReset(true);
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  };

  // ===== Render Success: Bước 1 đã gửi email =====
  if (successSent && !isResetStep) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-left">
            <img src="/src/assets/image/logo.jpg" alt="imgloginform" />
          </div>
          <div className="login-right">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Đã gửi email đặt lại mật khẩu!</h2>
              <p>Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn trong email.</p>
              <button onClick={() => navigate("/dang-nhap")} className="login-btn submit">
                Về trang đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Render Success: Bước 2 đã đặt lại xong =====
  if (successReset && isResetStep) {
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
              <p>Bây giờ bạn có thể đăng nhập với mật khẩu mới.</p>
              <button onClick={() => navigate("/dang-nhap")} className="login-btn submit">
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Render form Bước 2: Có oobCode nhưng link lỗi =====
  if (isResetStep && linkError) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-left">
            <img src="/src/assets/image/logo.jpg" alt="imgloginform" />
          </div>
          <div className="login-right">
            <div className="error-message">
              <h2>Liên kết không hợp lệ</h2>
              <p>{linkError}</p>
              <button onClick={() => navigate("/quen-mat-khau")} className="login-btn submit">
                Gửi lại email đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Render form =====
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
            <span onClick={() => navigate("/dang-nhap")} style={{ cursor: "pointer" }}>
              Đăng nhập
            </span>
            <span className="active">Quên mật khẩu</span>
          </div>

          <div className="forgot-password-info">
            <h2>{isResetStep ? "Nhập mật khẩu mới" : "Quên mật khẩu?"}</h2>
            <p>
              {isResetStep
                ? "Vui lòng nhập mật khẩu mới cho tài khoản của bạn."
                : "Nhập địa chỉ email để nhận liên kết đặt lại mật khẩu."}
            </p>
          </div>

          {/* Bước 2: đang kiểm tra link? */}
          {isResetStep && checkingLink ? (
            <div style={{ padding: 12 }}>Đang kiểm tra liên kết…</div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="login-form">
              {/* Bước 1: form nhập email */}
              {!isResetStep && (
                <>
                  <label>Email</label>
                  <input
                    type="text"
                    {...register("email")}
                    className={errors.email ? "error" : ""}
                    placeholder="Nhập email của bạn"
                  />
                  {errors.email && <span className="error">{errors.email.message}</span>}
                </>
              )}

              {/* Bước 2: form nhập mật khẩu mới */}
              {isResetStep && (
                <>
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
                  {errors.xacNhanMatKhau && (
                    <span className="error">{errors.xacNhanMatKhau.message}</span>
                  )}
                </>
              )}

              {error && <span className="error">{error}</span>}

              <button type="submit" className="login-btn submit">
                {isResetStep ? "Đặt lại mật khẩu" : "Gửi email đặt lại"}
              </button>
            </form>
          )}

          {!isResetStep && (
            <div className="back-to-login">
              <a onClick={() => navigate("/dang-nhap")} style={{ cursor: "pointer" }}>
                ← Quay lại đăng nhập
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
