import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClone,
  faListCheck,
  faLayerGroup,
  faFilePen,
  faPlay,
  faArrowLeft,
  faArrowRight,
  faL,
} from "@fortawesome/free-solid-svg-icons";
import "./MatchGame.css";
import { useRef } from "react";
import { ref } from "yup";

function MatchGame() {
  const { id } = useParams();
  const nagative = useNavigate();
  const [cards, setCards] = useState([]);
  const [danhsachthe, setDanhsachthe] = useState([]);
  const [question, setQuestion] = useState([]);
  const [match, setMatch] = useState([]);
  const [choice, setChoice] = useState([]);
  const [correct, setCorrect] = useState(false);
  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selected"));
    if (selected) {
      setDanhsachthe(selected.danhSachThe);
      setCards(selected);
    }
  }, []);
  useEffect(() => {
    if (!danhsachthe || danhsachthe.length === 0) return;

    const shuffled = danhsachthe.sort(() => 0.5 - Math.random());
    // const newQuestions = shuffled.slice(0, 3);

    setQuestion(shuffled);
  }, [danhsachthe]);
  useEffect(() => {
    if (!question || question.length === 0) return;

    const tuArray = question.map((q) => ({ text: q.tu, type: "tu" }));
    const nghiaArray = question.map((q) => ({
      text: q.nghia,
      type: "nghia",
    }));

    const combined = [...tuArray, ...nghiaArray].sort(
      () => 0.5 - Math.random()
    );
    setMatch(combined);
  }, [question]);

  const handleClick = (index) => {
    if (choice.includes(index)) return;

    const newChoice = [...choice, index];
    setChoice(newChoice);

    if (newChoice.length === 2) {
      const first = match[newChoice[0]];
      const second = match[newChoice[1]];

      if (
        (first.type === "tu" &&
          second.type === "nghia" &&
          question.find(
            (q) => q.tu === first.text && q.nghia === second.text
          )) ||
        (first.type === "nghia" &&
          second.type === "tu" &&
          question.find((q) => q.nghia === first.text && q.tu === second.text))
      ) {
        setCorrect(true);
        const remove1 = match.filter((item) => item.text !== first.text);
        const remove2 = remove1.filter((item) => item.text !== second.text);
        setMatch(remove2);
        
      }
      setTimeout(() => {
        setChoice([]);
        setCorrect(false);
      }, 500);
    }
  };

  return (
    <div className="container">
      <div className="back" onClick={() => nagative("/giangvien")}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        {"Quay lại"}
      </div>

      <div className="studyChange">
        <div className="studyBtn " onClick={() => nagative(`/flashcard/${id}`)}>
          <FontAwesomeIcon icon={faClone} />
          <span>Flashcards</span>
        </div>
        <div
          className="studyBtn "
          onClick={() => nagative(`/tracnghiem/${id}`)}
        >
          <FontAwesomeIcon icon={faListCheck} />
          <span>Trắc nghiệm</span>
        </div>
        <div className="studyBtn" onClick={() => nagative(`/test/${id}`)}>
          <FontAwesomeIcon icon={faFilePen} />
          <span>Test</span>
        </div>
        <div
          className="studyBtn  active"
          onClick={() => nagative(`/game/${id}`)}
        >
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>Match game</span>
        </div>
        <div className="studyBtn" onClick={() => nagative(`/video/${id}`)}>
          <FontAwesomeIcon icon={faPlay} />
          <span>Học bằng video</span>
        </div>
      </div>

      <div className="main">
        <div className="header">{cards.tenBoThe}</div>

        <div className="study">
          <div className="question">
            {match.map((item, index) => (
              <div
                className={`question-item ${
                  choice.includes(index) ? "selected" : ""
                }`}
                key={index}
                onClick={() => handleClick(index)}
              >
                {item.text}
              </div>
            ))}
          </div>
          <div className="display">
            {choice.length === 2 && (correct ? <p>ĐÚNG</p> : <p>SAI</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchGame;
