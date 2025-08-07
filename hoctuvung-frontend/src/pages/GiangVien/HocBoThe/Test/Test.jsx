import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import HocBoThe_Header from "../../../../components/HocBoThe/HocBoThe_Header";
import TextInput from "../../../../components/inputs/TextInput";
import "./Test.css";

function shuffleArray(array) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function Test() {
  const [boThe, setBoThe] = useState({});
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [ketQua, setKetQua] = useState(null);
  const [answerStatuses, setAnswerStatuses] = useState([]);
  const [lamLai,setLamLai] = useState(false);

  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selected"));
    if (selected) {
      let danhSach = selected.danhSachThe || [];

      if (selected.shuffle) {
        danhSach = shuffleArray(danhSach);
      }

      const questionList = danhSach.map((item) => ({
        ...item,
        isReversed: Math.random() < 0.5,
      }));

      setBoThe(selected);
      setQuestions(questionList);
      setUserAnswers(new Array(questionList.length).fill(""));
    }
  }, []);

  const handleChangeAnswer = (index, value) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let correct = 0;
    const statusList = [];

    questions.forEach((item, index) => {
      const userAnswer = userAnswers[index].trim().toLowerCase();
      const correctAnswer = item.isReversed
        ? item.tu.trim().toLowerCase()
        : item.nghia.trim().toLowerCase();

      if (userAnswer === correctAnswer) {
        correct++;
        statusList.push({ isCorrect: true });
      } else {
        statusList.push({ isCorrect: false, correctAnswer });
      }
    });

    setKetQua(correct);
    setAnswerStatuses(statusList);
  };

  return (
    <div className="container">
      <HocBoThe_Header url="giangvien" activeMode="test" />

      <div className="main">
        <h2 className="title">Bộ thẻ: {boThe.tenBoThe}</h2>

        <div className="question-list">
          {questions.map((item, index) => (
            <div key={index} className="question-item">
              <p className="question-text">
                Câu {index + 1}: Nhập {item.isReversed ? "từ tiếng Anh" : "nghĩa tiếng Việt"} cho:{" "}
                <strong>{item.isReversed ? item.nghia : item.tu}</strong>
              </p>

              <TextInput
                type="text"
                value={userAnswers[index]}
                onChange={(e) => handleChangeAnswer(index, e.target.value)}
                disabled={ketQua !== null}
              />

              {/* Hiện kết quả từng câu */}
              {ketQua !== null && (
                <p className="feedback">
                  {answerStatuses[index]?.isCorrect ? (
                    <span className="correct">✔️ Đúng</span>
                  ) : (
                    <span className="incorrect">
                      Sai. Đáp án đúng là: <strong>{answerStatuses[index].correctAnswer}</strong>
                    </span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={ketQua !== null}>
          Nộp bài
        </button>

        {ketQua !== null && (
          <p className="result">
            Bạn trả lời đúng {ketQua}/{questions.length} câu.
          </p>
        )}
      </div>
    </div>
  );
}

export default Test;
