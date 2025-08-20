import { useEffect, useMemo, useState } from "react";

// date helpers
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};
const toVN = (date) => {
  try { return new Date(date).toLocaleDateString("vi-VN"); }
  catch { return ""; }
};
const parseInputDate = (yyyy_mm_dd) => {
  // yyyy-mm-dd -> Date
  if (!yyyy_mm_dd) return new Date();
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const formatInputDate = (date) => {
  // Date -> yyyy-mm-dd
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const genSubId = () => "SUB_" + Date.now();

export default function QuanLyNguoiDungTraPhi() {
  const [subs, setSubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [packs, setPacks] = useState([]);

  // form
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [idNguoiDung, setIdNguoiDung] = useState("");
  const [idGoi, setIdGoi] = useState("");
  const [startDateStr, setStartDateStr] = useState(formatInputDate(new Date()));

  const reload = () => {
    const s = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const u = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
    const p = JSON.parse(localStorage.getItem("goiTraPhi") || "[]");
    setSubs(Array.isArray(s) ? s : []);
    setUsers(Array.isArray(u) ? u : []);
    setPacks(Array.isArray(p) ? p : []);
  };
  useEffect(() => { reload(); }, []);

  const resetForm = () => {
    setIsEdit(false);
    setEditId("");
    setIdNguoiDung("");
    setIdGoi("");
    setStartDateStr(formatInputDate(new Date()));
  };

  const handleAdd = () => {
    if (!idNguoiDung || !idGoi) return alert("Vui lòng chọn người dùng và gói");
    const pack = packs.find((x) => x.idGoi === idGoi);
    if (!pack) return alert("Gói không hợp lệ");

    const start = parseInputDate(startDateStr);
    const end = addDays(start, Number(pack.thoiHan || 0));

    const newSub = {
      idGTPCND: genSubId(),
      idNguoiDung: Number(idNguoiDung),
      idGoi: idGoi,
      NgayBatDau: toVN(start),
      NgayKetThuc: toVN(end),
    };
    const next = [...subs, newSub];
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(next));
    reload();
    resetForm();
  };

  const handleEditPick = (row) => {
    setIsEdit(true);
    setEditId(row.idGTPCND);
    setIdNguoiDung(row.idNguoiDung);
    setIdGoi(row.idGoi);
    // convert dd/mm/yyyy -> yyyy-mm-dd
    const [d, m, y] = (row.NgayBatDau || "").split("/").map(Number);
    const iso = y && m && d ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : formatInputDate(new Date());
    setStartDateStr(iso);
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    if (!idNguoiDung || !idGoi) return alert("Vui lòng chọn người dùng và gói");

    const pack = packs.find((x) => x.idGoi === idGoi);
    if (!pack) return alert("Gói không hợp lệ");

    const start = parseInputDate(startDateStr);
    const end = addDays(start, Number(pack.thoiHan || 0));

    const next = subs.map((s) =>
      s.idGTPCND === editId
        ? {
            ...s,
            idNguoiDung: Number(idNguoiDung),
            idGoi: idGoi,
            NgayBatDau: toVN(start),
            NgayKetThuc: toVN(end),
          }
        : s
    );
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(next));
    reload();
    resetForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Xoá đăng ký này?")) return;
    const next = subs.filter((s) => s.idGTPCND !== id);
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(next));
    reload();
    if (editId === id) resetForm();
  };

  // join để render bảng
  const rows = useMemo(() => {
    const today = new Date();
    return subs.map((s) => {
      const u = users.find((x) => x.idNguoiDung === s.idNguoiDung);
      const p = packs.find((x) => x.idGoi === s.idGoi);
      // parse end dd/mm/yyyy
      let status = "Không xác định";
      try {
        const [d, m, y] = (s.NgayKetThuc || "").split("/").map(Number);
        const end = new Date(y, (m || 1) - 1, d || 1);
        status = end >= today ? "Đang hoạt động" : "Hết hạn";
      } catch {}
      return {
        ...s,
        tenNguoiDung: u?.tenNguoiDung || `User ${s.idNguoiDung}`,
        tenGoi: p?.tenGoi || s.idGoi,
        status,
      };
    });
  }, [subs, users, packs]);

  return (
    <div>
      {/* Form thêm/sửa */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div>
          <label>Người dùng</label>
          <select value={idNguoiDung} onChange={(e) => setIdNguoiDung(e.target.value)}>
            <option value="">-- chọn --</option>
            {users.map((u) => (
              <option key={u.idNguoiDung} value={u.idNguoiDung}>
                {u.tenNguoiDung} ({u.idNguoiDung})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Gói</label>
          <select value={idGoi} onChange={(e) => setIdGoi(e.target.value)}>
            <option value="">-- chọn --</option>
            {packs.map((p) => (
              <option key={p.idGoi} value={p.idGoi}>
                {p.tenGoi} ({p.thoiHan} ngày)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Ngày bắt đầu</label>
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
          />
        </div>

        <div style={{ alignSelf: "end", display: "flex", gap: 8 }}>
          {!isEdit ? (
            <button className="btn btn-primary" onClick={handleAdd}>Thêm đăng ký</button>
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
            <th>ID</th>
            <th>Người dùng</th>
            <th>Gói</th>
            <th>Trạng thái</th>
            <th>Ngày bắt đầu</th>
            <th>Ngày hết hạn</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: "center" }}>Chưa có dữ liệu</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.idGTPCND}>
                <td>{r.idGTPCND}</td>
                <td>{r.tenNguoiDung} ({r.idNguoiDung})</td>
                <td>{r.tenGoi}</td>
                <td>{r.status}</td>
                <td>{r.NgayBatDau}</td>
                <td>{r.NgayKetThuc}</td>
                <td>
                  <button onClick={() => handleEditPick(r)}>👀</button>{" "}
                  <button onClick={() => handleDelete(r.idGTPCND)}>🗑️</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
