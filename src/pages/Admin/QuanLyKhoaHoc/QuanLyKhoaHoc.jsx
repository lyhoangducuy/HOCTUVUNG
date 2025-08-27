import { useEffect, useMemo, useState } from "react";
import MainConTentQKH from "./MainConTentKH/MainConTentQLKH";

import { db } from "../../../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

// utils
const toVN = (date) =>
  date instanceof Date && !isNaN(date) ? date.toLocaleDateString("vi-VN") : "";

const fromMaybeTsOrString = (val) => {
  if (!val) return null;
  // Firestore Timestamp
  if (typeof val?.toDate === "function") return val.toDate();
  // dd/MM/yyyy
  if (typeof val === "string" && val.includes("/")) {
    const [d, m, y] = val.split("/").map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  // number (ms or s)
  if (Number.isFinite(Number(val))) {
    const n = Number(val);
    return new Date(n > 1e12 ? n : n * 1000);
  }
  const d = new Date(val);
  return isNaN(d) ? null : d;
};

const QuanLyKhoaHoc = () => {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);

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

  // Realtime: người dùng (bảng bạn đã liệt kê là `nguoiDung`)
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

  const data = useMemo(() => {
    const nameById = new Map(
      users.map((u) => [
        String(u.idNguoiDung ?? u._docId),
        u.tenNguoiDung || u.username || u.email || "Ẩn danh",
      ])
    );

    const mapped = (Array.isArray(courses) ? courses : []).map((c, i) => {
      const id = c.idKhoaHoc ?? c._docId ?? `course_${i + 1}`;
      const name = c.tenKhoaHoc ?? c.name ?? "(Không tên)";
      const createdDate =
        fromMaybeTsOrString(c.createdAt) ||
        fromMaybeTsOrString(c.ngayTao) ||
        fromMaybeTsOrString(c._docId); // fallback nhẹ
      const userCreated = nameById.get(String(c.idNguoiDung)) || "Ẩn danh";

      return {
        id,
        name,
        userCreated,
        created: toVN(createdDate),
        _sortKey: createdDate ? createdDate.getTime() : 0,
      };
    });

    // sort: mới -> cũ
    mapped.sort((a, b) => b._sortKey - a._sortKey);
    return mapped.map(({ _sortKey, ...rest }) => rest);
  }, [courses, users]);

  return <MainConTentQKH Data={data} />;
};

export default QuanLyKhoaHoc;
