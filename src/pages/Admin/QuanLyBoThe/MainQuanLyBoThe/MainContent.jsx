import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";
import "./MainContent.css";

const MainContentQLBT = ({ Data = [] }) => {
  const ColumsBoThe = [
    { name: "ID", key: "id" },
    { name: "Tên bộ thẻ", key: "name" },
    { name: "Người tạo", key: "userCreated" },
    { name: "Số thẻ", key: "numBer" },
  ];

  const [data, setData] = useState(Data);
  const [filteredData, setFilteredData] = useState(Data);

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Export
  const [exportModal, setExportModal] = useState(false);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const onClose = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  // ✅ FIX: dùng fallback từ state nếu modal không truyền id
  const onConfirmDelete = (idFromModal) => {
    const id = idFromModal ?? deleteId;
    if (id == null) return;

    // Cập nhật state list hiển thị
    const updated = data.filter((item) => String(item.id) !== String(id));
    setData(updated);
    setFilteredData(updated); // ✅ cập nhật ngay UI

    // Xoá trong localStorage "boThe" (idBoThe phải trùng với item.id)
    try {
      const raw = localStorage.getItem("boThe");
      const list = raw ? JSON.parse(raw) : [];
      const next = (Array.isArray(list) ? list : []).filter(
        (bt) => String(bt.idBoThe) !== String(id)
      );
      localStorage.setItem("boThe", JSON.stringify(next));
    } catch (e) {
      console.error("Xoá bộ thẻ trong localStorage thất bại:", e);
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
  

  const handleUserDetailSave = (updatedUser, flagIsEditMode = false) => {
    if (flagIsEditMode) { setIsEditMode(true); return; }

    const updated = data.map((it) =>
      String(it.id) === String(updatedUser.id) ? updatedUser : it
    );
    setData(updated);
    setFilteredData(updated);

    // Đồng bộ localStorage/boThe (map các field phù hợp schema thực tế)
    try {
      const raw = localStorage.getItem("boThe");
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(
        (c) => String(c.idBoThe) === String(updatedUser.id)
      );
      if (idx !== -1) {
        const cur = { ...list[idx] };
        list[idx] = {
          ...cur,
          tenBoThe: updatedUser.name,
          // tuỳ schema thật của bạn: soTu hoặc danhSachThe.length
          soTu: Number(updatedUser.numBer) || cur.soTu || 0,
          // idNguoiDung / thông tin creator không nhất thiết lưu string "userCreated"
        };
        localStorage.setItem("boThe", JSON.stringify(list));
      }
    } catch (e) {
      console.error("Cập nhật bộ thẻ trong localStorage thất bại:", e);
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
          onConfirm={onConfirmDelete}  // sẽ tự fallback deleteId nếu không truyền id
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
