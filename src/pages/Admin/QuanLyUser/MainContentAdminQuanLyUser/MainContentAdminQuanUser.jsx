// src/pages/Admin/QuanLyNguoiDung/MainContentAdminQuanUser/MainContentAdminQuanUser.jsx
import "./MainContentAdminQuanUser.css";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";
import * as Yup from "yup";

import { db } from "../../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

/* ================= Helpers ================= */
const toVN = (d) =>
  d instanceof Date && !isNaN(d) ? d.toLocaleString("vi-VN") : "";

const trimStr = (v) => (typeof v === "string" ? v.trim() : v ?? "");
const sanitize = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)); // Firestore không cho undefined

const ROLE_OPTIONS = [
  { value: "HOC_VIEN", label: "Học viên" },
  { value: "GIANG_VIEN", label: "Giảng viên" },
  { value: "ADMIN", label: "Quản trị" },
];
const ROLE_VALUES = ROLE_OPTIONS.map((o) => o.value);

/* ===== Schema validate (không còn field ảnh) ===== */
const EditSchema = Yup.object({
  username: Yup.string().trim().required("Vui lòng nhập Tên đăng nhập").min(3, "Tối thiểu 3 ký tự"),
  fullname: Yup.string().trim().required("Vui lòng nhập Họ tên").min(3, "Tối thiểu 3 ký tự"),
  email: Yup.string().trim().required("Vui lòng nhập Email").email("Email không hợp lệ"),
  role: Yup.string().oneOf(ROLE_VALUES, "Vai trò không hợp lệ").required("Vui lòng chọn vai trò"),
});

const AddSchema = Yup.object({
  id: Yup.string()
    .trim()
    .matches(/^[\w-]*$/, "ID chỉ gồm chữ, số, gạch dưới, gạch ngang")
    .max(64, "ID quá dài")
    .notRequired(),
  username: Yup.string().trim().required("Vui lòng nhập Tên đăng nhập").min(3, "Tối thiểu 3 ký tự"),
  fullname: Yup.string().trim().required("Vui lòng nhập Họ tên").min(3, "Tối thiểu 3 ký tự"),
  email: Yup.string().trim().required("Vui lòng nhập Email").email("Email không hợp lệ"),
  role: Yup.string().oneOf(ROLE_VALUES, "Vai trò không hợp lệ").required("Vui lòng chọn vai trò"),
});

