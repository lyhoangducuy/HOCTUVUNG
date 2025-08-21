import AdminLayout from "../../../layouts/AdminLayout";
import MainContentQLBT from "./MainQuanLyBoThe/MainContent";
const QuanLyBoThe = () => {
  let cards =[]
  try {
    cards = JSON.parse(localStorage.getItem("boThe")||"[]");
  } catch  {
    cards =  [];
    
  }
  let users= []
  try {
    users =JSON.parse(localStorage.getItem("nguoiDung")||"[]");
  } catch  {
    users =[]
  }
  const Databothe= (Array.isArray(cards) ? cards : []).map((item,index) => {
    const id = item.idBoThe?? "";
    const name = item.tenBoThe?? "";
    const  userid =item.idNguoiDung??"";
    let userCreated = "";
    if(userid !== ""){
    const user = users.find(u => u.idNguoiDung === userid);
    userCreated = user.tenNguoiDung ?? "";
    }else{
      userCreated = "Ẩn danh";
    }
    const numBer = item.soTu??"";
  
    
    return {id, name,userCreated,numBer};
  })

  return (
    
          <MainContentQLBT Data={Databothe} />
       
  );
};
export default QuanLyBoThe;
