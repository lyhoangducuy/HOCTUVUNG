import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Newclass.css";

import { auth, db } from "../../../../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";


function Newclass() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // preview giá
  const [giaStr, setGiaStr] = useState("");
  const [giamStr, setGiamStr] = useState("");

  // tách danh sách "kienThuc" từ input (phân tách bởi dấu phẩy hoặc xuống dòng)
  const parseTags = (txt) =>
    (txt || "")
      .split(/[\n,]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

  // helpers số
  const toNumber = (v) => {
    const n = Number(String(v ?? "").replaceAll(",", ""));
    return Number.isFinite(n) ? n : 0;
  };
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const calcGiaSauGiam = () => {
    const gia = toNumber(giaStr);
    const giam = clamp(toNumber(giamStr), 0, 100);
    const after = Math.round(gia * (1 - giam / 100));
    return isNaN(after) ? 0 : after;
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      const session = JSON.parse(sessionStorage.getItem("session") || "null");
      const uid = auth.currentUser?.uid || session?.idNguoiDung;
      if (!uid) {
        alert("Bạn cần đăng nhập để tạo khóa học.");
        navigate("/dang-nhap");
        return;
      }

      // chuẩn hóa số
      const giaKhoaHoc = Math.max(0, toNumber(data.giaKhoaHoc));
      const giamGia = clamp(toNumber(data.giamGia), 0, 100);
      const giaSauGiam = Math.round(giaKhoaHoc * (1 - giamGia / 100));

      const idKhoaHoc = Date.now(); // id đơn giản, duy nhất theo thời gian
      const newCourse = {
        idKhoaHoc,
        idNguoiDung: String(uid),
        tenKhoaHoc: data.tenKhoaHoc,
        moTa: data.moTa || "",
        kienThuc: parseTags(data.kienThuc),
        boTheIds: [],
        folderIds: [],
        thanhVienIds: [],
        giaKhoaHoc,
        giamGia,
        giaSauGiam,
        ngayTao: serverTimestamp(), // <- chỉ cần ngày tạo
      };


      // Firestore: collection "khoaHoc"
      await setDoc(doc(db, "khoaHoc", String(idKhoaHoc)), newCourse);

      navigate("/khoaHoc/" + idKhoaHoc);
    } catch (e) {
      console.error(e);
      alert("Không thể tạo khóa học. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Object.fromEntries(new FormData(e.target)));
      }}
    >
      <h2 className="tittle">Nhập thông tin khóa học</h2>

      <label>Tên khóa học</label>
      <input name="tenKhoaHoc" required placeholder="VD: JLPT N5 - Ngữ pháp" />

      <label>Kỹ năng/Chủ đề (kiến thức)</label>
      <textarea
        name="kienThuc"
        rows={3}
        placeholder="Ví dụ: IT, tiếng Nhật, tiếng Anh..."
      />

      <label>Mô tả</label>
      <input name="moTa" placeholder="Mô tả ngắn..." />

      {/* ====== Giá & Giảm giá ====== */}
      <div className="price-grid">
        <div>
          <label>Giá khóa học (VND)</label>
          <input
            name="giaKhoaHoc"
            type="number"
            min="0"
            step="1000"
            placeholder="Ví dụ: 199000"
            value={giaStr}
            onChange={(e) => setGiaStr(e.target.value)}
          />
        </div>

        <div>
          <label>Giảm giá (%)</label>
          <input
            name="giamGia"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="0 - 100"
            value={giamStr}
            onChange={(e) => setGiamStr(e.target.value)}
          />
        </div>
      </div>

      <div className="hint">
        Giá sau giảm:{" "}
        <strong>
          {calcGiaSauGiam().toLocaleString("vi-VN")}đ
        </strong>
      </div>

      <div className="button-group">
        <button
          type="button"
          className="btn-close"
          onClick={() => navigate("/trangchu")}
        >
          Hủy
        </button>
        <button className="btn-submit" type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Xác Nhận"}
        </button>
      </div>
    </form>
  );
}

export default Newclass;
