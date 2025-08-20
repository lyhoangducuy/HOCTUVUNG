import { useEffect, useState } from "react";

// Helpers
const genPackId = () => "GOI_" + Date.now();
const toNumber = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export default function QuanLyGoiTraPhi() {
  const [packs, setPacks] = useState([]);
  const [form, setForm] = useState({
    idGoi: "",        // tự tạo khi thêm
    tenGoi: "",
    moTa: "",
    giaGoi: "",
    thoiHan: "",
    giamGia: "",      // phần trăm 0..100
  });
  const [isEdit, setIsEdit] = useState(false);

  // Load
  const reload = () => {
    const raw = JSON.parse(localStorage.getItem("goiTraPhi") || "[]");
    setPacks(Array.isArray(raw) ? raw : []);
  };
  useEffect(() => { reload(); }, []);

  // Reset form
  const resetForm = () => {
    setForm({ idGoi: "", tenGoi: "", moTa: "", giaGoi: "", thoiHan: "", giamGia: "" });
    setIsEdit(false);
  };

  // Validate nhẹ nhàng
  const validate = () => {
    if (!form.tenGoi.trim()) return alert("Vui lòng nhập tên gói");
    if (!String(form.giaGoi).trim()) return alert("Vui lòng nhập giá");
    if (!String(form.thoiHan).trim()) return alert("Vui lòng nhập thời hạn (ngày)");
    const gg = toNumber(form.giamGia, 0);
    if (gg < 0 || gg > 100) return alert("Giảm giá phải nằm trong 0 - 100%");
    return true;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const newPack = {
      idGoi: genPackId(),
      tenGoi: form.tenGoi.trim(),
      moTa: form.moTa.trim(),
      giaGoi: toNumber(form.giaGoi, 0),
      thoiHan: toNumber(form.thoiHan, 0),
      giamGia: toNumber(form.giamGia, 0),
    };
    const next = [...packs, newPack];
    localStorage.setItem("goiTraPhi", JSON.stringify(next));
    reload();
    resetForm();
  };

  const handleEditPick = (p) => {
    setIsEdit(true);
    setForm({
      idGoi: p.idGoi,
      tenGoi: p.tenGoi,
      moTa: p.moTa || "",
      giaGoi: String(p.giaGoi ?? ""),
      thoiHan: String(p.thoiHan ?? ""),
      giamGia: String(p.giamGia ?? 0),
    });
  };

  const handleSaveEdit = () => {
    if (!validate()) return;
    const next = packs.map((p) =>
      p.idGoi === form.idGoi
        ? {
            ...p,
            tenGoi: form.tenGoi.trim(),
            moTa: form.moTa.trim(),
            giaGoi: toNumber(form.giaGoi, 0),
            thoiHan: toNumber(form.thoiHan, 0),
            giamGia: toNumber(form.giamGia, 0),
          }
        : p
    );
    localStorage.setItem("goiTraPhi", JSON.stringify(next));
    reload();
    resetForm();
  };

  const handleDelete = (idGoi) => {
    if (!window.confirm("Xoá gói này?")) return;
    const next = packs.filter((p) => p.idGoi !== idGoi);
    localStorage.setItem("goiTraPhi", JSON.stringify(next));
    reload();
    // nếu đang sửa gói vừa xoá, reset form
    if (form.idGoi === idGoi) resetForm();
  };

  const giaSauGiam = (p) => {
    const g = toNumber(p.giaGoi, 0);
    const gg = toNumber(p.giamGia, 0);
    return Math.max(0, Math.round(g * (1 - gg / 100)));
  };

  return (
    <div>
      {/* Form thêm/sửa */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label>Tên gói</label>
          <input
            value={form.tenGoi}
            onChange={(e) => setForm((s) => ({ ...s, tenGoi: e.target.value }))}
            placeholder="VD: 1 tháng, 1 năm…"
          />
        </div>
        <div>
          <label>Giá (VNĐ)</label>
          <input
            type="number"
            value={form.giaGoi}
            onChange={(e) => setForm((s) => ({ ...s, giaGoi: e.target.value }))}
            placeholder="VD: 120000"
          />
        </div>
        <div>
          <label>Thời hạn (ngày)</label>
          <input
            type="number"
            value={form.thoiHan}
            onChange={(e) => setForm((s) => ({ ...s, thoiHan: e.target.value }))}
            placeholder="VD: 30, 365"
          />
        </div>
        <div>
          <label>Giảm giá (%)</label>
          <input
            type="number"
            value={form.giamGia}
            onChange={(e) => setForm((s) => ({ ...s, giamGia: e.target.value }))}
            placeholder="0..100"
          />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label>Mô tả</label>
          <textarea
            rows={3}
            value={form.moTa}
            onChange={(e) => setForm((s) => ({ ...s, moTa: e.target.value }))}
            placeholder="Mô tả ngắn về gói…"
          />
        </div>

        <div style={{ gridColumn: "1/-1", display: "flex", gap: 8 }}>
          {!isEdit ? (
            <button className="btn btn-primary" onClick={handleAdd}>Thêm gói</button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Lưu thay đổi</button>
              <button className="btn btn-secondary" onClick={resetForm}>Huỷ</button>
            </>
          )}
        </div>
      </div>

      {/* Bảng */}
      <table className="user-table" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID gói</th>
            <th>Tên gói</th>
            <th>Mô tả</th>
            <th>Giá</th>
            <th>Giảm (%)</th>
            <th>Giá sau giảm</th>
            <th>Thời hạn (ngày)</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {packs.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: "center" }}>Chưa có gói nào</td></tr>
          ) : (
            packs.map((p) => (
              <tr key={p.idGoi}>
                <td>{p.idGoi}</td>
                <td>{p.tenGoi}</td>
                <td style={{ maxWidth: 280 }}>{p.moTa}</td>
                <td>{(p.giaGoi ?? 0).toLocaleString()} đ</td>
                <td>{p.giamGia ?? 0}%</td>
                <td>{giaSauGiam(p).toLocaleString()} đ</td>
                <td>{p.thoiHan}</td>
                <td>
                  <button onClick={() => handleEditPick(p)}>👀</button>{" "}
                  <button onClick={() => handleDelete(p.idGoi)}>🗑️</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
