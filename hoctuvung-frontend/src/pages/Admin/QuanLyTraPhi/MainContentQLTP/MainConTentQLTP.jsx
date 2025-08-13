import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import ExportModal from "../../../../components/ExportModal/ExportModal";
import Add from "../../../../components/Admin/Add/Add"
import "./MainContentQLTP.css";
const MainContentQLTP = ({ Data }) => {
  const [data, setData] = useState(Data);

  const ColumnsGoiHoc = [
    { name: "ID", key: "id" },
    { name: "Tên người dùng", key: "username" },
    { name: "Gói học", key: "package" },
    { name: "Trạng thái", key: "status" },
    { name: "Ngày đăng ký", key: "created" },
    { name: "Ngày hết hạn", key: "endDate" },
  ];
  const ColumnsEdit = [
    { name: "ID", key: "id" },
    { name: "Tên người dùng", key: "username" },
    { name: "Gói học", key: "package" },
    { name: "Trạng thái", key: "status" },
    { name: "Ngày đăng ký", key: "created" },
    { name: "Ngày hết hạn", key: "endDate" },
  ];

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [filteredData, setFilteredData] = useState(data);
  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  // delete
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };
  const onConfirmDelete = (id) => {
    const updatedData = data.filter((item) => item.id !== id);
    setData(updatedData);
    onClose();
  };
  // Export
  const [exportModal, setExportModal] = useState(false);
  const onClose = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  //Edit

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

  // Add functions
  const handleAddUser = () => {
    setShowAddDialog(true);
  };

  const handleAddClose = () => {
    setShowAddDialog(false);
  };

  const handleAddSave = (newUser) => {
   
    // Tạo ID mới
    const maxId = Math.max(...data.map((item) => item.id));
    const userWithId = {
      ...newUser,
      id: maxId + 1,
    };

    // Thêm user mới vào danh sách
  
    setData((prev) => [...prev, userWithId]);
    handleAddClose();
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
      <h1>Quản Lý Trả Phí</h1>
      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={handleAddUser}>
            Thêm 
          </button>
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

      <TableAdmin Colums={ColumnsGoiHoc} Data={filteredData} Action={Action} />

      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onClose}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa người dùng này không?"
        />
      )}
      {showEdit && selectedUser && (
        <Edit
          user={selectedUser}
          onClose={handleUserDetailClose}
          onSave={handleUserDetailSave}
          isEditMode={isEditMode}
          Colums={ColumnsEdit}
          showAvatar={true}
        />
      )}
      {showAddDialog && (
        <Add
          onClose={handleAddClose}
          onSave={handleAddSave}
          Colums={ColumnsGoiHoc}
          showAvatar={true}
        />
      )}
      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          onExport={(data) => {
            console.log("Dữ liệu xuất:", data);
          }}
          filteredData={Search ? filteredData : data}
          title="Xuất thông tin người dùng"
          columns={ColumnsGoiHoc}
        />
      )}
    </div>
  );
};

export default MainContentQLTP;