export default function MainContentAdminQuanUser() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // dialogs/state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [exportModal, setExportModal] = useState(false);

  /* ==== Load realtime từ Firestore/nguoiDung ==== */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "nguoiDung"),
      (snap) => {
        const rows = snap.docs.map((d) => {
          const u = d.data();
          const created =
            u?.ngayTaoTaiKhoan?.toDate?.() ??
            (typeof u?.ngayTaoTaiKhoan === "string" ? new Date(u.ngayTaoTaiKhoan) : null);
          return {
            id: d.id, // dùng docId để CRUD
            username: u?.tenNguoiDung ?? "",
            fullname: u?.hoten ?? "",
            email: u?.email ?? "",
            role: u?.vaiTro ?? "",
            created: created ? toVN(created) : "",
            _raw: u,
          };
        });
        setData(rows);
        setFilteredData(rows);
      },
      (err) => {
        console.error("Lỗi đọc collection nguoiDung:", err);
        setData([]);
        setFilteredData([]);
      }
    );
    return () => unsub();
  }, []);

  /* ==== Cột bảng (không có ảnh) ==== */
  const ColumsTable = [
    { name: "Mã (docId)", key: "id" },
    { name: "Tên đăng nhập", key: "username" },
    { name: "Họ tên", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày tạo", key: "created" },
  ];

  /* ==== Cột form Sửa / Thêm (không có ảnh) ==== */
  const ColumsEdit = [
    { name: "Mã (docId)", key: "id" },
    { name: "Tên đăng nhập", key: "username" },
    { name: "Họ tên", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role", options: ROLE_OPTIONS },
    { name: "Ngày tạo", key: "created" },
  ];

  const ColumsAdd = [
    { name: "Mã (tùy chọn - để trống sẽ tự tạo)", key: "id" },
    { name: "Tên đăng nhập", key: "username" },
    { name: "Họ tên", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role", options: ROLE_OPTIONS },
  ];

  const ColumsXuat = [
    { name: "Mã", key: "id" },
    { name: "Tên đăng nhập", key: "username" },
    { name: "Họ tên", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày tạo", key: "created" },
  ];

  /* ==== Delete flow ==== */
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };
  const onCloseDelete = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };
  const onConfirmDelete = async (idFromModal) => {
    const id = idFromModal ?? deleteId;
    if (!id) return;
    try {
      await deleteDoc(doc(db, "nguoiDung", id));
      onCloseDelete();
    } catch (err) {
      console.error("Xóa người dùng thất bại:", err);
      alert(`Không thể xoá người dùng.\nChi tiết: ${err?.message || err}`);
    }
  };

  /* ==== Edit flow ==== */
  const handleEdit = (id) => {
    const user = data.find((item) => String(item.id) === String(id));
    if (!user) return;
    setSelectedUser(user);
    setShowEdit(true);
    setIsEditMode(false);
  };

  const handleUserDetailClose = () => {
    setShowEdit(false);
    setSelectedUser(null);
    setIsEditMode(false);
  };

  const handleUserDetailSave = async (updatedUser, flagIsEditMode = false) => {
    if (flagIsEditMode) {
      setIsEditMode(true);
      return;
    }
    if (!updatedUser?.id) return;

    const payload = sanitize({
      tenNguoiDung: trimStr(updatedUser.username),
      hoten: trimStr(updatedUser.fullname),
      email: trimStr(updatedUser.email),
      vaiTro: updatedUser.role || "HOC_VIEN",
      // KHÔNG đụng tới ảnh
      // KHÔNG ghi đè ngày tạo / mật khẩu
    });

    try {
      await updateDoc(doc(db, "nguoiDung", updatedUser.id), payload);
      handleUserDetailClose();
    } catch (err) {
      console.error("Cập nhật người dùng thất bại:", err);
      alert(`Không thể lưu thay đổi.\nChi tiết: ${err?.message || err}`);
    }
  };

  /* ==== Add flow ==== */
  const handleAddUser = () => setShowAddDialog(true);
  const handleAddClose = () => setShowAddDialog(false);

  const handleAddSave = async (newUser) => {
    try {
      const id = trimStr(newUser?.id || "");
      const basePayload = sanitize({
        tenNguoiDung: trimStr(newUser?.username || ""),
        hoten: trimStr(newUser?.fullname || ""),
        email: trimStr(newUser?.email || ""),
        vaiTro: newUser?.role || "HOC_VIEN",
        ngayTaoTaiKhoan: serverTimestamp(),
        // KHÔNG có ảnh
      });

      if (id) {
        // Tự đặt docId = id
        await setDoc(doc(db, "nguoiDung", id), {
          ...basePayload,
          idNguoiDung: id,
        });
      } else {
        // Tạo doc auto-id, rồi cập nhật idNguoiDung = doc.id
        const ref = await addDoc(collection(db, "nguoiDung"), basePayload);
        await updateDoc(ref, { idNguoiDung: ref.id });
      }

      handleAddClose();
    } catch (err) {
      console.error("Thêm người dùng thất bại:", err);
      alert(`Không thể thêm người dùng.\nChi tiết: ${err?.message || err}`);
    }
  };

  /* ==== Action buttons ==== */
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

  return (
    <div className="main-content-admin-user">
      <h1>Quản lý người dùng</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={handleAddUser}>
            Thêm
          </button>
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>
            Xuất
          </button>
        </div>
        <Search Data={data} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumsTable} Data={filteredData} Action={Action} />

      {/* Delete */}
      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa người dùng này không?"
        />
      )}

      {/* Edit */}
      {showEdit && selectedUser && (
        <Edit
          user={selectedUser}
          onClose={handleUserDetailClose}
          onSave={handleUserDetailSave}
          isEditMode={isEditMode}
          Colums={ColumsEdit}
          showAvatar={false}            // ẨN avatar/ảnh
          readOnlyKeys={["id", "created"]}
          selectFields={{ role: ROLE_OPTIONS }}
          validationSchema={EditSchema}
          validateOnChange={true}
        />
      )}

      {/* Add */}
      {showAddDialog && (
        <Add
          onClose={handleAddClose}
          onSave={handleAddSave}
          Colums={ColumsAdd}
          showAvatar={false}            // ẨN avatar/ảnh
          selectFields={{ role: ROLE_OPTIONS }}
          validationSchema={AddSchema}
          validateOnChange={true}
        />
      )}

      {/* Export */}
      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          filteredData={filteredData}
          title="Xuất thông tin người dùng"
          columns={ColumsXuat}
        />
      )}
    </div>
  );
}
