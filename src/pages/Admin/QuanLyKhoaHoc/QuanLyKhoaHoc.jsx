import { useEffect, useState } from "react";
import MainConTentQKH from "./MainConTentKH/MainConTentQLKH";

/* Helpers */
const readJSON = (key, fallback = []) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const dateFromMaybeTs = (val) => {
  if (val == null) return null;
  const n = Number(val);
  if (Number.isFinite(n)) {
    // nếu là giây thì *1000, nếu là mili-giây thì dùng luôn
    return new Date(n > 1e12 ? n : n * 1000);
  }
  // chuỗi "dd/MM/yyyy"
  if (typeof val === "string" && val.includes("/")) {
    const [d, m, y] = val.split("/").map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  const d = new Date(val);
  return isNaN(d) ? null : d;
};

const toVN = (date) =>
  date instanceof Date && !isNaN(date) ? date.toLocaleDateString("vi-VN") : "";

/* build hàm tra tên user theo idNguoiDung */
const userNameLookup = () => {
  const users = readJSON("nguoiDung", []);
  const map = new Map();
  users.forEach((u) => {
    const id = u?.idNguoiDung ?? u?.id;
    const name =
      u?.tenNguoiDung ?? u?.name ?? u?.displayName ?? u?.username ?? u?.email;
    if (id != null) map.set(String(id), name || `ID: ${id}`);
  });
  return (id) => map.get(String(id)) || (id != null ? `ID: ${id}` : "—");
};

const QuanLyKhoaHoc = () => {
  const [data, setData] = useState([]);

  const load = () => {
    const courses = readJSON("khoaHoc", []);
    const getUserName = userNameLookup();

    const mapped = (Array.isArray(courses) ? courses : []).map((c, i) => {
      const id = c?.idKhoaHoc ?? c?.id ?? `course_${i + 1}`;
      const name = c?.tenKhoaHoc ?? c?.name ?? "(Không tên)";
      const createdDate =
        dateFromMaybeTs(c?.createdAt ?? c?.ngayTao ?? c?.created ?? c?.idKhoaHoc);
      const userCreated = getUserName(c?.idNguoiDung);

      return {
        id,
        name,
        userCreated,
        created: toVN(createdDate),
        _sortKey: createdDate ? createdDate.getTime() : 0,
      };
    });

    // sort mới -> cũ
    mapped.sort((a, b) => b._sortKey - a._sortKey);

    // bỏ trường phụ
    setData(mapped.map(({ _sortKey, ...rest }) => rest));
  };

  useEffect(() => {
    load();
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === "khoaHoc" || e.key === "nguoiDung") load();
    };
    const onCoursesChanged = () => load();

    window.addEventListener("storage", onStorage);
    window.addEventListener("coursesChanged", onCoursesChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("coursesChanged", onCoursesChanged);
    };
  }, []);

  return <MainConTentQKH Data={data} />;
};

export default QuanLyKhoaHoc;
