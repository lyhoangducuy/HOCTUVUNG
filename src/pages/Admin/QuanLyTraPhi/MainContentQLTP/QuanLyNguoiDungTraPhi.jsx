import { useEffect, useState } from "react";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";

/* ===== Helpers ngày VN ===== */
const parseVN = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, (m || 1) - 1, d || 1);
};
const fmtVN = (d) => (d instanceof Date ? d.toLocaleDateString("vi-VN") : "");

/* ===== ID đăng ký tự tạo ===== */
const genSubId = () => "SUB_" + Date.now();

/* ===== Lấy thòi hạn theo idGoi ===== */
const getThoiHanById = (idGoi) => {
  const packs = JSON.parse(localStorage.getItem("goiTraPhi") || "[]");
  return packs.find((p) => p.idGoi === idGoi)?.thoiHan ?? 0;
};

/* ===== Xây hàng dữ liệu cho bảng (join user + pack) ===== */
function buildRows() {
  const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
  const users = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
  const packs = JSON.parse(localStorage.getItem("goiTraPhi") || "[]");

  const today = new Date();
  return subs.map((s) => {
    const u = users.find((x) => x.idNguoiDung === s.idNguoiDung);
    const p = packs.find((x) => x.idGoi === s.idGoi);

    let status = "Không xác định";
    try {
      const end = parseVN(s.NgayKetThuc);
      if (end) status = end >= today ? "Đang hoạt động" : "Hết hạn";
    } catch {}

    return {
      // các field để TableAdmin hiển thị
      id: s.idGTPCND,                 // 🔑 mirror id
      username: u?.tenNguoiDung || `User ${s.idNguoiDung}`,
      package: p?.tenGoi || s.idGoi,
      status,
      created: s.NgayBatDau,
      endDate: s.NgayKetThuc,

      // giữ lại để mở Edit
      idNguoiDung: s.idNguoiDung,
      idGoi: s.idGoi,
    };
  });
}

export default function QuanLyNguoiDungTraPhi() {
  /* ===== Cấu hình bảng ===== */
  const ColumnsTable = [
    { name: "ID", key: "id" },
    { name: "Tên người dùng", key: "username" },
    { name: "Gói học", key: "package" },
    { name: "Trạng thái", key: "status" },
    { name: "Ngày bắt đầu", key: "created" },
    { name: "Ngày hết hạn", key: "endDate" },
  ];

  /* ===== Cấu hình form (Add/Edit) ===== */
  // Dùng input thường theo component Add/Edit sẵn có của bạn
  const ColumnsForm = [
    { name: "ID người dùng", key: "idNguoiDung" },
    { name: "ID gói", key: "idGoi" },
    { name: "Ngày bắt đầu (dd/mm/yyyy)", key: "NgayBatDau" },
  ];

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  /* Delete dialog */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  /* Edit dialog */
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null); // { id, idNguoiDung, idGoi, NgayBatDau }

  /* Add dialog */
  const [showAdd, setShowAdd] = useState(false);

  /* ===== Load từ localStorage ===== */
  const reload = () => {
    const rows = buildRows();
    setData(rows);
    setFilteredData(rows);
  };

  useEffect(() => {
    reload();
  }, []);

  /* ===== Delete flow ===== */
  const handleDeleteAsk = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };
  const handleDeleteClose = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };
  const handleDeleteConfirm = (id) => {
    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const next = subs.filter((x) => x.idGTPCND !== id);
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(next));
    handleDeleteClose();
    reload();
  };

  /* ===== Edit flow ===== */
  const handleEditOpen = (id) => {
    const row = data.find((x) => x.id === id);
    if (!row) return;
    setSelectedRow({
      id: row.id,
      idNguoiDung: row.idNguoiDung,
      idGoi: row.idGoi,
      NgayBatDau: row.created, // đang lưu dạng dd/mm/yyyy
    });
    setShowEdit(true);
  };
  const handleEditClose = () => {
    setShowEdit(false);
    setSelectedRow(null);
  };

  const handleSaveEdit = (payload) => {
    // payload có: { id, idNguoiDung, idGoi, NgayBatDau }
    if (!payload?.id || !payload?.idNguoiDung || !payload?.idGoi || !payload?.NgayBatDau) {
      alert("Vui lòng nhập đủ: ID người dùng, ID gói, Ngày bắt đầu (dd/mm/yyyy).");
      return;
    }

    const thoiHan = getThoiHanById(payload.idGoi);
    const start = parseVN(payload.NgayBatDau) || new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + thoiHan);

    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const idx = subs.findIndex((x) => x.idGTPCND === payload.id);
    if (idx < 0) {
      alert("Không tìm thấy bản ghi cần sửa.");
      return;
    }

    subs[idx] = {
      ...subs[idx],
      idNguoiDung: Number(payload.idNguoiDung),
      idGoi: payload.idGoi,
      NgayBatDau: fmtVN(start),
      NgayKetThuc: fmtVN(end),
    };
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(subs));

    handleEditClose();
    reload();
  };

  /* ===== Add flow ===== */
  const handleAddOpen = () => setShowAdd(true);
  const handleAddClose = () => setShowAdd(false);

  const handleAddSave = (payload) => {
    // payload mong muốn: { idNguoiDung, idGoi, NgayBatDau }
    if (!payload?.idNguoiDung || !payload?.idGoi || !payload?.NgayBatDau) {
      alert("Vui lòng nhập: ID người dùng, ID gói, Ngày bắt đầu (dd/mm/yyyy).");
      return;
    }

    const thoiHan = getThoiHanById(payload.idGoi);
    if (!thoiHan) {
      alert("ID gói không hợp lệ hoặc thiếu thời hạn.");
      return;
    }

    const start = parseVN(payload.NgayBatDau) || new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + thoiHan);

    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const newSub = {
      idGTPCND: genSubId(),
      idNguoiDung: Number(payload.idNguoiDung),
      idGoi: payload.idGoi,
      NgayBatDau: fmtVN(start),
      NgayKetThuc: fmtVN(end),
    };
    subs.push(newSub);
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(subs));

    handleAddClose();
    reload();
  };

  /* ===== Actions cho TableAdmin (onClick nhận (id)) ===== */
  const Action = [
    { name: "👀", title: "Sửa", onClick: (id) => handleEditOpen(id) },
    { name: "🗑️", title: "Xoá", onClick: (id) => handleDeleteAsk(id) },
  ];

  return (
    <div className="main-content-admin-user">
      <h2>Quản lý trả phí của người dùng</h2>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={handleAddOpen}>
            Thêm
          </button>
        </div>
        <Search Data={data} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumnsTable} Data={filteredData} Action={Action} />

      {/* Delete dialog */}
      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          message="Bạn có muốn xóa đăng ký trả phí này không?"
        />
      )}

      {/* Edit dialog */}
      {showEdit && selectedRow && (
        <Edit
          user={selectedRow}
          onClose={handleEditClose}
          onSave={handleSaveEdit}
          Colums={ColumnsForm}
          showAvatar={false}
        />
      )}

      {/* Add dialog */}
      {showAdd && (
        <Add
          onClose={handleAddClose}
          onSave={handleAddSave}
          Colums={ColumnsForm}
          showAvatar={false}
        />
      )}
    </div>
  );
}
