import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import ExportModal from "../../../../components/ExportModal/ExportModal";
import "./MainConTentQLL.css";
const MainConTentQLL = ({ Data }) => {
  const ColumsBoThe = [
    { name: "ID", key: "id" },
    { name: "Tên Lớp Học", key: "name" },
    { name: "Người tạo", key: "userCreated" },
    { name: "Ngày tạo", key: "created" },
  ];
  const [data, setData] = useState(Data);

  // delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };
  // Export
  const [exportModal, setExportModal] = useState(false);
  const onClose = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  const onConfirmDelete = (id) => {
    const updatedData = data.filter((item) => item.id !== id);
    setData(updatedData);
    onClose();
  };
  //Edit

  const [showEdit, setShowEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const handleEdit = (id) => {
    const user = data.find((item) => item.id === id);
    setSelectedUser(user);
    setShowEdit(true);
    setIsEditMode(false);
  };

  const handleUserDetailClose = () => {
    setShowEdit(false);
    setSelectedUser(null);
    setIsEditMode(false);
  };

  const handleUserDetailSave = (updatedUser, isEditMode = false) => {
    if (isEditMode) {
      setIsEditMode(true);
      return;
    }
    // Cập nhật dữ liệu
    const updatedData = data.map((item) =>
      item.id === updatedUser.id ? updatedUser : item
    );
    setData(updatedData);
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
      <h1>Quản Lý Lớp Học</h1>
      <div className="user-actions">
        <div className="user-actions-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setExportModal(true);
            }}
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
          message="Bạn có muốn xóa lớp học này không?"
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
          onExport={(data) => {
            console.log("Dữ liệu xuất:", data);
          }}
          filteredData={data}
          title="Xuất thông tin lớp học"
          columns={ColumsBoThe}
          showAvatar={false}
        />
      )}
    </div>
  );
};

export default MainConTentQLL;
