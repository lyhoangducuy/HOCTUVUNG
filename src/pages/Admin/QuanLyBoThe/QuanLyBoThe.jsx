import AdminLayout from "../../../layouts/AdminLayout";
import MainContentQLBT from "./MainQuanLyBoThe/MainContent";
const QuanLyBoThe = () => {
  const DataBoThe = [
    {
      id: 1,
      name: "Từ vựng Mina l5",
      userCreated: "Tokuda",
      numBer: 50,
      created: "01/07/2025",
    },
    {
      id: 2,
      name: "Từ vựng tiếng Anh",
      userCreated: "Newton",
      numBer: 80,
      created: "15/06/2025",
    },
    {
      id: 3,
      name: "Từ vựng Mina l17",
      userCreated: "Emi Fukada",
      numBer: 40,
      created: "15/07/2025",
    },
    {
      id: 4,
      name: "Từ vựng tiếng Anh THPT",
      userCreated: "Einstein",
      numBer: 120,
      created: "01/06/2025",
    },
    {
      id: 5,
      name: "Từ vựng Mina l18",
      userCreated: "Yua Mikami",
      numBer: 50,
      created: "05/07/2025",
    },
  ];

  return (
    <div>
      <AdminLayout>
        <h1>
          <MainContentQLBT Data={DataBoThe} />
        </h1>
      </AdminLayout>
    </div>
  );
};
export default QuanLyBoThe;
