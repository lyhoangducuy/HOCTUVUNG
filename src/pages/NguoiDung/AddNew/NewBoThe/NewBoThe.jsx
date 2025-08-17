import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewBoThe.css";

export default function NewBoThe() {
  const navigate = useNavigate();

  // ===== Lấy session + người dùng hiện tại =====
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("session") || "null"); }
    catch { return null; }
  }, []);

  const dsNguoiDung = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("nguoiDung") || "[]"); }
    catch { return []; }
  }, []);

  const nguoiDung = useMemo(() => {
    if (!session?.idNguoiDung) return null;
    return dsNguoiDung.find(u => u.idNguoiDung === session.idNguoiDung) || null;
  }, [dsNguoiDung, session]);

  // Nếu chưa đăng nhập / không tìm thấy user
  if (!session?.idNguoiDung || !nguoiDung) {
    return (
      <div className="sua-container">
        <div className="sua-card">
          <h2>Vui lòng đăng nhập</h2>
          <p style={{opacity:.75, margin:"6px 0 12px"}}>
            Không tìm thấy thông tin người dùng hiện tại.
          </p>
          <button className="btn primary" onClick={() => navigate("/")}>Đến trang đăng nhập</button>
        </div>
      </div>
    );
  }

  // ===== State form =====
  const [tenBoThe, setTenBoThe] = useState("");
  const [danhSachThe, setDanhSachThe] = useState([{ tu: "", nghia: "" }]);
  const [loi, setLoi] = useState("");

  // ===== Helpers =====
  const getNextId = () => {
    try {
      const list = JSON.parse(localStorage.getItem("boThe") || "[]");
      const ids = (Array.isArray(list) ? list : []).map(x => Number(x.idBoThe)).filter(Number.isFinite);
      if (ids.length === 0) return 1;
      return Math.max(...ids) + 1;
    } catch {
      return Date.now(); // fallback
    }
  };

  const themThe = () => setDanhSachThe(prev => [...prev, { tu: "", nghia: "" }]);
  const xoaThe = (i) => setDanhSachThe(prev => prev.filter((_, idx) => idx !== i));
  const doiNoiDungThe = (i, field, value) => {
    setDanhSachThe(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const luuBoThe = () => {
    setLoi("");

    const ten = tenBoThe.trim();
    if (!ten) {
      setLoi("Vui lòng nhập tên bộ thẻ.");
      return;
    }

    const dsHopLe = danhSachThe
      .map(t => ({ tu: t.tu.trim(), nghia: t.nghia.trim() }))
      .filter(t => t.tu && t.nghia);

    if (dsHopLe.length === 0) {
      setLoi("Bộ thẻ phải có ít nhất 1 thẻ hợp lệ (điền đủ 'từ' và 'nghĩa').");
      return;
    }

    try {
      const idBoThe = getNextId();
      const boTheMoi = {
        idBoThe,
        tenBoThe: ten,
        soTu: dsHopLe.length,
        nguoiDung: {
          idNguoiDung: nguoiDung.idNguoiDung,
          anhDaiDien: nguoiDung.anhDaiDien || "",
          tenNguoiDung: nguoiDung.tenNguoiDung || "",
        },
        danhSachThe: dsHopLe,
      };

      const current = JSON.parse(localStorage.getItem("boThe") || "[]");
      const list = Array.isArray(current) ? current : [];
      localStorage.setItem("boThe", JSON.stringify([...list, boTheMoi]));

      // Bắn event để các trang khác cập nhật ngay
      window.dispatchEvent(new Event("boTheUpdated"));

      alert("Đã tạo bộ thẻ mới!");
      navigate("/giangvien");
    } catch {
      setLoi("Có lỗi khi lưu dữ liệu.");
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
          <button className="btn primary" onClick={luuBoThe}>Lưu</button>
        </div>
      </div>
    </div>
  );
}
