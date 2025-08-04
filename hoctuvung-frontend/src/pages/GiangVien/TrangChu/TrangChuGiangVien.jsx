import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./TrangChuGiangVien.css";

export default function TrangChuGiangVien() {
 const boThe = [
  {
    idBoThe: 1,
    tenBoThe: "Hiragana - Âm cơ bản",
    soTu: 10,
    nguoiDung: {
      id: 201,
      tenNguoiDung: "Yuki Sato",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "あ", nghia: "a" },
      { tu: "い", nghia: "i" },
      { tu: "う", nghia: "u" },
      { tu: "え", nghia: "e" },
      { tu: "お", nghia: "o" },
      { tu: "か", nghia: "ka" },
      { tu: "き", nghia: "ki" },
      { tu: "く", nghia: "ku" },
      { tu: "け", nghia: "ke" },
      { tu: "こ", nghia: "ko" }
    ]
  },
  {
    idBoThe: 2,
    tenBoThe: "Katakana - Từ mượn phổ biến",
    soTu: 8,
    nguoiDung: {
      id: 202,
      tenNguoiDung: "Takeshi Yamamoto",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "アイス", nghia: "Kem" },
      { tu: "テレビ", nghia: "TV" },
      { tu: "パン", nghia: "Bánh mì" },
      { tu: "コーヒー", nghia: "Cà phê" },
      { tu: "ホテル", nghia: "Khách sạn" },
      { tu: "レストラン", nghia: "Nhà hàng" },
      { tu: "コンピュータ", nghia: "Máy tính" },
      { tu: "タクシー", nghia: "Taxi" }
    ]
  },
  {
    idBoThe: 3,
    tenBoThe: "Tiếng Nhật - Hội thoại cơ bản (Hiragana)",
    soTu: 8,
    nguoiDung: {
      id: 203,
      tenNguoiDung: "Mika Tanaka",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "こんにちは", nghia: "Xin chào" },
      { tu: "ありがとう", nghia: "Cảm ơn" },
      { tu: "ごめんなさい", nghia: "Xin lỗi" },
      { tu: "すみません", nghia: "Xin lỗi / Làm ơn" },
      { tu: "さようなら", nghia: "Tạm biệt" },
      { tu: "はい", nghia: "Vâng" },
      { tu: "いいえ", nghia: "Không" },
      { tu: "おねがいします", nghia: "Làm ơn" }
    ]
  },
  {
    idBoThe: 4,
    tenBoThe: "Tiếng Nhật - Đồ ăn (Katakana + Hiragana)",
    soTu: 8,
    nguoiDung: {
      id: 204,
      tenNguoiDung: "Ayumi Kobayashi",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "りんご", nghia: "Táo" },
      { tu: "バナナ", nghia: "Chuối" },
      { tu: "みかん", nghia: "Quýt" },
      { tu: "すし", nghia: "Sushi" },
      { tu: "パン", nghia: "Bánh mì" },
      { tu: "ケーキ", nghia: "Bánh kem" },
      { tu: "さかな", nghia: "Cá" },
      { tu: "にく", nghia: "Thịt" }
    ]
  },
  {
    idBoThe: 5,
    tenBoThe: "Tiếng Nhật - Gia đình (Hiragana)",
    soTu: 8,
    nguoiDung: {
      id: 205,
      tenNguoiDung: "Daichi Mori",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "ちち", nghia: "Bố" },
      { tu: "はは", nghia: "Mẹ" },
      { tu: "あに", nghia: "Anh trai" },
      { tu: "あね", nghia: "Chị gái" },
      { tu: "おとうと", nghia: "Em trai" },
      { tu: "いもうと", nghia: "Em gái" },
      { tu: "そふ", nghia: "Ông" },
      { tu: "そぼ", nghia: "Bà" }
    ]
  }
  ,{
  idBoThe: 6,
  tenBoThe: "Tiếng Nhật - Động từ cơ bản (Kanji)",
  soTu: 8,
  nguoiDung: {
    id: 206,
    tenNguoiDung: "Kazuki Arai",
    anhDaiDien: "/src/image/formimg.png"
  },
  danhSachThe: [
    { tu: "食べる", nghia: "Ăn" },
    { tu: "飲む", nghia: "Uống" },
    { tu: "行く", nghia: "Đi" },
    { tu: "来る", nghia: "Đến" },
    { tu: "見る", nghia: "Nhìn" },
    { tu: "聞く", nghia: "Nghe" },
    { tu: "話す", nghia: "Nói" },
    { tu: "書く", nghia: "Viết" }
  ]
},
{
  idBoThe: 7,
  tenBoThe: "Tiếng Nhật - Tính từ phổ biến",
  soTu: 8,
  nguoiDung: {
    id: 207,
    tenNguoiDung: "Haruka Nishimura",
    anhDaiDien: "/src/image/formimg.png"
  },
  danhSachThe: [
    { tu: "大きい", nghia: "To" },
    { tu: "小さい", nghia: "Nhỏ" },
    { tu: "新しい", nghia: "Mới" },
    { tu: "古い", nghia: "Cũ" },
    { tu: "高い", nghia: "Cao / Đắt" },
    { tu: "安い", nghia: "Rẻ" },
    { tu: "いい", nghia: "Tốt" },
    { tu: "悪い", nghia: "Xấu" }
  ]
},
{
  idBoThe: 8,
  tenBoThe: "Tiếng Nhật - Thời gian (Kanji + Hiragana)",
  soTu: 8,
  nguoiDung: {
    id: 208,
    tenNguoiDung: "Ren Fujimoto",
    anhDaiDien: "/src/image/formimg.png"
  },
  danhSachThe: [
    { tu: "今日", nghia: "Hôm nay" },
    { tu: "明日", nghia: "Ngày mai" },
    { tu: "昨日", nghia: "Hôm qua" },
    { tu: "朝", nghia: "Buổi sáng" },
    { tu: "昼", nghia: "Buổi trưa" },
    { tu: "夜", nghia: "Buổi tối" },
    { tu: "週末", nghia: "Cuối tuần" },
    { tu: "毎日", nghia: "Mỗi ngày" }
  ]
},
{
  idBoThe: 9,
  tenBoThe: "Tiếng Nhật - Địa điểm cơ bản",
  soTu: 8,
  nguoiDung: {
    id: 209,
    tenNguoiDung: "Naoko Hoshino",
    anhDaiDien: "/src/image/formimg.png"
  },
  danhSachThe: [
    { tu: "学校", nghia: "Trường học" },
    { tu: "病院", nghia: "Bệnh viện" },
    { tu: "駅", nghia: "Nhà ga" },
    { tu: "銀行", nghia: "Ngân hàng" },
    { tu: "公園", nghia: "Công viên" },
    { tu: "店", nghia: "Cửa hàng" },
    { tu: "家", nghia: "Nhà" },
    { tu: "会社", nghia: "Công ty" }
  ]
}

];
  const navigate = useNavigate();


  const [cards, setCards] = useState(boThe);

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [])
  const handleStudy = (id) => {
    const card = JSON.parse(localStorage.getItem("cards"));
    const ketQua = card.find((item) => item.idBoThe === id);
    console.log(ketQua);
    
   
    localStorage.setItem("selected", JSON.stringify(ketQua));
    
    navigate(`/hoc-bo-the/${id}`);
  }
  return (
   <div className="container">
      <div className="section section-word">
        <h2 className="title">Gần Đây</h2>
        <div className="wordgroup">
          <ul>
            {
              cards.map((item, index) => (
                <li key={index} onClick={()=>handleStudy(item.idBoThe)} className="word-item"> <FontAwesomeIcon icon={faBook } className="icon icon-book" />Từ vưng buổi {index+1}</li>
              ))
            }
          </ul>
        </div>
      </div>
      <div className="section section-card">
        <h2 className="title">Bộ thẻ phổ biến</h2>
        <div className="card-group">
            {
              cards.map((item, index) => (
                <div key={index} className="card-item" onClick={()=>handleStudy(item.idBoThe)}>
                  <h3 className="nameCard">{item.tenBoThe}</h3>
                  <h4 className="numberWord">{item.soTu}</h4>
                  <div className="infor">
                    <img src={item.nguoiDung.anhDaiDien} alt="info" />
                    <span className="nameUser">{item.nguoiDung.tenNguoiDung}</span>
                  </div>
                  
                </div>
              ))
            }
        

        </div>
      </div>
   </div>
  );
}
