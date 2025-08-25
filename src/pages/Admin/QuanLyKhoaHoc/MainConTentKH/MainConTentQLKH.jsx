import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useMemo, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";
import "./MainConTentQLKH.css";

const MAIN_KEY = "khoaHoc";
const USER_KEY = "nguoiDung";

/* helpers */
const readJSON = (key, fallback = []) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const toVN = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");
const dateFromMaybeTs = (val) => {
  if (val == null) return null;
  const n = Number(val);
  if (Number.isFinite(n)) return new Date(n > 1e12 ? n : n * 1000);
  const ddmmyyyy = typeof val === "string" && val.includes("/");
  if (ddmmyyyy) {
    const [d, m, y] = val.split("/").map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  const d = new Date(val);
  return isNaN(d) ? null : d;
};

/* build display row from raw course */
const mapRow = (c, i, userLookup) => {
  const id = c?.idKhoaHoc ?? c?.id ?? `course_${i}`;
  const name = c?.tenKhoaHoc ?? c?.name ?? "(Không tên)";
  const createdDate =
    dateFromMaybeTs(c?.createdAt ?? c?.ngayTao ?? c?.created ?? c?.idKhoaHoc) ||
    new Date(0);
  const userCreated = userLookup(c?.idNguoiDung);

  return {
    id,
    name,
    userCreated,
    created: toVN(createdDate),
    _createdAt: createdDate.getTime(),
  };
};

const buildUserLookup = (users) => {
  const map = new Map();
  (users || []).forEach((u) => {
    const id = u?.idNguoiDung ?? u?.id;
    const label =
      u?.tenNguoiDung ??
      u?.name ??
      u?.displayName ??
      u?.username ??
      u?.email ??
      `ID: ${id}`;
    if (id != null) map.set(String(id), label);
  });
  const fn = (id) => map.get(String(id)) || (id != null ? `ID: ${id}` : "—");
  fn.options = Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  return fn;
};

const MainConTentQLKH = ({ Data = [] }) => {
  const ColumsBoThe = [
    { name: "ID", key: "id" },
    { name: "Tên Lớp Học", key: "name" },
    { name: "Người tạo", key: "userCreated" },
    { name: "Ngày tạo", key: "created" },
  ];

  const [users, setUsers] = useState(readJSON(USER_KEY, []));
  const userLookup = useMemo(() => buildUserLookup(users), [users]);

  const [data, setData] = useState(() =>
    (Array.isArray(readJSON(MAIN_KEY, [])) ? readJSON(MAIN_KEY, []) : [])
      .map((c, i) => mapRow(c, i, userLookup))
      .sort((a, b) => b._createdAt - a._createdAt)
      .map(({ _createdAt, ...rest }) => rest)
  );

  const [filteredData, setFilteredData] = useState(data);

  // delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Edit
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null); // row dạng display
  const [rawCourse, setRawCourse] = useState(null); // bản raw từ local
  const [isEditMode, setIsEditMode] = useState(false); // giữ API cũ của Edit

  // export
  const [exportModal, setExportModal] = useState(false);

  // đồng bộ khi local hoặc users thay đổi
  const reload = () => {
    const list = readJSON(MAIN_KEY, []);
    const rows = list
      .map((c, i) => mapRow(c, i, userLookup))
      .sort((a, b) => b._createdAt - a._createdAt)
      .map(({ _createdAt, ...rest }) => rest);
    setData(rows);
    setFilteredData(rows);
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key === MAIN_KEY || e?.key === USER_KEY) {
        setUsers(readJSON(USER_KEY, [])); // rebuild lookup
        reload();
      }
    };
    const onCoursesChanged = () => reload();
    window.addEventListener("storage", onStorage);
    window.addEventListener("coursesChanged", onCoursesChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("coursesChanged", onCoursesChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLookup]);

  /* Delete flow */
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };
  const onCloseDelete = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };
  const onConfirmDelete = (id) => {
    const list = readJSON(MAIN_KEY, []);
    const next = list.filter((c) => String(c?.idKhoaHoc ?? c?.id) !== String(id));
    writeJSON(MAIN_KEY, next);
    window.dispatchEvent(new Event("coursesChanged"));
    onCloseDelete();
  };

  /* Edit flow dùng Edit modal */
  const handleEdit = (id) => {
    const list = readJSON(MAIN_KEY, []);
    const raw = list.find((c) => String(c?.idKhoaHoc ?? c?.id) === String(id));
    if (!raw) return;

    setRawCourse(raw);
    setSelectedRow({
      id: raw.idKhoaHoc ?? raw.id,
      name: raw.tenKhoaHoc ?? raw.name ?? "",
      userCreated: String(raw.idNguoiDung ?? ""), // sẽ map sang dropdown
      created: toVN(
        dateFromMaybeTs(raw.createdAt ?? raw.ngayTao ?? raw.created ?? raw.idKhoaHoc)
      ),
      // thêm 2 field chỉ hiển thị
      memberCount: Array.isArray(raw.thanhVienIds) ? raw.thanhVienIds.length : 0,
      cardCount: Array.isArray(raw.boTheIds) ? raw.boTheIds.length : 0,
    });
    setShowEdit(true);
    setIsEditMode(false);
  };

  const handleUserDetailClose = () => {
    setShowEdit(false);
    setSelectedRow(null);
    setRawCourse(null);
    setIsEditMode(false);
  };

  const handleUserDetailSave = (updatedUser, isEdit = false) => {
    if (isEdit) {
      setIsEditMode(true);
      return;
    }
    if (!rawCourse) return;

    // Lấy id người tạo mới từ field userCreated (đang là ID dạng string do dropdown)
    const creatorId = updatedUser.userCreated
      ? Number(updatedUser.userCreated)
      : rawCourse.idNguoiDung;

    // Ghi localStorage
    const list = readJSON(MAIN_KEY, []);
    const idx = list.findIndex(
      (c) => String(c?.idKhoaHoc ?? c?.id) === String(updatedUser.id)
    );
    if (idx !== -1) {
      const next = [...list];
      next[idx] = {
        ...next[idx],
        tenKhoaHoc: updatedUser.name,
        idNguoiDung: creatorId,
      };
      writeJSON(MAIN_KEY, next);
      window.dispatchEvent(new Event("coursesChanged"));
    }

    // Cập nhật UI (bảng) — đổi name + displayName người tạo
    const label = buildUserLookup(readJSON(USER_KEY, [])).call
      ? buildUserLookup(readJSON(USER_KEY, [])).call(creatorId)
      : buildUserLookup(readJSON(USER_KEY, []))(creatorId);

    const displayName =
      buildUserLookup(readJSON(USER_KEY, []))(creatorId);

    setData((cur) =>
      cur.map((r) =>
        String(r.id) === String(updatedUser.id)
          ? { ...r, name: updatedUser.name, userCreated: displayName }
          : r
      )
    );
    setFilteredData((cur) =>
      cur.map((r) =>
        String(r.id) === String(updatedUser.id)
          ? { ...r, name: updatedUser.name, userCreated: displayName }
          : r
      )
    );

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

  // Tùy chọn dropdown Người tạo
  const userOptions = userLookup.options; // [{value,label}]

  return (
    <div className="main-content-admin-user">
      <h1>Quản Lý Lớp Học</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>
            Xuất
          </button>
        </div>
        <Search Data={data} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumsBoThe} Data={filteredData} Action={Action} />

      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa lớp học này không?"
        />
      )}

      {showEdit && selectedRow && (
        <Edit
          user={selectedRow}
          onClose={handleUserDetailClose}
          onSave={handleUserDetailSave}
          isEditMode={isEditMode}
          Colums={[
            ...ColumsBoThe,
            { name: "Số thành viên", key: "memberCount" },
            { name: "Số bộ thẻ", key: "cardCount" },
          ]}
          showAvatar={false}

          /* === thêm 3 prop nhẹ nhàng cho Edit === */
          readOnlyKeys={["id", "created", "memberCount", "cardCount"]} // ID/Ngày tạo/2 số liệu: chỉ xem
          selectFields={{
            // key trong dữ liệu -> option list [{value,label}]
            userCreated: userOptions,
          }}
          // Nhãn thay vì id khi Edit hiển thị field userCreated
          selectLabels={{
            userCreated: (val) => {
              const opt = userOptions.find((o) => String(o.value) === String(val));
              return opt ? opt.label : val;
            },
          }}
        />
      )}

      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          onExport={(list) => {
            console.log("Dữ liệu xuất:", list);
          }}
          filteredData={filteredData}
          title="Xuất thông tin lớp học"
          columns={ColumsBoThe}
          showAvatar={false}
        />
      )}
    </div>
  );
};

export default MainConTentQLKH;
