import { useEffect, useMemo, useState } from "react";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";

// ===== Helpers =====
const genPackId = () => "GOI_" + Date.now();
const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// Tải danh sách gói từ localStorage
const loadPacks = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("goiTraPhi") || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

// Lưu lại localStorage
const savePacks = (arr) => {
  localStorage.setItem("goiTraPhi", JSON.stringify(arr));
};

export default function QuanLyGoiTraPhi() {
  // ===== Cấu hình cột bảng (TableAdmin) =====
  const ColumnsTable = [
    { name: "ID gói", key: "idGoi" },
    { name: "Tên gói", key: "tenGoi" },
    { name: "Mô tả", key: "moTa" },
    { name: "Giá (đ)", key: "giaGoiFmt" },
    { name: "Giảm (%)", key: "giamGia" },
    { name: "Giá sau giảm (đ)", key: "giaSauGiamFmt" },
    { name: "Thời hạn (ngày)", key: "thoiHan" },
  ];

  // ===== Cấu hình form (Add/Edit) =====
  // Không cho nhập id → chỉ các field bên dưới
  const ColumnsForm = [
    { name: "Tên gói", key: "tenGoi" },
    { name: "Mô tả", key: "moTa" },
    { name: "Giá (đ)", key: "giaGoi" },
    { name: "Giảm giá (%)", key: "giamGia" },
    { name: "Thời hạn (ngày)", key: "thoiHan" },
  ];

  // ===== State =====
  const [rows, setRows] = useState([]);          // dữ liệu hiển thị (đã format + id mirror)
  const [filtered, setFiltered] = useState([]);  // dữ liệu sau khi search

  // Delete dialog
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null); // { id, idGoi, tenGoi, ... }

  // Add dialog
  const [showAdd, setShowAdd] = useState(false);

  // ===== Load lần đầu =====
  useEffect(() => {
    reload();
  }, []);

  // Tạo rows hiển thị (có id mirror và các field format)
  const buildRows = (packs) =>
    packs.map((p) => {
      const giaGoi = toNum(p.giaGoi, 0);
      const giamGia = toNum(p.giamGia, 0);
      const giaSauGiam = Math.max(0, Math.round(giaGoi * (1 - giamGia / 100)));
      return {
        // các field gốc
        idGoi: p.idGoi,
        tenGoi: p.tenGoi,
        moTa: p.moTa || "",
        giaGoi: giaGoi,
        giamGia: giamGia,
        thoiHan: toNum(p.thoiHan, 0),

        // field phục vụ TableAdmin
        id: p.idGoi,                          // mirror để TableAdmin dùng làm key & Action
        giaGoiFmt: giaGoi.toLocaleString(),
        giaSauGiamFmt: giaSauGiam.toLocaleString(),
      };
    });

  // Reload từ localStorage → set rows + filtered
  const reload = () => {
    const packs = loadPacks();
    const r = buildRows(packs);
    setRows(r);
    setFiltered(r);
  };

  // ====== Delete flow ======
  const askDelete = (id) => {
    setDeleteId(id);
    setShowDelete(true);
  };
  const closeDelete = () => {
    setShowDelete(false);
    setDeleteId(null);
  };
  const confirmDelete = (id) => {
    const packs = loadPacks().filter((p) => p.idGoi !== id);
    savePacks(packs);
    closeDelete();
    reload();
  };

  // ====== Edit flow ======
  const openEdit = (id) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    // giữ "id" để Edit khi Save trả về ta biết record nào
    setSelectedRow({
      id: row.id,           // mirror idGoi
      idGoi: row.idGoi,     // để dùng khi lưu
      tenGoi: row.tenGoi,
      moTa: row.moTa,
      giaGoi: row.giaGoi,
      giamGia: row.giamGia,
      thoiHan: row.thoiHan,
    });
    setShowEdit(true);
  };
  const closeEdit = () => {
    setShowEdit(false);
    setSelectedRow(null);
  };

  // Lưu Edit (Edit sẽ gọi onSave(payload))
  const handleSaveEdit = (payload) => {
    // payload chứa các field theo ColumnsForm + giữ nguyên "id" do ta đã set trong selectedRow
    const id = payload?.id || selectedRow?.id; // mirror idGoi
    if (!id) return;

    // Validate nhẹ
    const g = toNum(payload.giaGoi, 0);
    const gg = toNum(payload.giamGia, 0);
    const t = toNum(payload.thoiHan, 0);
    if (gg < 0 || gg > 100) {
      alert("Giảm giá phải nằm trong khoảng 0 - 100%");
      return;
    }

    const packs = loadPacks();
    const idx = packs.findIndex((p) => p.idGoi === id);
    if (idx < 0) return;

    packs[idx] = {
      ...packs[idx],
      tenGoi: String(payload.tenGoi || "").trim(),
      moTa: String(payload.moTa || "").trim(),
      giaGoi: g,
      giamGia: gg,
      thoiHan: t,
    };

    savePacks(packs);
    closeEdit();
    reload();
  };

  // ====== Add flow ======
  const openAdd = () => setShowAdd(true);
  const closeAdd = () => setShowAdd(false);

  // Add lưu — Add sẽ trả về payload theo ColumnsForm
  const handleAddSave = (payload) => {
    const tenGoi = String(payload.tenGoi || "").trim();
    if (!tenGoi) {
      alert("Vui lòng nhập tên gói");
      return;
    }
    const g = toNum(payload.giaGoi, 0);
    const gg = toNum(payload.giamGia, 0);
    const t = toNum(payload.thoiHan, 0);
    if (gg < 0 || gg > 100) {
      alert("Giảm giá phải nằm trong khoảng 0 - 100%");
      return;
    }

    const newPack = {
      idGoi: genPackId(),      // ✅ ID tự tạo
      tenGoi,
      moTa: String(payload.moTa || "").trim(),
      giaGoi: g,
      giamGia: gg,
      thoiHan: t,
    };

    const packs = loadPacks();
    packs.push(newPack);
    savePacks(packs);
    closeAdd();
    reload();
  };

  // ===== Actions cho TableAdmin (sử dụng API mới onClick(id, item)) =====
  const Action = useMemo(
    () => [
      {
        name: "👀",
        title: "Sửa",
        onClick: (id) => openEdit(id),
      },
      {
        name: "🗑️",
        title: "Xoá",
        onClick: (id) => askDelete(id),
      },
    ],
    [rows]
  );

  return (
    <div className="main-content-admin-user">
      <h2>Quản lý gói trả phí</h2>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={openAdd}>Thêm gói</button>
        </div>
        <Search Data={rows} onResult={setFiltered} />
      </div>

      <TableAdmin Colums={ColumnsTable} Data={filtered} Action={Action} />

      {/* Delete dialog */}
      {showDelete && (
        <Delete
          id={deleteId}
          onClose={closeDelete}
          onConfirm={confirmDelete}
          message="Bạn có chắc chắn muốn xoá gói này?"
        />
      )}

      {/* Edit dialog */}
      {showEdit && selectedRow && (
        <Edit
          user={selectedRow}               // phải có { id: <idGoi> } để Edit trả về payload.id
          onClose={closeEdit}
          onSave={handleSaveEdit}
          Colums={ColumnsForm}
          showAvatar={false}
        />
      )}

      {/* Add dialog */}
      {showAdd && (
        <Add
          onClose={closeAdd}
          onSave={handleAddSave}
          Colums={ColumnsForm}
          showAvatar={false}
        />
      )}
    </div>
  );
}
