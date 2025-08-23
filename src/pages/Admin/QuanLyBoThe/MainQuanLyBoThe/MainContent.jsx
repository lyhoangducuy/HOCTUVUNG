import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";
import "./MainContent.css";
const MainContentQLBT = ({ Data }) => {
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
      const cards = JSON.parse(localStorage.getItem("boThe"));

      const next = (Array.isArray(cards) ? cards : []).filter(
        (temp) => String(temp.idBoThe) !== String(id)
      );

      localStorage.setItem("boThe", JSON.stringify(next));
    } catch (error) {
      console.error("xóa bộ thẻ thất bại: ", error);
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
    console.log(updatedUser);

    setData(updatedData);
    try {
      const raw = localStorage.getItem("boThe");
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(
        (c) => String(c.idBoThe) === String(updatedUser.id)
      );
      console.log(idx);

      if (idx !== -1) {
        const cur = { ...list[idx] };
        list[idx] = {
          ...cur,
          tenBoThe: updatedUser.name,
          userCreated: updatedUser.userCreated,
          numBer: updatedUser.numBer,
        };
        localStorage.setItem("boThe", JSON.stringify(list));
      }
    } catch (error) {
      console.error("cập nhật bộ thẻ thất bại ", error);
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
