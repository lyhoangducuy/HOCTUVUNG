// src/pages/Admin/QuanLyTraPhi/QuanLyNguoiDungTraPhi.jsx
import "./MainConTentQLTP.css";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useMemo, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";

import { db } from "../../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

/* ===== Helpers (ngày VN dd/mm/yyyy) ===== */
const parseVN = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, (m || 1) - 1, d || 1);
};
const fmtVN = (d) =>
  d instanceof Date && !isNaN(d) ? d.toLocaleDateString("vi-VN") : "";
const today0 = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};
const genSubId = () => "SUB_" + Date.now();

/* Tính trạng thái hiển thị (ưu tiên “Đã hủy” nếu có) */
const displayStatus = (sub) => {
  if (sub?.status === "Đã hủy") return "Đã hủy";
  const end = parseVN(sub?.NgayKetThuc);
  if (end && end >= today0()) return "Đang hoạt động";
  return "Hết hạn";
};

export default function QuanLyNguoiDungTraPhi() {
  /* ===== Firestore states ===== */
  const [subs, setSubs] = useState([]);   // goiTraPhiCuaNguoiDung
  const [users, setUsers] = useState([]); // nguoiDung
  const [packs, setPacks] = useState([]); // goiTraPhi

  useEffect(() => {
    const un1 = onSnapshot(collection(db, "goiTraPhiCuaNguoiDung"), (snap) => {
      setSubs(snap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    });
    const un2 = onSnapshot(collection(db, "nguoiDung"), (snap) => {
      setUsers(snap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    });
    const un3 = onSnapshot(collection(db, "goiTraPhi"), (snap) => {
      setPacks(snap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    });
    return () => {
      un1();
      un2();
      un3();
    };
  }, []);

  /* ===== Build rows cho bảng ===== */
  const rows = useMemo(() => {
    return subs.map((s) => {
      const u = users.find((x) => String(x.idNguoiDung) === String(s.idNguoiDung));
      const p = packs.find((x) => String(x.idGoi) === String(s.idGoi));
      return {
        id: s._docId,                               // docId dùng cho action
        idGTPCND: s.idGTPCND || s._docId,           // mã hiển thị
        username: u?.tenNguoiDung || `User ${s.idNguoiDung}`,
        package: p?.tenGoi || s.idGoi,
        status: displayStatus(s),
        created: s.NgayBatDau,
        endDate: s.NgayKetThuc,
        // phụ để mở form
        _raw: s,
      };
    });
  }, [subs, users, packs]);

  const [filteredData, setFilteredData] = useState(rows);
  useEffect(() => setFilteredData(rows), [rows]);

  /* ===== Options cho select (tên gói) ===== */
  const packOptions = useMemo(
    () =>
      packs.map((p) => ({
        value: String(p.idGoi),
        label: String(p.tenGoi || p.idGoi),
        thoiHan: Number(p.thoiHan || 0),
      })),
    [packs]
  );
  const statusOptions = [
    { value: "Đang hoạt động", label: "Đang hoạt động" },
    { value: "Hết hạn", label: "Hết hạn" },
    { value: "Đã hủy", label: "Đã hủy" },
  ];

  /* ===== Cột bảng ===== */
  const ColumsTable = [
    { name: "Mã đăng ký", key: "idGTPCND" },
    { name: "Tên người dùng", key: "username" },
    { name: "Gói học", key: "package" },
    { name: "Trạng thái", key: "status" },
    { name: "Ngày bắt đầu", key: "created" },
    { name: "Ngày hết hạn", key: "endDate" },
  ];

  /* ===== Form (Edit/Add) ===== */
  const ColumsFormEdit = useMemo(
    () => [
      { name: "Gói học", key: "idGoi", options: packOptions }, // select
      { name: "Trạng thái", key: "status", options: statusOptions }, // select
      { name: "Ngày bắt đầu (dd/mm/yyyy)", key: "NgayBatDau" },
      { name: "Ngày hết hạn (dd/mm/yyyy)", key: "NgayKetThuc" },
    ],
    [packOptions]
  );

  const ColumsFormAdd = useMemo(
    () => [
      { name: "ID người dùng", key: "idNguoiDung" }, // nhập UID (string) của user
      { name: "Gói học", key: "idGoi", options: packOptions }, // select
      { name: "Ngày bắt đầu (dd/mm/yyyy)", key: "NgayBatDau" },
      { name: "Ngày hết hạn (dd/mm/yyyy) (có thể để trống)", key: "NgayKetThuc" },
    ],
    [packOptions]
  );

  /* ===== Dialog states ===== */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  /* ===== Delete ===== */
  const handleDelete = (docId) => {
    setDeleteId(docId);
    setShowDeleteDialog(true);
  };
  const onCloseDelete = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };
  const onConfirmDelete = async (docIdFromModal) => {
    const id = docIdFromModal ?? deleteId;
    if (!id) return;
    try {
      await deleteDoc(doc(db, "goiTraPhiCuaNguoiDung", id));
      onCloseDelete();
    } catch (e) {
      console.error(e);
      alert("Xoá đăng ký thất bại.");
    }
  };

  /* ===== Edit ===== */
  const handleEdit = (docId) => {
    const row = rows.find((x) => String(x.id) === String(docId));
    if (!row) return;
    const r = row._raw || {};
    setSelectedRow({
      id: row.id, // docId
      idNguoiDung: r.idNguoiDung,
      idGoi: r.idGoi,
      status: displayStatus(r),
      NgayBatDau: r.NgayBatDau,
      NgayKetThuc: r.NgayKetThuc,
    });
    setShowEdit(true);
    setIsEditMode(false);
  };
  const handleEditClose = () => {
    setShowEdit(false);
    setSelectedRow(null);
    setIsEditMode(false);
  };
  const handleEditSave = async (payload, isEdit = false) => {
    if (isEdit) {
      setIsEditMode(true);
      return;
    }
    const id = payload?.id || selectedRow?.id;
    const idGoi = String(payload?.idGoi || "").trim();
    const status = String(payload?.status || "");
    const start = parseVN(payload?.NgayBatDau);
    let end = parseVN(payload?.NgayKetThuc);

    if (!id || !idGoi || !status || !start || !end) {
      alert("Nhập đủ: Gói học, Trạng thái, Ngày bắt đầu, Ngày hết hạn.");
      return;
    }

    // Ép end theo trạng thái
    const t0 = today0();
    if (status === "Đang hoạt động" && end < t0) end = t0;
    if (status === "Hết hạn" && end >= t0) {
      const d = new Date(t0);
      d.setDate(d.getDate() - 1);
      end = d;
    }
    // “Đã hủy” thì giữ nguyên end, chỉ set status.

    try {
      await updateDoc(doc(db, "goiTraPhiCuaNguoiDung", id), {
        idGoi,
        NgayBatDau: fmtVN(start),
        NgayKetThuc: fmtVN(end),
        status, // lưu status để đồng bộ với các chỗ khác (ví dụ prime check)
      });
      handleEditClose();
    } catch (e) {
      console.error(e);
      alert("Cập nhật đăng ký thất bại.");
    }
  };

  /* ===== Add ===== */
  const handleAddOpen = () => setShowAddDialog(true);
  const handleAddClose = () => setShowAddDialog(false);

  const handleAddSave = async (row) => {
    const idNguoiDung = String(row?.idNguoiDung || "").trim(); // UID (string)
    const idGoi = String(row?.idGoi || "").trim();
    const start = parseVN(row?.NgayBatDau);
    let end = parseVN(row?.NgayKetThuc);

    if (!idNguoiDung || !idGoi || !start) {
      alert("Nhập: ID người dùng, Gói học, Ngày bắt đầu.");
      return;
    }

    // Nếu chưa cung cấp ngày hết hạn -> tính theo thoiHan của gói
    if (!end) {
      const pack = packs.find((p) => String(p.idGoi) === idGoi);
      const days = Number(pack?.thoiHan || 0);
      const e = new Date(start);
      e.setDate(e.getDate() + days);
      end = e;
    }

    const stt = end >= today0() ? "Đang hoạt động" : "Hết hạn";

    try {
      await addDoc(collection(db, "goiTraPhiCuaNguoiDung"), {
        idGTPCND: genSubId(),
        idNguoiDung,
        idGoi,
        NgayBatDau: fmtVN(start),
        NgayKetThuc: fmtVN(end),
        status: stt,
        createdAt: serverTimestamp(),
      });
      handleAddClose();
    } catch (e) {
      console.error(e);
      alert("Thêm đăng ký thất bại.");
    }
  };

  /* ===== Action ===== */
  const Action = [
    {
      name: "👀",
      class: "edit-button",
      style: { cursor: "pointer", marginRight: 8, fontSize: "1.2rem" },
      onClick: (id) => () => handleEdit(id),
    },
    {
      name: "🗑️",
      class: "delete-button",
      style: { cursor: "pointer", fontSize: "1.2rem" },
      onClick: (id) => () => handleDelete(id),
    },
  ];

  /* ===== Export modal ===== */
  const [exportModal, setExportModal] = useState(false);

  return (
    <div className="main-content-admin-user">
      <h1>Quản Lý Trả Phí (Theo Người Dùng)</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={handleAddOpen}>
            Thêm
          </button>
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>
            Xuất
          </button>
        </div>
        <Search Data={rows} onResult={setFilteredData} />
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
          Colums={ColumsFormEdit}
          showAvatar={false}
        />
      )}

      {showAddDialog && (
        <Add onClose={handleAddClose} onSave={handleAddSave} Colums={ColumsFormAdd} showAvatar={false} />
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
