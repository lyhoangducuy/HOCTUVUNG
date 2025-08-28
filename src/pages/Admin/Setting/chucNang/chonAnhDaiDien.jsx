import React, { useRef, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCamera, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
/**
 * Chọn ảnh đại diện từ máy, xem trước rồi Lưu/Huỷ.
 * Props:
 *  - giaTri: string | ""   (url hiện tại / dataURL)
 *  - onLuu: (url:string) => void  (callback lưu ảnh)
 */
export default function chonAnhDaiDien({ giaTri = "", onLuu }) {
  const inputRef = useRef(null);
  const [xemTruoc, setXemTruoc] = useState("");
  const [loi, setLoi] = useState("");
  const [chonFile, setChonFile] = useState(null); 
  const [dangTaiLen, setDangTaiLen] = useState(false);
  const moChonFile = () => inputRef.current?.click();
  const [uploadProgress, setUploadProgress] = useState(0);
 
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const onChonFile = (e) => {
    setLoi("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate (giữ nguyên logic của bạn)
    const hopLeType = /^image\/(png|jpe?g|webp|jpg)$/i.test(file.type);
    if (!hopLeType) return setLoi("Chỉ chấp nhận file PNG, JPG, WEBP.");

    const maxMb = 4;
    if (file.size > maxMb * 1024 * 1024)
      return setLoi(`Kích thước tối đa ${maxMb}MB.`);

    // Lưu file vào state và tạo URL tạm thời để xem trước
    setChonFile(file);
    setXemTruoc(URL.createObjectURL(file)); 
  };

  const luuAnh = async () => {
    if (!chonFile) return;

    setDangTaiLen(true);
    setLoi("");

    // 1. Chuẩn bị dữ liệu để gửi lên Cloudinary
    const formData = new FormData();
    formData.append("file", chonFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      // 2. Gửi request POST đến API của Cloudinary
      const response = await axios.post(CLOUDINARY_API_URL, formData, {
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });
      
      // 3. Upload thành công, lấy URL an toàn (secure_url)
      const cloudinaryUrl = response.data.secure_url;
      
      // 4. Gọi callback onLuu với URL mới
      onLuu?.(cloudinaryUrl);
      
      // 5. Reset component về trạng thái ban đầu
      huy();

    } catch (err) {
      console.error("Lỗi khi upload ảnh:", err);
      setLoi("Upload thất bại. Vui lòng thử lại.");
    } finally {
      setDangTaiLen(false);
    }
  };

  const huy = () => {
    setXemTruoc("");
    setLoi("");
    if (inputRef.current) inputRef.current.value = "";
  };

  // Ưu tiên hiển thị ảnh xem trước, nếu không có thì hiển thị ảnh hiện tại
  const srcHienThi = xemTruoc || giaTri || "";

  return (
    <div className="chon-anh">
      <div className="avatar-wrapper">
        {srcHienThi ? (
          <img src={srcHienThi} alt="Ảnh đại diện" className="avatar-preview" style={{ width: "120px", height: "120px",borderRadius:"50%",objectFit:"cover" }}/>
        ) : (
          <div className="avatar-placeholder">
            <FontAwesomeIcon icon={faCamera} />
          </div>
        )}
        <button type="button" className="change-avatar-btn" onClick={moChonFile} disabled={dangTaiLen}>
          <FontAwesomeIcon icon={faCamera} />
        </button>
        <input
          type="file"
          ref={inputRef}
          onChange={onChonFile}
          accept="image/jpeg, image/png, image/webp, image/jpg"
          style={{ display: "none" }}
        />
      </div>

      {loi && <p className="error-message">{loi}</p>}

      {xemTruoc && (
        <div className="action-buttons">
          <button type="button" className="btn btn-save" onClick={luuAnh} disabled={dangTaiLen}>
            {dangTaiLen ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faSave} />
            )}
            <span>{dangTaiLen ? "Đang tải..." : "Lưu ảnh"}</span>
          </button>
          <button type="button" className="btn btn-cancel" onClick={huy} disabled={dangTaiLen}>
            <FontAwesomeIcon icon={faTimes} />
            <span>Hủy</span>
          </button>
        </div>
      )}
    </div>
  );
}
