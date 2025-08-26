// src/pages/Admin/QuanLyTraPhi/QuanLyGoiTraPhi.jsx
import { useEffect, useState } from "react";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";

import { db } from "../../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const VN = "vi-VN";
const genIdGoi = () => "GOI_" + Date.now();
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const makeRows = (docs) =>
  docs.map((p) => {
    const gia = toNum(p.giaGoi);
    const gg = toNum(p.giamGia);
    const after = Math.max(0, Math.round(gia * (1 - gg / 100)));
    return {
      id: p._docId,                 // dùng docId cho action (Edit/Delete)
      idGoi: p.idGoi || p._docId,   // hiển thị mã gói theo yêu cầu
      tenGoi: p.tenGoi || "",
      moTa: p.moTa || "",
      giaGoi: gia,
      giamGia: gg,
      thoiHan: toNum(p.thoiHan),
      giaGoiFmt: gia.toLocaleString(VN),
      giaSauGiamFmt: after.toLocaleString(VN),
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

  // Load realtime từ Firestore
  useEffect(() => {
    const un = onSnapshot(collection(db, "goiTraPhi"), (snap) => {
      const docs = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
      const r = makeRows(docs);
      setRows(r);
      setFiltered(r);
    });
    return () => un();
  }, []);

  // Xoá
  const askDelete = (id) => {
    setDeleteId(id);
    setShowDelete(true);
  };
  const closeDelete = () => {
    setShowDelete(false);
    setDeleteId(null);
  };
  const confirmDelete = async (idFromModal) => {
    const id = idFromModal ?? deleteId;
    if (!id) return;
    try {
      await deleteDoc(doc(db, "goiTraPhi", id));
      closeDelete();
    } catch (e) {
      console.error(e);
      alert("Xoá gói thất bại.");
    }
  };

  // Sửa
  const openEdit = (id) => {
    const row = rows.find((x) => String(x.id) === String(id));
    if (!row) return;
    setEditData({
      id: row.id, // docId
      tenGoi: row.tenGoi,
      moTa: row.moTa,
      giaGoi: row.giaGoi,
      giamGia: row.giamGia,
      thoiHan: row.thoiHan,
    });
    setIsEditMode(false);
    setShowEdit(true);
  };
  const closeEdit = () => {
    setShowEdit(false);
    setEditData(null);
    setIsEditMode(false);
  };
  const saveEdit = async (payload, isEditFlag) => {
    if (isEditFlag) {
      setIsEditMode(true);
      return;
    }
    if (!payload?.id) return;
    try {
      await updateDoc(doc(db, "goiTraPhi", payload.id), {
        tenGoi: String(payload.tenGoi || "").trim(),
        moTa: String(payload.moTa || "").trim(),
        giaGoi: toNum(payload.giaGoi),
        giamGia: toNum(payload.giamGia),
        thoiHan: toNum(payload.thoiHan),
      });
      closeEdit();
    } catch (e) {
      console.error(e);
      alert("Cập nhật gói thất bại.");
    }
  };

  // Thêm
  const openAdd = () => setShowAdd(true);
  const closeAdd = () => setShowAdd(false);
  const saveAdd = async (p) => {
    const ten = String(p?.tenGoi || "").trim();
    if (!ten) return alert("Nhập tên gói");
    try {
      await addDoc(collection(db, "goiTraPhi"), {
        idGoi: genIdGoi(), // vẫn lưu idGoi để hiển thị đúng như trước
        tenGoi: ten,
        moTa: String(p.moTa || "").trim(),
        giaGoi: toNum(p.giaGoi),
        giamGia: toNum(p.giamGia),
        thoiHan: toNum(p.thoiHan),
      });
      closeAdd();
    } catch (e) {
      console.error(e);
      alert("Thêm gói thất bại.");
    }
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
