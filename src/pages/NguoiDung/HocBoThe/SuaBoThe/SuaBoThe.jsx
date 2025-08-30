import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./SuaBoThe.css";

import { auth, db } from "../../../../../lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

export default function SuaBoThe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dangTai, setDangTai] = useState(true);
  const [boThe, setBoThe] = useState(null);
  const [tenBoThe, setTenBoThe] = useState("");
  const [danhSachThe, setDanhSachThe] = useState([]);
  const [loi, setLoi] = useState("");
  const [saving, setSaving] = useState(false);

  // Nạp bộ thẻ theo id từ Firestore
  useEffect(() => {
    if (!id) return;
    setDangTai(true);
    const ref = doc(db, "boThe", String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setBoThe(null);
          setDangTai(false);
          return;
        }
        const data = snap.data();
        setBoThe(data || null);
        setTenBoThe(data?.tenBoThe || "");
        setDanhSachThe(
          Array.isArray(data?.danhSachThe)
            ? data.danhSachThe.map((t) => ({ tu: t.tu || "", nghia: t.nghia || "" }))
            : []
        );
        setDangTai(false);
      },
      () => {
        setBoThe(null);
        setDangTai(false);
      }
    );
    return () => unsub();
  }, [id]);

  const themThe = () => setDanhSachThe((prev) => [...prev, { tu: "", nghia: "" }]);
  const xoaThe = (index) => setDanhSachThe((prev) => prev.filter((_, i) => i !== index));
  const doiNoiDungThe = (index, truong, value) =>
    setDanhSachThe((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [truong]: value };
      return next;
    });

  const luuBoThe = async () => {
    setLoi("");

    const ten = tenBoThe.trim();
    if (!ten) {
      setLoi("Vui lòng nhập tên bộ thẻ.");
      return;
    }

    // Lọc thẻ hợp lệ
    const dsHopLe = danhSachThe
      .map((t) => ({ tu: t.tu.trim(), nghia: t.nghia.trim() }))
      .filter((t) => t.tu && t.nghia);

    if (dsHopLe.length === 0) {
      setLoi("Bộ thẻ phải có ít nhất 1 thẻ hợp lệ (đủ 'từ' và 'nghĩa').");
      return;
    }

    if (!boThe) {
      setLoi("Không tìm thấy bộ thẻ để cập nhật.");
      return;
    }

    // Quyền sửa: phải là chủ sở hữu
    const uid =
      auth.currentUser?.uid ||
      JSON.parse(sessionStorage.getItem("session") || "null")?.idNguoiDung;
    if (!uid || String(uid) !== String(boThe.idNguoiDung)) {
      setLoi("Bạn không có quyền sửa bộ thẻ này.");
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "boThe", String(boThe.idBoThe)), {
        tenBoThe: ten,
        danhSachThe: dsHopLe,
        soTu: dsHopLe.length,
      });

      // Giữ event cũ nếu nơi khác còn lắng nghe
      window.dispatchEvent(new Event("boTheUpdated"));

      alert("Đã lưu bộ thẻ!");
      navigate(`/flashcard/${boThe.idBoThe}`);
    } catch (e) {
      console.error(e);
      setLoi("Có lỗi khi lưu dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  if (dangTai) {
    return <div className="sua-container">Đang tải…</div>;
  }

  if (!boThe) {
    return (
      <div className="sua-container">
        <div className="sua-card">
          <h2>Không tìm thấy bộ thẻ</h2>
          <button className="btn" onClick={() => navigate("/giangvien")}>
            Về trang giảng viên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sua-container">
      <div className="sua-card">
        <div className="sua-header">
          <h2>Sửa bộ thẻ</h2>
          <div className="sua-actions">
            <button className="btn ghost" onClick={() => navigate(-1)}>Hủy</button>
            <button className="btn primary" onClick={luuBoThe} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>

        {loi && <div className="alert">{loi}</div>}

        <div className="form-group">
          <label>Tên bộ thẻ</label>
          <input
            type="text"
            value={tenBoThe}
            onChange={(e) => setTenBoThe(e.target.value)}
            placeholder="Nhập tên bộ thẻ"
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

          {danhSachThe.map((item, index) => (
            <div className="the-item" key={index}>
              <div className="the-row">
                <div className="col">
                  <label>Từ</label>
                  <input
                    type="text"
                    value={item.tu}
                    onChange={(e) => doiNoiDungThe(index, "tu", e.target.value)}
                    placeholder="Ví dụ: apple"
                  />
                </div>
                <div className="col">
                  <label>Nghĩa</label>
                  <input
                    type="text"
                    value={item.nghia}
                    onChange={(e) => doiNoiDungThe(index, "nghia", e.target.value)}
                    placeholder="Ví dụ: quả táo"
                  />
                </div>
              </div>
              <div className="the-actions">
                <button className="btn danger ghost" onClick={() => xoaThe(index)}>
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
