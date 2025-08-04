import { Routes, Route, Outlet } from "react-router-dom";
import Giangvien_Header from "../../../components/GiangVien/Header/Giangvien_Header";
import Giangvien_Sidebar from "../../../components/GiangVien/Sidebar/Giangvien_Sidebar";
import { useEffect, useState } from "react";

export default function TrangChuGiangVien() {
  const [cards, setCards] = useState([
  {
    id: 1,
    word: "apple",
    meaning: "quả táo",
    type: "noun",
    example: "I eat an apple every day.",
    topic: "Fruits",
  },
  {
    id: 2,
    word: "run",
    meaning: "chạy",
    type: "verb",
    example: "She runs every morning.",
    topic: "Actions",
  },
  {
    id: 3,
    word: "beautiful",
    meaning: "đẹp",
    type: "adjective",
    example: "The view is beautiful.",
    topic: "Adjectives",
  },
  {
    id: 4,
    word: "book",
    meaning: "quyển sách",
    type: "noun",
    example: "I’m reading a new book.",
    topic: "Objects",
  },
  {
    id: 5,
    word: "study",
    meaning: "học tập",
    type: "verb",
    example: "He studies hard for exams.",
    topic: "Education",
  },
  {
    id: 6,
    word: "happy",
    meaning: "vui vẻ",
    type: "adjective",
    example: "She is happy today.",
    topic: "Feelings",
  },
  {
    id: 7,
    word: "dog",
    meaning: "con chó",
    type: "noun",
    example: "My dog is very friendly.",
    topic: "Animals",
  },
  {
    id: 8,
    word: "write",
    meaning: "viết",
    type: "verb",
    example: "I write emails every day.",
    topic: "Actions",
  },
  {
    id: 9,
    word: "quickly",
    meaning: "một cách nhanh chóng",
    type: "adverb",
    example: "She runs quickly.",
    topic: "Adverbs",
  },
  {
    id: 10,
    word: "chair",
    meaning: "cái ghế",
    type: "noun",
    example: "The chair is broken.",
    topic: "Furniture",
  }
]);
  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  },[])
  return (
   <div className="container">
      <div className="section section-word">
        
      </div>
      <div className="section section-card"></div>
   </div>
  );
}
