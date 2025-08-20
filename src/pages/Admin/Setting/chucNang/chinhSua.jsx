import React, { useState } from "react";

export default function chinhSua({
  nhan,
  loai = "text",
  giaTriBanDau,
  hienThiGiaTri,     // nếu muốn hiển thị khác với giá trị thật (VD: ********)
  goiY,
  laMatKhau = false,
  onLuu,
  xacThuc = () => true,
}) {
  const [dangSua, setDangSua] = useState(false);
  const [giaTri, setGiaTri] = useState(giaTriBanDau ?? "");
  const [loi, setLoi] = useState("");

  const batDauSua = () => {
    setGiaTri(laMatKhau ? "" : (giaTriBanDau ?? ""));
    setLoi("");
    setDangSua(true);
  };

  const huy = () => {
    setGiaTri(giaTriBanDau ?? "");
    setLoi("");
    setDangSua(false);
  };

  const luu = () => {
    const kq = xacThuc(giaTri);
    if (kq !== true) {
      setLoi(kq || "Giá trị không hợp lệ");
      return;
    }
    onLuu(giaTri);
    setDangSua(false);
  };

  return (
    <div className="info-item">
      <div className="info-account">
        <div className="info-label">{nhan} :</div>

        {!dangSua ? (
          <div className="info-value">
            {hienThiGiaTri !== undefined ? hienThiGiaTri : (giaTriBanDau ?? "—")}
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            <input
              className="input"
              type={loai}
              placeholder={goiY}
              value={giaTri}
              onChange={(e) => setGiaTri(e.target.value)}
            />
            {loi && <div style={{ color: "#dc3545", fontSize: 12, marginTop: 6 }}>{loi}</div>}
          </div>
        )}
      </div>

      <div className="info-action" style={{ display: "flex", gap: 8 }}>
        {!dangSua ? (
          <button className="btn" onClick={batDauSua}>Sửa</button>
        ) : (
          <>
            <button className="btn" onClick={huy}>Hủy</button>
            <button className="btn btn-primary" onClick={luu}>Lưu</button>
          </>
        )}
      </div>
    </div>
  );
}
