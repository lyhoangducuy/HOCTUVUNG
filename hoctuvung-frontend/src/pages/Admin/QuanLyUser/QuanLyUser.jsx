import AdminLayout from "../../../layouts/AdminLayout";
import MainContentAdminQuanUser from "./MainContentAdminQuanLyUser/MainContentAdminQuanUser";
const QuanLyUser = () => {
  const Data = [
    {
      id: 1,
      username: "tuantran123k",
      image:
        "https://kenh14cdn.com/thumb_w/660/203336854389633024/2021/2/22/15251512011507448553886425796925100866693077o-1614008494654514344700.jpg",
      password: "123456",
      fullname: "Văn A",
      email: "rmail@gmail.com",
      role: "Teacher",
      created: "01/08/2025",
    },
    {
      id: 2,
      username: "tuantran123p",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn B",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/07/2025",
    },
    {
      id: 3,
      username: "tuantran123q",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn C",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 4,
      username: "tuantran123j",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn J",
      email: "rmail@gmail.com",
      role: "Teacher",
      created: "01/07/2025",
    },
    {
      id: 5,
      username: "tuantran123g",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn K",
      email: "rmail@gmail.com",
      role: "Admin",
      created: "05/08/2025",
    },
    {
      id: 6,
      username: "tuantran123h",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn L",
      email: "rmail@gmail.com",
      role: "Teacher",
      created: "01/07/2025",
    },
    {
      id: 7,
      username: "tuantran123m",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn M",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 8,
      username: "tuantran123n",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn N",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 9,
      username: "tuantran123o",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn O",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 10,
      username: "tuantran123p",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn P",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
    {
      id: 11,
      username: "tuantran123q",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      password: "123456",
      fullname: "Văn Q",
      email: "rmail@gmail.com",
      role: "Student",
      created: "15/08/2025",
    },
  ];
  return (
    <div>
        <h1>
          <MainContentAdminQuanUser Data={Data} />
        </h1>
    </div>
  );
};
export default QuanLyUser;
