import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
import { useEffect, useMemo, useState } from "react";
import Search from "../../../../components/Admin/Search/Search";
import Delete from "../../../../components/Admin/Delete/Delete";
import Edit from "../../../../components/Admin/Edit/Edit";
import ExportModal from "../../../../components/Admin/ExportModal/ExportModal";
import * as yup from "yup";
import "./MainContent.css";

import { db } from "../../../../../lib/firebase";
import {
  doc, getDoc, deleteDoc, updateDoc,
  collection, query, where, limit, getDocs, serverTimestamp,
} from "firebase/firestore";

/* ==== map chế độ ==== */
const MODE_VN = { cong_khai: "Công khai", ca_nhan: "Cá nhân" };
const toVN  = (raw) => raw === "cong_khai" ? "Công khai" : "Cá nhân";   // default: Cá nhân
const toRaw = (vn)  => vn === "Công khai" ? "cong_khai" : "ca_nhan";

/* ==== bảng ngoài: cột gọn ==== */
const ColumnsLite = [
  { name: "ID", key: "id" },
  { name: "Tên bộ thẻ", key: "name" },
  { name: "Chế độ", key: "cheDoVN" },      // tiếng Việt
  { name: "Số thẻ", key: "numBer" },
  { name: "Lượt học", key: "luotHoc" },
  { name: "Người tạo", key: "userCreated" },
];

/* ==== modal chi tiết: đầy đủ nhưng vẫn bỏ “Mã bộ thẻ” ==== */
const ColumnsFull = [
  { name: "ID", key: "id" },
  { name: "Tên bộ thẻ", key: "name" },
  { name: "Người tạo", key: "userCreated" },
  { name: "ID người tạo", key: "idNguoiDung" },
  { name: "Chế độ", key: "cheDoVN" },      // dropdown
  { name: "Số thẻ", key: "numBer" },
  { name: "Lượt học", key: "luotHoc" },
  { name: "Ngày tạo", key: "ngayTao" },
  { name: "Sửa gần nhất", key: "ngayChinhSua" },
];

/* ==== helpers ==== */
function formatTS(v) {
  if (!v) return "";
  try {
    const d = typeof v?.toDate === "function" ? v.toDate()
      : typeof v?.seconds === "number" ? new Date(v.seconds * 1000)
      : v instanceof Date ? v : new Date(v);
    return Number.isNaN(d?.getTime?.()) ? "" : d.toLocaleString("vi-VN");
  } catch { return ""; }
}
function normalizeRow(it = {}) {
  const docId = String(it.id ?? it.docId ?? it._docId ?? it.idBoThe ?? "");
  const soThe = typeof it.soTu === "number" ? it.soTu
              : Array.isArray(it.danhSachThe) ? it.danhSachThe.length : 0;
  const luotHoc = Number(it.luotHoc || 0);
  return {
    id: docId,
    name: it.tenBoThe ?? it.name ?? "",
    userCreated: it.userCreated ?? it.tenNguoiTao ?? it._tenNguoiTao ?? "",
    idNguoiDung: it.idNguoiDung ?? "",
    cheDoVN: toVN(it.cheDo),                 // luôn có (default “Cá nhân”)
    numBer: String(soThe),
    luotHoc: String(luotHoc),
    ngayTao: formatTS(it.ngayTao),
    ngayChinhSua: formatTS(it.ngayChinhSua),
    _raw: it,
  };
}
async function getDeckDocRefByAnyId(id) {
  const r1 = doc(db, "boThe", String(id)); const s1 = await getDoc(r1);
  if (s1.exists()) return r1;
  const rs = await getDocs(query(collection(db,"boThe"), where("idBoThe","==",String(id)), limit(1)));
  return rs.empty ? null : rs.docs[0].ref;
}

/* ==== validate các field cho phép sửa ==== */
const validationSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên bộ thẻ").min(2).max(120),
  numBer: yup.number().typeError("Số thẻ phải là số").integer("Số thẻ phải là số nguyên").min(0, "Số thẻ không âm").nullable(),
  cheDoVN: yup.string().oneOf(["Công khai", "Cá nhân"]).required(),
});

