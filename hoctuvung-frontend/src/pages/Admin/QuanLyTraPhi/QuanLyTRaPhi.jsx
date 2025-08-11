import AdminLayout from "../../../layouts/AdminLayout";
import MainContentQLTP from "./MainContentQLTP/MainConTentQLTP";

const QuanLyTraPhi = () => {
  const DataGoiHoc = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face ",
      username: "Nguyễn Văn A",
      package: "Cơ bản",
      status: "Đang hoạt động",
      created: "01/07/2025",
      endDate: "01/08/2025",
    },
    {
      id: 2,
      image: "https://via.placeholder.com/40",
      username: "Trần Thị B",
      package: "Nâng cao",
      status: "Hết hạn",
      created: "15/06/2025",
      endDate: "15/07/2025",
    },
    {
      id: 3,
      image: "https://via.placeholder.com/40",
      username: "Lê Văn C",
      package: "Miễn phí",
      status: "Đang hoạt động",
      created: "15/07/2025",
      endDate: "15/08/2025",
    },
    {
      id: 4,
      image: "https://via.placeholder.com/40",
      username: "Phạm Thị D",
      package: "Cơ bản",
      status: "Đã huỷ",
      created: "01/06/2025",
      endDate: "01/07/2025",
    },
    {
      id: 5,
      image: "https://via.placeholder.com/40",
      username: "Hồ Văn E",
      package: "Nâng cao",
      status: "Đang hoạt động",
      created: "05/07/2025",
      endDate: "05/08/2025",
    },
  ];

  return (
    <div>
      <AdminLayout>
        <MainContentQLTP Data={DataGoiHoc} />
      </AdminLayout>
    </div>
  );
};
export default QuanLyTraPhi;
