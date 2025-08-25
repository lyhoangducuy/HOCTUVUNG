// src/pages/Admin/QuanLyTraPhi/QuanLyNguoiDungTraPhi.jsx
import "./MainConTentQLTP.css";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useMemo, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";

/* ===== Helpers ===== */
const readJSON = (k, def = []) => {
  try { const raw = localStorage.getItem(k); const v = raw ? JSON.parse(raw) : def; return Array.isArray(v) ? v : def; }
  catch { return def; }
};
const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const genSubId = () => "SUB_" + Date.now();

const parseVN = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const [d, m, y] = dmy.split("/").map(Number);s
  if (!d || !m || !y) return null;
  return new Date(y, (m || 1) - 1, d || 1);
};
const fmtVN = (d) => (d instanceof Date ? d.toLocaleDateString("vi-VN") : "");
const today0 = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };

const buildRows = () => {
  const subs = readJSON("goiTraPhiCuaNguoiDung", []);
  const users = readJSON("nguoiDung", []);
  const packs = readJSON("goiTraPhi", []);

  return subs.map((s) => {
    const u = users.find((x) => x.idNguoiDung === s.idNguoiDung);
    const p = packs.find((x) => x.idGoi === s.idGoi);

    const end = parseVN(s.NgayKetThuc);
    const status = end && end >= today0() ? "Đang hoạt động" : "Hết hạn";

    return {
      // hiển thị
      id: s.idGTPCND,
      username: u?.tenNguoiDung || `User ${s.idNguoiDung}`,
      package: p?.tenGoi || s.idGoi,
      status,
      created: s.NgayBatDau,
      endDate: s.NgayKetThuc,

      // dữ liệu phụ
      idNguoiDung: s.idNguoiDung,
      idGoi: s.idGoi,
    };
  });
};

