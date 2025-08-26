// src/pages/Admin/QuanLyTraPhi/QuanLyGoiTraPhi.jsx
import { useEffect, useState, useMemo } from "react";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import Add from "../../../../components/Admin/Add/Add";

import { db } from "../../../../../lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import * as Yup from "yup";

/* ====== Helpers ====== */
const VN = "vi-VN";
const genIdGoi = () => "GOI_" + Date.now();
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// Date helpers cho kiểm tra sub còn hoạt động khi xoá gói
const parseVN = (dmy) => {
  if (!dmy || typeof dmy !== "string") return null;
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(dt.getTime()) ? null : dt;
};
const toDateFlexible = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Timestamp
  if (typeof v === "string") return parseVN(v) || new Date(v);
  return null;
};
const today0 = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};
const isActiveSub = (sub) => {
  if (String(sub?.status || "").toLowerCase().includes("hủy")) return false;
  const end = toDateFlexible(sub?.NgayKetThuc);
  return !!end && end >= today0();
};

const makeRows = (docs) =>
  docs.map((p) => {
    const gia = toNum(p.giaGoi);
    const gg = toNum(p.giamGia);
    const after = Math.max(0, Math.round(gia * (1 - gg / 100)));
    return {
      id: p._docId,                 // docId dùng cho Edit/Delete
      idGoi: p.idGoi || p._docId,   // hiển thị mã gói
      tenGoi: p.tenGoi || "",
      moTa: p.moTa || "",
      giaGoi: gia,
      giamGia: gg,
      thoiHan: toNum(p.thoiHan),
      giaGoiFmt: gia.toLocaleString(VN),
      giaSauGiamFmt: after.toLocaleString(VN),
    };
  });

/* ====== Yup schemas (Edit/Add dùng chung) ====== */
const numberFromText = (msg) =>
  Yup.number()
    .transform((val, orig) => {
      // Chuẩn hoá chuỗi số: '' -> NaN; ' 120 ' -> 120
      const s = String(orig ?? "").trim();
      if (s === "") return NaN;
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    })
    .typeError(msg);

const PlanSchemaBase = Yup.object({
  tenGoi: Yup.string().trim().required("Nhập tên gói"),
  moTa: Yup.string().trim().max(500, "Mô tả tối đa 500 ký tự").nullable(),
  giaGoi: numberFromText("Giá phải là số").min(0, "Giá ≥ 0").required("Nhập giá"),
  giamGia: numberFromText("Giảm giá phải là số")
    .min(0, "Giảm giá ≥ 0")
    .max(100, "Giảm giá ≤ 100")
    .required("Nhập giảm giá"),
  thoiHan: numberFromText("Thời hạn (ngày) phải là số")
    .integer("Thời hạn phải là số nguyên")
    .min(1, "Thời hạn ≥ 1 ngày")
    .required("Nhập thời hạn"),
});

const PlanEditSchema = PlanSchemaBase.shape({
  id: Yup.string().required(),
});

const PlanAddSchema = PlanSchemaBase; // không cần id

