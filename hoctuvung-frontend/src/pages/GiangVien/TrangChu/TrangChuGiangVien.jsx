import { Routes, Route, Outlet } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faBook} from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from "react";
import Giangvien_Header from "../../../components/GiangVien/Header/Giangvien_Header";
import Giangvien_Sidebar from "../../../components/GiangVien/Sidebar/Giangvien_Sidebar";
import './TrangChuGiangVien.css'
export default function TrangChuGiangVien() {
const boThe = [
  {
    idBoThe: 1,
    tenBoThe: "English - Fruits",
    soTu: 5,
    nguoiDung: {
      id: 101,
      tenNguoiDung: "Alice Nguyen",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Apple", nghia: "Quả táo" },
      { tu: "Banana", nghia: "Quả chuối" },
      { tu: "Mango", nghia: "Quả xoài" },
      { tu: "Grape", nghia: "Quả nho" },
      { tu: "Pineapple", nghia: "Quả dứa" }
    ]
  },
  {
    idBoThe: 2,
    tenBoThe: "TOEIC - Office Vocabulary",
    soTu: 4,
    nguoiDung: {
      id: 102,
      tenNguoiDung: "Minh Tran",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Meeting", nghia: "Cuộc họp" },
      { tu: "Document", nghia: "Tài liệu" },
      { tu: "Deadline", nghia: "Hạn chót" },
      { tu: "Colleague", nghia: "Đồng nghiệp" }
    ]
  },
  {
    idBoThe: 3,
    tenBoThe: "IELTS - Travel & Transport",
    soTu: 3,
    nguoiDung: {
      id: 103,
      tenNguoiDung: "Linh Dao",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Luggage", nghia: "Hành lý" },
      { tu: "Ticket", nghia: "Vé" },
      { tu: "Customs", nghia: "Hải quan" }
    ]
  },
  {
    idBoThe: 4,
    tenBoThe: "Daily Conversation - Basic",
    soTu: 5,
    nguoiDung: {
      id: 104,
      tenNguoiDung: "Khanh Le",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Hello", nghia: "Xin chào" },
      { tu: "Thank you", nghia: "Cảm ơn" },
      { tu: "Sorry", nghia: "Xin lỗi" },
      { tu: "Excuse me", nghia: "Làm ơn" },
      { tu: "Goodbye", nghia: "Tạm biệt" }
    ]
  },
  {
    idBoThe: 5,
    tenBoThe: "English - Animals",
    soTu: 5,
    nguoiDung: {
      id: 105,
      tenNguoiDung: "Bao Chau",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Dog", nghia: "Chó" },
      { tu: "Cat", nghia: "Mèo" },
      { tu: "Tiger", nghia: "Hổ" },
      { tu: "Elephant", nghia: "Voi" },
      { tu: "Monkey", nghia: "Khỉ" }
    ]
  },
  {
    idBoThe: 6,
    tenBoThe: "Academic - Science Terms",
    soTu: 4,
    nguoiDung: {
      id: 106,
      tenNguoiDung: "Tuan Vu",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Atom", nghia: "Nguyên tử" },
      { tu: "Gravity", nghia: "Trọng lực" },
      { tu: "Photosynthesis", nghia: "Quang hợp" },
      { tu: "Evaporation", nghia: "Bốc hơi" }
    ]
  },
  {
    idBoThe: 7,
    tenBoThe: "English - Emotions",
    soTu: 4,
    nguoiDung: {
      id: 107,
      tenNguoiDung: "Trang Pham",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Happy", nghia: "Vui vẻ" },
      { tu: "Sad", nghia: "Buồn" },
      { tu: "Angry", nghia: "Tức giận" },
      { tu: "Excited", nghia: "Hào hứng" }
    ]
  },
  {
    idBoThe: 8,
    tenBoThe: "IELTS - Education Vocabulary",
    soTu: 4,
    nguoiDung: {
      id: 108,
      tenNguoiDung: "Nam Bui",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Curriculum", nghia: "Chương trình học" },
      { tu: "Tuition", nghia: "Học phí" },
      { tu: "Assignment", nghia: "Bài tập" },
      { tu: "Graduate", nghia: "Tốt nghiệp" }
    ]
  },
  {
    idBoThe: 9,
    tenBoThe: "Technology - IT Terms",
    soTu: 5,
    nguoiDung: {
      id: 109,
      tenNguoiDung: "Quang Le",
      anhDaiDien: "/src/image/formimg.png"
    },
    danhSachThe: [
      { tu: "Software", nghia: "Phần mềm" },
      { tu: "Hardware", nghia: "Phần cứng" },
      { tu: "Database", nghia: "Cơ sở dữ liệu" },
      { tu: "Network", nghia: "Mạng" },
      { tu: "Algorithm", nghia: "Thuật toán" }
    ]
  }
];

  const [cards, setCards] = useState(boThe);

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  },[])
  return (
   <div className="container">
      <div className="section section-word">
        <h2 className="title">Gần Đây</h2>
        <div className="wordgroup">
          <ul>
            {
              cards.map((item, index) => (
                <li className="word-item"> <FontAwesomeIcon icon={faBook } className="icon icon-book" />Từ vưng buổi {index+1}</li>
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
                <div className="card-item">
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
