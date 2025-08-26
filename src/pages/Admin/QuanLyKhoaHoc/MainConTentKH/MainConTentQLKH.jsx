import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useMemo, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";
import "./MainConTentQLKH.css";

import { db } from "../../../../../lib/firebase"; // chỉnh lại nếu đường dẫn khác
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

/* --- utils --- */
const toVN = (date) =>
  date instanceof Date && !isNaN(date) ? date.toLocaleDateString("vi-VN") : "";

const fromMaybeTs = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate(); // Firestore Timestamp
  if (typeof val === "string" && val.includes("/")) {
    const [d, m, y] = val.split("/").map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  if (Number.isFinite(Number(val))) {
    const n = Number(val);
    return new Date(n > 1e12 ? n : n * 1000);
  }
  const d = new Date(val);
  return isNaN(d) ? null : d;
};

/* --- Firestore helpers --- */
async function getCourseDocRefByAnyId(id) {
  // 1) Thử coi id là docId
  const ref1 = doc(db, "khoaHoc", String(id));
  const snap1 = await getDoc(ref1);
  if (snap1.exists()) return ref1;

  // 2) Fallback: tìm tài liệu có field idKhoaHoc == id
  const q1 = query(collection(db, "khoaHoc"), where("idKhoaHoc", "==", String(id)), limit(1));
  const rs = await getDocs(q1);
  if (!rs.empty) return rs.docs[0].ref;

  return null;
}

async function getCourseByAnyId(id) {
  const ref = await getCourseDocRefByAnyId(id);
  if (!ref) return null;
  const snap = await getDoc(ref);
  return snap.exists() ? { _docId: snap.id, ...snap.data() } : null;
}

const MainConTentQLKH = ({ Data = [] }) => {
  const ColumsBoThe = [
    { name: "ID", key: "id" },
    { name: "Tên Lớp Học", key: "name" },
    { name: "Người tạo", key: "userCreated" },
    { name: "Ngày tạo", key: "created" },
  ];

  // dữ liệu bảng lấy từ prop Data (do parent đã realtime)
  const [data, setData] = useState(Data);
  const [filteredData, setFilteredData] = useState(Data);

  // users để build dropdown “Người tạo”
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setData(Data);
    setFilteredData(Data);
  }, [Data]);

  // realtime users
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "nguoiDung"),
      (snap) => {
        const list = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
        setUsers(list);
      },
      () => setUsers([])
    );
    return () => unsub();
  }, []);

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: String(u.idNguoiDung ?? u._docId),
        label: u.tenNguoiDung || u.username || u.email || `ID: ${u.idNguoiDung ?? u._docId}`,
      })),
    [users]
  );
  const userLabelById = useMemo(() => {
    const m = new Map(userOptions.map((o) => [String(o.value), o.label]));
    return (id) => m.get(String(id)) || (id != null ? `ID: ${id}` : "—");
  }, [userOptions]);

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null); // {id,name,userCreated,created,...}
  const [rawCourse, setRawCourse] = useState(null);      // raw từ Firestore
  const [isEditMode, setIsEditMode] = useState(false);

  // Export
  const [exportModal, setExportModal] = useState(false);

  /* Delete flow */
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };
  const onCloseDelete = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };
  const onConfirmDelete = async (idFromModal) => {
    const id = idFromModal ?? deleteId;
    if (!id) return;

    // UI optimistic
    setData((prev) => prev.filter((r) => String(r.id) !== String(id)));
    setFilteredData((prev) => prev.filter((r) => String(r.id) !== String(id)));

    try {
      const ref = await getCourseDocRefByAnyId(id);
      if (ref) {
        await deleteDoc(ref);
      } else {
        console.warn("Không tìm thấy tài liệu 'khoaHoc' để xoá:", id);
      }
      // (tuỳ chọn) có thể dọn tham chiếu ở nơi khác (nếu có)
    } catch (e) {
      console.error("Xoá lớp học thất bại:", e);
    }

    onCloseDelete();
  };

  /* Edit flow */
  const handleEdit = async (id) => {
    try {
      const raw = await getCourseByAnyId(id);
      if (!raw) return;

      setRawCourse(raw);
      setSelectedRow({
        id: raw.idKhoaHoc ?? raw._docId,
        name: raw.tenKhoaHoc ?? "",
        userCreated: String(raw.idNguoiDung ?? ""), // sẽ hiển thị bằng select
        created: toVN(
          fromMaybeTs(raw.createdAt) ||
            fromMaybeTs(raw.ngayTao) ||
            fromMaybeTs(raw._docId)
        ),
        // thêm vài số liệu đọc-only nếu muốn
        memberCount: Array.isArray(raw.thanhVienIds) ? raw.thanhVienIds.length : 0,
        cardCount: Array.isArray(raw.boTheIds) ? raw.boTheIds.length : 0,
      });

      setShowEdit(true);
      setIsEditMode(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserDetailClose = () => {
    setShowEdit(false);
    setSelectedRow(null);
    setRawCourse(null);
    setIsEditMode(false);
  };

  const handleUserDetailSave = async (updatedUser, flagIsEditMode = false) => {
    if (flagIsEditMode) {
      setIsEditMode(true);
      return;
    }
    if (!rawCourse) return;

    const newName = updatedUser.name ?? "";
    const newCreatorId = updatedUser.userCreated
      ? String(updatedUser.userCreated)
      : String(rawCourse.idNguoiDung ?? "");

    // UI optimistic
    setData((cur) =>
      cur.map((r) =>
        String(r.id) === String(updatedUser.id)
          ? { ...r, name: newName, userCreated: userLabelById(newCreatorId) }
          : r
      )
    );
    setFilteredData((cur) =>
      cur.map((r) =>
        String(r.id) === String(updatedUser.id)
          ? { ...r, name: newName, userCreated: userLabelById(newCreatorId) }
          : r
      )
    );

    // Firestore update
    try {
      const ref = await getCourseDocRefByAnyId(updatedUser.id);
      if (!ref) {
        console.warn("Không tìm thấy tài liệu 'khoaHoc' để cập nhật:", updatedUser.id);
      } else {
        await updateDoc(ref, {
          tenKhoaHoc: newName,
          idNguoiDung: newCreatorId,
        });
      }
    } catch (e) {
      console.error("Cập nhật lớp học thất bại:", e);
    }

    handleUserDetailClose();
  };

  /* Hành động từng dòng */
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
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>
            Xuất
          </button>
        </div>
        <Search Data={data} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumsBoThe} Data={filteredData} Action={Action} />

      {/* Xoá */}
      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa lớp học này không?"
        />
      )}

      {/* Sửa / Xem */}
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
          readOnlyKeys={["id", "created", "memberCount", "cardCount"]}
          selectFields={{
            userCreated: userOptions, // dropdown người tạo
          }}
          selectLabels={{
            userCreated: (val) => {
              const opt = userOptions.find((o) => String(o.value) === String(val));
              return opt ? opt.label : val;
            },
          }}
        />
      )}

      {/* Xuất */}
      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          onExport={(rows) => console.log("Dữ liệu export:", rows)}
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
