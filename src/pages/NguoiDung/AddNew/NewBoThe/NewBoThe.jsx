// src/pages/.../NewBoThe.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewBoThe.css";

import { auth, db } from "../../../../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function NewBoThe() {
  const điềuHướng = useNavigate();

  const [tênBộThẻ, đặtTênBộThẻ] = useState("");
  const [danhSáchThẻ, đặtDanhSáchThẻ] = useState([{ tu: "", nghia: "" }]);
  const [chếĐộ, đặtChếĐộ] = useState("ca_nhan"); // cong_khai | ca_nhan
  const [lỗi, đặtLỗi] = useState("");
  const [đangLưu, đặtĐangLưu] = useState(false);

  const idNgẫuNhiên = useMemo(() => Math.floor(Math.random() * 1_000_000), []);

  const thêmThẻ = () =>
    đặtDanhSáchThẻ((trước) => [...trước, { tu: "", nghia: "" }]);

  const xoáThẻ = (i) =>
    đặtDanhSáchThẻ((trước) => trước.filter((_, idx) => idx !== i));

  const đổiNộiDungThẻ = (i, trường, giáTrị) => {
    đặtDanhSáchThẻ((trước) => {
      const sau = [...trước];
      sau[i] = { ...sau[i], [trường]: giáTrị };
      return sau;
    });
  };

  const lưuBộThẻ = async () => {
    đặtLỗi("");

    const tên = String(tênBộThẻ || "").trim();
    if (!tên) return đặtLỗi("Vui lòng nhập tên bộ thẻ.");

    const danhSáchHợpLệ = danhSáchThẻ
      .map((t) => ({ tu: String(t.tu || "").trim(), nghia: String(t.nghia || "").trim() }))
      .filter((t) => t.tu && t.nghia);

    if (danhSáchHợpLệ.length === 0)
      return đặtLỗi("Bộ thẻ phải có ít nhất 1 thẻ hợp lệ (điền đủ 'từ' và 'nghĩa').");

    const uid =
      auth.currentUser?.uid ||
      JSON.parse(sessionStorage.getItem("session") || "null")?.idNguoiDung;

    if (!uid) {
      đặtLỗi("Bạn cần đăng nhập để tạo bộ thẻ.");
      điềuHướng("/dang-nhap");
      return;
    }

    try {
      đặtĐangLưu(true);

      const idBộThẻ = idNgẫuNhiên;
      const thờiĐiểm = serverTimestamp();

      const bộThẻMới = {
        idBoThe: idBộThẻ,
        tenBoThe: tên,
        soTu: danhSáchHợpLệ.length,
        idNguoiDung: String(uid),
        danhSachThe: danhSáchHợpLệ,
        luotHoc: 0,
        cheDo: chếĐộ,
        // === THÊM 2 TRƯỜNG TIẾNG VIỆT ===
        ngayTao: thờiĐiểm,
        ngayChinhSua: thờiĐiểm,
      };

      await setDoc(doc(db, "boThe", String(idBộThẻ)), bộThẻMới, { merge: true });

      window.dispatchEvent(new Event("boTheUpdated"));
      alert("Đã tạo bộ thẻ mới!");
      điềuHướng("/trangchu");
    } catch (e) {
      console.error(e);
      đặtLỗi("Có lỗi khi lưu dữ liệu.");
    } finally {
      đặtĐangLưu(false);
    }
  };

  return (
    <div className="sua-container">
      <div className="sua-card">
        <div className="sua-header">
          <h2>Tạo bộ thẻ mới</h2>
        </div>

        {lỗi && <div className="alert">{lỗi}</div>}

        <div className="form-group">
          <label>Tên bộ thẻ</label>
          <input
            type="text"
            value={tênBộThẻ}
            onChange={(e) => đặtTênBộThẻ(e.target.value)}
            placeholder="VD: Từ vựng buổi 1"
          />
        </div>

        {/* Chế độ hiển thị */}
        <div className="form-group">
          <label>Chế độ</label>
          <select value={chếĐộ} onChange={(e) => đặtChếĐộ(e.target.value)}>
            <option value="cong_khai">Công khai — ai cũng tìm & học được</option>
            <option value="ca_nhan">Cá nhân — chỉ mình tôi thấy</option>
          </select>
          <div className="hint">
            Chọn <b>Công khai</b> để mọi người có thể tìm thấy bộ thẻ của bạn trong kết quả tìm kiếm.
          </div>
        </div>

        <div className="divider" />

        <div className="the-list">
          <div className="the-list-header">
            <h3>Danh sách thẻ ({danhSáchThẻ.length})</h3>
            <button className="btn" onClick={thêmThẻ}>+ Thêm thẻ</button>
          </div>

          {danhSáchThẻ.length === 0 && (
            <div className="empty">Chưa có thẻ nào. Nhấn “+ Thêm thẻ”.</div>
          )}

          {danhSáchThẻ.map((item, idx) => (
            <div className="the-item" key={idx}>
              <div className="the-row">
                <div className="col">
                  <label>Từ</label>
                  <input
                    type="text"
                    value={item.tu}
                    onChange={(e) => đổiNộiDungThẻ(idx, "tu", e.target.value)}
                    placeholder="Ví dụ: apple"
                  />
                </div>
                <div className="col">
                  <label>Nghĩa</label>
                  <input
                    type="text"
                    value={item.nghia}
                    onChange={(e) => đổiNộiDungThẻ(idx, "nghia", e.target.value)}
                    placeholder="Ví dụ: quả táo"
                  />
                </div>
              </div>

              <div className="the-actions">
                <button className="btn danger ghost" onClick={() => xoáThẻ(idx)}>
                  Xoá thẻ
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="footer-actions">
          <button className="btn ghost" onClick={() => điềuHướng(-1)}>Hủy</button>
          <button className="btn primary" onClick={lưuBộThẻ} disabled={đangLưu}>
            {đangLưu ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
