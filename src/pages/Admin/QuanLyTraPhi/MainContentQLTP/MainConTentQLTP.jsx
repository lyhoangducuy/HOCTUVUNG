import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useMemo, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import ExportModal from "../../../../components/ExportModal/ExportModal";
import Add from "../../../../components/Admin/Add/Add";
import "./MainContentQLTP.css";

/* ===== Helpers ngày VN ===== */
const parseVN = (dmy) => {
  if (!dmy) return null;
  const [d, m, y] = dmy.split("/").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const fmtVN = (d) => d.toLocaleDateString("vi-VN");

/* ===== Fallback gói nếu chưa có bảng goiTraPhi ===== */
const FALLBACK_PACKS = [
  { idGoi: "BASIC1", tenGoi: "1 tháng", thoiHan: 30 },
  { idGoi: "PRO1Y", tenGoi: "1 năm", thoiHan: 365 },
];

const PLACEHOLDER_AVT = "https://via.placeholder.com/40";

/* ===== Join dữ liệu để hiển thị bảng ===== */
function buildRows() {
  const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
  const users = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
  const packs =
    JSON.parse(localStorage.getItem("goiTraPhi") || "null")?.length
      ? JSON.parse(localStorage.getItem("goiTraPhi"))
      : FALLBACK_PACKS;

  const today = new Date();

  return subs.map((s) => {
    const u = users.find((x) => x.idNguoiDung === s.idNguoiDung);
    const p = packs.find((x) => x.idGoi === s.idGoi);
    const end = parseVN(s.NgayKetThuc);

    let status = "Không xác định";
    if (end) status = end >= today ? "Đang hoạt động" : "Hết hạn";

    return {
      id: s.idGTPCND,                  // dùng làm khoá & xoá/sửa
      image: u?.anhDaiDien || PLACEHOLDER_AVT,
      username: u?.tenNguoiDung || `User ${s.idNguoiDung}`,
      idNguoiDung: s.idNguoiDung,
      package: p?.tenGoi || s.idGoi,
      idGoi: s.idGoi,
      status,
      created: s.NgayBatDau,
      endDate: s.NgayKetThuc,
    };
  });
}

/* ===== Lấy thòi hạn theo idGoi ===== */
function getThoiHanById(idGoi) {
  const packs =
    JSON.parse(localStorage.getItem("goiTraPhi") || "null")?.length
      ? JSON.parse(localStorage.getItem("goiTraPhi"))
      : FALLBACK_PACKS;
  return packs.find((p) => p.idGoi === idGoi)?.thoiHan ?? 0;
}

const MainContentQLTP = () => {
  /* ===== Columns hiển thị bảng ===== */
  const ColumnsTable = [
    { name: "ID", key: "id" },
    { name: "Tên người dùng", key: "username" },
    { name: "Gói học", key: "package" },
    { name: "Trạng thái", key: "status" },
    { name: "Ngày đăng ký", key: "created" },
    { name: "Ngày hết hạn", key: "endDate" },
  ];

  /* ===== Columns cho form Add/Edit (làm việc theo dữ liệu thật) ===== */
  const ColumnsForm = [
    { name: "ID người dùng", key: "idNguoiDung" },
    { name: "ID gói (idGoi)", key: "idGoi" },
    { name: "Ngày bắt đầu (dd/mm/yyyy)", key: "NgayBatDau" },
    // Ngày kết thúc sẽ tính từ thoiHan của gói → không cho nhập
  ];

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  /* Delete dialog */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  /* Add/Edit dialog */
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // giữ API theo component Edit hiện có

  /* Export modal */
  const [exportModal, setExportModal] = useState(false);

  /* ===== Load từ localStorage ===== */
  const reload = () => {
    const rows = buildRows();
    setData(rows);
    setFilteredData(rows);
  };

  useEffect(() => {
    reload();

    // cập nhật realtime khi tab khác ghi subscription
    const onStorage = (e) => {
      if (e.key === "goiTraPhiCuaNguoiDung" || e.key === "nguoiDung" || e.key === "goiTraPhi") {
        reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ===== Actions bảng ===== */
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const onConfirmDelete = (id) => {
    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const newSubs = subs.filter((x) => x.idGTPCND !== id);
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(newSubs));

    setShowDeleteDialog(false);
    setDeleteId(null);
    reload();
  };

  const handleEdit = (id) => {
    const row = data.find((x) => x.id === id);
    if (!row) return;
    // Chuẩn hoá dữ liệu cho form Edit
    setSelectedRow({
      id: row.id,
      idNguoiDung: row.idNguoiDung,
      idGoi: row.idGoi,
      NgayBatDau: row.created,
    });
    setShowEdit(true);
    setIsEditMode(false);
  };

  const handleUserDetailClose = () => {
    setShowEdit(false);
    setSelectedRow(null);
    setIsEditMode(false);
  };

  /* Edit save: update subs thật rồi reload */
  const handleUserDetailSave = (updated, flagIsEditMode = false) => {
    // Giữ tương thích API component Edit
    if (flagIsEditMode) {
      setIsEditMode(true);
      return;
    }
    if (!updated?.id || !updated?.idNguoiDung || !updated?.idGoi || !updated?.NgayBatDau) {
      alert("Thiếu dữ liệu bắt buộc (id, idNguoiDung, idGoi, NgayBatDau).");
      return;
    }

    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const idx = subs.findIndex((x) => x.idGTPCND === updated.id);
    if (idx < 0) {
      alert("Không tìm thấy bản ghi cần sửa.");
      return;
    }

    // Tính lại ngày kết thúc theo gói
    const thoiHan = getThoiHanById(updated.idGoi);
    const start = parseVN(updated.NgayBatDau) || new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + thoiHan);

    subs[idx] = {
      ...subs[idx],
      idNguoiDung: updated.idNguoiDung,
      idGoi: updated.idGoi,
      NgayBatDau: fmtVN(start),
      NgayKetThuc: fmtVN(end),
    };
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(subs));

    handleUserDetailClose();
    reload();
  };

  /* Add */
  const handleAddUser = () => setShowAddDialog(true);
  const handleAddClose = () => setShowAddDialog(false);

  const handleAddSave = (payload) => {
    // payload mong muốn: { idNguoiDung, idGoi, NgayBatDau }
    if (!payload?.idNguoiDung || !payload?.idGoi || !payload?.NgayBatDau) {
      alert("Vui lòng nhập: ID người dùng, ID gói, Ngày bắt đầu (dd/mm/yyyy).");
      return;
    }

    const thoiHan = getThoiHanById(payload.idGoi);
    if (!thoiHan) {
      alert("ID gói không hợp lệ hoặc thiếu thoiHan.");
      return;
    }

    const start = parseVN(payload.NgayBatDau) || new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + thoiHan);

    const subs = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const newSub = {
      idGTPCND: "SUB" + Date.now(),
      idNguoiDung: payload.idNguoiDung,
      idGoi: payload.idGoi,
      NgayBatDau: fmtVN(start),
      NgayKetThuc: fmtVN(end),
    };
    subs.push(newSub);
    localStorage.setItem("goiTraPhiCuaNguoiDung", JSON.stringify(subs));

    handleAddClose();
    reload();
  };

  /* ===== Hành động cell ===== */
  const Action = useMemo(
    () => [
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
    ],
    [data]
  );

  return (
    <div className="main-content-admin-user">
      <h1>Quản Lý Trả Phí</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={handleAddUser}>
            Thêm
          </button>
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>
            Xuất
          </button>
        </div>

        {/* Search dùng data hiển thị */}
        <Search Data={data} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumnsTable} Data={filteredData} Action={Action} />

      {/* Delete dialog */}
      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeleteId(null);
          }}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa bản ghi trả phí này không?"
        />
      )}

      {/* Edit dialog (làm việc theo dữ liệu thật) */}
      {showEdit && selectedRow && (
        <Edit
          user={selectedRow}
          onClose={handleUserDetailClose}
          onSave={handleUserDetailSave}
          isEditMode={isEditMode}
          Colums={ColumnsForm}
          showAvatar={false}
        />
      )}

      {/* Add dialog */}
      {showAddDialog && (
        <Add
          onClose={handleAddClose}
          onSave={handleAddSave}
          Colums={ColumnsForm}
          showAvatar={false}
        />
      )}

      {/* Export */}
      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          onExport={(rows) => {
            // tuỳ app của bạn, ở đây chỉ log
            console.log("Dữ liệu export:", rows);
          }}
          filteredData={filteredData}
          title="Xuất danh sách trả phí"
          columns={ColumnsTable}
        />
      )}
    </div>
  );
};

export default MainContentQLTP;
