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

  const getrandomQuetion = () => {
    const index = Math.floor(Math.random() * danhsachthe.length);
    return danhsachthe[index];
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
    const wrongs = getwrongAnswer(question);
    const allOptions = [...wrongs, question.nghia];
    const shuffled = allOptions.sort(() => 0.5 - Math.random());
    setCurrentQuestion(question);
    setOptions(shuffled);
  };
  const nextQuestion = () => {
    if (step < danhsachthe.length - 1) {
      setStep((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };
  const handleAnswer = (item) => {
    setChoice(true);
    setTimeout(() => {
      setChoice(false);
    }, 1500);
    if (item === currentQuestion?.nghia) {
      setCorrect(true);

      if (step < danhsachthe.length - 1) {
        setStep((prev) => prev + 1);
      }
    } else {
      setCorrect(false);

      if (step < danhsachthe.length - 1) {
        setTimeout(() => {
          setStep((prev) => prev + 1);
        }, 1000);
      }
    }
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
          {choice && (correct ? <p>ĐÚNG</p> : <p>SAI</p>)}

          <div className="btn-group">
            <div className="left" onClick={() => prevQuestion()}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </div>
            <span>
              {step + 1}/{danhsachthe?.length}
            </span>
            <div className="right" onClick={() => nextQuestion()}>
              <FontAwesomeIcon icon={faArrowRight} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TracNghiem;
