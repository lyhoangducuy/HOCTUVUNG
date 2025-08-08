import { useEffect, useState } from "react";
import "./Library.css";
function Library() {
  const [cardLib, setCardLib] = useState([]);
  useEffect(() => {
    const myCardLib = JSON.parse(localStorage.getItem("myLib")) || [];
    setCardLib(myCardLib);
  }, []);
  return (
    <div className="myLib-container">
      <h2 className="tittle-lib">Thư viện của tôi</h2>
      <ul className="header-lib">
        <li className="lib-item active">Bộ Thẻ</li>
        <li className="lib-item">Lớp Học</li>
      </ul>
      <div className="myLibCard">
        {cardLib.map((item, index) => (
            <div className="CardLib" key={index}>
                <h2 className="lib-tittle">{item?.tenBoThe}</h2>
                <span className="quantity">{item?.soTu}</span>
                <span className="nameUser">{item?.nguoiDung?.tenNguoiDung }</span>
          </div>
        ))}
              {
                  cardLib.length===0 && (
                      <p className="emty">Không có bộ thẻ nào cả</p>
                  )
              }
      </div>
    </div>
  );
}
export default Library;
