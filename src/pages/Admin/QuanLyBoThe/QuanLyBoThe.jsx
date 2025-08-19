import AdminLayout from "../../../layouts/AdminLayout";
import MainContentQLBT from "./MainQuanLyBoThe/MainContent";
const QuanLyBoThe = () => {
  let cards =[]
  try {
    cards = JSON.parse(localStorage.getItem("cards")||"[]");
  } catch  {
    cards =  [];
  }
  const Databothe= (Array.isArray(cards) ? cards : []).map((item,index) => {
    const id = item.idBoThe?? "";
    const name = item.tenBoThe?? "";
    const  userCreated =item.nguoiDung.tenNguoiDung??"Ẩn danh";
    const numBer = item.soTu??"";
    const videoSrc = typeof item.video ;
    return {id, name,userCreated,numBer,videoSrc};
  })

  return (
    
          <MainContentQLBT Data={Databothe} />
       
  );
};
export default QuanLyBoThe;
