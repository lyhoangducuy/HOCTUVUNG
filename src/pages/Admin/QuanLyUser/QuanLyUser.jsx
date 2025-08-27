// src/pages/Admin/QuanLyNguoiDung/index.jsx
import { useEffect, useState } from "react";
import MainContentAdminQuanUser from "./MainContentAdminQuanLyUser/MainContentAdminQuanUser";
import { db } from "../../../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const QuanLyUser = () => {
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    // Đúng tên collection theo schema của bạn: "nguoiDung"
    const unsub = onSnapshot(
      collection(db, "nguoiDung"),
      (snap) => {
        const list = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            ...d,
            _docId: doc.id,
            idNguoiDung: d?.idNguoiDung || doc.id,
            // nếu là Timestamp thì đổi về Date cho UI dễ dùng
            ngayTaoTaiKhoan: d?.ngayTaoTaiKhoan?.toDate?.() ?? d?.ngayTaoTaiKhoan ?? null,
          };
        });
        setUserData(list);
      },
      (err) => {
        console.error("Lỗi đọc nguoiDung:", err);
        setUserData([]);
      }
    );
    return () => unsub();
  }, []);

  return <MainContentAdminQuanUser Data={userData} />;
};

export default QuanLyUser;