export default function QuanLyNguoiDungTraPhi() {
  /* ===== Cột bảng ===== */
  const ColumsTable = [
    { name: "ID", key: "id" },
    { name: "Tên người dùng", key: "username" },
    { name: "Gói học", key: "package" },
    { name: "Trạng thái", key: "status" },
    { name: "Ngày bắt đầu", key: "created" },
    { name: "Ngày hết hạn", key: "endDate" },
  ];

  /* ===== Options cho select (tên gói) ===== */
  const getPackOptions = () =>
    readJSON("goiTraPhi", []).map((p) => ({
      value: String(p.idGoi),
      label: String(p.tenGoi || p.idGoi), // 👉 hiển thị TÊN GÓI
      thoiHan: Number(p.thoiHan || 0),
    }));

  const [packOptions, setPackOptions] = useState(getPackOptions());

  /* ===== Form (Edit/Add) – chỉ sửa/chọn 4 trường ===== */
  const statusOptions = [
    { value: "Đang hoạt động", label: "Đang hoạt động" },
    { value: "Hết hạn", label: "Hết hạn" },
  ];

  const ColumsFormEdit = useMemo(() => [
    { name: "Gói học", key: "idGoi", options: packOptions },   // select tên gói
    { name: "Trạng thái", key: "status", options: statusOptions }, // select
    { name: "Ngày bắt đầu (dd/mm/yyyy)", key: "NgayBatDau" },
    { name: "Ngày hết hạn (dd/mm/yyyy)", key: "NgayKetThuc" },
  ], [packOptions]);

  const ColumsFormAdd = useMemo(() => [
    { name: "ID người dùng", key: "idNguoiDung" },
    { name: "Gói học", key: "idGoi", options: packOptions },   // select tên gói
    { name: "Ngày bắt đầu (dd/mm/yyyy)", key: "NgayBatDau" },
    { name: "Ngày hết hạn (dd/mm/yyyy) (có thể để trống)", key: "NgayKetThuc" },
  ], [packOptions]);

  /* ===== State data ===== */
  const [data, setData] = useState(() => buildRows());
  const [filteredData, setFilteredData] = useState(data);
  useEffect(() => setFilteredData(data), [data]);

  /* Dialog states */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [exportModal, setExportModal] = useState(false);

  /* ===== Reload ===== */
  const reload = () => {
    setPackOptions(getPackOptions());  // cập nhật list gói mới nhất
    setData(buildRows());
  };

  useEffect(() => {
    // reload khi đổi dữ liệu ở tab khác
    const onStorage = (e) => {
      if (["goiTraPhi", "goiTraPhiCuaNguoiDung", "nguoiDung"].includes(e.key)) reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ===== Delete ===== */
  const handleDelete = (id) => { setDeleteId(id); setShowDeleteDialog(true); };
  const onCloseDelete = () => { setShowDeleteDialog(false); setDeleteId(null); };
  const onConfirmDelete = (id) => {
    const prev = readJSON("goiTraPhiCuaNguoiDung", []);
    const next = prev.filter((x) => String(x.idGTPCND) !== String(id));
    writeJSON("goiTraPhiCuaNguoiDung", next);
    onCloseDelete();
    reload();
    window.dispatchEvent(new Event("subscriptionChanged"));
  };

  /* ===== Edit ===== */
  const handleEdit = (id) => {
    const row = data.find((x) => String(x.id) === String(id));
    if (!row) return;
    setSelectedRow({
      id: row.id,
      idNguoiDung: row.idNguoiDung,
      idGoi: row.idGoi,           // sẽ map lên select theo tên gói
      status: row.status,         // select
      NgayBatDau: row.created,
      NgayKetThuc: row.endDate,
    });
    setShowEdit(true);
    setIsEditMode(false);
  };
  const handleEditClose = () => { setShowEdit(false); setSelectedRow(null); setIsEditMode(false); };

  const handleEditSave = (payload, isEdit = false) => {
    if (isEdit) { setIsEditMode(true); return; }

    const id = payload?.id || selectedRow?.id;
    const idGoi = String(payload?.idGoi || "").trim();
    const status = String(payload?.status || "");
    const start = parseVN(payload?.NgayBatDau);
    let end = parseVN(payload?.NgayKetThuc);

    if (!id || !idGoi || !status || !start || !end) {
      alert("Nhập đủ: Gói học, Trạng thái, Ngày bắt đầu, Ngày hết hạn.");
      return;
    }

    // ép end theo trạng thái nếu cần
    const t0 = today0();
    if (status === "Đang hoạt động" && end < t0) end = t0;
    if (status === "Hết hạn" && end >= t0) { const d = new Date(t0); d.setDate(d.getDate() - 1); end = d; }

    const list = readJSON("goiTraPhiCuaNguoiDung", []);
    const idx = list.findIndex((x) => String(x.idGTPCND) === String(id));
    if (idx === -1) { alert("Không tìm thấy bản ghi để sửa."); return; }

    list[idx] = {
      ...list[idx],
      idGoi,
      NgayBatDau: fmtVN(start),
      NgayKetThuc: fmtVN(end),
    };
    writeJSON("goiTraPhiCuaNguoiDung", list);

    handleEditClose();
    reload();
    window.dispatchEvent(new Event("subscriptionChanged"));
  };

  /* ===== Add ===== */
  const handleAddOpen = () => setShowAddDialog(true);
  const handleAddClose = () => setShowAddDialog(false);

  const handleAddSave = (row) => {
    const idNguoiDung = Number(row?.idNguoiDung);
    const idGoi = String(row?.idGoi || "").trim();
    const start = parseVN(row?.NgayBatDau);
    let end = parseVN(row?.NgayKetThuc);

    if (!idNguoiDung || !idGoi || !start) {
      alert("Nhập: ID người dùng, Gói học, Ngày bắt đầu.");
      return;
    }

    // nếu chưa chọn ngày hết hạn -> tự tính theo thoiHan
    if (!end) {
      const pack = readJSON("goiTraPhi", []).find((p) => String(p.idGoi) === idGoi);
      const days = Number(pack?.thoiHan || 0);
      const e = new Date(start);
      e.setDate(e.getDate() + days);
      end = e;
    }

    const list = readJSON("goiTraPhiCuaNguoiDung", []);
    list.push({
      idGTPCND: genSubId(),
      idNguoiDung,
      idGoi,
      NgayBatDau: fmtVN(start),
      NgayKetThuc: fmtVN(end),
    });
    writeJSON("goiTraPhiCuaNguoiDung", list);

    handleAddClose();
    reload();
    window.dispatchEvent(new Event("subscriptionChanged"));
  };

  /* ===== Action ===== */
  const Action = [
    { name: "👀", class: "edit-button", style: { cursor: "pointer", marginRight: 8, fontSize: "1.2rem" }, onClick: (id) => () => handleEdit(id) },
    { name: "🗑️", class: "delete-button", style: { cursor: "pointer", fontSize: "1.2rem" }, onClick: (id) => () => handleDelete(id) },
  ];

  return (
    <div className="main-content-admin-user">
      <h1>Quản Lý Trả Phí (Theo Người Dùng)</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={handleAddOpen}>Thêm</button>
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>Xuất</button>
        </div>
        <Search Data={data} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumsTable} Data={filteredData} Action={Action} />

      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa đăng ký trả phí này không?"
        />
      )}

      {showEdit && selectedRow && (
        <Edit
          user={selectedRow}
          onClose={handleEditClose}
          onSave={handleEditSave}
          isEditMode={isEditMode}
          Colums={ColumsFormEdit}    // 👉 có options (tên gói & trạng thái)
          showAvatar={false}
        />
      )}

      {showAddDialog && (
        <Add
          onClose={handleAddClose}
          onSave={handleAddSave}
          Colums={ColumsFormAdd}     // 👉 có options (tên gói)
          showAvatar={false}
        />
      )}

      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          filteredData={filteredData}
          title="Xuất danh sách trả phí của người dùng"
          columns={ColumsTable}
        />
      )}
    </div>
  );
}
