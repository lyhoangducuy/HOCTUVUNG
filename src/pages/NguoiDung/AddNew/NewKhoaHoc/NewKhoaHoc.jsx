import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Newclass.css";

import { auth, db } from "../../../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

function Newclass() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // tách danh sách "kienThuc" từ input (phân tách bởi dấu phẩy hoặc xuống dòng)
  const parseTags = (txt) =>
    (txt || "")
      .split(/[\n,]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

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
      };

      // Firestore: collection "khoaHoc"
      await setDoc(doc(db, "khoaHoc", String(idKhoaHoc)), newCourse);

      // điều hướng trang chi tiết
      navigate("/khoaHoc/" + idKhoaHoc);
    } catch (e) {
      console.error(e);
      alert("Không thể tạo khóa học. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(Object.fromEntries(new FormData(e.target))); }}>
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

      <div className="button-group">
        <button
          type="button"
          className="btn-close"
          onClick={() => navigate("/trangchu")}
        >
          Đóng
        </button>
        <button className="btn-submit" type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Xác Nhận"}
        </button>
      </div>
    </form>
  );
}

export default Newclass;
