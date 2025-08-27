// src/pages/Admin/QuanLyTraPhi/QuanLyNguoiDungTraPhi.jsx
import "./MainConTentQLTP.css";
import { useEffect, useMemo, useState, useCallback, useDeferredValue, useTransition } from "react";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";

import { db } from "../../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

import * as yup from "yup";

/* ========== Helpers ngày/thời gian ========== */
const parseVN = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const m = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const y = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
};
const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (typeof v === "string") return parseVN(v) || new Date(v);
  return null;
};
const fmtVN = (d) =>
  d instanceof Date && !Number.isNaN(d) ? d.toLocaleDateString("vi-VN") : "";
const toVNStr = (v) => {
  const d = toDateFlexible(v);
  return d && !Number.isNaN(d) ? d.toLocaleDateString("vi-VN") : "";
};
const today0 = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};
const genSubId = () => `SUB_${Date.now()}`;

// Trạng thái hiển thị
const displayStatus = (sub) => {
  if (sub?.status === "Đã hủy") return "Đã hủy";
  const end = toDateFlexible(sub?.NgayKetThuc);
  if (end && end >= today0()) return "Đang hoạt động";
  return "Hết hạn";
};

/* ========== Yup schemas ========== */
const dateVN = yup
  .string()
  .required("Bắt buộc")
  .test("ddmmyyyy", "Ngày phải dạng dd/mm/yyyy", (v) => !!parseVN(v || ""));

const addSchema = yup.object({
  idNguoiDung: yup.string().trim().required("Thiếu ID người dùng"),
  idGoi: yup.string().trim().required("Thiếu gói"),
  NgayBatDau: dateVN,
  NgayKetThuc: yup
    .string()
    .trim()
    .test("empty-or-date", "Ngày phải dạng dd/mm/yyyy", (v) => !v || !!parseVN(v)),
});

const editSchema = yup.object({
  id: yup.string().required(),
  idGoi: yup.string().trim().required("Thiếu gói"),
  status: yup.string().oneOf(["Đang hoạt động", "Hết hạn", "Đã hủy"]).required(),
  NgayBatDau: dateVN,
  NgayKetThuc: dateVN,
});

