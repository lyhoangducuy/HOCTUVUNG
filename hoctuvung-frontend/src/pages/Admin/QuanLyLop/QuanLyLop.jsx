import AdminLayout from "../../../layouts/AdminLayout";
import MainConTentQLL from "./MainConTentQLL/MainConTentQLL";

const QuanLyLop = () => {
  const DataDemo = [
    {
      id: 1,
      name: "Lớp tiếng Nhật sơ cấp 1",
      userCreated: "Admin01",
      created: "10/08/2025",
    },
    {
      id: 2,
      name: "Lớp tiếng Nhật sơ cấp 2",
      userCreated: "Admin01",
      created: "15/08/2025",
    },
    {
      id: 3,
      name: "Lớp tiếng Nhật trung cấp 1",
      userCreated: "Admin02",
      created: "20/08/2025",
    },
    {
      id: 4,
      name: "Lớp tiếng Nhật trung cấp 2",
      userCreated: "Admin02",
      created: "25/08/2025",
    },
    {
      id: 5,
      name: "Lớp luyện thi JLPT N3",
      userCreated: "Admin03",
      created: "28/08/2025",
    },
    {
      id: 6,
      name: "Lớp luyện thi JLPT N2",
      userCreated: "Admin03",
      created: "30/08/2025",
    },
    {
      id: 7,
      name: "Lớp luyện thi JLPT N1",
      userCreated: "Admin04",
      created: "02/09/2025",
    },
    {
      id: 8,
      name: "Lớp tiếng Nhật giao tiếp",
      userCreated: "Admin04",
      created: "05/09/2025",
    },
    {
      id: 9,
      name: "Lớp tiếng Nhật thương mại",
      userCreated: "Admin05",
      created: "08/09/2025",
    },
    {
      id: 10,
      name: "Lớp tiếng Nhật du lịch",
      userCreated: "Admin05",
      created: "10/09/2025",
    },
    {
      id: 11,
      name: "Lớp tiếng Nhật văn phòng",
      userCreated: "Admin06",
      created: "12/09/2025",
    },
    {
      id: 12,
      name: "Lớp tiếng Nhật trẻ em",
      userCreated: "Admin06",
      created: "15/09/2025",
    },
  ];

  return (
    <div>
      <AdminLayout>
        <MainConTentQLL Data={DataDemo} />
      </AdminLayout>
    </div>
  );
};
export default QuanLyLop;
