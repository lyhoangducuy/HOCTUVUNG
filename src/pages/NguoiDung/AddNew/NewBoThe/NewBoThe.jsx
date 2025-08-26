import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewBoThe.css";

import { auth, db } from "../../../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function NewBoThe() {
  const navigate = useNavigate();

  const [tenBoThe, setTenBoThe] = useState("");
  const [danhSachThe, setDanhSachThe] = useState([{ tu: "", nghia: "" }]);
  const [loi, setLoi] = useState("");
  const [saving, setSaving] = useState(false);

  const idNgauNhien = useMemo(() => Math.floor(Math.random() * 1_000_000), []);
  const themThe = () => setDanhSachThe((prev) => [...prev, { tu: "", nghia: "" }]);
  const xoaThe = (i) => setDanhSachThe((prev) => prev.filter((_, idx) => idx !== i));
  const doiNoiDungThe = (i, field, value) => {
    setDanhSachThe((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const luuBoThe = async () => {
    setLoi("");

    const ten = tenBoThe.trim();
    if (!ten) return setLoi("Vui lòng nhập tên bộ thẻ.");

    const dsHopLe = danhSachThe
      .map((t) => ({ tu: t.tu.trim(), nghia: t.nghia.trim() }))
      .filter((t) => t.tu && t.nghia);

    if (dsHopLe.length === 0)
      return setLoi("Bộ thẻ phải có ít nhất 1 thẻ hợp lệ (điền đủ 'từ' và 'nghĩa').");

    const uid =
      auth.currentUser?.uid ||
      JSON.parse(sessionStorage.getItem("session") || "null")?.idNguoiDung;
    if (!uid) {
      setLoi("Bạn cần đăng nhập để tạo bộ thẻ.");
      navigate("/dang-nhap");
      return;
    }

    try {
      setSaving(true);

      const idBoThe = idNgauNhien;
      const boTheMoi = {
        idBoThe,
        tenBoThe: ten,
        soTu: dsHopLe.length,
        idNguoiDung: String(uid),
        danhSachThe: dsHopLe,
        // ⬅️ không có createdAt
      };

      await setDoc(doc(db, "boThe", String(idBoThe)), boTheMoi, { merge: true });

      window.dispatchEvent(new Event("boTheUpdated"));
      alert("Đã tạo bộ thẻ mới!");
      navigate("/trangchu");
    } catch (e) {
      console.error(e);
      setLoi("Có lỗi khi lưu dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sua-container">
      <div className="sua-card">
        <div className="sua-header">
          <h2>Tạo bộ thẻ mới</h2>
        </div>

        {loi && <div className="alert">{loi}</div>}

        <div className="form-group">
          <label>Tên bộ thẻ</label>
          <input
            type="text"
            value={tenBoThe}
            onChange={(e) => setTenBoThe(e.target.value)}
            placeholder="VD: Từ vựng buổi 1"
          />
        </div>

        <div className="divider" />

        <div className="the-list">
          <div className="the-list-header">
            <h3>Danh sách thẻ ({danhSachThe.length})</h3>
            <button className="btn" onClick={themThe}>+ Thêm thẻ</button>
          </div>

          {danhSachThe.length === 0 && (
            <div className="empty">Chưa có thẻ nào. Nhấn “+ Thêm thẻ”.</div>
          )}

          {danhSachThe.map((item, idx) => (
            <div className="the-item" key={idx}>
              <div className="the-row">
                <div className="col">
                  <label>Từ</label>
                  <input
                    type="text"
                    value={item.tu}
                    onChange={(e) => doiNoiDungThe(idx, "tu", e.target.value)}
                    placeholder="Ví dụ: apple"
                  />
                </div>
                <div className="col">
                  <label>Nghĩa</label>
                  <input
                    type="text"
                    value={item.nghia}
                    onChange={(e) => doiNoiDungThe(idx, "nghia", e.target.value)}
                    placeholder="Ví dụ: quả táo"
                  />
                </div>
              </div>

              <div className="the-actions">
                <button className="btn danger ghost" onClick={() => xoaThe(idx)}>
                  Xoá thẻ
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="footer-actions">
          <button className="btn ghost" onClick={() => navigate(-1)}>Hủy</button>
          <button className="btn primary" onClick={luuBoThe} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
