import "./MainContentAdminQuanUser.css";
import TableAdmin from "../../../../components/Admin/TableAdmin/TableAdmin";
const MainContentAdminQuanUser = () => {
  const Colums = [
    { name: "ID", key: "id" },
    { name: "UserName", key: "username" },
    { name: "FullName", key: "fullname" },
    { name: "Email", key: "email" },
    { name: "Vai trò", key: "role" },
    { name: "Ngày Tạo", key: "created" },
  ];
  const Data = [
    {
      id: 1,
      username: "tuantran123k",
      fullname: "Văn A",
      email: "rmail@gmail.com",
      role: "Teacher",
      created: "01/08/2025",
    },
    {
      id: 2,
      username: "tuantran123p",
      fullname: "Văn B",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/07/2025",
    },
    {
      id: 3,
      username: "tuantran123q",
      fullname: "Văn C",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 4,
      username: "tuantran123j",
      fullname: "Văn J",
      email: "rmail@gmail.com",
      role: "Teacher",
      created: "01/07/2025",
    },
    {
      id: 5,
      username: "tuantran123g",
      fullname: "Văn K",
      email: "rmail@gmail.com",
      role: "Admin",
      created: "05/08/2025",
    },
    {
      id: 6,
      username: "tuantran123h",
      fullname: "Văn L",
      email: "rmail@gmail.com",
      role: "Teacher",
      created: "01/07/2025",
    },
    {
      id: 7,
      username: "tuantran123m",
      fullname: "Văn M",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 8,
      username: "tuantran123n",
      fullname: "Văn N",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 9,
      username: "tuantran123o",
      fullname: "Văn O",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 10,
      username: "tuantran123p",
      fullname: "Văn P",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 11,
      username: "tuantran123q",
      fullname: "Văn Q",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
  ];
  const Action = [
    {
      name: "✏️",
      class: "edit-button",
      style: { cursor: "pointer", marginRight: 8, fontSize: "1.2rem" },
      onClick: (id) => () => console.log(`Edit user with id ${id}`),
    },
    {
      name: "🗑️",
      class: "delete-button",
      style: { cursor: "pointer", fontSize: "1.2rem" },
      onClick: (id) => () => console.log(`Delete user with id ${id}`),
    },
  ];

  return (
    <div className="main-content-admin-user">
      <h1>Quản Lý Người Dùng</h1>
      <div className="user-actions">
        <div className="user-actions-buttons">
          <button className="btn btn-primary">Thêm người dùng</button>
          <button className="btn btn-secondary">Xuất</button>{" "}
        </div>

        <input className="search-input" placeholder="Tìm kiếm" />
      </div>
      {/* <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên người dùng</th>
            <th>Họ Và Tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Ngày Tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.slice(0, pageSize).map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.fullname}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.created}</td>
              <td>
                <button
                  role="img"
                  aria-label="edit"
                  style={{ cursor: "pointer", marginRight: 8 }}
                >
                  ✏️
                </button>
                <button
                  role="img"
                  aria-label="delete"
                  style={{ cursor: "pointer" }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}
      <TableAdmin Colums={Colums} Data={Data} Action={Action} />
      {/* <div className="user-pagination">
        <div className="pagination-input">
          <span>Hiển thị</span>
          <input
            type="number"
            value={pageSize}
            min={1}
            onChange={handleInputChange}
          />
        </div>
        <div className="pagination-info">
          <span>Phần tử</span>
          <button>{"<"}</button>
          <span style={{ margin: "0 8px" }}>1/1</span>
          <button>{">"}</button>
        </div>
      </div> */}
      <div></div>
    </div>
  );
};

export default MainContentAdminQuanUser;
