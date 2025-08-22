import React, { useState, useEffect, useRef } from "react";
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
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import "./TracNghiem.css";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";

function TracNghiem() {
  const { id } = useParams();
  const nagative = useNavigate();
  const [cards, setCards] = useState([]);
  const [danhsachthe, setDanhsachthe] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState();
  const [options, setOptions] = useState([]);
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [choice, setChoice] = useState(false);
  const [indexQuestion, setIndexQuestion] = useState([]);

  const getrandomQuetion = () => {
    const index = Math.floor(Math.random() * danhsachthe.length);
    if (indexQuestion.length === danhsachthe.length) return null;
    if (indexQuestion.findIndex((item) => item === index) === -1) {
      setIndexQuestion((pre) => [...pre, index]);
      return danhsachthe[index];
    }
    return getrandomQuetion();
  };

  const getwrongAnswer = (answer) => {
    const wrong = danhsachthe
      .map((item) => item.nghia)
      .filter((nghia) => nghia.toLowerCase() !== answer.nghia.toLowerCase());

    const uniqueWrong = [...new Set(wrong)];

    const shuffled = uniqueWrong.sort(() => 0.5 - Math.random());

    return shuffled.slice(0, 3);
  };

  const generateQuestion = () => {
    const question = getrandomQuetion();
    if (!question) return;
    const wrongs = getwrongAnswer(question);
    const allOptions = [...wrongs, question.nghia];
    const shuffled = allOptions.sort(() => 0.5 - Math.random());
    setCurrentQuestion(question);
    setOptions(shuffled);
  };
  const handleAnswer = (item) => {
    setChoice(true);
    setTimeout(() => setChoice(false), 1500);

    const isCorrect = item === currentQuestion?.nghia;
    setCorrect(isCorrect);

    setStep((prev) => {
      if (prev < danhsachthe.length - 1) return prev + 1;
      return prev;
    });
  };

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("boThe") || "[]");
    const selected = Array.isArray(list)
      ? list.find((x) => String(x.idBoThe) === String(id))
      : null;
    if (selected) {
      setCards(selected);
      setDanhsachthe(selected.danhSachThe);
    }
  }, []);
  useEffect(() => {
    if (danhsachthe?.length > 0 && step < danhsachthe?.length && step >= 0) {
      generateQuestion();
    }
  }, [danhsachthe, step]);
  return (
    <div className="container">
      <HocBoThe_Header activeMode="tracnghiem" />
      <div className="main">
        <div className="header">{cards.tenBoThe}</div>

        <div className="study">
          <div className="questionGroup">
            {
              <div className="question">
                {currentQuestion?.tu}
                <br />
                <p className="tittle">Chọn đáp án đúng</p>
              </div>
            }
            {
              <div className="answer">
                {options.map((item, index) => (
                  <div
                    className="answer-item"
                    key={index}
                    onClick={() => handleAnswer(item)}
                  >
                    {true && item}
                  </div>
                ))}
              </div>
            }
          </div>
          {choice && (correct ?
            
            <p>ĐÚNG</p> : <p>SAI Đáp án đúng là {`${currentQuestion.nghia}`}</p>)}
          {`${step+1}/${danhsachthe.length}`}
        </div>
      </div>
    </div>
  );
}

export default TracNghiem;
