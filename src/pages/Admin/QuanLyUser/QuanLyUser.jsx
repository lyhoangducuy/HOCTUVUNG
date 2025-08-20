import { useEffect, useState } from "react";
import AdminLayout from "../../../layouts/AdminLayout";
import MainContentAdminQuanUser from "./MainContentAdminQuanLyUser/MainContentAdminQuanUser";
const QuanLyUser = () => {
  const [userData, setUserData] = useState([]);
  useEffect(() => {
    try {
      const usersArray = JSON.parse(localStorage.getItem("nguoiDung") || "[]");

      setUserData(usersArray);
    } catch (e) {
      console.error("lỗi lấy dữ liệu người dùng ở quản lý ", e);
      setUserData([]);
    }
  }, []);

  return <MainContentAdminQuanUser Data={userData} />;
};
export default QuanLyUser;
