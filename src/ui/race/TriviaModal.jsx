import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './triviaModal.css';

const TriviaModal = ({ question, onAnswer, timeLimit }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const answeredRef = useRef(false);
  const startTimeRef = useRef(null);

  // Derive time left from elapsed time
  const timeLeft = useMemo(() => {
    return Math.max(0, timeLimit - elapsedMs);
  }, [elapsedMs, timeLimit]);

  const answered = selectedAnswer !== null || timeLeft === 0;
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleTimeout = useCallback(() => {
    if (!answeredRef.current) {
      answeredRef.current = true;
      onAnswer(-1); // Timeout
    }
  }, [onAnswer]);

  // Timer effect - only runs once on mount since we use key prop for remounting
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        setElapsedMs(now - startTimeRef.current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Handle timeout when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !answeredRef.current) {
      handleTimeout();
    }
  }, [timeLeft, handleTimeout]);

  const handleSelect = useCallback((index) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setSelectedAnswer(index);
    
    setTimeout(() => {
      onAnswer(index);
    }, 500);
  }, [onAnswer]);

  const timePercent = (timeLeft / timeLimit) * 100;

  return (
    <div className="trivia-modal-overlay">
      <div className="trivia-modal">
        {/* Timer */}
        <div className="trivia-timer">
          <div 
            className="timer-bar" 
            style={{ 
              width: `${timePercent}%`,
              backgroundColor: timePercent > 30 ? '#4ECDC4' : '#FF6B6B'
            }} 
          />
        </div>
        
        {/* Category */}
        {question.category && (
          <span className="trivia-category">{question.category}</span>
        )}
        
        {/* Question */}
        <h2 className="trivia-question">{question.question}</h2>
        
        {/* Options */}
        <div className="trivia-options">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`trivia-option ${
                selectedAnswer === index 
                  ? (isCorrect ? 'correct' : 'wrong')
                  : ''
              } ${answered && index === question.correctAnswer ? 'correct' : ''}`}
              onClick={() => handleSelect(index)}
              disabled={answered}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>
        
        {/* Result feedback */}
        {answered && (
          <div className={`trivia-result ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? '✓ Correct! Speed boost!' : '✗ Wrong! Slowing down...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TriviaModal;
