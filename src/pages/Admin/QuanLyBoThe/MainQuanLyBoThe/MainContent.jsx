// src/pages/Admin/BoThe/MainContentQLBT.jsx
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
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

/* ================== Columns ================== */
const ColumsBoThe = [
  { name: "ID", key: "id" },
  { name: "Tên bộ thẻ", key: "name" },
  { name: "Người tạo", key: "userCreated" }, // để readonly
  { name: "Số thẻ", key: "numBer" },
];

/* ================== Helpers ================== */
// Tìm docRef theo docId hoặc field idBoThe
async function getDeckDocRefByAnyId(id) {
  const ref1 = doc(db, "boThe", String(id));
  const snap1 = await getDoc(ref1);
  if (snap1.exists()) return ref1;

  const q1 = query(collection(db, "boThe"), where("idBoThe", "==", String(id)), limit(1));
  const rs = await getDocs(q1);
  if (!rs.empty) return rs.docs[0].ref;

  return null;
}

/* Yup: validate ngay dưới ô trong Edit.jsx */
const validationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Vui lòng nhập tên bộ thẻ")
    .min(2, "Tên quá ngắn")
    .max(120, "Tên tối đa 120 ký tự"),
  numBer: yup
    .number()
    .typeError("Số thẻ phải là số")
    .integer("Số thẻ phải là số nguyên")
    .min(0, "Số thẻ không âm")
    .nullable(),
  // userCreated giữ readonly ⇒ không cần rule
});

const MainContentQLBT = ({ Data = [] }) => {
  /* Data từ parent (realtime) */
  const [data, setData] = useState(Data);
  const [filteredData, setFilteredData] = useState(Data);
  useEffect(() => {
    setData(Data);
    setFilteredData(Data);
  }, [Data]);

  /* Delete dialog */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  /* Edit dialog */
  const [showEdit, setShowEdit] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  /* Export */
  const [exportModal, setExportModal] = useState(false);

  /* ===== Delete flow (có check tham chiếu) ===== */
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
      const ref = await getDeckDocRefByAnyId(id);
      if (!ref) {
        console.warn("Không tìm thấy tài liệu boThe để xoá:", id);
        onCloseDelete();
        return;
      }
      const snap = await getDoc(ref);
      const deck = { _docId: ref.id, ...snap.data() };
      const customId = String(deck.idBoThe ?? deck._docId);

      // Kiểm tra bảng thẻ (điều chỉnh tên collection nếu bạn dùng khác):
      // Thử cả theo idBoThe (custom) và theo docId
      const cardsCol = collection(db, "the");
      const q1 = query(cardsCol, where("idBoThe", "==", customId));
      const q2 =
        customId !== deck._docId
          ? query(cardsCol, where("idBoThe", "==", deck._docId))
          : null;

      // (tuỳ chọn) nếu bạn dùng "tuVung" thay cho "the", thêm 2 query tương tự:
      const wordsCol = collection(db, "tuVung");
      const q3 = query(wordsCol, where("idBoThe", "==", customId));
      const q4 =
        customId !== deck._docId
          ? query(wordsCol, where("idBoThe", "==", deck._docId))
          : null;

      const [s1, s2, s3, s4] = await Promise.all([
        getDocs(q1),
        q2 ? getDocs(q2) : Promise.resolve({ size: 0 }),
        getDocs(q3),
        q4 ? getDocs(q4) : Promise.resolve({ size: 0 }),
      ]);

      const linkedCount = (s1?.size || 0) + (s2?.size || 0) + (s3?.size || 0) + (s4?.size || 0);
      if (linkedCount > 0) {
        alert(
          `Không thể xoá: còn ${linkedCount} thẻ/ từ vựng tham chiếu tới bộ thẻ này.\n` +
          `Hãy xoá/di chuyển các thẻ trước.`
        );
        onCloseDelete();
        return;
      }

      await deleteDoc(ref);
      // Không cần tự setData – parent realtime sẽ cập nhật lại
    } catch (e) {
      console.error("Xoá bộ thẻ thất bại:", e);
      alert("Xoá bộ thẻ thất bại.");
    }

    onCloseDelete();
  };

  /* ===== Edit flow (validate + cập nhật Firestore) ===== */
  const handleEdit = (id) => {
    const deck = data.find((item) => String(item.id) === String(id));
    if (!deck) return;

    // selectedDeck khớp với ColumsBoThe
    setSelectedDeck({
      id: deck.id,
      name: deck.name ?? "",
      userCreated: deck.userCreated ?? "", // readonly
      numBer: deck.numBer ?? "",           // có thể sửa
    });
    setShowEdit(true);
    setIsEditMode(false);
  };

  const handleUserDetailClose = () => {
    setShowEdit(false);
    setSelectedDeck(null);
    setIsEditMode(false);
  };

  const handleUserDetailSave = async (updated, flagIsEditMode = false) => {
    if (flagIsEditMode) {
      setIsEditMode(true); // bật input trong Edit.jsx
      return;
    }
    // Lưu Firestore
    try {
      const ref = await getDeckDocRefByAnyId(updated.id);
      if (!ref) {
        console.warn("Không tìm thấy tài liệu boThe để cập nhật:", updated.id);
      } else {
        const payload = {
          tenBoThe: String(updated.name || "").trim(),
        };
        if (updated.numBer !== undefined && updated.numBer !== "") {
          const n = Number(updated.numBer);
          if (Number.isFinite(n)) payload.soTu = n;
        }
        await updateDoc(ref, payload);
      }
    } catch (e) {
      console.error("Cập nhật boThe thất bại:", e);
      alert("Cập nhật bộ thẻ thất bại.");
    }

    handleUserDetailClose();
  };

  /* ===== Actions ===== */
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
      <h1>Quản Lý Bộ Thẻ</h1>

      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-secondary" onClick={() => setExportModal(true)}>
            Xuất
          </button>
        </div>
        <Search Data={data} onResult={setFilteredData} />
      </div>

      <TableAdmin Colums={ColumsBoThe} Data={filteredData} Action={Action} />

      {/* Delete */}
      {showDeleteDialog && (
        <Delete
          id={deleteId}
          onClose={onCloseDelete}
          onConfirm={onConfirmDelete}
          message="Bạn có muốn xóa bộ thẻ này không?"
        />
      )}

      {/* Edit */}
      {showEdit && selectedDeck && (
        <Edit
          user={selectedDeck}
          onClose={handleUserDetailClose}
          onSave={handleUserDetailSave}
          isEditMode={isEditMode}
          Colums={ColumsBoThe}
          showAvatar={false}
          readOnlyKeys={["id", "userCreated"]}     // khoá ID + người tạo
          validationSchema={validationSchema}      // Yup: hiện lỗi dưới ô
          validateOnChange={false}                 // validate onBlur + khi Lưu
        />
      )}

      {/* Export */}
      {exportModal && (
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          filteredData={filteredData}
          title="Xuất danh sách bộ thẻ"
          columns={ColumsBoThe}
          showAvatar={false}
        />
      )}
    </div>
  );
};

export default MainContentQLBT;
