import { useEffect, useState } from "react";
import "./Library.css";
import { useLocation, useNavigate } from "react-router-dom";
function Library() {
  const [cardLib, setCardLib] = useState([]);
  const [actionTab, setActionTab] = useState("boThe");
  const [lopList, setLopList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const myCard = JSON.parse(localStorage.getItem("boThe")) || [];
    const myClass = JSON.parse(localStorage.getItem("class")) || [];
    const myCardLib = [...myCard];
    setLopList(myClass);
    setCardLib(myCardLib);
  }, []);

  const handleStudy = (id) => {
    navigate(`/flashcard/${id}`,);
  };
  const handleLop =(id) =>{
    const selectLop=lopList.find((item) => item.idLop === id);
    navigate(`/lop/${selectLop.idLop}`);
  }
  
  
  return (
    <div className="myLib-container">
      <h2 className="tittle-lib">Thư viện của tôi</h2>
      <ul className="header-lib">
        <li className={`lib-item ${actionTab==="boThe" ? "active" : ""}`} onClick={()=>setActionTab("boThe")}>Bộ Thẻ</li>
        <li className={`lib-item ${actionTab==="lop" ? "active" :""}`} onClick={()=>setActionTab("lop")}>Lớp Học</li>
      </ul>
      {actionTab==="boThe" && <div className="myLibCard">
        {cardLib.map((item, index) => (
          <div
            className="CardLib"
            key={index}
            onClick={() => handleStudy(item.idBoThe)}
          >
            <h2 className="lib-tittle">{item?.tenBoThe}</h2>
            <span className="quantity">{item?.soTu}</span>
            <span className="nameUser">{item?.nguoiDung?.tenNguoiDung}</span>
          </div>
        ))}
        {cardLib.length === 0 && <p className="emty">Không có bộ thẻ nào cả</p>}
      </div>}
      {actionTab==="lop" && <div className="myLop">
        {lopList.map((item, index) => (
          <div
            className="lop"
            key={index}
            onClick={() => handleLop(item.idLop)}
          >
            <h2 className="lib-tittle">{item?.tenLop}</h2>
            <span className="quantity">{item?.school}</span>
          </div>
        ))}
        {lopList.length === 0 && <p className="emty">Không có bộ thẻ nào cả</p>}
      </div>}
    </div>
  );
}
export default Library;
