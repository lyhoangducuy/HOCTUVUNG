import React, { useMemo, useState } from "react";

/* ==== Helpers đọc/ghi LS gọn ==== */
const docJSON = (k, fb = []) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; }
  catch { return fb; }
};
const ghiJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* Tách nhiều input: "a, b" hoặc xuống dòng */
const tachDanhSachMoi = (txt) =>
  (txt || "")
    .split(/[\n,]+/g)
    .map(s => s.trim())
    .filter(Boolean);

/* Tìm user theo email hoặc tenNguoiDung */
const timUserTheoToken = (token, ds) => {
  const t = token.toLowerCase();
  return ds.find(u =>
    u?.email?.toLowerCase() === t ||
    u?.tenNguoiDung?.toLowerCase() === t
  ) || null;
};

export default function moiThanhVien({ idKhoaHoc, onCapNhat }) {
  const [textMoi, setTextMoi] = useState("");
  const [thongBao, setThongBao] = useState("");

  // cache danh sách người dùng để tra cứu
  const dsNguoiDung = useMemo(() => docJSON("nguoiDung", []), []);

  const handleMoi = () => {
    setThongBao("");
    const tokens = tachDanhSachMoi(textMoi);
    if (tokens.length === 0) {
      setThongBao("Nhập email hoặc tên người dùng trước đã.");
      return;
    }

    // -> tìm id người dùng hợp lệ
    const idsMoi = tokens
      .map(t => timUserTheoToken(t, dsNguoiDung)?.idNguoiDung)
      .filter(Boolean);

    if (idsMoi.length === 0) {
      setThongBao("Không tìm thấy người dùng phù hợp.");
      return;
    }

    // -> cập nhật vào khóa học
    const dsKH = docJSON("khoaHoc", []);
    const i = dsKH.findIndex(kh => String(kh.idKhoaHoc) === String(idKhoaHoc));
    if (i === -1) {
      setThongBao("Không tìm thấy khóa học.");
      return;
    }

    const kh = { ...dsKH[i] };
    const cu = Array.isArray(kh.thanhVienIds) ? kh.thanhVienIds : [];
    const uniq = Array.from(new Set([...cu, ...idsMoi]));
    const soMoiThem = uniq.length - cu.length;

    kh.thanhVienIds = uniq;
    dsKH[i] = kh;
    ghiJSON("khoaHoc", dsKH);

    setTextMoi("");
    setThongBao(soMoiThem > 0 ? `Đã thêm ${soMoiThem} thành viên mới.` : "Tất cả đã có trong khóa học.");

    // báo ngược lên parent nếu cần
    onCapNhat?.(kh);
  };

  return (
    <div className="email-section" style={{ marginTop: 20 }}>
      <h3>Mời qua email / tên người dùng</h3>

      {/* Dùng textarea để hỗ trợ xuống dòng; giữ class .email-input để tận dụng CSS sẵn có */}
      <textarea
        className="email-input"
        rows={3}
        placeholder="Nhập email hoặc tên người dùng (ngăn cách bởi dấu phẩy hoặc xuống dòng)"
        value={textMoi}
        onChange={(e) => setTextMoi(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        <button className="copy-link-btn" onClick={handleMoi}>
          Mời
        </button>
      </div>

      {thongBao && (
        <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
          {thongBao}
        </div>
      )}
    </div>
  );
}
