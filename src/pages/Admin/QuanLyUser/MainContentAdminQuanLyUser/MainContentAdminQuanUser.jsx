import "./MainContentAdminQuanUser.css";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";
import ExportModal from "../../../../components/ExportModal/ExportModal";
const MainContentAdminQuanUser = ({ Data = [] }) => {
  const mapToTable = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list.map((u) => ({
      id: u?.id ?? u?.idNguoiDung ?? "",
      username: u?.username ?? u?.tenNguoiDung ?? "",
      fullname: u?.fullname ?? u?.hoten ?? "",
      email: u?.email ?? "",  
      role: u?.role ?? u?.vaiTro ?? "",
      created: u?.created ?? u?.ngayTaoTaiKhoan ?? "",
      password: u?.password ?? u?.matkhau ?? "",
      image: u?.image ?? u?.anhDaiDien ?? "",
    }));
  };

  const [data, setData] = useState(() => mapToTable(Data));


  // Đồng bộ khi prop Data thay đổi
  useEffect(() => {
    setData(mapToTable(Data));
  }, [Data]);
  
  const ColumsTable = [
    { name: "ID", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày Tạo", key: "created" },
  ];
  const ColumsEdit = [
    { name: "ID", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    { name: "Password", key: "password" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày Tạo", key: "created" },
  ];

  const ColumsAdd = [
    { name: "ID", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    { name: "Password", key: "password" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Image", key: "image" },
  ];
  const ColumsXuat = [
    { name: "ID", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày Tạo", key: "created" },
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
    const prevData = data;
    const updatedData = data.filter((item) => item.id !== id);
    setData(updatedData);
    // Đồng bộ về localStorage.nguoiDung theo schema gốc
    try {
      const gocRaw = localStorage.getItem("nguoiDung");
      const goc = gocRaw ? JSON.parse(gocRaw) : [];
      const after = (Array.isArray(goc) ? goc : []).filter((u) => String(u.idNguoiDung) !== String(id));
      localStorage.setItem("nguoiDung", JSON.stringify(after));
      onClose();
    } catch (error){
      console.error("Xóa người dùng thất bại (localStorage)", error);
      setData(prevData);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
    }
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
    const prevData = data;
    const updatedData = data.map((item) =>
      item.id === updatedUser.id ? updatedUser : item
    );
    setData(updatedData);
    // Đồng bộ schema gốc vào localStorage
    try {
      const gocRaw = localStorage.getItem("nguoiDung");
      const goc = gocRaw ? JSON.parse(gocRaw) : [];
      const idx = (Array.isArray(goc) ? goc : []).findIndex((u) => String(u.idNguoiDung) === String(updatedUser.id));
      const mapped = {
        idNguoiDung: updatedUser.id,
        tenNguoiDung: updatedUser.username,
        hoten: updatedUser.fullname,
        email: updatedUser.email,
        vaiTro: updatedUser.role,
        ngayTaoTaiKhoan: updatedUser.created,
        matkhau: updatedUser.password,
        anhDaiDien: updatedUser.image,
      };
      if (idx !== -1) {
        goc[idx] = { ...goc[idx], ...mapped };
      }
      localStorage.setItem("nguoiDung", JSON.stringify(goc));
      handleUserDetailClose();
    } catch (error){
      console.error("Cập nhật người dùng thất bại (localStorage)", error);
      setData(prevData);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
    }
  };

  // Add functions
  const handleAddUser = () => {
    setShowAddDialog(true);
  };

  const handleAddClose = () => {
    setShowAddDialog(false);
  };

  const handleAddSave = (newUser) => {
    // Tạo ID mới an toàn
    const safeIds = data.map((item) => Number(item.id)).filter(Number.isFinite);
    const maxId = safeIds.length ? Math.max(...safeIds) : 0;
    const userWithId = {
      ...newUser,
      id: String(maxId + 1),
    };

    // Thêm user mới vào danh sách hiển thị
    const prevData = data;
    const optimistic = [...data, userWithId];
    setData(optimistic);

    // Đồng bộ thêm vào localStorage.nguoiDung theo schema gốc
    try {
      const gocRaw = localStorage.getItem("nguoiDung");
      const goc = gocRaw ? JSON.parse(gocRaw) : [];
      const mapped = {
        idNguoiDung: userWithId.id,
        tenNguoiDung: userWithId.username,
        hoten: userWithId.fullname,
        email: userWithId.email,
        vaiTro: userWithId.role,
        ngayTaoTaiKhoan: userWithId.created || new Date().toISOString(),
        matkhau: userWithId.password || "",
        anhDaiDien: userWithId.image || "",
      };
      const next = [...(Array.isArray(goc) ? goc : []), mapped];
      localStorage.setItem("nguoiDung", JSON.stringify(next));
      handleAddClose();
    } catch (error){
      console.error("Thêm người dùng thất bại (localStorage)", error);
      setData(prevData);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
    }
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
      <h1>Quản Lý Người Dùng</h1>
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

      <TableAdmin Colums={ColumsTable} Data={filteredData} Action={Action} />

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
          Colums={ColumsEdit}
          showAvatar={true}
        />
      )}
      {showAddDialog && (
        <Add
          onClose={handleAddClose}
          onSave={handleAddSave}
          Colums={ColumsAdd}
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
          columns={ColumsXuat}
        />
      )}
    </div>
  );
};

export default MainContentAdminQuanUser;