export default function QuanLyGoiTraPhi() {
  /* ====== Cột bảng & form ====== */
  const columnsTable = useMemo(() => ([
    { name: "ID gói", key: "idGoi" },
    { name: "Tên gói", key: "tenGoi" },
    { name: "Mô tả", key: "moTa" },
    { name: "Giá (đ)", key: "giaGoiFmt" },
    { name: "Giảm (%)", key: "giamGia" },
    { name: "Giá sau giảm (đ)", key: "giaSauGiamFmt" },
    { name: "Thời hạn (ngày)", key: "thoiHan" },
  ]), []);

  const columnsForm = useMemo(() => ([
    { name: "Tên gói", key: "tenGoi" },
    { name: "Mô tả", key: "moTa" },
    { name: "Giá (đ)", key: "giaGoi" },
    { name: "Giảm giá (%)", key: "giamGia" },
    { name: "Thời hạn (ngày)", key: "thoiHan" },
  ]), []);

  /* ====== State ====== */
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Modal/Xoá/Sửa/Thêm
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showAdd, setShowAdd] = useState(false);

  /* ====== Realtime ====== */
  useEffect(() => {
    const un = onSnapshot(collection(db, "goiTraPhi"), (snap) => {
      const docs = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
      const r = makeRows(docs);
      setRows(r);
      setFiltered(r);
    });
    return () => un();
  }, []);

  /* ====== Delete ====== */
  const askDelete = (id) => {
    setDeleteId(id);
    setShowDelete(true);
  };
  const closeDelete = () => {
    setShowDelete(false);
    setDeleteId(null);
  };

  // kiểm tra sub tham chiếu, chỉ xoá khi không còn sub đang hoạt động
  const confirmDelete = async (idFromModal) => {
    const planDocId = idFromModal ?? deleteId;
    if (!planDocId) return;

    try {
      const planSnap = await getDoc(doc(db, "goiTraPhi", planDocId));
      if (!planSnap.exists()) {
        closeDelete();
        return;
      }
      const plan = { _docId: planSnap.id, ...planSnap.data() };
      const customId = String(plan.idGoi || plan._docId);

      const subsCol = collection(db, "goiTraPhiCuaNguoiDung");
      const q1 = query(subsCol, where("idGoi", "==", customId));
      const q2Needed = customId !== plan._docId;
      const q2 = q2Needed ? query(subsCol, where("idGoi", "==", plan._docId)) : null;

      const [s1, s2] = await Promise.all([getDocs(q1), q2 ? getDocs(q2) : Promise.resolve(null)]);
      const allRefs = [
        ...(s1?.docs || []),
        ...((s2 && s2.docs) || []),
      ].map((d) => ({ _docId: d.id, ...d.data() }));

      const activeRefs = allRefs.filter(isActiveSub);
      if (activeRefs.length > 0) {
        alert(
          `Không thể xoá vì còn ${activeRefs.length} đăng ký đang hoạt động cho gói này.\n` +
          `Hãy huỷ hoặc chờ hết hạn các đăng ký trước.`
        );
        closeDelete();
        return;
      }

      await deleteDoc(doc(db, "goiTraPhi", planDocId));
      closeDelete();
    } catch (e) {
      console.error(e);
      alert("Xoá gói thất bại.");
    }
  };

  /* ====== Edit ====== */
  const openEdit = (id) => {
    const row = rows.find((x) => String(x.id) === String(id));
    if (!row) return;
    setEditData({
      id: row.id,
      tenGoi: row.tenGoi,
      moTa: row.moTa,
      giaGoi: String(row.giaGoi),  // giữ dạng text để Edit validate
      giamGia: String(row.giamGia),
      thoiHan: String(row.thoiHan),
    });
    setIsEditMode(false);
    setShowEdit(true);
  };
  const closeEdit = () => {
    setShowEdit(false);
    setEditData(null);
    setIsEditMode(false);
  };
  const saveEdit = async (payload, isEditFlag) => {
    if (isEditFlag) {
      setIsEditMode(true);
      return;
    }
    try {
      const parsed = await PlanEditSchema.validate(payload, { abortEarly: false });
      await updateDoc(doc(db, "goiTraPhi", parsed.id), {
        tenGoi: String(parsed.tenGoi || "").trim(),
        moTa: String(parsed.moTa || "").trim(),
        giaGoi: Number(parsed.giaGoi),
        giamGia: Number(parsed.giamGia),
        thoiHan: Number(parsed.thoiHan),
      });
      closeEdit();
    } catch (e) {
      if (e?.name === "ValidationError") {
        // Lỗi field đã hiển thị ở ngay dưới ô trong Edit.jsx
        return;
      }
      console.error(e);
      alert("Cập nhật gói thất bại.");
    }
  };

  /* ====== Add ====== */
  const openAdd = () => setShowAdd(true);
  const closeAdd = () => setShowAdd(false);
  const saveAdd = async (p) => {
    try {
      const parsed = await PlanAddSchema.validate(p, { abortEarly: false });
      await addDoc(collection(db, "goiTraPhi"), {
        idGoi: genIdGoi(),
        tenGoi: String(parsed.tenGoi || "").trim(),
        moTa: String(parsed.moTa || "").trim(),
        giaGoi: Number(parsed.giaGoi),
        giamGia: Number(parsed.giamGia),
        thoiHan: Number(parsed.thoiHan),
      });
      closeAdd();
    } catch (e) {
      if (e?.name === "ValidationError") {
        // Add.jsx chưa hiển thị lỗi dưới ô, nên báo gọn:
        alert(e.errors?.[0] || "Dữ liệu không hợp lệ.");
        return;
      }
      console.error(e);
      alert("Thêm gói thất bại.");
    }
  };

  /* ====== Action cho bảng (TableAdmin) ====== */
  const Action = [
    { name: "👀", title: "Sửa", onClick: (id) => openEdit(id) },
    { name: "🗑️", title: "Xoá", onClick: (id) => askDelete(id) },
  ];

  return (
    <div className="main-content-admin-user">
      <h2>Quản lý gói trả phí</h2>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary" onClick={openAdd}>Thêm gói</button>
        </div>
        <Search Data={rows} onResult={setFiltered} />
      </div>

      <TableAdmin Colums={columnsTable} Data={filtered} Action={Action} />

      {/* Xoá */}
      {showDelete && (
        <Delete
          id={deleteId}
          onClose={closeDelete}
          onConfirm={confirmDelete}
          message="Bạn có muốn xoá gói trả phí này không?"
        />
      )}

      {/* Sửa (hiển thị lỗi ngay dưới ô nhờ Edit + Yup) */}
      {showEdit && editData && (
        <Edit
          user={editData}
          onClose={closeEdit}
          onSave={saveEdit}
          isEditMode={isEditMode}
          Colums={columnsForm}
          showAvatar={false}
          validationSchema={PlanEditSchema}
          validateOnChange={true}
        />
      )}

      {/* Thêm (validate trước khi lưu; nếu muốn lỗi dưới ô, có thể chuyển sang dùng Edit ở chế độ "thêm") */}
      {showAdd && (
        <Add
          onClose={closeAdd}
          onSave={saveAdd}
          Colums={columnsForm}
          showAvatar={false}
          validationSchema={PlanAddSchema}
          validateOnChange={true}
        />
      )}
    </div>
  );
}
