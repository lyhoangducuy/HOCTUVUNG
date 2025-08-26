import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";
import "./MainContent.css";

import { db } from "../../../../../lib/firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

const MainContentQLBT = ({ Data = [] }) => {
  const ColumsBoThe = [
    { name: "ID", key: "id" },
    { name: "Tên bộ thẻ", key: "name" },
    { name: "Người tạo", key: "userCreated" },
    { name: "Số thẻ", key: "numBer" },
  ];

  const [data, setData] = useState(Data);
  const [filteredData, setFilteredData] = useState(Data);

  // Đồng bộ khi prop Data đổi (realtime từ cha)
  useEffect(() => {
    setData(Data);
    setFilteredData(Data);
  }, [Data]);

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Export
  const [exportModal, setExportModal] = useState(false);

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const onClose = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  // Xoá trên Firestore + cập nhật UI tạm thời
  const onConfirmDelete = async (idFromModal) => {
    const id = idFromModal ?? deleteId;
    if (id == null) return;

    // UI optimstic update
    const updated = data.filter((item) => String(item.id) !== String(id));
    setData(updated);
    setFilteredData(updated);

    try {
      // 1) Thử xoá theo doc id
      const ref = doc(db, "boThe", String(id));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
      } else {
        // 2) Fallback: tìm theo field idBoThe == id
        const q1 = query(
          collection(db, "boThe"),
          where("idBoThe", "==", String(id)),
          limit(1)
        );
        const rs = await getDocs(q1);
        const first = rs.docs[0];
        if (first) {
          await deleteDoc(first.ref);
        } else {
          console.warn("Không tìm thấy tài liệu boThe để xoá:", id);
        }
      }
    } catch (e) {
      console.error("Xoá bộ thẻ trên Firestore thất bại:", e);
      // (tuỳ chọn) rollback UI nếu muốn
    }

    onClose();
  };

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

  // Lưu chỉnh sửa lên Firestore + cập nhật UI
  const handleUserDetailSave = async (updatedUser, flagIsEditMode = false) => {
    if (flagIsEditMode) {
      setIsEditMode(true);
      return;
    }

    // UI optimistic
    const updated = data.map((it) =>
      String(it.id) === String(updatedUser.id) ? updatedUser : it
    );
    setData(updated);
    setFilteredData(updated);

    // Ghi Firestore
    try {
      const payload = {
        tenBoThe: updatedUser.name ?? "",
      };

      // Hỗ trợ cập nhật số lượng thẻ nếu bạn đang cho sửa (giữ nguyên nếu không)
      if (updatedUser.numBer != null) {
        const n = Number(updatedUser.numBer);
        if (!Number.isNaN(n)) payload.soTu = n;
      }

      // 1) Thử update theo doc id
      const ref = doc(db, "boThe", String(updatedUser.id));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, payload);
      } else {
        // 2) Fallback: tìm theo field idBoThe == id
        const q1 = query(
          collection(db, "boThe"),
          where("idBoThe", "==", String(updatedUser.id)),
          limit(1)
        );
        const rs = await getDocs(q1);
        const first = rs.docs[0];
        if (first) {
          await updateDoc(first.ref, payload);
        } else {
          console.warn("Không tìm thấy tài liệu boThe để cập nhật:", updatedUser.id);
        }
      }
    } catch (e) {
      console.error("Cập nhật boThe trên Firestore thất bại:", e);
      // (tuỳ chọn) rollback UI nếu cần
    }

    handleUserDetailClose();
  };

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
      <h1>Quản Lý Bộ Thẻ</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => setExportModal(true)}
          >
            Xuất
          </button>
        </div>
        <Search Data={data} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumsBoThe} Data={filteredData} Action={Action} />

      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onClose}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa bộ thẻ này không?"
        />
      )}

      {showEdit && selectedUser && (
        <Edit
          user={selectedUser}
          onClose={handleUserDetailClose}
          onSave={handleUserDetailSave}
          isEditMode={isEditMode}
          Colums={ColumsBoThe}
          showAvatar={false}
        />
      )}

      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          onExport={(rows) => console.log("Dữ liệu export:", rows)}
          filteredData={filteredData}
          title="Xuất danh sách bộ thẻ"
          columns={ColumsBoThe}
          showAvatar={false}
        />
      )}
    </div>
  );
};

export default MainContentQLBT;
