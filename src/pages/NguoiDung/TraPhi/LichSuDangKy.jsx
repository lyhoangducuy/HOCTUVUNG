import { useEffect, useState } from "react";

function LichSuDangKy({ currentUser }) {
  const [subs, setSubs] = useState([]);
  const [goiList, setGoiList] = useState([]);

  useEffect(() => {
    const ds = JSON.parse(localStorage.getItem("goiTraPhiCuaNguoiDung") || "[]");
    const dsGoi = JSON.parse(localStorage.getItem("goiTraPhi") || "[]");
    setGoiList(dsGoi);
    setSubs(ds.filter(s => s.idNguoiDung === currentUser.idNguoiDung));
  }, [currentUser]);

  return (
    <div>
      <h2>Lịch sử đăng ký của bạn</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Tên gói</th>
            <th>Ngày bắt đầu</th>
            <th>Ngày kết thúc</th>
          </tr>
        </thead>
        <tbody>
          {subs.map(s => {
            const goi = goiList.find(g => g.idGoi === s.idGoi);
            return (
              <tr key={s.idGTPCND}>
                <td>{goi?.tenGoi}</td>
                <td>{s.NgayBatDau}</td>
                <td>{s.NgayKetThuc}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LichSuDangKy;
