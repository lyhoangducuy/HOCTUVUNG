// src/pages/Admin/QuanLyTraPhi/QuanLyKhoaHoc/index.jsx
import { useEffect, useMemo, useState } from "react";
import MainConTentQKH from "./MainConTentKH/MainConTentQLKH";

import { db } from "../../../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

/* ===== Utils ngày giờ ===== */
const fromMaybeTsOrString = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate();     // Firestore Timestamp
  if (typeof val === "string" && val.includes("/")) {             // dd/MM/yyyy
    const [d, m, y] = val.split("/").map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  if (Number.isFinite(Number(val))) {                             // epoch ms|s
    const n = Number(val);
    return new Date(n > 1e12 ? n : n * 1000);
  }
  const d = new Date(val);
  return Number.isNaN(d) ? null : d;
};
const nOr0 = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const QuanLyKhoaHoc = () => {
  const [courses, setCourses] = useState([]);

  // Realtime: khóa học
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "khoaHoc"),
      (snap) => {
        const list = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
        setCourses(list);
      },
      () => setCourses([])
    );
    return () => unsub();
  }, []);

  // Chuẩn hoá mềm cho component con (giữ nguyên cấu trúc cũ)
  const data = useMemo(() => {
    const mapped = (Array.isArray(courses) ? courses : []).map((c, i) => {
      // id hiển thị
      const idKhoaHoc = String(c.idKhoaHoc ?? c._docId ?? `course_${i + 1}`);

      // giá sau giảm (ưu tiên lấy có sẵn, nếu thiếu thì tự tính từ giá & %)
      const giaKhoaHoc = nOr0(c.giaKhoaHoc);
      const giamGia = clamp(nOr0(c.giamGia), 0, 100);
      const giaSauGiam =
        Number.isFinite(Number(c.giaSauGiam)) && Number(c.giaSauGiam) >= 0
          ? Number(c.giaSauGiam)
          : Math.round(giaKhoaHoc * (1 - giamGia / 100));

      // khóa học có thể không có ngayTao — để nguyên (component con tự xử lý)
      const createdDate =
        fromMaybeTsOrString(c.ngayTao) ||
        fromMaybeTsOrString(c.createdAt) ||
        fromMaybeTsOrString(c._docId);

      return {
        ...c,
        idKhoaHoc,
        giaSauGiam,
        _sortKey: createdDate ? createdDate.getTime() : 0, // chỉ dùng để sort
      };
    });

    // sắp xếp mới → cũ
    mapped.sort((a, b) => b._sortKey - a._sortKey);
    return mapped.map(({ _sortKey, ...rest }) => rest);
  }, [courses]);

  return <MainConTentQKH Data={data} />;
};

export default QuanLyKhoaHoc;