const MainContentQLBT = ({ Data = [] }) => {
  const [data, setData] = useState(Data);
  useEffect(() => setData(Data), [Data]);

  const tableData = useMemo(() => (data || []).map(normalizeRow), [data]);
  const [filteredData, setFilteredData] = useState(tableData);
  useEffect(() => setFilteredData(tableData), [tableData]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [exportModal, setExportModal] = useState(false);

  const handleDelete = (id) => { setDeleteId(id); setShowDeleteDialog(true); };
  const onCloseDelete = () => { setShowDeleteDialog(false); setDeleteId(null); };
  const onConfirmDelete = async (idFromModal) => {
    const id = idFromModal ?? deleteId; if (!id) return;
    try {
      const ref = await getDeckDocRefByAnyId(id);
      if (!ref) return alert("Không tìm thấy bộ thẻ để xoá.");
      await deleteDoc(ref);
    } catch (e) { console.error(e); alert("Xoá bộ thẻ thất bại."); }
    onCloseDelete();
  };

  const handleView = async (id) => {
    try {
      setIsEditMode(false);
      const ref = await getDeckDocRefByAnyId(id);
      if (!ref) return alert("Không tìm thấy bộ thẻ.");
      const snap = await getDoc(ref);
      if (!snap.exists()) return alert("Bộ thẻ đã bị xoá.");
      const n = normalizeRow({ id: ref.id, ...snap.data() });
      setSelectedDeck({
        id: n.id,
        name: n.name,
        userCreated: n.userCreated,
        idNguoiDung: n.idNguoiDung,
        cheDoVN: n.cheDoVN,
        numBer: n.numBer,
        luotHoc: n.luotHoc,
        ngayTao: n.ngayTao,
        ngayChinhSua: n.ngayChinhSua,
      });
      setShowDetail(true);
    } catch (e) { console.error(e); alert("Không thể mở chi tiết."); }
  };

  const handleUserDetailClose = () => { setShowDetail(false); setSelectedDeck(null); setIsEditMode(false); };
  const handleUserDetailSave = async (updated, flagIsEditMode = false) => {
    if (flagIsEditMode) { setIsEditMode(true); return; }
    try {
      const ref = await getDeckDocRefByAnyId(updated.id);
      if (ref) {
        const payload = {
          tenBoThe: String(updated.name || "").trim(),
          cheDo: toRaw(updated.cheDoVN),
          ngayChinhSua: serverTimestamp(),
        };
        if (updated.numBer !== undefined && updated.numBer !== "") {
          const n = Number(updated.numBer);
          if (Number.isFinite(n)) payload.soTu = n;
        }
        await updateDoc(ref, payload);
      }
    } catch (e) { console.error(e); alert("Cập nhật bộ thẻ thất bại."); }
    handleUserDetailClose();
  };

  const Action = [
    { name: "👀", class: "edit-button", style: { cursor:"pointer", marginRight:8, fontSize:"1.2rem" }, onClick: (id) => () => handleView(id) },
    { name: "🗑️", class: "delete-button", style: { cursor:"pointer", fontSize:"1.2rem" }, onClick: (id) => () => handleDelete(id) },
  ];

  return (
    <div className="main-content-admin-user">
      <h1>Quản Lý Bộ Thẻ</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>Xuất</button>
        </div>
        <Search Data={tableData} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumnsLite} Data={filteredData} Action={Action} />

      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa bộ thẻ này không?"
        />
      )}

      {showDetail && selectedDeck && (
        <Edit
          user={selectedDeck}
          onClose={handleUserDetailClose}
          onSave={handleUserDetailSave}
          isEditMode={isEditMode}
          Colums={ColumnsFull}
          showAvatar={false}
          readOnlyKeys={["id", "userCreated", "idNguoiDung", "luotHoc", "ngayTao", "ngayChinhSua"]}
          validationSchema={validationSchema}
          validateOnChange={false}
          /* Dropdown cho trường cheDoVN */
          selectOptions={{ cheDoVN: ["Công khai", "Cá nhân"] }}
        />
      )}

      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          filteredData={filteredData}
          title="Xuất danh sách bộ thẻ"
          columns={ColumnsLite}
          showAvatar={false}
        />
      )}
    </div>
  );
};

export default MainContentQLBT;
