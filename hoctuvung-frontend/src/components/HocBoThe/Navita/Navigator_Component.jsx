import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";

function Navigator_Component({ step, total, onPrev, onNext }) {
  return (
    <div className="btn-group">
      <div className="left" onClick={onPrev}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </div>
      <span>
        {step + 1}/{total}
      </span>
      <div className="right" onClick={onNext}>
        <FontAwesomeIcon icon={faArrowRight} />
      </div>
    </div>
  );
}

export default Navigator_Component;
