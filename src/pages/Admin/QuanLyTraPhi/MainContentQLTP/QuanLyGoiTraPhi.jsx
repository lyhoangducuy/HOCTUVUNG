// src/pages/Admin/QuanLyTraPhi/QuanLyGoiTraPhi.jsx
import { useEffect, useState } from "react";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";

const LS_KEY = "goiTraPhi";
const genId = () => "GOI_" + Date.now();
const toNum = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const read = () => {
  try { const a = JSON.parse(localStorage.getItem(LS_KEY) || "[]"); return Array.isArray(a) ? a : []; }
  catch { return []; }
};
const write = (a) => localStorage.setItem(LS_KEY, JSON.stringify(a));

// Tạo dữ liệu hiển thị cho TableAdmin
const makeRows = (packs) =>
  packs.map((p) => {
    const gia = toNum(p.giaGoi);
    const gg = toNum(p.giamGia);
    const after = Math.max(0, Math.round(gia * (1 - gg / 100)));
    return {
      id: p.idGoi,        // mirror để TableAdmin/Action dùng
      idGoi: p.idGoi,
      tenGoi: p.tenGoi || "",
      moTa: p.moTa || "",
      giaGoi: gia,
      giamGia: gg,
      thoiHan: toNum(p.thoiHan),
      giaGoiFmt: gia.toLocaleString(),
      giaSauGiamFmt: after.toLocaleString(),
    };
  });

export default function QuanLyGoiTraPhi() {
  // Cột bảng
  const columnsTable = [
    { name: "ID gói", key: "idGoi" },
    { name: "Tên gói", key: "tenGoi" },
    { name: "Mô tả", key: "moTa" },
    { name: "Giá (đ)", key: "giaGoiFmt" },
    { name: "Giảm (%)", key: "giamGia" },
    { name: "Giá sau giảm (đ)", key: "giaSauGiamFmt" },
    { name: "Thời hạn (ngày)", key: "thoiHan" },
  ];

  // Cột form (Add/Edit)
  const columnsForm = [
    { name: "Tên gói", key: "tenGoi" },
    { name: "Mô tả", key: "moTa" },
    { name: "Giá (đ)", key: "giaGoi" },
    { name: "Giảm giá (%)", key: "giamGia" },
    { name: "Thời hạn (ngày)", key: "thoiHan" },
  ];

  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Modal/Xoá/Sửa/Thêm
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showAdd, setShowAdd] = useState(false);

  // Load ban đầu
  const reload = () => {
    const r = makeRows(read());
    setRows(r);
    setFiltered(r);
  };
  useEffect(() => { reload(); }, []);

  // Xoá
  const askDelete = (id) => { setDeleteId(id); setShowDelete(true); };
  const closeDelete = () => { setShowDelete(false); setDeleteId(null); };
  const confirmDelete = (id) => {
    const next = read().filter((x) => String(x.idGoi) !== String(id));
    write(next);
    closeDelete();
    reload();
  };

  // Sửa
  const openEdit = (id) => {
    const row = rows.find((x) => String(x.id) === String(id));
    if (!row) return;
    setEditData({
      id: row.id,             // giữ lại id để lưu
      tenGoi: row.tenGoi,
      moTa: row.moTa,
      giaGoi: row.giaGoi,
      giamGia: row.giamGia,
      thoiHan: row.thoiHan,
    });
    setIsEditMode(false);     // mở ở chế độ xem
    setShowEdit(true);
  };
  const closeEdit = () => { setShowEdit(false); setEditData(null); setIsEditMode(false); };

  // Nhận (payload, isEditFlag) từ Edit:
  const saveEdit = (payload, isEditFlag) => {
    if (isEditFlag) { setIsEditMode(true); return; } // bấm “Chỉnh sửa”
    if (!payload?.id) return;

    const packs = read();
    const i = packs.findIndex((x) => String(x.idGoi) === String(payload.id));
    if (i === -1) return;

    packs[i] = {
      ...packs[i],
      tenGoi: String(payload.tenGoi || "").trim(),
      moTa: String(payload.moTa || "").trim(),
      giaGoi: toNum(payload.giaGoi),
      giamGia: toNum(payload.giamGia),
      thoiHan: toNum(payload.thoiHan),
    };
    write(packs);
    closeEdit();
    reload();
  };

  // Thêm
  const openAdd = () => setShowAdd(true);
  const closeAdd = () => setShowAdd(false);
  const saveAdd = (p) => {
    const ten = String(p?.tenGoi || "").trim();
    if (!ten) return alert("Nhập tên gói");

    const next = read();
    next.push({
      idGoi: genId(),
      tenGoi: ten,
      moTa: String(p.moTa || "").trim(),
      giaGoi: toNum(p.giaGoi),
      giamGia: toNum(p.giamGia),
      thoiHan: toNum(p.thoiHan),
    });
    write(next);
    closeAdd();
    reload();
  };

  // Nút hành động trong bảng
  const Action = [
    { name: "👀", title: "Sửa", onClick: (id) => openEdit(id) },
    { name: "🗑️", title: "Xoá", onClick: (id) => askDelete(id) },
  ];

  return (
    <div className="main-content-admin-user">
      <h2>Quản lý gói trả phí</h2>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={openAdd}>Thêm gói</button>
        </div>
        <Search Data={rows} onResult={setFiltered} />
      </div>

      <TableAdmin Colums={columnsTable} Data={filtered} Action={Action} />

      {/* Xoá */}
      {showDelete && (
        <Delete
          id={deleteId}
          onClose={closeDelete}
          onConfirm={confirmDelete}
          message="Bạn có muốn xoá gói trả phí này không?"
        />
      )}

      {/* Sửa */}
      {showEdit && editData && (
        <Edit
          user={editData}
          onClose={closeEdit}
          onSave={saveEdit}        // (payload, isEditFlag)
          isEditMode={isEditMode}  // bật input khi bấm “Chỉnh sửa”
          Colums={columnsForm}
          showAvatar={false}
        />
      )}

      {/* Thêm */}
      {showAdd && (
        <Add
          onClose={closeAdd}
          onSave={saveAdd}
          Colums={columnsForm}
          showAvatar={false}
        />
      )}
    </div>
  );
}
