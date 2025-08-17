import React, { useRef, useState } from "react";

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

  const moChonFile = () => inputRef.current?.click();

  const onChonFile = (e) => {
    setLoi("");
    const file = e.target.files?.[0];
    if (!file) return;

    // validate cơ bản
    const hopLeType = /^image\/(png|jpe?g|webp|gif)$/i.test(file.type);
    if (!hopLeType) return setLoi("Chỉ chấp nhận PNG, JPG, JPEG, WEBP, GIF.");

    const maxMb = 4; // giới hạn 4MB
    if (file.size > maxMb * 1024 * 1024)
      return setLoi(`Kích thước tối đa ${maxMb}MB.`);

    // đọc thành data URL để xem trước + lưu vào localStorage
    const reader = new FileReader();
    reader.onload = () => setXemTruoc(reader.result?.toString() || "");
    reader.readAsDataURL(file);
  };

  const luuAnh = () => {
    if (!xemTruoc) return;
    onLuu?.(xemTruoc);
    setXemTruoc("");
  };

  const huy = () => {
    setXemTruoc("");
    setLoi("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const srcHienThi = xemTruoc || giaTri || "";

  return (
    <div className="chon-anh">
      <div className="avatars">
        {srcHienThi ? (
          <img src={srcHienThi} alt="avatar" />
        ) : (
          <div className="avatar-placeholder" />
        )}
      </div>

      <div className="nhom-nut">
        <button type="button" className="change-avatars" onClick={moChonFile}>
          Đổi ảnh
        </button>

        {xemTruoc && (
          <>
            <button type="button" className="btn btn-primary" onClick={luuAnh}>
              Lưu ảnh
            </button>
            <button type="button" className="btn" onClick={huy}>
              Huỷ
            </button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onChonFile}
        />
      </div>

      {loi && <small className="canh-bao">{loi}</small>}
    </div>
  );
}
