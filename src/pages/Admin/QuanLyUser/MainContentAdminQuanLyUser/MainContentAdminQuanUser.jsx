// src/pages/Admin/QuanLyNguoiDung/MainContentAdminQuanUser/MainContentAdminQuanUser.jsx
import "./MainContentAdminQuanUser.css";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useState } from "react";
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
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
// Nếu muốn gửi email đặt lại mật khẩu thì mở dòng dưới và truyền auth + nút riêng:
// import { auth } from "../../../../lib/firebase";
// import { sendPasswordResetEmail } from "firebase/auth";

const toVN = (d) =>
  d instanceof Date && !isNaN(d) ? d.toLocaleString("vi-VN") : "";

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

  // ==== Load realtime từ Firestore/nguoiDung ====
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "nguoiDung"), // đúng tên collection bạn dùng
      (snap) => {
        const rows = snap.docs.map((d) => {
          const u = d.data();
          const created =
            u?.ngayTaoTaiKhoan?.toDate?.() ??
            (typeof u?.ngayTaoTaiKhoan === "string"
              ? new Date(u.ngayTaoTaiKhoan)
              : null);
        return {
            id: d.id, // dùng docId làm ID hiển thị & CRUD
            username: u?.tenNguoiDung ?? "",
            fullname: u?.hoten ?? "",
            email: u?.email ?? "",
            role: u?.vaiTro ?? "",
            created: created ? toVN(created) : "",
            image: u?.anhDaiDien ?? "",
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

  // ==== Cấu hình cột bảng / form ====
  const ColumsTable = [
    { name: "ID", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày Tạo", key: "created" },
  ];

  // Bản Edit/Add giữ nguyên layout nhưng sẽ bỏ qua "password" khi lưu (không set ở Firestore)
  const ColumsEdit = [
    { name: "ID", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    // { name: "Password", key: "password" }, // ⚠️ KHÔNG lưu password vào Firestore
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày Tạo", key: "created" },
  ];

  const ColumsAdd = [
    { name: "ID (tuỳ chọn - nếu để trống sẽ auto)", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    // { name: "Password", key: "password" }, // ⚠️ KHÔNG lưu password vào Firestore
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Image (URL)", key: "image" },
  ];

  const ColumsXuat = [
    { name: "ID", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày Tạo", key: "created" },
  ];

  // ==== Delete flow ====
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
      // UI sẽ tự cập nhật nhờ onSnapshot
      onCloseDelete();
    } catch (err) {
      console.error("Xóa người dùng thất bại (Firestore):", err);
      alert("Không thể xoá người dùng. Vui lòng thử lại.");
    }
  };

  // ==== Edit flow ====
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

    // Map về schema Firestore "nguoiDung"
    const payload = {
      tenNguoiDung: updatedUser.username ?? "",
      hoten: updatedUser.fullname ?? "",
      email: updatedUser.email ?? "",
      vaiTro: updatedUser.role ?? "",
      anhDaiDien: updatedUser.image ?? "",
      // ngayTaoTaiKhoan: KHÔNG ghi đè ở đây
      // matkhau/password: KHÔNG lưu trong Firestore
    };

    try {
      await updateDoc(doc(db, "nguoiDung", updatedUser.id), payload);
      // UI sẽ tự cập nhật qua onSnapshot
      handleUserDetailClose();
    } catch (err) {
      console.error("Cập nhật người dùng thất bại (Firestore):", err);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
    }
  };

  // ==== Add flow ====
  const handleAddUser = () => setShowAddDialog(true);
  const handleAddClose = () => setShowAddDialog(false);

  const handleAddSave = async (newUser) => {
    try {
      const id = String(newUser?.id || "").trim() || null;

      const payload = {
        idNguoiDung: id || undefined, // sẽ set đúng sau nếu addDoc sinh id
        tenNguoiDung: newUser?.username || "",
        hoten: newUser?.fullname || "",
        email: newUser?.email || "",
        vaiTro: newUser?.role || "HOC_VIEN",
        anhDaiDien: newUser?.image || "",
        ngayTaoTaiKhoan: serverTimestamp(),
      };

      if (id) {
        // Tạo doc với id cụ thể (ví dụ bạn nhập đúng UID đã có)
        await setDoc(doc(db, "nguoiDung", id), payload);
      } else {
        // Tạo doc mới -> cập nhật idNguoiDung = doc.id cho nhất quán
        const ref = await addDoc(collection(db, "nguoiDung"), payload);
        await updateDoc(ref, { idNguoiDung: ref.id });
      }

      handleAddClose();
      // UI tự cập nhật nhờ onSnapshot

      // ⚠️ Lưu ý: Thêm user ở đây chỉ tạo HỒ SƠ (profile).
      // Nếu cần tài khoản đăng nhập (Auth), bạn nên dùng trang Đăng ký,
      // hoặc tạo tài khoản qua backend (Admin SDK) rồi sync profile.
    } catch (err) {
      console.error("Thêm người dùng thất bại (Firestore):", err);
      alert("Không thể thêm người dùng. Vui lòng thử lại.");
    }
  };

  // ==== Action buttons (table) ====
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
      <h1>Quản Lý Người Dùng</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={handleAddUser}>
            Thêm
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setExportModal(true)}
          >
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
          showAvatar={true}
        />
      )}

      {/* Add */}
      {showAddDialog && (
        <Add
          onClose={handleAddClose}
          onSave={handleAddSave}
          Colums={ColumsAdd}
          showAvatar={true}
        />
      )}

      {/* Export */}
      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          onExport={(rows) => {
            console.log("Dữ liệu xuất:", rows);
          }}
          filteredData={filteredData}
          title="Xuất thông tin người dùng"
          columns={ColumsXuat}
        />
      )}
    </div>
  );
}
