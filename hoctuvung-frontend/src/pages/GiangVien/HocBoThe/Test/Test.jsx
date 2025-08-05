import React, { useState, useEffect } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClone,
  faListCheck,
  faLayerGroup,
  faFilePen,
  faPlay,
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import "./Test.css";

function Test() {
  const { id } = useParams();
  const nagative = useNavigate();
  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selected"));
    if (selected) {
     
    }
  }, []);



  return (
    <div className="container">
      <div className="back" onClick={()=>nagative("/giangvien")}>
        <FontAwesomeIcon icon={faArrowLeft} className="iconback" />
        {"Quay lại"}
      </div>
      
      <div className="studyChange">
        <div className="studyBtn " onClick={()=>nagative(`/flashcard/${id}`)}>
          <FontAwesomeIcon icon={faClone} />
          <span>Flashcards</span>
        </div>
        <div className="studyBtn " onClick={()=>nagative(`/tracnghiem/${id}`)} >
          <FontAwesomeIcon icon={faListCheck} />
          <span>Trắc nghiệm</span>
        </div>
        <div className="studyBtn active">
          <FontAwesomeIcon icon={faFilePen} />
          <span>Test</span>
        </div>
        <div className="studyBtn" onClick={()=>nagative(`/game/${id}`)}>
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>Match game</span>
        </div>
        <div className="studyBtn" onClick={()=>nagative(`/video/${id}`)}>
          <FontAwesomeIcon icon={faPlay} />
          <span>Học bằng video</span>
        </div>
      </div>

      <div className="main">
       <div className="header">
         
        </div> 

        <div className="study">
         

          <div className="btn-group">
            <div className="left" >
              <FontAwesomeIcon icon={faArrowLeft} />
            </div>
            <span>
            
            </span>
            <div className="right">
              <FontAwesomeIcon icon={faArrowRight} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Test;