export default function QuanLyNguoiDungTraPhi() {
  const [subs, setSubs] = useState([]);   // đăng ký gói (realtime)
  const [users, setUsers] = useState([]); // người dùng (fetch 1 lần)
  const [packs, setPacks] = useState([]); // gói (fetch 1 lần)

  // chỉ realtime cho đăng ký
  useEffect(() => {
    const un1 = onSnapshot(collection(db, "goiTraPhiCuaNguoiDung"), (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          _docId: d.id,
          ...data,
          _NgayBatDauStr: toVNStr(data.NgayBatDau),
          _NgayKetThucStr: toVNStr(data.NgayKetThuc),
        };
      });
      setSubs(list);
    });
    return () => un1?.();
  }, []);

  // users & packs: tải 1 lần để giảm re-render
  useEffect(() => {
    (async () => {
      const [uSnap, pSnap] = await Promise.all([
        getDocs(collection(db, "nguoiDung")),
        getDocs(collection(db, "goiTraPhi")),
      ]);
      setUsers(uSnap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
      setPacks(pSnap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    })();
  }, []);

  /* ---- Map tra cứu tối ưu ---- */
  const userMap = useMemo(
    () => new Map(users.map((u) => [String(u.idNguoiDung), u])),
    [users]
  );
  const packMap = useMemo(() => {
    const m = new Map();
    for (const p of packs) {
      const key1 = String(p.idGoi ?? p._docId);
      const key2 = String(p._docId);
      m.set(key1, p);
      m.set(key2, p);
    }
    return m;
  }, [packs]);

  /* ---- Rows cho bảng ---- */
  const rows = useMemo(() => {
    return subs.map((s) => {
      const u = userMap.get(String(s.idNguoiDung));
      const p = packMap.get(String(s.idGoi));
      return {
        id: s._docId,
        idGTPCND: s.idGTPCND || s._docId,
        username: u?.tenNguoiDung || `User ${s.idNguoiDung}`,
        package: p?.tenGoi || s.idGoi,
        status: displayStatus(s),
        created: s._NgayBatDauStr || "",
        endDate: s._NgayKetThucStr || "",
        _raw: s,
      };
    });
  }, [subs, userMap, packMap]);

  const [filteredData, setFilteredData] = useState(rows);
  useEffect(() => setFilteredData(rows), [rows]);

  // Giảm giật khi search list lớn
  const [isPending, startTransition] = useTransition();
  const deferredData = useDeferredValue(filteredData);
  const onSearchResult = useCallback(
    (data) => startTransition(() => setFilteredData(data)),
    []
  );

  /* ---- Columns ---- */
  const ColumnsTable = useMemo(
    () => [
      { name: "Mã đăng ký", key: "idGTPCND" },
      { name: "Tên người dùng", key: "username" },
      { name: "Gói học", key: "package" },
      { name: "Trạng thái", key: "status" },
      { name: "Ngày bắt đầu", key: "created" },
      { name: "Ngày hết hạn", key: "endDate" },
    ],
    []
  );

  /* ---- Options cho form ---- */
  const packOptions = useMemo(
    () =>
      packs.map((p) => ({
        value: String(p.idGoi ?? p._docId),
        label: String(p.tenGoi || p.idGoi || p._docId),
        thoiHan: Number(p.thoiHan || 0),
      })),
    [packs]
  );
  const packValueSet = useMemo(
    () => new Set(packOptions.map((o) => String(o.value))),
    [packOptions]
  );
  const userIdSet = useMemo(
    () => new Set(users.map((u) => String(u.idNguoiDung))),
    [users]
  );
  const statusOptions = useMemo(
    () => [
      { value: "Đang hoạt động", label: "Đang hoạt động" },
      { value: "Hết hạn", label: "Hết hạn" },
      { value: "Đã hủy", label: "Đã hủy" },
    ],
    []
  );

  const ColumnsEdit = useMemo(
    () => [
      { name: "Gói học", key: "idGoi", options: packOptions },
      { name: "Trạng thái", key: "status", options: statusOptions },
      { name: "Ngày bắt đầu (dd/mm/yyyy)", key: "NgayBatDau" },
      { name: "Ngày hết hạn (dd/mm/yyyy)", key: "NgayKetThuc" },
    ],
    [packOptions, statusOptions]
  );

  const ColumnsAdd = useMemo(
    () => [
      { name: "ID người dùng (uid)", key: "idNguoiDung" },
      { name: "Gói học", key: "idGoi", options: packOptions },
      { name: "Ngày bắt đầu (dd/mm/yyyy)", key: "NgayBatDau" },
      { name: "Ngày hết hạn (dd/mm/yyyy) (có thể để trống)", key: "NgayKetThuc" },
    ],
    [packOptions]
  );

  /* ---- Delete ---- */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const handleDelete = useCallback((docId) => {
    setDeleteId(docId);
    setShowDeleteDialog(true);
  }, []);
  const onCloseDelete = useCallback(() => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  }, []);
  const onConfirmDelete = useCallback(
    async (docIdFromModal) => {
      const id = docIdFromModal ?? deleteId;
      if (!id) return;
      try {
        await deleteDoc(doc(db, "goiTraPhiCuaNguoiDung", id));
        onCloseDelete();
      } catch (e) {
        console.error(e);
        alert("Xóa đăng ký thất bại.");
      }
    },
    [deleteId, onCloseDelete]
  );

  /* ---- Edit ---- */
  const [showEdit, setShowEdit] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleEdit = useCallback(
    (docId) => {
      const row = rows.find((r) => String(r.id) === String(docId));
      if (!row) return;
      const r = row._raw || {};
      setSelectedRow({
        id: row.id,
        idNguoiDung: r.idNguoiDung,
        idGoi: r.idGoi,
        status: displayStatus(r),
        NgayBatDau: toVNStr(r.NgayBatDau),
        NgayKetThuc: toVNStr(r.NgayKetThuc),
      });
      setShowEdit(true);
      setIsEditMode(false);
    },
    [rows]
  );

  const handleEditClose = useCallback(() => {
    setShowEdit(false);
    setSelectedRow(null);
    setIsEditMode(false);
  }, []);

  const handleEditSave = useCallback(
    async (payload, isEdit = false) => {
      if (isEdit) {
        setIsEditMode(true);
        return;
      }

      try {
        const data = await editSchema.validate(payload, { abortEarly: false });

        if (!packValueSet.has(String(data.idGoi))) {
          return alert("Gói không hợp lệ.");
        }

        let start = parseVN(data.NgayBatDau);
        let end = parseVN(data.NgayKetThuc);
        const t0 = today0();

        if (data.status === "Đang hoạt động" && end < t0) end = t0;
        if (data.status === "Hết hạn" && end >= t0) {
          const d = new Date(t0);
          d.setDate(d.getDate() - 1);
          end = d;
        }

        await updateDoc(doc(db, "goiTraPhiCuaNguoiDung", data.id), {
          idGoi: String(data.idGoi),
          NgayBatDau: fmtVN(start),
          NgayKetThuc: fmtVN(end),
          status: data.status,
        });
        handleEditClose();
      } catch (err) {
        if (err?.name === "ValidationError") {
          alert(err.errors.join("\n"));
        } else {
          console.error(err);
          alert("Cập nhật đăng ký thất bại.");
        }
      }
    },
    [packValueSet, handleEditClose]
  );

  /* ---- Add ---- */
  const [showAddDialog, setShowAddDialog] = useState(false);
  const handleAddOpen = useCallback(() => setShowAddDialog(true), []);
  const handleAddClose = useCallback(() => setShowAddDialog(false), []);

  const handleAddSave = useCallback(
    async (row) => {
      try {
        const data = await addSchema.validate(row, { abortEarly: false });

        if (!packValueSet.has(String(data.idGoi))) {
          return alert("Gói không hợp lệ.");
        }
        if (!userIdSet.has(String(data.idNguoiDung))) {
          return alert("ID người dùng không tồn tại.");
        }

        let start = parseVN(data.NgayBatDau);
        let end = data.NgayKetThuc ? parseVN(data.NgayKetThuc) : null;

        if (!end) {
          const pack = packs.find((x) => String(x.idGoi ?? x._docId) === String(data.idGoi));
          const days = Number(pack?.thoiHan || 0);
          const e = new Date(start);
          e.setDate(e.getDate() + days);
          end = e;
        }

        const status = end >= today0() ? "Đang hoạt động" : "Hết hạn";

        await addDoc(collection(db, "goiTraPhiCuaNguoiDung"), {
          idGTPCND: genSubId(),
          idNguoiDung: String(data.idNguoiDung),
          idGoi: String(data.idGoi),
          NgayBatDau: fmtVN(start),
          NgayKetThuc: fmtVN(end),
          status,
          createdAt: serverTimestamp(),
        });
        handleAddClose();
      } catch (err) {
        if (err?.name === "ValidationError") {
          alert(err.errors.join("\n"));
        } else {
          console.error(err);
          alert("Thêm đăng ký thất bại.");
        }
      }
    },
    [packValueSet, userIdSet, packs, handleAddClose]
  );

  /* ---- Actions cho bảng ---- */
  const Action = useMemo(
    () => [
      {
        name: "👀",
        class: "edit-button",
        style: { cursor: "pointer", marginRight: 8, fontSize: "1.2rem" },
        onClick: (id) => () => handleEdit(id),
        title: "Xem/Sửa",
      },
      {
        name: "🗑️",
        class: "delete-button",
        style: { cursor: "pointer", fontSize: "1.2rem" },
        onClick: (id) => () => handleDelete(id),
        title: "Xoá",
      },
    ],
    [handleDelete, handleEdit]
  );

  /* ---- Export modal ---- */
  const [exportModal, setExportModal] = useState(false);

  return (
    <div className="main-content-admin-user">
      <h1>Quản Lý Trả Phí (Theo Người Dùng)</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={handleAddOpen}>Thêm</button>
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>Xuất</button>
        </div>
        <Search Data={rows} onResult={onSearchResult} />
      </div>

      {/* isPending có thể dùng để show “đang lọc…” nếu muốn */}
      <TableAdmin Colums={ColumnsTable} Data={deferredData} Action={Action} />

      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa đăng ký trả phí này không?"
        />
      )}

     {showEdit && selectedRow && (
  <Edit
    user={selectedRow}
    onClose={handleEditClose}
    onSave={handleEditSave}
    isEditMode={isEditMode}
    Colums={ColumnsEdit}
    showAvatar={false}
    validationSchema={editSchema}   // <-- thêm
    validateOnChange={false}        // bật true nếu muốn vừa gõ vừa hiện lỗi
  />
)}

{showAddDialog && (
  <Add
    onClose={handleAddClose}
    onSave={handleAddSave}
    Colums={ColumnsAdd}
    showAvatar={false}
    validationSchema={addSchema}     // <-- thêm
    validateOnChange={false}
  />
)}


      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          filteredData={deferredData}
          title="Xuất danh sách trả phí của người dùng"
          columns={ColumnsTable}
        />
      )}
    </div>
  );
}
