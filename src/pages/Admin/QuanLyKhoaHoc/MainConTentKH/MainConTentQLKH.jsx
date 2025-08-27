// src/pages/Admin/QuanLyTraPhi/QuanLyKhoaHoc.jsx
// (hoặc MainConTentQLKH.jsx)
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useMemo, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";
import * as yup from "yup";
import "./MainConTentQLKH.css";

import { db } from "../../../../../lib/firebase";
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

/* ========== Tiện ích ngày giờ ========== */
const toVN = (date) =>
  date instanceof Date && !Number.isNaN(date) ? date.toLocaleDateString("vi-VN") : "";

const fromMaybeTs = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate(); // Timestamp Firestore
  if (typeof val === "string" && val.includes("/")) {
    const [d, m, y] = val.split("/").map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  if (Number.isFinite(Number(val))) {
    const n = Number(val);
    return new Date(n > 1e12 ? n : n * 1000);
  }
  const d = new Date(val);
  return Number.isNaN(d) ? null : d;
};

/* ========== Trợ giúp Firestore ========== */
async function getCourseDocRefByAnyId(id) {
  const ref1 = doc(db, "khoaHoc", String(id));
  const snap1 = await getDoc(ref1);
  if (snap1.exists()) return ref1;

  const q1 = query(
    collection(db, "khoaHoc"),
    where("idKhoaHoc", "==", String(id)),
    limit(1)
  );
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

/* ========== Thành phần chính ========== */
const MainConTentQLKH = ({ Data = [] }) => {
  /* Danh sách người dùng (để hiện “Người tạo”) */
  const [users, setUsers] = useState([]);
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
        label:
          u.tenNguoiDung || u.username || u.email || `ID: ${u.idNguoiDung ?? u._docId}`,
      })),
    [users]
  );
  const userLabelById = useMemo(() => {
    const m = new Map(userOptions.map((o) => [String(o.value), o.label]));
    return (id) => m.get(String(id)) || (id != null ? `ID: ${id}` : "—");
  }, [userOptions]);
  const userIdSet = useMemo(
    () => new Set(userOptions.map((o) => String(o.value))),
    [userOptions]
  );

  /* Chuẩn hoá hàng dữ liệu cho bảng (đúng theo ảnh + thêm Ngày tạo) */
  const rows = useMemo(() => {
    return (Array.isArray(Data) ? Data : []).map((r) => {
      const createdRaw =
        fromMaybeTs(r.ngayTao) || fromMaybeTs(r.createdAt) || fromMaybeTs(r._docId);
      const creatorId = String(r.idNguoiDung ?? r.userCreated ?? "");
      const kienThucArr = Array.isArray(r.kienThuc) ? r.kienThuc : [];
      return {
        id: String(r.idKhoaHoc ?? r._docId ?? r.id ?? ""),
        name: r.tenKhoaHoc ?? r.name ?? "",
        userCreated: userLabelById(creatorId),
        knowledgeText: kienThucArr.join(", "),
        description: r.moTa ?? "",
        created: toVN(createdRaw),
        _creatorId: creatorId, // dùng cho popup sửa
      };
    });
  }, [Data, userLabelById]);

  const [filteredData, setFilteredData] = useState(rows);
  useEffect(() => setFilteredData(rows), [rows]);

  /* Cột bảng – đúng theo ảnh + Ngày tạo */
  const ColumsBoThe = [
    { name: "Mã", key: "id" },
    { name: "Tên khóa học", key: "name" },
    { name: "Người tạo", key: "userCreated" },
    { name: "Kiến thức", key: "knowledgeText" },
    { name: "Mô tả", key: "description" },
    { name: "Ngày tạo", key: "created" },
  ];

  /* Xoá */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  /* Sửa/Xem */
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rawCourse, setRawCourse] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  /* Xuất */
  const [exportModal, setExportModal] = useState(false);

  /* ===== Xoá ===== */
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

    try {
      const ref = await getCourseDocRefByAnyId(id);
      if (!ref) {
        console.warn("Không tìm thấy tài liệu 'khoaHoc' để xoá:", id);
        onCloseDelete();
        return;
      }
      const snap = await getDoc(ref);
      const course = { _docId: ref.id, ...snap.data() };
      const customId = String(course.idKhoaHoc ?? course._docId);

      // Không cho xoá nếu vẫn còn bộ thẻ trỏ tới khoá học này
      const cBoThe = collection(db, "boThe");
      const q1 = query(cBoThe, where("idKhoaHoc", "==", customId));
      const q2 =
        customId !== course._docId
          ? query(cBoThe, where("idKhoaHoc", "==", course._docId))
          : null;

      const [s1, s2] = await Promise.all([getDocs(q1), q2 ? getDocs(q2) : Promise.resolve(null)]);
      const linkedCount = (s1?.size || 0) + (s2?.size || 0);

      if (linkedCount > 0) {
        alert(
          `Không thể xoá vì còn ${linkedCount} bộ thẻ đang tham chiếu tới khóa học này.\n` +
            `Vui lòng xoá/đổi liên kết các bộ thẻ trước.`
        );
        onCloseDelete();
        return;
      }

      await deleteDoc(ref);
    } catch (e) {
      console.error("Xoá khóa học thất bại:", e);
      alert("Xoá khóa học thất bại.");
    }
    onCloseDelete();
  };

  /* ===== Sửa/Xem ===== */
  const handleEdit = async (id) => {
    try {
      const raw = await getCourseByAnyId(id);
      if (!raw) return;

      const createdStr =
        toVN(fromMaybeTs(raw.ngayTao) || fromMaybeTs(raw.createdAt) || fromMaybeTs(raw._docId));
      const creatorId = String(raw.idNguoiDung ?? "");
      const knowledge = Array.isArray(raw.kienThuc) ? raw.kienThuc : [];

      setRawCourse(raw);
      setSelectedRow({
        id: raw.idKhoaHoc ?? raw._docId,
        name: raw.tenKhoaHoc ?? "",
        userCreated: creatorId,
        description: raw.moTa ?? "",
        knowledgeText: knowledge.join(", "),
        created: createdStr, // chỉ hiển thị
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

  const validationSchema = useMemo(
    () =>
      yup.object({
        name: yup
          .string()
          .trim()
          .required("Tên khóa học không được để trống")
          .min(3, "Tên tối thiểu 3 ký tự")
          .max(120, "Tên tối đa 120 ký tự"),
        userCreated: yup
          .string()
          .required("Vui lòng chọn người tạo")
          .test("valid-creator", "Người tạo không hợp lệ", (v) =>
            v ? userIdSet.has(String(v)) : false
          ),
        description: yup.string().max(1000, "Mô tả tối đa 1000 ký tự").nullable(),
        knowledgeText: yup.string().nullable(),
      }),
    [userIdSet]
  );

  const tachDanhSach = (s) =>
    String(s || "")
      .split(/[;,]/)
      .map((x) => x.trim())
      .filter(Boolean);

  const handleUserDetailSave = async (updated, flagIsEditMode = false) => {
    if (flagIsEditMode) {
      setIsEditMode(true);
      return;
    }
    if (!rawCourse) return;

    const newName = String(updated.name ?? "").trim();
    const newCreatorId = String(updated.userCreated ?? rawCourse.idNguoiDung ?? "");
    const newDesc = String(updated.description ?? "").trim();
    const newKnowledge = tachDanhSach(updated.knowledgeText);

    try {
      const ref = await getCourseDocRefByAnyId(updated.id);
      if (!ref) {
        console.warn("Không tìm thấy tài liệu 'khoaHoc' để cập nhật:", updated.id);
      } else {
        await updateDoc(ref, {
          tenKhoaHoc: newName,
          idNguoiDung: newCreatorId,
          moTa: newDesc,
          kienThuc: newKnowledge,
          // không sửa ngày tạo ở đây
        });
      }
    } catch (e) {
      console.error("Cập nhật khóa học thất bại:", e);
      alert("Cập nhật khóa học thất bại.");
    }

    handleUserDetailClose();
  };

  /* Hành động hàng */
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
      <h1>Quản lý khóa học</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>
            Xuất
          </button>
        </div>
        <Search Data={rows} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumsBoThe} Data={filteredData} Action={Action} />

      {/* Xoá */}
      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
          message="Bạn có chắc muốn xóa khóa học này không?"
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
            { name: "Mã", key: "id" },
            { name: "Tên khóa học", key: "name" },
            { name: "Người tạo", key: "userCreated", options: userOptions },
            { name: "Mô tả", key: "description" },
            { name: "Kiến thức (ngăn cách bởi dấu phẩy)", key: "knowledgeText" },
            { name: "Ngày tạo", key: "created" },
          ]}
          showAvatar={false}
          readOnlyKeys={["id", "created"]}
          validationSchema={validationSchema}
          validateOnChange={false}
          selectFields={{ userCreated: userOptions }}
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
          filteredData={filteredData}
          title="Xuất danh sách khóa học"
          columns={ColumsBoThe}
        />
      )}
    </div>
  );
};

export default MainConTentQLKH;
